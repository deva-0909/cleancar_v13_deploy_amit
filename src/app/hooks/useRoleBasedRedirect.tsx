/**
 * Role-Based Redirect Hook
 * Automatically redirects users to their role-specific landing page when role changes
 *
 * Usage: Add this hook to RootLayout component
 */

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Role } from "../lib/roleConfig";

interface RoleRedirectConfig {
  defaultPath: string;
  allowedPaths?: string[]; // Optional: paths where redirect should NOT happen
}

/**
 * Role-specific landing pages
 */
const ROLE_REDIRECTS: Partial<Record<Role, RoleRedirectConfig>> = {
  // Sales roles - Direct to their specific apps
  TSE: {
    defaultPath: "/tse-app",
    allowedPaths: ["/tse-app", "/tse-diagnostics", "/leads"], // Don't redirect if already on TSE pages or leads
  },
  TSM: {
    defaultPath: "/tsm-app",
    allowedPaths: ["/", "/tsm-app", "/tele-sales-manager", "/leads", "/customers", "/complaints", "/washer-jobs", "/service-zones", "/hr/professional-leave", "/hr/self-service", "/performance"],
  },
  CCE: {
    defaultPath: "/cce-app",
    allowedPaths: ["/", "/cce-app", "/customer-care", "/customer-care-executive", "/leads", "/customers", "/complaints"],
  },

  // Operations roles - Stay on their apps
  "Car Washer": {
    defaultPath: "/washer-core-screens",
    allowedPaths: ["/", "/car-washer", "/washer-core-screens", "/cloth-tracking/exchange", "/advance", "/hr/professional-leave", "/hr/self-service", "/performance"],
  },
  Supervisor: {
    defaultPath: "/supervisor-app/dashboard",
    allowedPaths: ["/", "/supervisor-app", "/supervisor", "/washer-jobs", "/service-zones", "/complaints", "/car-washer", "/inventory", "/cloth-tracking", "/advance", "/hr/professional-leave", "/hr/self-service", "/performance"],
  },
  "Operations Manager": {
    defaultPath: "/operations",
    allowedPaths: ["/", "/operations", "/washer-jobs", "/service-zones", "/supervisor", "/complaints", "/car-washer", "/hr/professional-leave", "/hr/self-service", "/approvals", "/performance"],
  },
  "Sr Operations Manager": {
    defaultPath: "/operations",
    allowedPaths: ["/", "/operations", "/washer-jobs", "/service-zones", "/supervisor", "/complaints", "/car-washer", "/hr/professional-leave", "/hr/self-service", "/approvals", "/performance", "/analytics"],
  },
  "Cluster Manager": {
    defaultPath: "/cluster",
    allowedPaths: ["/", "/cluster", "/operations", "/washer-jobs", "/service-zones", "/complaints", "/users", "/leads", "/customers", "/finance", "/hr/professional-leave", "/hr/self-service", "/performance", "/analytics"],
  },
  "City Manager": {
    defaultPath: "/city-app",
    allowedPaths: ["/", "/city-app", "/city", "/complaints", "/users", "/leads", "/customers", "/operations", "/washer-jobs", "/service-zones", "/finance", "/hr/professional-leave", "/hr/self-service", "/performance", "/analytics"],
  },

  // Store/Procurement roles
  "Store Manager": {
    defaultPath: "/store",
    allowedPaths: ["/store", "/inventory"],
  },
  "Procurement Manager": {
    defaultPath: "/procurement",
    allowedPaths: ["/procurement", "/store"],
  },

  // Admin roles - No redirect, they need access to everything
  "Super Admin": {
    defaultPath: "/",
    allowedPaths: [], // No restrictions
  },
  Admin: {
    defaultPath: "/",
    allowedPaths: [],
  },

  // Support roles
  HR: {
    defaultPath: "/hr",
    allowedPaths: ["/hr", "/advance/hr-management"],
  },
  Accounts: {
    defaultPath: "/finance",
    allowedPaths: ["/finance", "/accounts"],
  },
};

/**
 * Hook to handle role-based redirects
 */
export function useRoleBasedRedirect(currentRole: Role, enabled: boolean = true) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;

    const roleConfig = ROLE_REDIRECTS[currentRole];
    if (!roleConfig) return; // No redirect configured for this role

    const currentPath = location.pathname;
    const { defaultPath, allowedPaths = [] } = roleConfig;

    // Don't redirect if:
    // 1. Already on default path
    // 2. On an allowed path for this role
    // 3. No allowed paths defined (admin roles - unrestricted access)
    // 4. On an exact match of allowed path (not just startsWith)
    if (currentPath === defaultPath) return;
    if (allowedPaths.length === 0) return; // Admin roles have unrestricted access

    // Check if current path matches any allowed path
    const isAllowed = allowedPaths.some((path) => {
      // Exact match or starts with for nested routes
      return currentPath === path || currentPath.startsWith(path + '/');
    });

    if (isAllowed) return;

    // Redirect to default path
    console.log(`[Role Redirect] ${currentRole} → ${defaultPath} (from ${currentPath})`);
    navigate(defaultPath, { replace: true });
  }, [currentRole, navigate, location.pathname, enabled]);
}

/**
 * Get the default landing page for a role
 */
export function getRoleDefaultPath(role: Role): string {
  return ROLE_REDIRECTS[role]?.defaultPath || "/";
}

/**
 * Check if a path is allowed for a role
 */
export function isPathAllowedForRole(role: Role, path: string): boolean {
  const roleConfig = ROLE_REDIRECTS[role];
  if (!roleConfig) return true; // If no config, allow all

  const { allowedPaths = [] } = roleConfig;
  if (allowedPaths.length === 0) return true; // No restrictions (admin roles)

  return allowedPaths.some((allowedPath) => path.startsWith(allowedPath));
}
