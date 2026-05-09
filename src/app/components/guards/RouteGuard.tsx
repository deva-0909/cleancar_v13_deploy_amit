/**
 * Route Guard - Global Route Protection
 *
 * Placed in RootLayout to protect ALL routes automatically.
 * Checks current route against permission system and redirects if unauthorized.
 *
 * CRITICAL: This runs on EVERY route change
 * - Checks route configuration for required module
 * - Verifies user has permission to view module
 * - Redirects to appropriate page if unauthorized
 *
 * Usage in RootLayout:
 * ```tsx
 * <RouteGuard />
 * <Outlet />
 * ```
 */

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { hasPermission } from "../../utils/permissionEngine";
import { getRouteConfig, getDefaultRoute, isPublicRoute } from "../../config/routeConfig";
import { logger } from "../../services/logger";

export function RouteGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, currentRole } = useRole();
  const { employees } = useEmployee();

  useEffect(() => {
    // Skip check for public routes
    if (isPublicRoute(location.pathname)) {
      return;
    }

    // Get route configuration
    const routeConfig = getRouteConfig(location.pathname);

    // If route not in config, allow access (assume public)
    if (!routeConfig) {
      return;
    }

    // Get current employee record
    const currentEmployee = currentUser
      ? employees.find(e => e.employeeId === currentUser.employeeId) || null
      : null;

    // Check permission
    // Always allow "dashboard" module routes for authenticated users (my-account, travel)
    // These are self-service routes accessible to ALL roles
    const selfServiceModules = ["dashboard", "travel"];
    if (selfServiceModules.includes(routeConfig.module) && currentUser) {
      return; // Allow — no redirect needed
    }

    // Build employee shape for permission check
    // Use real employee record if available, else construct from session
    const empForCheck = currentEmployee || (currentUser ? {
      role: currentUser.role,
      cityId: currentUser.cityId || "CITY-SURAT", // Default city if missing
      customPermissions: currentUser.customPermissions,
    } : null);

    const hasAccess = empForCheck
      ? hasPermission(empForCheck, routeConfig.module, "view")
      : false;

    // If unauthorized, redirect to default route for role
    if (!hasAccess) {
      const defaultRoute = getDefaultRoute(currentRole);

      logger.warn(`🚫 Access denied to ${location.pathname} for role ${currentRole}. Redirecting to ${defaultRoute}`);

      navigate(defaultRoute, { replace: true });
    }
  }, [location.pathname, currentUser, currentRole, employees, navigate]);

  // This component doesn't render anything
  return null;
}
