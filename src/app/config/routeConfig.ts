/**
 * Route Configuration - Single Source of Truth for Route Permissions
 *
 * Maps all application routes to their required permission modules.
 * Used by ProtectedRoute component to enforce access control.
 *
 * IMPORTANT: Every protected route in routes.tsx should have an entry here.
 * Routes not listed here are considered public (no protection needed).
 */

import type { Module } from "../types/permissions";

export interface AppRoute {
  path: string;
  module: Module;
  description?: string;
}

/**
 * ROUTE REGISTRY
 *
 * All application routes with their required permission modules.
 * The ProtectedRoute component uses this to check access.
 *
 * Pattern Matching:
 * - Exact paths: "/operations" matches only /operations
 * - Wildcard paths: "/operations/*" matches /operations/anything
 * - Dynamic segments: "/finance/invoices/:id" matches /finance/invoices/123
 */
export const ROUTES: AppRoute[] = [
  // DASHBOARD
  { path: "/", module: "dashboard", description: "Main dashboard" },

  // ANALYTICS
  { path: "/analytics", module: "analytics", description: "Analytics overview" },
  { path: "/analytics/*", module: "analytics", description: "Analytics sub-pages" },
  { path: "/analytics/unit-economics/cost-by-consumption", module: "analytics", description: "Cost by consumption" },
  { path: "/analytics/unit-economics/cost-by-plan", module: "analytics", description: "Cost by plan" },
  { path: "/analytics/unit-economics/cost-report", module: "analytics", description: "Cost report" },
  { path: "/analytics/unit-economics/labour-cost", module: "analytics", description: "Labour cost" },
  { path: "/founder/*", module: "analytics", description: "Founder analytics" },

  // CRM
  { path: "/crm/*", module: "crm", description: "CRM pages" },
  { path: "/leads", module: "leads", description: "Lead management" },
  { path: "/customers", module: "customers", description: "Customer management" },

  // JOBS
  { path: "/operations", module: "jobs", description: "Operations overview" },
  { path: "/operations/*", module: "jobs", description: "Operations sub-pages" },
  { path: "/washer-jobs", module: "jobs", description: "Washer job execution" },
  { path: "/service-zones", module: "jobs", description: "Service zone management" },

  // OPERATIONS MANAGEMENT
  { path: "/users", module: "users", description: "User management" },
  { path: "/complaints", module: "complaints", description: "Complaint management" },
  { path: "/performance", module: "performance", description: "Performance tracking" },
  { path: "/expansion-opportunities", module: "operations", description: "Expansion planning" },

  // HR
  { path: "/hr", module: "hr", description: "HR overview" },
  { path: "/hr/*", module: "hr", description: "HR sub-pages" },

  // LEAVE
  { path: "/hr/professional-leave", module: "leave", description: "Leave management" },
  { path: "/hr/self-service", module: "payroll-self-service", description: "Employee payslip access" },

  // PAYROLL
  { path: "/payroll/run", module: "payroll", description: "Payroll run" },
  { path: "/payroll/*", module: "payroll", description: "Payroll pages" },

  // FINANCE
  { path: "/finance", module: "finance", description: "Finance overview" },
  { path: "/finance/cost-per-wash", module: "finance", description: "Cost per wash" },
  { path: "/finance/package-cost-matrix", module: "finance", description: "Package cost matrix" },
  { path: "/finance/*", module: "finance", description: "Finance sub-pages" },

  // ACCOUNTS
  { path: "/accounts", module: "accounts", description: "Accounts overview" },
  { path: "/accounts/*", module: "accounts", description: "Accounts sub-pages" },

  // INVENTORY
  { path: "/inventory", module: "inventory", description: "Inventory overview" },
  { path: "/inventory/*", module: "inventory", description: "Inventory sub-pages" },
  { path: "/store", module: "store", description: "Store management" },
  { path: "/store-manager/*", module: "store-manager", description: "Store manager pages" },
  { path: "/procurement", module: "procurement", description: "Procurement" },
  { path: "/procurement/*", module: "procurement", description: "Procurement sub-pages" },

  // CLOTH TRACKING
  { path: "/cloth-tracking/*", module: "cloth-tracking", description: "Cloth tracking" },

  // ADVANCES
  { path: "/advance", module: "advance", description: "Advance requests" },
  { path: "/advance/*", module: "advance", description: "Advance sub-pages" },

  // ADMIN
  { path: "/admin/*", module: "admin", description: "Admin pages" },
  { path: "/settings/*", module: "admin", description: "Settings pages" },
  { path: "/subscription/*", module: "admin", description: "Subscription management" },
  { path: "/workforce/*", module: "admin", description: "Workforce management" },

  // APPROVALS
  { path: "/approvals", module: "approvals", description: "Approval center" },

  // AUDIT TRAIL
  { path: "/audit-trail", module: "audit-trail", description: "Audit trail" },
  { path: "/system-audit", module: "audit-trail", description: "System audit dashboard" },

  // REPORTS
  { path: "/reports/*", module: "reports", description: "Reports" },

  // ROLE-SPECIFIC APPS (these use their own module keys)
  { path: "/washer-core-screens", module: "car-washer", description: "Washer app" },
  { path: "/washer/*", module: "car-washer", description: "Washer pages" },
  { path: "/supervisor-app/*", module: "supervisor", description: "Supervisor app" },
  { path: "/om-app", module: "operations", description: "Operations Manager app" },
  { path: "/cm-app", module: "operations", description: "Cluster Manager app" },
  { path: "/city-app", module: "operations", description: "City Manager app" },
  { path: "/tsm-app", module: "crm", description: "TSM app" },
  { path: "/tse-app", module: "crm", description: "TSE app" },
  { path: "/cce-app", module: "crm", description: "CCE app" },

  // INCENTIVES
  { path: "/incentives/configuration", module: "hr", description: "Incentive configuration" },
  { path: "/incentives/*", module: "payroll", description: "Incentive management" },

  // HIERARCHY
  { path: "/hierarchy-dashboard", module: "operations", description: "Org hierarchy" },

  // PUBLIC ONBOARDING
  { path: "/onboard/:empId", module: "public", description: "Employee onboarding" },
  { path: "/onboarding/:empId", module: "public", description: "Employee onboarding form" },
];

