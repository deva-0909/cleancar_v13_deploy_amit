/**
 * IncentiveContext - Incentive Management
 * PHASE 4: Domain-specific context for incentive data
 *
 * Owns:
 * - Incentive plans
 * - Incentive rules
 * - Incentive calculations
 *
 * Single source of truth for incentives
 */

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { DataService } from "../services/DataService";

// ========== TYPES ==========

export type IncentiveType = "per_car" | "target_based" | "revenue_share" | "tiered";

export interface IncentivePlan {
  planId: string;
  name: string;
  description?: string;
  type: IncentiveType;
  applicableRoles: string[];

  // Rules
  rules: {
    // Per car incentive
    perCarAmount?: number;

    // Target based
    targetCars?: number;
    targetAmount?: number;
    achievementBonus?: number;

    // Tiered structure
    tiers?: Array<{
      from: number;
      to: number;
      amount: number;
    }>;

    // Revenue share
    revenueSharePercentage?: number;
  };

  // Payout settings
  payoutCycle: "weekly" | "monthly" | "quarterly";
  minPayout?: number;
  maxPayout?: number;

  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface EmployeeIncentive {
  employeeId: string;
  planId: string;

  // Current period tracking
  currentPeriod: {
    startDate: string;
    endDate: string;
  };

  // Achievement
  target: number;
  achieved: number;
  achievementPercentage: number;

  // Calculated payout
  calculatedAmount: number;

  // Status
  status: "Active" | "Pending Approval" | "Approved" | "Paid";
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;

  lastUpdated: string;
}

// ========== CONTEXT TYPE ==========

interface IncentiveContextType {
  // Incentive Plans
  incentivePlans: IncentivePlan[];
  addIncentivePlan: (plan: Omit<IncentivePlan, "planId" | "createdAt">) => IncentivePlan;
  updateIncentivePlan: (planId: string, updates: Partial<IncentivePlan>) => void;
  deleteIncentivePlan: (planId: string) => void;
  getIncentivePlan: (planId: string) => IncentivePlan | undefined;
  getActivePlans: () => IncentivePlan[];
  getConfigForRole: (roleName: string) => { quota: number; perUnitRate: number; addOnsRate: number } | null;

  // Employee Incentives
  employeeIncentives: EmployeeIncentive[];
  assignIncentivePlan: (employeeId: string, planId: string) => void;
  updateEmployeeIncentive: (employeeId: string, updates: Partial<EmployeeIncentive>) => void;
  getEmployeeIncentive: (employeeId: string) => EmployeeIncentive | undefined;

  // Calculations
  calculateIncentive: (employeeId: string, achieved: number) => number;
  updateAchievement: (employeeId: string, achieved: number) => void;

