/**
 * Role-Based Redirect Hook
 * Automatically redirects users to their role-specific landing page when role changes
 *
 * Usage: Add this hook to RootLayout component
 */

import { useEffect, useRef } from "react";
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
    allowedPaths: ["/tse-app", "/tse-diagnostics", "/leads", "/my-account"],
  },
  TSM: {
    defaultPath: "/tsm-app",
    allowedPaths: ["/", "/tsm-app", "/tele-sales-manager", "/leads", "/customers", "/complaints", "/washer-jobs", "/service-zones", "/hr/professional-leave", "/hr/self-service", "/performance", "/my-account"],
  },
  CCE: {
    defaultPath: "/cce-app",
    allowedPaths: ["/", "/cce-app", "/customer-care", "/customer-care-executive", "/leads", "/customers", "/complaints", "/my-account"],
  },

  // Operations roles - Stay on their apps
  "Car Washer": {
    defaultPath: "/washer-core-screens",
    allowedPaths: ["/", "/car-washer", "/washer-core-screens", "/cloth-tracking/exchange", "/advance", "/hr/professional-leave", "/hr/self-service", "/performance", "/my-account"],
  },
  Supervisor: {
    defaultPath: "/supervisor-app/dashboard",
    allowedPaths: [
      "/", "/supervisor-app", "/supervisor-app/dashboard", "/supervisor-app/team",
      "/supervisor-app/audit", "/supervisor-app/cloth", "/supervisor-app/alerts",
      "/supervisor-app/schedule", "/supervisor-app/leads", "/supervisor-app/incentive",
      "/supervisor-app/issues", "/supervisor-app/visibility", "/supervisor-app/cover",
      "/supervisor-app/kpi",
      "/supervisor", "/washer-jobs", "/service-zones", "/complaints", "/car-washer",
      "/inventory", "/cloth-tracking", "/advance", "/hr/professional-leave",
      "/hr/self-service", "/performance", "/my-account"
    ],
  },
  "Operations Manager": {
    defaultPath: "/operations",
    allowedPaths: ["/", "/operations", "/washer-jobs", "/service-zones", "/supervisor", "/complaints", "/car-washer", "/hr/professional-leave", "/hr/self-service", "/approvals", "/performance", "/my-account"],
  },
  "Sr Operations Manager": {
    defaultPath: "/operations",
    allowedPaths: ["/", "/operations", "/washer-jobs", "/service-zones", "/supervisor", "/complaints", "/car-washer", "/hr/professional-leave", "/hr/self-service", "/approvals", "/performance", "/analytics", "/my-account"],
  },
  "Cluster Manager": {
    // FIX: was "/cluster" which has no route — correct destination is "/cm-app"
    defaultPath: "/cm-app",
    allowedPaths: ["/", "/cm-app", "/operations", "/washer-jobs", "/service-zones", "/complaints", "/users", "/leads", "/customers", "/finance", "/hr/professional-leave", "/hr/self-service", "/performance", "/analytics", "/my-account"],
  },
  "City Manager": {
    defaultPath: "/city-app",
    allowedPaths: ["/", "/city-app", "/city", "/complaints", "/users", "/leads", "/customers", "/operations", "/washer-jobs", "/service-zones", "/finance", "/hr/professional-leave", "/hr/self-service", "/performance", "/analytics", "/my-account"],
  },

  // Store/Procurement roles
  "Store Manager": {
    defaultPath: "/store",
    allowedPaths: ["/store", "/inventory", "/my-account"],
  },
  "Procurement Manager": {
    defaultPath: "/procurement",
    allowedPaths: ["/procurement", "/store", "/my-account"],
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
  // HR, Accounts, Store Manager, Procurement Manager:
  // Initial redirect handled by RoleRouter (/ → /hr etc.)
  // DO NOT restrict here — useRoleBasedRedirect was trapping them
  // on a single path and preventing sub-route navigation.
  // HR needs /hr/*, Accounts needs /finance/*, etc.
  HR: {
    defaultPath: "/hr",
    allowedPaths: [], // Empty = no restrictions (like Admin)
  },
  Accounts: {
    defaultPath: "/finance",
    allowedPaths: [], // Empty = no restrictions
  },
};

/**
 * Hook to handle role-based redirects
 *
 * IMPORTANT: This hook ONLY redirects when the ROLE CHANGES and the current
 * path is the previous role's landing page (not a general nav destination).
 *
 * It does NOT maintain an allowedPaths whitelist — that pattern always falls
 * out of sync and silently blocks legitimate navigation.
 *
 * Per-route access control is handled by RouteGuard using the permissionMatrix.
 */
export function useRoleBasedRedirect(currentRole: Role, enabled: boolean = true) {
  const navigate = useNavigate();
  const location = useLocation();

  // Track previous role to detect role switches
  const prevRoleRef = React.useRef<Role>(currentRole);

  useEffect(() => {
    if (!enabled) return;

    const roleConfig = ROLE_REDIRECTS[currentRole];
    if (!roleConfig) return;

    const prevRole = prevRoleRef.current;
    const roleChanged = prevRole !== currentRole;
    prevRoleRef.current = currentRole;

    // Only redirect on role change, not on every navigation
    // RouteGuard handles per-route access control
    if (!roleChanged) return;

    const currentPath = location.pathname;
    const { defaultPath } = roleConfig;

    // On role change: if the user is on "/" or the previous role's default path,
    // redirect to new role's default path
    const prevRoleDefault = ROLE_REDIRECTS[prevRole]?.defaultPath ?? "/";
    const shouldRedirect =
      currentPath === "/" ||
      currentPath === prevRoleDefault ||
      currentPath === "/login";

    if (!shouldRedirect) return;

    console.log(`[Role Redirect] Role changed ${prevRole} → ${currentRole}, navigating to ${defaultPath}`);
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