/**
 * Find route configuration for a given path
 *
 * @param path - Current route path
 * @returns Route config or undefined if not found
 */
export function getRouteConfig(path: string): AppRoute | undefined {
  // Strip query params from path (e.g., /tse-app?tab=leads → /tse-app)
  const pathWithoutQuery = path.split("?")[0];

  // First try exact match
  const exactMatch = ROUTES.find(route => route.path === pathWithoutQuery);
  if (exactMatch) return exactMatch;

  // Try wildcard matching
  for (const route of ROUTES) {
    if (route.path.endsWith("/*")) {
      const basePath = route.path.slice(0, -2);
      if (pathWithoutQuery.startsWith(basePath)) {
        return route;
      }
    }

    // Try dynamic segment matching (e.g., /finance/invoices/:id)
    if (route.path.includes(":")) {
      const pattern = route.path.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(pathWithoutQuery)) {
        return route;
      }
    }
  }

  return undefined;
}

/**
 * Check if a route is public (no authentication required)
 *
 * @param path - Route path to check
 * @returns true if route is public
 */
export function isPublicRoute(path: string): boolean {
  // Strip query params from path
  const pathWithoutQuery = path.split("?")[0];

  const publicRoutes = [
    "/onboarding",
    "/onboard",
    "/unauthorized",
  ];

  return publicRoutes.some(route => pathWithoutQuery.startsWith(route));
}

/**
 * Get default landing page for a role
 *
 * @param role - User's role
 * @returns Default route path for this role
 */
export function getDefaultRoute(role: string): string {
  const roleDefaults: Record<string, string> = {
    "Super Admin": "/",
    "Admin": "/",
    "City Manager": "/analytics/dashboard",
    "Cluster Manager": "/cm-app",
    "Sr Operations Manager": "/operations",
    "Operations Manager": "/om-app",
    "Manager": "/operations",
    "Supervisor": "/supervisor-app",
    "Car Washer": "/washer-core-screens",
    "TSM": "/tsm-app",
    "TSE": "/tse-app",
    "CCE": "/cce-app",
    "Store Manager": "/store-manager",
    "Procurement Manager": "/procurement",
    "Accounts": "/accounts",
    "HR": "/hr",
  };

  return roleDefaults[role] || "/";
}
