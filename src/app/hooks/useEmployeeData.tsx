/**
 * useEmployeeData Hook - PHASE 4 AGGREGATOR
 *
 * Unified employee data interface that aggregates all domain contexts
 * Provides enriched employee data with salary, incentives, attendance, and performance
 *
 * ARCHITECTURAL PATTERN:
 * This hook is an AGGREGATOR that combines:
 * - EmployeeContext (core identity)
 * - PayrollContext (salary, payroll runs)
 * - IncentiveContext (incentive plans, calculations)
 * - AttendanceContext (attendance records)
 * - OrgContext (roles, departments, designations)
 *
 * Single source of truth: Each domain context owns its data
 * This hook provides a convenient unified API for components
 */

import { useMemo, useCallback } from "react";
import { useEmployee, type Employee as CoreEmployee, type EmployeeStatus } from "../contexts/EmployeeContext";
import { usePayroll } from "../contexts/PayrollContext";
import { useIncentive } from "../contexts/IncentiveContext";
import { useAttendance } from "../contexts/AttendanceContext";
import { useOrg, type EmployeeRole } from "../contexts/OrgContext";

// ========== ENRICHED EMPLOYEE TYPE ==========

/**
 * Enriched Employee with computed fields and domain data
 */
export interface EnrichedEmployee extends CoreEmployee {
  // Computed fields
  fullName: string;
  isProfileComplete: boolean;
  completionScore: number; // 0-100
  missingFields: string[];

  // Domain data (aggregated from other contexts)
  salary?: {
    type?: "fixed" | "hourly" | "per_car" | "hybrid";
    base?: number;
    structureId?: string;
    components?: {
      basic?: number;
      hra?: number;
      allowances?: number;
      deductions?: number;
    };
    paymentCycle?: "weekly" | "monthly";
  };

  incentives?: {
    planId?: string;
    type?: "per_car" | "target_based" | "revenue_share" | "tiered";
    target?: number;
    achieved?: number;
    calculatedAmount?: number;
    status?: string;
  };

  performance?: {
    totalCarsWashed?: number;
    rating?: number;
    attendanceScore?: number;
    lastUpdated?: string;
  };
}

// ========== PROFILE COMPLETION LOGIC ==========

function calculateProfileCompletion(employee: CoreEmployee): {
  isComplete: boolean;
  score: number;
  missing: string[];
} {
  const missing: string[] = [];
  let score = 0;

  // Base fields (always present) - 40 points
  score += 40;

  // Salary configuration - 30 points
  if (employee.salaryStructureId || employee.baseSalary) {
    score += 30;
  } else {
    missing.push("Salary Configuration");
  }

  // Incentive plan - 20 points
  if (employee.incentivePlanId || employee.incentiveEligible) {
    score += 20;
  } else {
    missing.push("Incentive Plan");
  }

  // Bank details - 10 points
  if (employee.bankDetails && employee.bankDetails.accountNumber) {
    score += 10;
  } else {
    missing.push("Bank Details");
  }

  return {
    isComplete: score === 100,
    score,
    missing,
  };
}

// ========== MAIN HOOK ==========

