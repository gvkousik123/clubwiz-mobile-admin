import { useEffect, useState } from 'react';
import { AuthService } from '@/lib/services/auth.service';

interface AuthGuardOptions {
  requiredRoles?: string[];
  requireAuth?: boolean;
}

interface AuthGuardResult {
  isAuthenticated: boolean;
  userRoles: string[];
  hasRole: (role: string) => boolean;
  isLoading: boolean;
}

export const useAuthGuard = ({
  requiredRoles = [],
  requireAuth = true
}: AuthGuardOptions): AuthGuardResult => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      console.log("🔍 useAuthGuard: Checking auth status", { requiredRoles, requireAuth });

      // Debug: Log stored data
      const storedUser = AuthService.getStoredUser();
      const storedToken = AuthService.getStoredToken();
      console.log("📦 useAuthGuard: Stored data", {
        hasToken: !!storedToken,
        user: storedUser,
        userRoles: storedUser?.roles
      });

      // Check if authentication is required
      if (requireAuth && !AuthService.isAuthenticated()) {
        console.log("⚠️ useAuthGuard: User not authenticated");
        console.log("   Token:", !!AuthService.getStoredToken());
        console.log("   Stored User:", !!AuthService.getStoredUser());
      }

      // Check role requirements
      if (requiredRoles.length > 0) {
        const userRoles = AuthService.getUserRolesFromStorage();
        console.log("👤 useAuthGuard: User roles:", userRoles, "Required:", requiredRoles);
        console.log("   Roles check:", requiredRoles.map(role => ({
          role,
          hasRole: userRoles.includes(role)
        })));

        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
          console.log("⚠️ useAuthGuard: User doesn't have required role");
          console.log("   User roles from storage:", userRoles);
          console.log("   Required roles:", requiredRoles);
        }
      }

      console.log("✅ useAuthGuard: Auth check completed - no redirects");
      setIsLoading(false);
    };

    // Add a small delay to allow localStorage to be populated
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, [requiredRoles, requireAuth]);

  return {
    isAuthenticated: AuthService.isAuthenticated(),
    userRoles: AuthService.getUserRolesFromStorage(),
    hasRole: (role: string) => AuthService.hasRole(role),
    isLoading
  };
};

// Specific hooks for different route types
export const useUserAuth = () => useAuthGuard({
  requiredRoles: ['ROLE_USER'],
  requireAuth: true
});

export const useAdminAuth = () => useAuthGuard({
  requiredRoles: ['ROLE_ADMIN', 'ROLE_SUPERADMIN'],
  requireAuth: true
});

export const useSuperAdminAuth = () => useAuthGuard({
  requiredRoles: ['ROLE_SUPERADMIN'],
  requireAuth: true
});