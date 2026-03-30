import axios from 'axios';
import { OfflineDB } from './db';
import Cookies from 'js-cookie';

const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || '';
const baseURL = rawBaseURL.trim().endsWith('/api') 
    ? rawBaseURL 
    : `${rawBaseURL.replace(/\/$/, '')}/api`;

export const api = axios.create({
    baseURL: baseURL || '/api',
    withCredentials: true,
});

// --- Enterprise Axios Architecture ---
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// 1. Request Interceptor: Idempotency & Offline Queue
api.interceptors.request.use(async (config) => {
    // Prevent caching on auth/sync routes to avoid stale offline responses
    if (config.url?.includes('/auth/') || config.url?.includes('/sync/')) {
        config.headers['Cache-Control'] = 'no-cache';
        config.headers['Pragma'] = 'no-cache';
        config.headers['Expires'] = '0';
    }

    if (['post', 'put', 'delete'].includes(config.method?.toLowerCase() || '')) {
        const operationId = config.headers['X-Operation-Id'] || crypto.randomUUID();
        config.headers['X-Operation-Id'] = operationId;

        // Offline Handling
        if (typeof window !== 'undefined' && !navigator.onLine) {
            const entity = config.url?.split('/')[1] || 'unknown';
            const tenantId = document.cookie.match(/tenantId=([^;]+)/)?.[1] || 'default';

            await OfflineDB.addToSyncQueue({
                operationId,
                type: config.method?.toUpperCase() as any,
                method: config.method?.toUpperCase(),
                url: config.url || '',
                entity,
                data: config.data,
                timestamp: Date.now(),
                tenantId,
            });

            // Mark as offline-intercepted so response interceptor can handle it
            return Promise.reject({ isOffline: true, config });
        }
    }
    return config;
});

// 2. Response Interceptor: Refresh Rotation & Error Handling
api.interceptors.response.use(
    (response) => {
        if (response.data?.accessToken) {
            Cookies.set('accessToken', response.data.accessToken, {
                secure: true,
                sameSite: 'none',
                expires: 1 / 96,
            });
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle scheduled offline rejections
        if (error.isOffline) {
            return Promise.resolve({ data: { offline: true, ...originalRequest.data }, status: 202 });
        }

        // Handle 401 Unauthorized (Session Expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Prevent infinite loops if refresh itself fails with 401
            if (originalRequest.url?.includes('/auth/refresh')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => api(originalRequest))
                  .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Enterprise: Always use a dedicated refresh call to avoid interceptor overlap
                await axios.post('/api/auth/refresh', {}, { withCredentials: true });
                
                processQueue(null, 'refreshed');
                return api(originalRequest);
            } catch (refreshError: any) {
                processQueue(refreshError, null);
                
                // Clear state and redirect on hard failure
                if (typeof window !== 'undefined') {
                    const locale = window.location.pathname.split('/')[1] || 'en';
                    if (!window.location.pathname.includes('/login')) {
                        // Use replace to avoid back-button loops
                        window.location.replace(`/${locale}/login?reason=expired`);
                    }
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
