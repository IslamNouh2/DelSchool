'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';

interface PermissionGuardProps {
  children: ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: ReactNode;
}

export const PermissionGuard = ({
  children,
  roles,
  permissions,
  fallback = null,
}: PermissionGuardProps) => {
  const { user, hasPermission, hasRole } = useAuth();

  if (!user || typeof hasPermission !== 'function') return fallback as JSX.Element;

  // Check roles if provided
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some((role) => hasRole(role));
    if (!hasRequiredRole) return fallback as JSX.Element;
  }

  // Check permissions if provided
  if (permissions && permissions.length > 0) {
    const hasRequiredPermission = permissions.every((perm) => hasPermission(perm));
    if (!hasRequiredPermission) return fallback as JSX.Element;
  }

  return <>{children}</>;
};
