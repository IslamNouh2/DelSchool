// 2. Authentication Context (contexts/AuthContext.tsx)
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    permissions: string[];
    profileId?: number;
    status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const hasPermission = useCallback((permission: string) => {
        if (!user) return false;
        if (user.role === 'ADMIN') return true;
        if (!user.permissions) return false;
        console.log(user.permissions.includes(permission));
        return user.permissions.includes(permission);
    }, [user]);

    const hasRole = useCallback((role: string) => {
        return user?.role === role;
    }, [user]);

    const checkAuth = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/me');

            if (response.data?.user) {
                const userData = response.data.user;
                setUser(userData);

                // Auto-redirect based on role if not already on correct route
                const currentPath = window.location.pathname;
                const userRole = userData.role.toLowerCase();
                const expectedDashboard = `/${userRole}`;
                
                // Only redirect if at root or login
                if (currentPath === '/' || currentPath === '/login' || currentPath.endsWith('/login')) {
                     router.push(expectedDashboard);
                }
            }
        } catch (error) {
            console.log('Authentication check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        try {
            const response = await api.post('/auth/login', { username, password });

            if (response.data?.user) {
                const userData = response.data.user;
                setUser(userData);

                // Redirect to role-based dashboard
                const role = userData.role.toLowerCase();
                router.push(`/${role}`);
            }
        } catch (error) {
            throw error; // Re-throw to handle in component
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            router.push('/login');
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const contextValue = useMemo(() => ({
        user,
        loading,
        login,
        logout,
        checkAuth,
        hasPermission,
        hasRole
    }), [user, loading, hasPermission, hasRole]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

