/**
 * PlanDefinitionContext - PLAN TEMPLATES AND PRICING DEFINITIONS
 *
 * ⚠️ DO NOT CONFUSE WITH CustomerSubscriptionContext ⚠️
 *
 * THIS CONTEXT:
 * - Stores plan templates (Basic, Standard, Premium, Deluxe)
 * - Manages pricing matrix by vehicle category and plan type
 * - Provides add-on services, combo offers, one-time wash pricing
 * - Used for admin plan management and pricing updates
 *
 * CustomerSubscriptionContext (DIFFERENT):
 * - Stores customer subscription instances (who subscribed to what)
 * - Tracks active subscriptions, billing status, payment tracking
 * - NOT for plan definitions or pricing templates
 *
 * NAMING CONVENTION:
 * - "Plan" = Plan definition/template
 * - "Subscription" = Customer subscription instance
 *
 * Used for: Pricing screens, plan editors, finance calculations
 */

import React, { createContext, useContext, ReactNode } from "react";
import {
  CURRENT_PLAN_VERSION,
  getActivePlanVersion,
  VEHICLE_CATEGORIES,
  PLAN_TYPES,
  formatPrice,
  ADD_ON_SERVICES,
  COMBO_OFFERS,
  ONE_TIME_WASH_PRICING,
  type PlanVersion,
  type VehicleCategory,
  type PlanType,
  type PlanDeliverables,
  type AddOnService,
  type ComboOffer,
  type OneTimeWashPricing,
} from "../data/subscriptionPlans";

interface PlanDefinitionContextType {
  // Core Plan Data
  activePlan: PlanVersion;
  CURRENT_PLAN_VERSION: PlanVersion;
  vehicleCategories: VehicleCategory[];
  VEHICLE_CATEGORIES: VehicleCategory[];
  planTypes: PlanType[];
  PLAN_TYPES: PlanType[];

  // Plan Functions
  getPlanPrice: (vehicle: VehicleCategory, plan: PlanType) => number | "NA";
  getPlanDeliverables: (plan: PlanType) => PlanDeliverables | null;
  getVehicleCategoryPlans: (vehicle: VehicleCategory) => Array<{ planType: PlanType; monthlyPrice: number }>;
  formatPrice: (price: number | "NA") => string;

  // Add-On Services
  ADD_ON_SERVICES: AddOnService[];
  getAddOnById: (id: string) => AddOnService | undefined;
  getAddOnsByCategory: (category: "Cleaning" | "Protection" | "Maintenance") => AddOnService[];
  getAddOnsForPlan: (planType: PlanType) => AddOnService[];
  getAddOnPrice: (addonId: string, vehicleType: "4W" | "2W") => number | "NA";

  // Combo Offers
  COMBO_OFFERS: ComboOffer[];
  getComboById: (id: string) => ComboOffer | undefined;
  getActiveComboOffers: () => ComboOffer[];
  getCombosByVehicleCategory: (category: VehicleCategory) => ComboOffer[];

  // One-Time Wash Pricing
  ONE_TIME_WASH_PRICING: OneTimeWashPricing[];
  getOneTimeWashPrice: (vehicle: VehicleCategory, memberType: "member" | "nonMember") => number;
}

const PlanDefinitionContext = createContext<PlanDefinitionContextType | undefined>(
  undefined
);

export function PlanDefinitionProvider({ children }: { children: ReactNode }) {
  const activePlan = getActivePlanVersion();

  const getPlanPrice = (vehicle: VehicleCategory, plan: PlanType): number | "NA" => {
    return activePlan.pricingMatrix[vehicle][plan];
  };

  const getPlanDeliverables = (plan: PlanType): PlanDeliverables | null => {
    return activePlan.deliverables[plan] || null;
  };

  const getVehicleCategoryPlans = (vehicle: VehicleCategory) => {
    // Safety check: ensure the vehicle category exists in the pricing matrix
    if (!activePlan.pricingMatrix[vehicle]) {
      console.warn(`Vehicle category "${vehicle}" not found in pricing matrix`);
      return [];
    }

    return PLAN_TYPES.map(planType => {
      const price = getPlanPrice(vehicle, planType);
      return {
        planType,
        monthlyPrice: price
      };
    }).filter(plan => plan.monthlyPrice !== "NA") as Array<{ planType: PlanType; monthlyPrice: number }>;
  };

  // Add-On Helper Functions
  const getAddOnById = (id: string): AddOnService | undefined => {
    return ADD_ON_SERVICES.find((addon) => addon.id === id);
  };

  const getAddOnsByCategory = (
    category: "Cleaning" | "Protection" | "Maintenance"
  ): AddOnService[] => {
    return ADD_ON_SERVICES.filter((addon) => addon.category === category && addon.isActive);
  };

  const getAddOnsForPlan = (planType: PlanType): AddOnService[] => {
    return ADD_ON_SERVICES.filter(
      (addon) => addon.isActive && addon.bestPairedWith.includes(planType)
    );
  };

  const getAddOnPrice = (addonId: string, vehicleType: "4W" | "2W"): number | "NA" => {
    const addon = getAddOnById(addonId);
    return addon ? addon.pricing[vehicleType] : "NA";
  };

  // Combo Offer Helper Functions
  const getComboById = (id: string): ComboOffer | undefined => {
    return COMBO_OFFERS.find((combo) => combo.id === id);
  };

  const getActiveComboOffers = (): ComboOffer[] => {
    return COMBO_OFFERS.filter((combo) => combo.isActive);
  };

  const getCombosByVehicleCategory = (category: VehicleCategory): ComboOffer[] => {
    return COMBO_OFFERS.filter(
      (combo) =>
        combo.planCombination.vehicle1.category === category ||
        combo.planCombination.vehicle2?.category === category
    );
  };

  // One-Time Wash Helper Function
  const getOneTimeWashPrice = (
    vehicle: VehicleCategory,
    memberType: "member" | "nonMember"
  ): number => {
    const pricing = ONE_TIME_WASH_PRICING.find((p) => p.vehicleCategory === vehicle);
    if (!pricing) return 0;
    return memberType === "member" ? pricing.memberPrice : pricing.nonMemberPrice;
  };

  // Filter plan types for subscription-only (exclude One-Time)
  const subscriptionPlanTypes = PLAN_TYPES.filter((plan) => !plan.includes("One-Time"));

  const value: PlanDefinitionContextType = {
    // Core Plan Data
    activePlan,
    CURRENT_PLAN_VERSION,
    vehicleCategories: VEHICLE_CATEGORIES,
    VEHICLE_CATEGORIES,
    planTypes: subscriptionPlanTypes,
    PLAN_TYPES,

    // Plan Functions
    getPlanPrice,
    getPlanDeliverables,
    getVehicleCategoryPlans,
    formatPrice,

    // Add-On Services
    ADD_ON_SERVICES,
    getAddOnById,
    getAddOnsByCategory,
    getAddOnsForPlan,
    getAddOnPrice,

    // Combo Offers
    COMBO_OFFERS,
    getComboById,
    getActiveComboOffers,
    getCombosByVehicleCategory,

    // One-Time Wash Pricing
    ONE_TIME_WASH_PRICING,
    getOneTimeWashPrice,
  };

  return (
    <PlanDefinitionContext.Provider value={value}>
      {children}
    </PlanDefinitionContext.Provider>
  );
}

export function usePlanDefinitions() {
  const context = useContext(PlanDefinitionContext);
  if (context === undefined) {
    console.warn("[Context] usePlanDefinitions must be used within a PlanDefinitionProvider — using safe defaults.");
    return null as any;
  }
  return context;
}
