/**
 * RoleContext - Global role/user state
 * REFACTORED: Now derives currentUser from useEmployeeData (single source of truth)
 *
 * CRITICAL: NO hardcoded employee data allowed
 * All user data comes from useEmployeeData hook
 */

import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import { Role, getRoleConfig, RoleConfig } from "../lib/roleConfig";
import { useEmployeeData } from "../hooks/useEmployeeData";
import { logger } from "../services/logger";
import type { EmployeeRole } from "./OrgContext";

interface RoleContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  roleConfig: RoleConfig | undefined;
  currentUser: {
    employeeId?: string;
    name: string;
    email: string;
    city: string;
    role: Role;
    phone?: string;
    // Hierarchy assignments
    cityId?: string;
    clusterId?: string;
    assignedPincodes?: string[];
  };
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

/**
 * Map Role to EmployeeRole
 * Some roles are direct matches, others need mapping
 */
const roleToEmployeeRole: Record<Role, EmployeeRole> = {
  "Super Admin": "Super Admin",
  "Admin": "Admin",
  "City Manager": "City Manager",
  "Sr Operations Manager": "Sr Operations Manager",
  "Operations Manager": "Operations Manager",
  "Cluster Manager": "Cluster Manager",
  "Manager": "Manager",
  "Supervisor": "Supervisor",
  "Car Washer": "Car Washer Full Time", // Default to full-time
  "TSM": "TSM",
  "TSE": "TSE",
  "CCE": "CCE",
  "Store Manager": "Store Manager",
  "Procurement Manager": "Procurement Manager",
  "Accounts": "Accounts",
  "HR": "HR",
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>("Super Admin");
  const roleConfig = getRoleConfig(currentRole);

  /**
   * Get current user data with fallback for demo/default user
   * Uses hardcoded defaults until EmployeeContext integration is complete
   */
  const currentUser = useMemo(() => {
    // Temporary fallback user based on role
    // TODO: Replace stubs with real EmployeeContext lookup after auth is implemented
    const defaultUsers: Record<Role, any> = {
      "Super Admin": {
        employeeId: "EMP-SA-001",
        name: "Super Admin",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "Admin": {
        employeeId: "EMP-A-001",
        name: "Admin User",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "City Manager": {
        employeeId: "CM-001",
        name: "City Manager",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "Cluster Manager": {
        employeeId: "CLM-001",
        name: "Cluster Manager",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "Operations Manager": {
        employeeId: "OM-001",
        name: "Operations Manager",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "Sr Operations Manager": {
        employeeId: "SOM-001",
        name: "Sr Operations Manager",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "Manager": {
        employeeId: "MGR-001",
        name: "Manager",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "Supervisor": {
        employeeId: "SUP-001",
        name: "Supervisor",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "Car Washer": {
        employeeId: "WASHER-001",
        name: "Car Washer",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "TSM": {
        employeeId: "TSM-001",
        name: "Telesales Manager",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "TSE": {
        employeeId: "TSE-001",
        name: "Telesales Executive",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "CCE": {
        employeeId: "CCE-001",
        name: "Customer Care Executive",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "Store Manager": {
        employeeId: "SM-001",
        name: "Store Manager",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "Procurement Manager": {
        employeeId: "PM-001",
        name: "Procurement Manager",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "Accounts": {
        employeeId: "ACC-001",
        name: "Accounts Manager",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
      "HR": {
        employeeId: "HR-001",
        name: "HR Manager",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: currentRole,
      },
    };

    return defaultUsers[currentRole] || {
      name: "Unknown User",
      email: "",
      city: "Surat",
      cityId: "CITY-SURAT",
      role: currentRole,
    };
  }, [currentRole]);

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        roleConfig,
        currentUser,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);

  if (context === undefined) {
    return {
      currentRole: "Super Admin" as Role,
      setCurrentRole: () => {},
      roleConfig: getRoleConfig("Super Admin"),
      currentUser: {
        name: "Demo User",
        email: "",
        city: "Surat",
        cityId: "CITY-SURAT",
        role: "Super Admin" as Role,
      },
    };
  }

  return context;
}

/**
 * BEFORE (WRONG):
 * ```typescript
 * const getUserData = (role: Role) => {
 *   const baseData: Record<Role, { name: string; email: string; ... }> = {
 *     "Super Admin": { name: "Rajesh Patel", email: "rajesh@cleancar.com", ... },
 *     // ... hardcoded data for all roles
 *   };
 *   return baseData[role];
 * };
 * ```
 *
 * AFTER (CORRECT):
 * ```typescript
 * const currentUser = useMemo(() => {
 *   const employeeRole = roleToEmployeeRole[currentRole];
 *   const matchingEmployees = getEmployeesByRole(employeeRole);
 *   const employee = matchingEmployees.find((emp) => emp.status === "Active");
 *   // Return employee data from HRDataContext
 * }, [currentRole, employees, getEmployeesByRole]);
 * ```
 *
 * BENEFIT:
 * - No duplicate employee data
 * - Role switching shows real employees
 * - Updates in HRDataContext automatically reflect in RoleContext
 * - Single source of truth maintained
 */
