/**
 * Layout Rules - Smart Sidebar Behavior
 *
 * Defines which routes should trigger auto-collapse for maximum content space
 */

/**
 * Routes that benefit from collapsed sidebar (dense content, wide tables, charts)
 */
export const DENSE_ROUTES = [
  "/analytics",
  "/finance",
  "/reports",
  "/operations",
  "/payroll",
  "/accounts",
  "/inventory",
  "/founder",
  "/gst",
  "/hr/lifecycle-reports",
  "/hr/employee-ledger",
  "/crm/conversion-analytics",
];

/**
 * Check if current route should trigger auto-collapse
 *
 * @param path - Current route path
 * @returns true if route is dense and should auto-collapse
 */
export function isDenseRoute(path: string): boolean {
  return DENSE_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Routes that should always keep sidebar expanded
 */
export const ALWAYS_EXPANDED_ROUTES = [
  "/onboarding",
  "/onboard",
];

/**
 * Check if route should force sidebar expansion
 *
 * @param path - Current route path
 * @returns true if sidebar should always be expanded
 */
export function shouldForceExpand(path: string): boolean {
  return ALWAYS_EXPANDED_ROUTES.some((route) => path.startsWith(route));
}
