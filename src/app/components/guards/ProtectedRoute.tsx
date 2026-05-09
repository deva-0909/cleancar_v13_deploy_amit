/**
 * Protected Route Component - Route Access Guard
 *
 * Prevents unauthorized access to routes by checking user permissions.
 * Integrates with MC-11 Permission Engine and route configuration.
 *
 * CRITICAL SECURITY:
 * - Prevents URL hacking (users can't bypass by typing URLs)
 * - Checks permissions against route configuration
 * - Smart redirects based on user role
 * - Shows clear unauthorized pages
 *
 * Usage:
 * ```tsx
 * <Route
 *   path="/admin/permissions"
 *   element={<ProtectedRoute module="admin"><PermissionManagementPage /></ProtectedRoute>}
 * />
 * ```
 */

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { hasPermission } from "../../utils/permissionEngine";
import { getRouteConfig, getDefaultRoute, isPublicRoute } from "../../config/routeConfig";
import type { Module } from "../../types/permissions";
import { AlertCircle, Home, Shield } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  module?: Module; // Required module for access (optional if auto-detected from route)
  fallbackPath?: string; // Custom redirect path
  showUnauthorized?: boolean; // Show unauthorized page vs redirect
}

export function ProtectedRoute({
  children,
  module,
  fallbackPath,
  showUnauthorized = true,
}: ProtectedRouteProps) {
  const { currentUser, currentRole } = useRole();
  const { employees } = useEmployee();
  const location = useLocation();

  // Public routes bypass all checks
  if (isPublicRoute(location.pathname)) {
    return <>{children}</>;
  }

  // Get current employee record
  const currentEmployee = currentUser
    ? employees.find(e => e.employeeId === currentUser.employeeId) || null
    : null;

  // Determine required module
  let requiredModule = module;
  if (!requiredModule) {
    // Auto-detect from route configuration
    const routeConfig = getRouteConfig(location.pathname);
    requiredModule = routeConfig?.module;
  }

  // If no module specified and not in route config, allow access (public route)
  if (!requiredModule) {
    return <>{children}</>;
  }

  // Self-service routes (my-account, travel) are accessible to all authenticated users
  const selfServiceModules: string[] = ["dashboard", "travel"];
  if (selfServiceModules.includes(requiredModule) && currentUser) {
    return <>{children}</>;
  }

  // Build employee shape — use real record if available, else session data
  const empForCheck = currentEmployee || (currentUser ? {
    role: currentUser.role,
    cityId: currentUser.cityId || "CITY-SURAT",
    customPermissions: currentUser.customPermissions,
  } : null);

  // Check if user has permission
  const hasAccess = empForCheck
    ? hasPermission(empForCheck, requiredModule, "view")
    : false;

  // Grant access if permitted
  if (hasAccess) {
    return <>{children}</>;
  }

  // ========== ACCESS DENIED ==========

  // Determine where to redirect
  const redirectPath = fallbackPath || getDefaultRoute(currentRole);

  // Show unauthorized page if configured
  if (showUnauthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>

          <p className="text-gray-600 mb-2">
            You don't have permission to access this page.
          </p>

          {currentUser && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Your Role:</span>
                  <span className="ml-2 text-gray-900">{currentUser.role}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Requested Page:</span>
                  <code className="ml-2 bg-white px-2 py-1 rounded text-xs text-gray-900 border">
                    {location.pathname}
                  </code>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Required Module:</span>
                  <code className="ml-2 bg-white px-2 py-1 rounded text-xs text-gray-900 border">
                    {requiredModule}
                  </code>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Link to={redirectPath}>
              <Button className="w-full" variant="default">
                <Home className="w-4 h-4 mr-2" />
                Go to My Dashboard
              </Button>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Go Back
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-left">
                If you believe you should have access to this page,
                please contact your administrator to request permission.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Silent redirect to appropriate page
  return <Navigate to={redirectPath} replace />;
}

/**
 * Higher-order component version for easier use
 *
 * Usage:
 * ```tsx
 * const ProtectedPermissionPage = withProtection(PermissionManagementPage, { module: "admin" });
 * ```
 */
export function withProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    module?: Module;
    fallbackPath?: string;
    showUnauthorized?: boolean;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute
        module={options?.module}
        fallbackPath={options?.fallbackPath}
        showUnauthorized={options?.showUnauthorized}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