export function useEmployeeData() {
  // PHASE 4: Import all domain contexts
  const employeeCtx = useEmployee();
  const payrollCtx = usePayroll();
  const incentiveCtx = useIncentive();
  const attendanceCtx = useAttendance();
  const orgCtx = useOrg();

  // ========== ENRICH EMPLOYEES ==========

  const enrichedEmployees = useMemo((): EnrichedEmployee[] => {
    return employeeCtx.employees.map((employee) => {
      const { isComplete, score, missing } = calculateProfileCompletion(employee);

      // Get salary structure if referenced
      let salary = undefined;
      if (employee.salaryStructureId) {
        const structure = payrollCtx.getSalaryStructure(employee.salaryStructureId);
        if (structure) {
          salary = {
            type: structure.type,
            base: structure.components.basic,
            structureId: structure.structureId,
            components: structure.components,
            paymentCycle: "monthly" as const,
          };
        }
      } else if (employee.baseSalary) {
        // Legacy fallback
        salary = {
          type: "fixed" as const,
          base: employee.baseSalary,
          paymentCycle: "monthly" as const,
        };
      }

      // Get incentive data if referenced
      let incentives = undefined;
      if (employee.incentivePlanId) {
        const employeeIncentive = incentiveCtx.getEmployeeIncentive(employee.employeeId);
        const plan = incentiveCtx.getIncentivePlan(employee.incentivePlanId);
        if (employeeIncentive && plan) {
          incentives = {
            planId: plan.planId,
            type: plan.type,
            target: employeeIncentive.target,
            achieved: employeeIncentive.achieved,
            calculatedAmount: employeeIncentive.calculatedAmount,
            status: employeeIncentive.status,
          };
        }
      } else if (employee.incentiveEligible) {
        // Legacy fallback
        incentives = {
          type: "per_car" as const,
          target: 0,
          achieved: 0,
        };
      }

      // Calculate performance metrics
      const attendanceRecords = attendanceCtx.getAttendanceByEmployee(employee.employeeId);
      const thisMonth = new Date().toISOString().slice(0, 7);
      const monthlyAttendance = attendanceCtx.getMonthlyAttendanceSummary(employee.employeeId, thisMonth);

      const performance = {
        totalCarsWashed: 0, // Would be calculated from job data
        rating: 4.5, // Default rating
        attendanceScore: monthlyAttendance.attendancePercentage,
        lastUpdated: new Date().toISOString(),
      };

      return {
        ...employee,
        fullName: `${employee.firstName} ${employee.lastName}`,
        isProfileComplete: isComplete,
        completionScore: score,
        missingFields: missing,
        salary,
        incentives,
        performance,
      };
    });
  }, [employeeCtx.employees, payrollCtx, incentiveCtx, attendanceCtx]);

  // ========== HELPER FUNCTIONS ==========

  const getEnrichedEmployee = useCallback((employeeId: string): EnrichedEmployee | undefined => {
    return enrichedEmployees.find((emp) => emp.employeeId === employeeId);
  }, [enrichedEmployees]);

  const getIncompleteProfiles = useCallback((): EnrichedEmployee[] => {
    return enrichedEmployees.filter((emp) => !emp.isProfileComplete);
  }, [enrichedEmployees]);

  const getCompleteProfiles = useCallback((): EnrichedEmployee[] => {
    return enrichedEmployees.filter((emp) => emp.isProfileComplete);
  }, [enrichedEmployees]);

  // ========== DOMAIN-SPECIFIC UPDATE HELPERS ==========

  const updateEmployeeWithSalary = useCallback((
    employeeId: string,
    salaryData: {
      type: "fixed" | "hourly" | "per_car" | "hybrid";
      base: number;
      components?: {
        basic?: number;
        hra?: number;
        allowances?: number;
        deductions?: number;
      };
      paymentCycle?: "weekly" | "monthly";
    }
  ): void => {
    // Create salary structure if it doesn't exist
    const structure = payrollCtx.addSalaryStructure({
      name: `Salary Structure - ${employeeId}`,
      type: salaryData.type,
      components: salaryData.components || {
        basic: salaryData.base,
        hra: 0,
        allowances: 0,
        deductions: 0,
      },
      applicableRoles: [],
      isActive: true,
    });

    // Update employee reference
    employeeCtx.updateEmployee(employeeId, {
      salaryStructureId: structure.structureId,
      baseSalary: salaryData.base, // Keep for backward compatibility
    });
  }, [employeeCtx, payrollCtx]);

  const updateEmployeeWithIncentives = useCallback((
    employeeId: string,
    incentiveData: {
      planId?: string;
      type?: "per_car" | "target_based" | "revenue_share" | "tiered";
      target?: number;
    }
  ): void => {
    if (incentiveData.planId) {
      // Assign existing plan
      incentiveCtx.assignIncentivePlan(employeeId, incentiveData.planId);
    }

    // Update employee reference
    employeeCtx.updateEmployee(employeeId, {
      incentivePlanId: incentiveData.planId,
      incentiveEligible: true, // Keep for backward compatibility
    });
  }, [employeeCtx, incentiveCtx]);

  const updateEmployeePerformance = useCallback((
    employeeId: string,
    performanceData: {
      totalCarsWashed?: number;
      rating?: number;
    }
  ): void => {
    // Performance is calculated, not stored directly
    // Update achievement in incentive context
    if (performanceData.totalCarsWashed !== undefined) {
      incentiveCtx.updateAchievement(employeeId, performanceData.totalCarsWashed);
    }
  }, [incentiveCtx]);

  // ========== UNIFIED API ==========

  return {
    // PHASE 4: Core employee data (enriched)
    employees: enrichedEmployees,
    getEmployeeById: getEnrichedEmployee,
    enrichedEmployees,
    getEnrichedEmployee,

    // Profile filtering
    getIncompleteProfiles,
    getCompleteProfiles,

    // Employee operations (pass-through to EmployeeContext)
    addEmployee: employeeCtx.addEmployee,
    updateEmployee: employeeCtx.updateEmployee,
    deleteEmployee: employeeCtx.deleteEmployee,
    getEmployeesByRole: employeeCtx.getEmployeesByRole,

    // Domain-specific updates
    updateEmployeeWithSalary,
    updateEmployeeWithIncentives,
    updateEmployeePerformance,

    // Organizational data (pass-through from OrgContext)
    roles: orgCtx.roles,
    departments: orgCtx.departments,
    designations: orgCtx.designations,
    publicHolidays: orgCtx.publicHolidays,

    // Attendance data (pass-through from AttendanceContext)
    attendanceRecords: attendanceCtx.attendanceRecords,
    addAttendanceRecord: attendanceCtx.addAttendanceRecord,
    updateAttendance: attendanceCtx.updateAttendance,
    getEmployeeAttendance: attendanceCtx.getAttendanceForDate, // Renamed for consistency
    getAttendanceByEmployee: attendanceCtx.getAttendanceByEmployee,
    getMonthlyAttendanceSummary: attendanceCtx.getMonthlyAttendanceSummary,

    // Payroll data (pass-through from PayrollContext)
    payrollRuns: payrollCtx.payrollRuns,
    getPayrollForMonth: payrollCtx.getPayrollForMonth,
    processPayroll: payrollCtx.processPayroll,
    applyHROverride: payrollCtx.applyHROverride,
    approvePayrollByHR: payrollCtx.approvePayrollByHR,
    approvePayrollByFinance: payrollCtx.approvePayrollByFinance,
    markPayrollAsPaid: payrollCtx.markPayrollAsPaid,

    // Incentive data (pass-through from IncentiveContext)
    incentivePlans: incentiveCtx.incentivePlans,
    getIncentivePlan: incentiveCtx.getIncentivePlan,

    // Statistics
    profileCompletionRate:
      employeeCtx.employees.length > 0
        ? (enrichedEmployees.filter((e) => e.isProfileComplete).length /
            employeeCtx.employees.length) *
          100
        : 0,
  };
}

/**
 * Backward Compatibility: Migration helper
 * (Not needed in Phase 4 - all data in proper domains)
 */
export function migrateEmployeeToNewStructure(employee: CoreEmployee): Partial<CoreEmployee> {
  const updates: Partial<CoreEmployee> = {};

  // Already handled by domain contexts
  return updates;
}
