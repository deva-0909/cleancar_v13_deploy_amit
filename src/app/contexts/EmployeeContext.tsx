/**
 * EmployeeContext - Core Employee Data (READ-ONLY)
 * PHASE 4: Domain-specific context for employee identity
 *
 * ⚠️ CRITICAL - READ-ONLY CONTEXT:
 * This context is READ-ONLY. All employee write operations MUST go through HRDataContext.
 *
 * WHY READ-ONLY:
 * - Prevents data corruption from multiple write sources
 * - HRDataContext is the SINGLE WRITER to employee data
 * - Uses proper DataService.insert/update/delete methods
 * - EmployeeContext just loads data from DataService (no writes)
 *
 * Owns:
 * - Employee identity (ID, name, contact)
 * - Employment status
 * - Organizational assignment
 * - REFERENCES to other domains (NOT full objects)
 *
 * WRITE OPERATIONS:
 * ❌ DO NOT use EmployeeContext.addEmployee/updateEmployee/deleteEmployee
 * ✅ USE HRDataContext.addEmployee/updateEmployee/deleteEmployee instead
 *
 * CRITICAL PRINCIPLE:
 * - Stores salaryStructureId (NOT salary object)
 * - Stores incentivePlanId (NOT incentive calculations)
 * - Related data lives in domain contexts (Payroll, Incentive, etc.)
 */

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";
import { eventBus } from "../utils/eventBus";
import { EVENTS } from "../constants/events";
import type { EmployeeRole } from "./OrgContext";
import { useCity } from "./CityContext";

// ========== TYPES ==========

export type EmployeeStatus = "Active" | "On Leave" | "Inactive" | "Terminated";

/**
 * PHASE 4 Employee Model - Lean and Reference-based
 * Stores ONLY core identity and references to other domains
 */
export interface Employee {
  // ===== CORE IDENTITY =====
  employeeId: string; // Primary key, used across all systems
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // ===== EMPLOYMENT =====
  role: EmployeeRole;
  status: EmployeeStatus;
  joiningDate: string;

  // ===== ORGANIZATIONAL ASSIGNMENT =====
  department: string;
  city: string;
  unit?: string;

  // ===== HIERARCHY & GEOGRAPHY =====
  cityId?: string;
  clusterId?: string;
  assignedPincodes?: string[];

  // ===== REFERENCES TO OTHER DOMAINS (IDs only, not full objects) =====
  salaryStructureId?: string; // → PayrollContext
  incentivePlanId?: string; // → IncentiveContext

  // ===== PERMISSION OVERRIDES (MC-11) =====
  customPermissions?: import("../types/permissions").PermissionMatrix; // → PermissionEngine
  permissionGrantedBy?: string; // Who granted custom permissions
  permissionGrantedAt?: string; // When custom permissions granted
  permissionReason?: string; // Why custom permissions granted
  subRoleId?: string; // Custom sub-role assigned by Super Admin
  permissionOverrideReason?: string; // Reason for individual permission overrides
  permissionOverrideExpiresAt?: string; // Optional expiry for temporary access

  // ===== LEGACY FIELDS (for backward compatibility during migration) =====
  baseSalary?: number; // Will be deprecated once all data migrated
  incentiveEligible?: boolean; // Will be deprecated

  // ===== BANK DETAILS =====
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };

  // ===== DOCUMENTS =====
  documents?: Array<{
    type: string;
    url: string;
    uploadedAt: string;
  }>;

  // ===== METADATA =====
  createdAt: string;
  updatedAt: string;
}

// ========== CONTEXT TYPE ==========

interface EmployeeContextType {
  // Data (READ-ONLY)
  employees: Employee[];
  cityEmployees: Employee[];  // Auto-filtered to current city — use this in components

  // isLoaded: true once the initial localStorage read is complete.
  // Use this in RouteGuard / any guard that must not run before employees are available.
  isLoaded: boolean;

  // Queries
  getEmployeeById: (employeeId: string) => Employee | undefined;
  getEmployeesByRole: (role: EmployeeRole | EmployeeRole[]) => Employee[];
  getEmployeesByStatus: (status: EmployeeStatus) => Employee[];
  getEmployeesByCity: (city: string) => Employee[];
  getEmployeesByPincode: (pincode: string) => Employee[];
  getEmployeesByCluster: (clusterId: string) => Employee[];
  getActiveEmployees: () => Employee[];

