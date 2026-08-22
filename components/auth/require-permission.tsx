'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Permission, homeRouteForRoles } from '@/lib/auth/roles';
import { useAuthorization } from '@/hooks/use-authorization';

interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
  /** Shown while roles are being read; defaults to a neutral splash. */
  fallback?: ReactNode;
}

/**
 * Gates a subtree on a capability. Mount this once in a route-group layout
 * rather than per page — with a console this size, per-page checks are a
 * check you will eventually forget to add.
 *
 * Unauthenticated users go to login. Authenticated users lacking the
 * permission are sent to whichever console they do belong to, so a club
 * owner who lands here ends up somewhere useful rather than on a dead end.
 */
export const RequirePermission = ({ permission, children, fallback }: RequirePermissionProps) => {
  const router = useRouter();
  const { status, roles } = useAuthorization(permission);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/bz/auth/intro');
    } else if (status === 'forbidden') {
      router.replace(homeRouteForRoles(roles));
    }
  }, [status, roles, router]);

  if (status === 'authorized') return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05100C]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl mx-auto mb-4 bg-[#1DE9B6] animate-pulse" />
        <p className="text-[#EAF2EE]/60 text-sm">
          {status === 'loading' ? 'Checking access…' : 'Redirecting…'}
        </p>
      </div>
    </div>
  );
};

export default RequirePermission;