  // Approval workflow
  approveIncentive: (employeeId: string, approvedBy: string) => void;
  markIncentiveAsPaid: (employeeId: string) => void;
}

const IncentiveContext = createContext<IncentiveContextType | undefined>(undefined);

// ========== PROVIDER ==========

export function IncentiveProvider({ children }: { children: ReactNode }) {
  const [incentivePlans, setIncentivePlans] = useState<IncentivePlan[]>(() => {
    const stored = DataService.get<IncentivePlan>("INCENTIVE_PLANS");
    console.log(`[IncentiveContext] Loaded ${stored.length} incentive plans`);
    return stored;
  });

  const [employeeIncentives, setEmployeeIncentives] = useState<EmployeeIncentive[]>(() => {
    const stored = DataService.get<EmployeeIncentive>("EMPLOYEE_INCENTIVES");
    return stored;
  });

  // Persist to storage
  useEffect(() => {
    DataService.setAll("INCENTIVE_PLANS", incentivePlans);
  }, [incentivePlans]);

  useEffect(() => {
    DataService.setAll("EMPLOYEE_INCENTIVES", employeeIncentives);
  }, [employeeIncentives]);

  // ========== INCENTIVE PLAN ACTIONS ==========

  const addIncentivePlan = useCallback((
    plan: Omit<IncentivePlan, "planId" | "createdAt">
  ): IncentivePlan => {
    const newPlan: IncentivePlan = {
      ...plan,
      planId: `INC-PLAN-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setIncentivePlans((prev) => [...prev, newPlan]);
    return newPlan;
  }, []);

  const updateIncentivePlan = useCallback((planId: string, updates: Partial<IncentivePlan>) => {
    setIncentivePlans((prev) =>
      prev.map((plan) =>
        plan.planId === planId
          ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
          : plan
      )
    );
  }, []);

  const deleteIncentivePlan = useCallback((planId: string) => {
    setIncentivePlans((prev) => prev.filter((plan) => plan.planId !== planId));
  }, []);

  const getIncentivePlan = useCallback((planId: string): IncentivePlan | undefined => {
    return incentivePlans.find((plan) => plan.planId === planId);
  }, [incentivePlans]);

  const getActivePlans = useCallback((): IncentivePlan[] => {
    return incentivePlans.filter((plan) => plan.isActive);
  }, [incentivePlans]);

  const getConfigForRole = useCallback((roleName: string): { quota: number; perUnitRate: number; addOnsRate: number } | null => {
    // Find active plan that applies to this role
    const plan = incentivePlans.find(
      (p) => p.isActive && p.applicableRoles.includes(roleName)
    );

    if (!plan) return null;

    return {
      quota: plan.rules.targetCars ?? 50,
      perUnitRate: plan.rules.perCarAmount ?? 25,
      addOnsRate: 50, // TODO: Add to plan rules if needed
    };
  }, [incentivePlans]);

  // ========== EMPLOYEE INCENTIVE ACTIONS ==========

  const assignIncentivePlan = useCallback((employeeId: string, planId: string) => {
    const plan = getIncentivePlan(planId);
    if (!plan) return;

    const now = new Date();
    const newIncentive: EmployeeIncentive = {
      employeeId,
      planId,
      currentPeriod: {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0],
      },
      target: plan.rules.targetCars || 0,
      achieved: 0,
      achievementPercentage: 0,
      calculatedAmount: 0,
      status: "Active",
      lastUpdated: new Date().toISOString(),
    };

    setEmployeeIncentives((prev) => {
      const existing = prev.find((inc) => inc.employeeId === employeeId);
      if (existing) {
        return prev.map((inc) =>
          inc.employeeId === employeeId ? newIncentive : inc
        );
      }
      return [...prev, newIncentive];
    });
  }, [getIncentivePlan]);

  const updateEmployeeIncentive = useCallback((employeeId: string, updates: Partial<EmployeeIncentive>) => {
    setEmployeeIncentives((prev) =>
      prev.map((inc) =>
        inc.employeeId === employeeId
          ? { ...inc, ...updates, lastUpdated: new Date().toISOString() }
          : inc
      )
    );
  }, []);

  const getEmployeeIncentive = useCallback((employeeId: string): EmployeeIncentive | undefined => {
    return employeeIncentives.find((inc) => inc.employeeId === employeeId);
  }, [employeeIncentives]);

  // ========== CALCULATIONS ==========

  const calculateIncentive = useCallback((employeeId: string, achieved: number): number => {
    const employeeInc = getEmployeeIncentive(employeeId);
    if (!employeeInc) return 0;

    const plan = getIncentivePlan(employeeInc.planId);
    if (!plan) return 0;

    let calculatedAmount = 0;

    switch (plan.type) {
      case "per_car":
        calculatedAmount = achieved * (plan.rules.perCarAmount || 0);
        break;

      case "target_based":
        const achievementPercentage = employeeInc.target > 0
          ? (achieved / employeeInc.target) * 100
          : 0;
        if (achievementPercentage >= 100) {
          calculatedAmount = (plan.rules.targetAmount || 0) + (plan.rules.achievementBonus || 0);
        } else {
          calculatedAmount = (plan.rules.targetAmount || 0) * (achievementPercentage / 100);
        }
        break;

      case "tiered":
        if (plan.rules.tiers) {
          for (const tier of plan.rules.tiers) {
            if (achieved >= tier.from && achieved <= tier.to) {
              calculatedAmount = tier.amount;
              break;
            }
          }
        }
        break;

      default:
        calculatedAmount = 0;
    }

    // Apply min/max limits
    if (plan.minPayout && calculatedAmount < plan.minPayout) {
      calculatedAmount = 0;
    }
    if (plan.maxPayout && calculatedAmount > plan.maxPayout) {
      calculatedAmount = plan.maxPayout;
    }

    return calculatedAmount;
  }, [getEmployeeIncentive, getIncentivePlan]);

  const updateAchievement = useCallback((employeeId: string, achieved: number) => {
    const employeeInc = getEmployeeIncentive(employeeId);
    if (!employeeInc) return;

    const achievementPercentage = employeeInc.target > 0
      ? (achieved / employeeInc.target) * 100
      : 0;
    const calculatedAmount = calculateIncentive(employeeId, achieved);

    updateEmployeeIncentive(employeeId, {
      achieved,
      achievementPercentage,
      calculatedAmount,
    });
  }, [getEmployeeIncentive, calculateIncentive, updateEmployeeIncentive]);

  // ========== APPROVAL WORKFLOW ==========

  const approveIncentive = useCallback((employeeId: string, approvedBy: string) => {
    updateEmployeeIncentive(employeeId, {
      status: "Approved",
      approvedBy,
      approvedAt: new Date().toISOString(),
    });
  }, [updateEmployeeIncentive]);

  const markIncentiveAsPaid = useCallback((employeeId: string) => {
    updateEmployeeIncentive(employeeId, {
      status: "Paid",
      paidAt: new Date().toISOString(),
    });
  }, [updateEmployeeIncentive]);

  // ========== CONTEXT VALUE ==========

  const value: IncentiveContextType = {
    incentivePlans,
    addIncentivePlan,
    updateIncentivePlan,
    deleteIncentivePlan,
    getIncentivePlan,
    getActivePlans,
    getConfigForRole,
    employeeIncentives,
    assignIncentivePlan,
    updateEmployeeIncentive,
    getEmployeeIncentive,
    calculateIncentive,
    updateAchievement,
    approveIncentive,
    markIncentiveAsPaid,
  };

  return <IncentiveContext.Provider value={value}>{children}</IncentiveContext.Provider>;
}

// ========== HOOK ==========

export function useIncentive() {
  const context = useContext(IncentiveContext);
  if (!context) {
    console.warn("[Context] called outside provider — using safe defaults."); return null as any;
  }
  return context;
}
