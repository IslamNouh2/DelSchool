// 2. Authentication Context (contexts/AuthContext.tsx)
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
    id: number;
    username: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
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

    const checkAuth = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/me');

            if (response.data?.user) {
                setUser(response.data.user);

                // Auto-redirect based on role if not already on correct route
                const currentPath = window.location.pathname;
                const userRole = response.data.user.role.toLowerCase();
                const expectedPath = `/${userRole}`;

                if (currentPath === '/login' || currentPath === '/') {
                    router.push(expectedPath);
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
                setUser(response.data.user);

                // Redirect to role-based dashboard
                const role = response.data.user.role.toLowerCase();
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

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};
