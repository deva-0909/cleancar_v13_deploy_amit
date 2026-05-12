/**
 * CustomerSubscriptionContext - CUSTOMER SUBSCRIPTION INSTANCES
 *
 * ⚠️ DO NOT CONFUSE WITH PlanDefinitionContext ⚠️
 *
 * THIS CONTEXT:
 * - Stores active customer subscriptions (who subscribed to what)
 * - Links customers to plans via customerId and planId
 * - Tracks billing status, start/end dates, payment status
 * - Historical pricing locked at subscription creation
 *
 * PlanDefinitionContext (DIFFERENT):
 * - Stores plan templates and pricing definitions
 * - Used for admin plan management and pricing updates
 * - NOT for customer subscription tracking
 *
 * NAMING CONVENTION:
 * - "Subscription" = Customer subscription instance
 * - "Plan" = Plan definition/template
 *
 * Used across: CRM, Jobs, Finance, Revenue
 */

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";
import { useSync } from "../hooks/useSync";
// REMOVED: circular import useFinance from FinanceContext
import { useCity } from "./CityContext";

// Types
export interface CustomerSubscription {
  subscriptionId: string;
  customerId: string; // GLOBAL IDENTITY - links to CustomerContext
  packageType: "Basic" | "Standard" | "Premium" | "Deluxe";
  packageName: string;
  frequency: "Daily" | "Alternate Days" | "Weekly" | "Bi-Weekly" | "Monthly";
  status: "Active" | "Paused" | "Cancelled" | "Expired";
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  pricing: {
    basePrice: number;
    discount: number;
    finalPrice: number;
    currency: string;
  };
  priceLocked: number; // CRITICAL: Price snapshot at creation - NEVER changes for historical accuracy
  serviceDetails: {
    vehicleType: string;
    addOns?: string[];
    preferredTimeSlot?: string;
  };
  billingCycle: "Monthly" | "Quarterly" | "Annual";
  paymentStatus: "Paid" | "Pending" | "Overdue";
  createdAt: string;
  updatedAt: string;
  pauseHistory?: Array<{
    pausedAt: string;
    resumedAt?: string;
    reason: string;
  }>;
}

interface CustomerSubscriptionContextType {
  subscriptions: CustomerSubscription[];
  createSubscription: (subscription: Omit<CustomerSubscription, "subscriptionId" | "createdAt" | "updatedAt">) => CustomerSubscription;
  updateSubscription: (subscriptionId: string, updates: Partial<CustomerSubscription>) => void;
  updateSubscriptionStatus: (subscriptionId: string, status: CustomerSubscription["status"]) => void;
  deleteSubscription: (subscriptionId: string) => void;
  getSubscriptionById: (subscriptionId: string) => CustomerSubscription | undefined;
  getSubscriptionsByCustomerId: (customerId: string) => CustomerSubscription[];
  getActiveSubscriptions: () => CustomerSubscription[];
  pauseSubscription: (subscriptionId: string, reason: string) => void;
  resumeSubscription: (subscriptionId: string) => void;
  cancelSubscription: (subscriptionId: string) => void;
}

const CustomerSubscriptionContext = createContext<CustomerSubscriptionContextType | undefined>(undefined);

