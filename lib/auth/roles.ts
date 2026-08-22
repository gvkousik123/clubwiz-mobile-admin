/**
 * Single source of truth for roles and permissions.
 *
 * The backend has emitted role strings in two shapes over time — prefixed
 * (`ROLE_SUPERADMIN`) and bare (`SUPERADMIN`) — so every check normalises
 * before comparing. Do not compare raw role strings anywhere else.
 */

export type Role = 'SUPERADMIN' | 'ADMIN' | 'BUSINESS_ADMIN' | 'USER';

export const ROLES: Record<Role, Role> = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  BUSINESS_ADMIN: 'BUSINESS_ADMIN',
  USER: 'USER',
};

/** Strips the `ROLE_` prefix and upper-cases, so both backend shapes collapse to one. */
export const normalizeRole = (role: string): string =>
  String(role || '').trim().toUpperCase().replace(/^ROLE_/, '');

export const normalizeRoles = (roles: unknown): Role[] => {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((r) => normalizeRole(typeof r === 'string' ? r : (r as any)?.name ?? ''))
    .filter((r): r is Role => r in ROLES);
};

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * Pages ask for a capability, never for a role. Adding a role, or widening
 * what an existing role may do, is a change in this file only.
 */
export type Permission =
  // access to the /bz/superadmin console at all
  | 'platform.console.access'
  // platform overview
  | 'platform.dashboard.view'
  // clubs
  | 'clubs.viewAll'
  | 'clubs.approve'
  | 'clubs.suspend'
  | 'clubs.delete'
  // users & roles
  | 'users.viewAll'
  | 'users.activate'
  | 'users.delete'
  | 'roles.assign'
  // money
  | 'payouts.view'
  | 'payouts.run'
  | 'commissions.view'
  | 'commissions.edit'
  | 'refunds.view'
  | 'refunds.decide'
  // content & marketing
  | 'carousel.manage'
  | 'ads.manage'
  | 'promos.manage'
  | 'broadcasts.send'
  | 'content.postOnBehalf'
  // support
  | 'support.view'
  | 'support.respond';

const ALL_PERMISSIONS: Permission[] = [
  'platform.console.access',
  'platform.dashboard.view',
  'clubs.viewAll', 'clubs.approve', 'clubs.suspend', 'clubs.delete',
  'users.viewAll', 'users.activate', 'users.delete', 'roles.assign',
  'payouts.view', 'payouts.run', 'commissions.view', 'commissions.edit',
  'refunds.view', 'refunds.decide',
  'carousel.manage', 'ads.manage', 'promos.manage', 'broadcasts.send',
  'content.postOnBehalf',
  'support.view', 'support.respond',
];

/**
 * SUPERADMIN is Clubwiz platform access — everything, and the only role that
 * may open the /bz/superadmin console.
 *
 * ADMIN is Clubwiz staff. It deliberately lacks `platform.console.access`, so
 * it stays on /bz/admin; the per-section grants below are here for when the
 * two consoles are merged, and grant nothing on their own today.
 *
 * BUSINESS_ADMIN is a club owner — nothing here; their console is /bz/business.
 */
const PERMISSIONS_BY_ROLE: Record<Role, Permission[]> = {
  SUPERADMIN: ALL_PERMISSIONS,
  ADMIN: [
    'clubs.viewAll',
    'users.viewAll',
    'ads.manage',
    'support.view',
    'support.respond',
  ],
  BUSINESS_ADMIN: [],
  USER: [],
};

export const permissionsForRoles = (roles: Role[]): Set<Permission> => {
  const granted = new Set<Permission>();
  roles.forEach((role) => {
    (PERMISSIONS_BY_ROLE[role] ?? []).forEach((p) => granted.add(p));
  });
  return granted;
};

// ============================================================================
// ROLE PREDICATES
// ============================================================================

export const hasRole = (roles: unknown, role: Role): boolean =>
  normalizeRoles(roles).includes(role);

export const isSuperAdmin = (roles: unknown): boolean => hasRole(roles, 'SUPERADMIN');

/** Clubwiz staff — super admin counts, since it is strictly above admin. */
export const isPlatformAdmin = (roles: unknown): boolean => {
  const r = normalizeRoles(roles);
  return r.includes('SUPERADMIN') || r.includes('ADMIN');
};

/** Club owner. Deliberately excludes ADMIN/SUPERADMIN — these are different people. */
export const isClubOwner = (roles: unknown): boolean => hasRole(roles, 'BUSINESS_ADMIN');

export const can = (roles: unknown, permission: Permission): boolean =>
  permissionsForRoles(normalizeRoles(roles)).has(permission);

/** Where a signed-in user belongs after login, by descending privilege. */
export const homeRouteForRoles = (roles: unknown): string => {
  const r = normalizeRoles(roles);
  if (r.includes('SUPERADMIN')) return '/bz/superadmin';
  if (r.includes('ADMIN')) return '/bz/admin';
  if (r.includes('BUSINESS_ADMIN')) return '/bz/business';
  return '/bz/auth/intro';
};
