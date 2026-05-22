/**
 * incentiveVisibilityService.ts
 *
 * Super Admin can activate or deactivate the Incentive screen
 * for any role or individual employee. This is the single source
 * of truth — SalesManagerApp and SalesHeadApp both read from here
 * before rendering the Incentives tab.
 *
 * Storage key: cc360_incentive_visibility
 * Shape:
 *   {
 *     roles: { [role: string]: boolean }          // per-role default
 *     employees: { [employeeId: string]: boolean } // per-employee override (highest priority)
 *     updatedAt: string
 *     updatedBy: string
 *   }
 */

export interface IncentiveVisibilityConfig {
  roles: Record<string, boolean>;
  employees: Record<string, boolean>;
  updatedAt: string;
  updatedBy: string;
}

const STORAGE_KEY = "cc360_incentive_visibility";

// All roles that have an incentive tab in their app
const INCENTIVE_ROLES = [
  "Sales Manager",
  "Sales Head",
  "TSM",
  "TSE",
  "Supervisor",
  "Car Washer",
  "CCE",
];

const DEFAULT_CONFIG: IncentiveVisibilityConfig = {
  roles: Object.fromEntries(INCENTIVE_ROLES.map((r) => [r, true])),
  employees: {},
  updatedAt: new Date().toISOString(),
  updatedBy: "System",
};

class IncentiveVisibilityService {
  private read(): IncentiveVisibilityConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      const parsed = JSON.parse(raw);
      // Merge with defaults so newly added roles are always present
      return {
        roles: { ...DEFAULT_CONFIG.roles, ...parsed.roles },
        employees: parsed.employees || {},
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        updatedBy: parsed.updatedBy || "System",
      };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  private write(config: IncentiveVisibilityConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  /** Get the full config (for the admin UI) */
  getConfig(): IncentiveVisibilityConfig {
    return this.read();
  }

  /** All roles that have incentive tabs */
  getAllRoles(): string[] {
    return INCENTIVE_ROLES;
  }

  /**
   * Check if the incentive screen is visible for a given role + employee.
   * Employee-level overrides beat role-level defaults.
   */
  isVisible(role: string, employeeId?: string): boolean {
    const config = this.read();
    // Employee-level override (highest priority)
    if (employeeId && employeeId in config.employees) {
      return config.employees[employeeId];
    }
    // Role-level default
    return config.roles[role] ?? true;
  }

  /**
   * Super Admin: set visibility for an entire role.
   * Affects all employees of that role unless they have a personal override.
   */
  setRoleVisibility(role: string, visible: boolean, updatedBy: string): void {
    const config = this.read();
    config.roles[role] = visible;
    config.updatedAt = new Date().toISOString();
    config.updatedBy = updatedBy;
    this.write(config);
  }

  /**
   * Super Admin: set visibility for a specific employee (overrides role default).
   */
  setEmployeeVisibility(employeeId: string, visible: boolean, updatedBy: string): void {
    const config = this.read();
    config.employees[employeeId] = visible;
    config.updatedAt = new Date().toISOString();
    config.updatedBy = updatedBy;
    this.write(config);
  }

  /**
   * Super Admin: remove an employee-level override (falls back to role default).
   */
  clearEmployeeOverride(employeeId: string, updatedBy: string): void {
    const config = this.read();
    delete config.employees[employeeId];
    config.updatedAt = new Date().toISOString();
    config.updatedBy = updatedBy;
    this.write(config);
  }

  /** Reset everything to defaults */
  reset(updatedBy: string): void {
    this.write({
      ...DEFAULT_CONFIG,
      updatedAt: new Date().toISOString(),
      updatedBy,
    });
  }
}

export const incentiveVisibilityService = new IncentiveVisibilityService();