export function CustomerSubscriptionProvider({ children }: { children: ReactNode }) {
  // Defensive: FinanceProvider must be above CustomerSubscriptionProvider in AppProvider (now fixed).
  // useFinance removed — MRR fires via cc360_mrr_add event
  const { city } = useCity();

  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>(() => {
    const stored = DataService.get<CustomerSubscription>("SUBSCRIPTIONS");
    logger.debug("CustomerSubscriptionContext loaded", { count: stored.length });
    return stored;
  });

  // Persist to storage (local cache - instant)
  useEffect(() => {
    if (subscriptions.length > 0) DataService.setAll("SUBSCRIPTIONS", subscriptions);
  }, [subscriptions]);

  // Backend sync (background, non-blocking)
  useSync("SUBSCRIPTIONS", subscriptions);

  const createSubscription = (
    subscriptionData: Omit<CustomerSubscription, "subscriptionId" | "createdAt" | "updatedAt">
  ): CustomerSubscription => {
    const newSubscription: CustomerSubscription = {
      ...subscriptionData,
      subscriptionId: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      // CRITICAL: Lock price at creation time - this NEVER changes
      priceLocked: subscriptionData.pricing.finalPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSubscriptions((prev) => [...prev, newSubscription]);

    // Auto-create MRR entry in FinanceContext when subscription goes Active
    if (newSubscription.status === "Active" && addMRREntry) {
      const monthKey = new Date().toISOString().slice(0, 7); // "2026-04"
      addMRREntry({
        month: monthKey,
        subscriptionId: newSubscription.subscriptionId,
        customerId: newSubscription.customerId,
        revenue: newSubscription.priceLocked,
        status: "Active",
        cityId: city,
      });
    }

    return newSubscription;
  };

  const updateSubscription = (subscriptionId: string, updates: Partial<CustomerSubscription>) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.subscriptionId === subscriptionId) {
          // CRITICAL: Prevent priceLocked from being modified after creation
          const { priceLocked, ...safeUpdates } = updates;
          return {
            ...sub,
            ...safeUpdates,
            updatedAt: new Date().toISOString(),
          };
        }
        return sub;
      })
    );
  };

  const updateSubscriptionStatus = (subscriptionId: string, status: CustomerSubscription["status"]) => {
    updateSubscription(subscriptionId, { status });
  };

  const getSubscriptionById = (subscriptionId: string): CustomerSubscription | undefined => {
    return subscriptions.find((s) => s.subscriptionId === subscriptionId);
  };

  const getSubscriptionsByCustomerId = (customerId: string): CustomerSubscription[] => {
    return subscriptions.filter((s) => s.customerId === customerId);
  };

  const getActiveSubscriptions = (): CustomerSubscription[] => {
    return subscriptions.filter((s) => s.status === "Active");
  };

  const pauseSubscription = (subscriptionId: string, reason: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.subscriptionId === subscriptionId) {
          const pauseEntry = {
            pausedAt: new Date().toISOString(),
            reason,
          };
          return {
            ...sub,
            status: "Paused" as const,
            pauseHistory: [...(sub.pauseHistory || []), pauseEntry],
            updatedAt: new Date().toISOString(),
          };
        }
        return sub;
      })
    );
  };

  const resumeSubscription = (subscriptionId: string) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.subscriptionId === subscriptionId && sub.pauseHistory) {
          const updatedHistory = [...sub.pauseHistory];
          const lastPause = updatedHistory[updatedHistory.length - 1];
          if (lastPause && !lastPause.resumedAt) {
            lastPause.resumedAt = new Date().toISOString();
          }
          return {
            ...sub,
            status: "Active" as const,
            pauseHistory: updatedHistory,
            updatedAt: new Date().toISOString(),
          };
        }
        return sub;
      })
    );
  };

  const cancelSubscription = (subscriptionId: string) => {
    updateSubscriptionStatus(subscriptionId, "Cancelled");

    // Remove MRR entry when subscription is cancelled
    if (removeMRREntry) {
      removeMRREntry(subscriptionId);
    }
  };

  const deleteSubscription = (subscriptionId: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.subscriptionId !== subscriptionId));
  };

  return (
    <CustomerSubscriptionContext.Provider
      value={{
        subscriptions,
        createSubscription,
        updateSubscription,
        updateSubscriptionStatus,
        deleteSubscription,
        getSubscriptionById,
        getSubscriptionsByCustomerId,
        getActiveSubscriptions,
        pauseSubscription,
        resumeSubscription,
        cancelSubscription,
      }}
    >
      {children}
    </CustomerSubscriptionContext.Provider>
  );
}

export function useCustomerSubscriptions() {
  const context = useContext(CustomerSubscriptionContext);
  if (!context) {
    throw new Error("useCustomerSubscriptions must be used within CustomerSubscriptionProvider");
  }
  return context;
}
