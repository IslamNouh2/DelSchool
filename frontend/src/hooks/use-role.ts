'use client';

import { useAuth } from '@/components/contexts/AuthContext';

export const useRole = () => {
    const { user } = useAuth();
    return {
        role: user?.role || 'GUEST',
        permissions: user?.permissions || [],
        isLoading: !user
    };
};