  // Statistics
  getEmployeeCount: () => number;
  getEmployeeCountByRole: (role: EmployeeRole) => number;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

// ========== PROVIDER ==========

export function EmployeeProvider({ children }: { children: ReactNode }) {
  // READ-ONLY: EmployeeContext only reads from DataService.
  // All writes (including initial seeding) are handled exclusively by HRDataContext.
  // Removing the seedEmployeesIfEmpty() call here prevents a race condition where
  // both EmployeeContext and HRDataContext seed simultaneously (both see count=0
  // before either write completes), resulting in duplicate employee records.
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const stored = DataService.get<Employee>("EMPLOYEES");
    logger.debug("EmployeeContext loaded", { count: stored.length });
    return stored;
  });

  // isLoaded is true immediately — employees initialise synchronously from localStorage.
  // Exposed on the context so guards (e.g. RouteGuard) can wait for initial load.
  const [isLoaded] = useState(true);

  const { city, cityInfo } = useCity();

  // Pre-filtered employees for the selected city — used by all components
  // Matches against both city name ("Surat") and cityId ("CITY-SURAT")
  const cityEmployees = useMemo(() => {
    const cityName = cityInfo.displayName.toLowerCase();
    const cityId   = city;
    return employees.filter(emp =>
      emp.city?.toLowerCase() === cityName ||
      emp.cityId === cityId ||
      emp.city === cityId
    );
  }, [employees, city, cityInfo]);

  // Re-hydrate from Supabase data after it loads into localStorage
  useEffect(() => {
    const t1 = setTimeout(() => {
      const stored = DataService.get<Employee>("EMPLOYEES");
      if (stored.length > employees.length) {
        console.log(`[EmployeeContext] Re-hydrating ${stored.length} employees`);
        setEmployees(stored);
      }
    }, 1500);
    const t2 = setTimeout(() => {
      const stored = DataService.get<Employee>("EMPLOYEES");
      if (stored.length > employees.length) {
        setEmployees(stored);
      }
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to reload employees from DataService
  const loadEmployees = useCallback(() => {
    const data = DataService.get<Employee>("EMPLOYEES");
    setEmployees(data);
    logger.debug("EmployeeContext reloaded", { count: data.length });
  }, []);

  // REAL-TIME SYNC: Subscribe to employee updates from HRDataContext
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(EVENTS.EMPLOYEES_UPDATED, () => {
      loadEmployees();
    });

    return () => unsubscribe();
  }, [loadEmployees]);

  // CROSS-TAB SYNC: Listen for storage changes in other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      loadEmployees();
      logger.debug("EmployeeContext synced from other tab");
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadEmployees]);

  // READ-ONLY: No persistence to storage
  // All writes handled by HRDataContext using DataService.insert/update/delete

  // ========== QUERIES (READ-ONLY) ==========

  const getEmployeeById = useCallback((employeeId: string): Employee | undefined => {
    return employees.find((emp) => emp.employeeId === employeeId);
  }, [employees]);

  const getEmployeesByRole = useCallback((role: EmployeeRole | EmployeeRole[]): Employee[] => {
    const roles = Array.isArray(role) ? role : [role];
    return employees.filter((emp) => roles.includes(emp.role));
  }, [employees]);

  const getEmployeesByStatus = useCallback((status: EmployeeStatus): Employee[] => {
    return employees.filter((emp) => emp.status === status);
  }, [employees]);

  const getEmployeesByCity = useCallback((city: string): Employee[] => {
    return employees.filter((emp) => emp.city === city);
  }, [employees]);

  const getEmployeesByPincode = useCallback((pincode: string): Employee[] => {
    return employees.filter((emp) => emp.assignedPincodes?.includes(pincode));
  }, [employees]);

  const getEmployeesByCluster = useCallback((clusterId: string): Employee[] => {
    return employees.filter((emp) => emp.clusterId === clusterId);
  }, [employees]);

  const getActiveEmployees = useCallback((): Employee[] => {
    return employees.filter((emp) => emp.status === "Active");
  }, [employees]);

  // ========== STATISTICS ==========

  const getEmployeeCount = useCallback((): number => {
    return employees.length;
  }, [employees]);

  const getEmployeeCountByRole = useCallback((role: EmployeeRole): number => {
    return employees.filter((emp) => emp.role === role).length;
  }, [employees]);

  // ========== CONTEXT VALUE (READ-ONLY) ==========

  const contextValue: EmployeeContextType = useMemo(() => ({
    employees,
    cityEmployees,
    isLoaded,
    getEmployeeById,
    getEmployeesByRole,
    getEmployeesByStatus,
    getEmployeesByCity,
    getEmployeesByPincode,
    getEmployeesByCluster,
    getActiveEmployees,
    getEmployeeCount,
    getEmployeeCountByRole,
  }),
  // eslint-disable-line react-hooks/exhaustive-deps
  [employees, cityEmployees, isLoaded, getEmployeeById, getEmployeesByRole, getEmployeesByStatus, getEmployeesByCity, getEmployeesByPincode, getEmployeesByCluster, getActiveEmployees, getEmployeeCount]);

  return <EmployeeContext.Provider value={contextValue}>{children}</EmployeeContext.Provider>;
}

// ========== HOOK ==========

export function useEmployee() {
  const context = useContext(EmployeeContext);

  if (!context) {
    // PREVIEW MODE FALLBACK: Detect if running in preview/standalone mode
    const isPreviewMode = typeof window !== "undefined" && (
      window.location.href.includes("figma.com") ||
      window.location.href.includes("preview") ||
      !import.meta.env?.PROD
    );

    // Provide safe fallback for preview/standalone mode
    if (import.meta.hot || isPreviewMode) {
      return {
        employees: [],
        cityEmployees: [],
        isLoaded: true,
        getEmployeeById: () => undefined,
        getEmployeesByRole: () => [],
        addEmployee: () => {},
        updateEmployee: () => {},
        deleteEmployee: () => {},
        getEmployeesByCity: () => [],
        getEmployeesByDepartment: () => [],
      };
    }

    throw new Error("useEmployee must be used within EmployeeProvider");
  }
  return context;
}
