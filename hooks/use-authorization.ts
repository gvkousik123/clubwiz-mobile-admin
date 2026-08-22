'use client';

import { useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import {
  Permission,
  Role,
  can as canWithRoles,
  isSuperAdmin as isSuperAdminRoles,
  isPlatformAdmin as isPlatformAdminRoles,
  normalizeRoles,
} from '@/lib/auth/roles';

export type AuthzStatus = 'loading' | 'authorized' | 'unauthenticated' | 'forbidden';

interface AuthorizationState {
  status: AuthzStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  roles: Role[];
  can: (permission: Permission) => boolean;
  isSuperAdmin: boolean;
  isPlatformAdmin: boolean;
}

const readStoredRoles = (): { token: string | null; roles: Role[] } => {
  if (typeof window === 'undefined') return { token: null, roles: [] };
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    const parsed = raw ? JSON.parse(raw) : null;
    return { token, roles: normalizeRoles(parsed?.roles) };
  } catch {
    return { token, roles: [] };
  }
};

/**
 * Reads the signed-in user's roles and answers capability questions.
 *
 * Roles come from localStorage and are therefore user-editable — this gates the
 * UI only. The backend JWT check on every /admin/* call is the real boundary.
 *
 * Pass `require` to have the hook resolve to `forbidden` when the permission is
 * missing; omit it to just read capabilities.
 */
export const useAuthorization = (require?: Permission): AuthorizationState => {
  // Roles live in localStorage, which does not exist during SSR. Staying in
  // `loading` until mount avoids rendering a false "forbidden" flash.
  const [mounted, setMounted] = useState(false);
  const [{ token, roles }, setStored] = useState<{ token: string | null; roles: Role[] }>({
    token: null,
    roles: [],
  });

  useEffect(() => {
    setStored(readStoredRoles());
    setMounted(true);
  }, []);

  return useMemo(() => {
    const isAuthenticated = Boolean(token);
    const can = (permission: Permission) => canWithRoles(roles, permission);

    let status: AuthzStatus = 'authorized';
    if (!mounted) status = 'loading';
    else if (!isAuthenticated) status = 'unauthenticated';
    else if (require && !can(require)) status = 'forbidden';

    return {
      status,
      isLoading: status === 'loading',
      isAuthenticated,
      roles,
      can,
      isSuperAdmin: isSuperAdminRoles(roles),
      isPlatformAdmin: isPlatformAdminRoles(roles),
    };
  }, [mounted, token, roles, require]);
};
