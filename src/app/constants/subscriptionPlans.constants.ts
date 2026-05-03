/**
 * Subscription Plans - Constants & Configuration
 *
 * Default values, thresholds, and configuration for subscription management.
 * All values here are DEFAULTS and should be admin-editable in production.
 *
 * @module subscriptionPlans.constants
 */

// ============================================
// BILLING CONFIGURATION
// ============================================

/** Standard number of washes per month (Mon-Sat, ~26 days) */
export const WASHES_PER_MONTH = 26;

/** Currency code */
export const CURRENCY = "INR" as const;

/** Currency symbol */
export const CURRENCY_SYMBOL = "₹";

// ============================================
// BILLING DURATION DEFAULTS
// ============================================

/**
 * Default Discount Rates by Duration
 * Admin can override these values
 */
export const DEFAULT_DURATION_DISCOUNTS = {
  MONTHLY: 0, // 0% - no discount
  QUARTERLY: 5, // 5% off
  HALF_YEARLY: 10, // 10% off
  NINE_MONTHS: 12, // 12% off
  ANNUAL: 15, // 15% off
} as const;

/**
 * Billing Duration Configurations
 */
export const BILLING_DURATIONS = [
  {
    type: "MONTHLY" as const,
    label: "Monthly",
    months: 1,
    discountPercent: DEFAULT_DURATION_DISCOUNTS.MONTHLY,
  },
  {
    type: "QUARTERLY" as const,
    label: "Quarterly",
    months: 3,
    discountPercent: DEFAULT_DURATION_DISCOUNTS.QUARTERLY,
  },
  {
    type: "HALF_YEARLY" as const,
    label: "Half-Yearly",
    months: 6,
    discountPercent: DEFAULT_DURATION_DISCOUNTS.HALF_YEARLY,
  },
  {
    type: "NINE_MONTHS" as const,
    label: "9 Months",
    months: 9,
    discountPercent: DEFAULT_DURATION_DISCOUNTS.NINE_MONTHS,
  },
  {
    type: "ANNUAL" as const,
    label: "Annual",
    months: 12,
    discountPercent: DEFAULT_DURATION_DISCOUNTS.ANNUAL,
  },
] as const;

// ============================================
// VEHICLE CATEGORY MAPPINGS
// ============================================

/**
 * Vehicle Category Display Names and Examples
 */
export const VEHICLE_CATEGORIES = {
  // 4-Wheeler Categories
  HATCHBACK_COMPACT_SEDAN: {
    displayName: "Hatchback / Compact Sedan",
    examples: ["Swift", "i20", "Baleno", "Dzire", "Tiago"],
    type: "4W" as const,
  },
  SUV_MUV_SEDAN: {
    displayName: "SUV / MUV / Sedan",
    examples: ["Creta", "Innova", "City", "Thar", "Ertiga"],
    type: "4W" as const,
  },
  LUXURY_LARGE_SUV: {
    displayName: "Luxury / Large SUV",
    examples: ["Fortuner", "XUV700", "Meridian", "Scorpio N"],
    type: "4W" as const,
  },
  // 2-Wheeler Categories
  STANDARD_COMMUTER_BIKE: {
    displayName: "Standard / Commuter Bike",
    examples: ["Splendor", "Passion", "CT100", "HF Deluxe"],
    type: "2W" as const,
  },
  SPORTS_PREMIUM_BIKE: {
    displayName: "Sports / Premium Bike",
    examples: ["Pulsar", "Apache", "Dominar", "Duke", "R15"],
    type: "2W" as const,
  },
  SCOOTER: {
    displayName: "Scooter",
    examples: ["Activa", "Jupiter", "Dio", "NTorq", "Burgman"],
    type: "2W" as const,
  },
} as const;

// ============================================
// PLAN TIER PRICING (BASE MONTHLY)
// ============================================

/**
 * Base Monthly Prices by Vehicle Category and Plan Tier
 * Source of truth for all billing calculations
 */
export const PLAN_BASE_PRICES = {
  // Hatchback / Compact Sedan
  HATCHBACK_COMPACT_SEDAN: {
    WATER_WASH: 699,
    SHAMPOO_WASH: 1299,
    SHAMPOO_WAX: 1999,
  },
  // SUV / MUV / Sedan
  SUV_MUV_SEDAN: {
    WATER_WASH: 899,
    SHAMPOO_WASH: 1699,
    SHAMPOO_WAX: 2699,
  },
  // Luxury / Large SUV
  LUXURY_LARGE_SUV: {
    WATER_WASH: 1099,
    SHAMPOO_WAX: 2999,
    // Note: No SHAMPOO_WASH tier for Luxury - see Section 8 Question #5
  },
  // Standard / Commuter Bike
  STANDARD_COMMUTER_BIKE: {
    WATER_WASH: 299,
    SHAMPOO_WASH: 499,
    SHAMPOO_POLISH: 799,
  },
  // Sports / Premium Bike
  SPORTS_PREMIUM_BIKE: {
    WATER_WASH: 399,
    SHAMPOO_WASH: 699,
    SHAMPOO_POLISH: 999,
  },
  // Scooter
  SCOOTER: {
    SHAMPOO_POLISH: 699,
    // Note: Only one tier for scooters
  },
} as const;

// ============================================
// PLAN TIER DISPLAY NAMES
// ============================================

export const PLAN_TIER_NAMES = {
  WATER_WASH: "Water Wash",
  SHAMPOO_WASH: "Shampoo Wash",
  SHAMPOO_WAX: "Shampoo + Wax",
  SHAMPOO_POLISH: "Shampoo + Polish",
} as const;

// ============================================
// ADD-ON SERVICES
// ============================================

/**
 * Add-On Service Configurations
 */
export const ADDON_SERVICES = [
  {
    name: "Interior Deep Vacuum",
    description: "Seats, mats, footwells, boot area",
    price: 199,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["WATER_WASH", "SHAMPOO_WASH"],
    marginPercent: 78,
    isOperationallyConfirmed: true,
  },
  {
    name: "Dashboard & Console Clean",
    description: "Dash, console, door pads",
    price: 149,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["WATER_WASH", "SHAMPOO_WASH", "SHAMPOO_WAX", "SHAMPOO_POLISH"],
    marginPercent: 80,
    isOperationallyConfirmed: true,
  },
  {
    name: "Tyre Dressing",
    description: "Shine & protect all 4 tyres",
    price: 99,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["WATER_WASH", "SHAMPOO_WASH"],
    marginPercent: 75,
    isOperationallyConfirmed: true,
  },
  {
    name: "Glass Coating (RainX)",
    description: "Applied 1x/month on all glass",
    price: 349,
    billingType: "PER_MONTH" as const,
    bestPairedWith: ["SHAMPOO_WASH", "SHAMPOO_WAX"],
    marginPercent: 72,
    isOperationallyConfirmed: true,
  },
  {
    name: "One-time Wax Polish",
    description: "For Basic/Shampoo plan users",
    price: 599,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["WATER_WASH", "SHAMPOO_WASH"],
    marginPercent: 70,
    isOperationallyConfirmed: true,
  },
  {
    name: "Underbody Anti-Rust Spray",
    description: "Protective coating, quarterly",
    price: 799,
    billingType: "PER_VISIT" as const,
    bestPairedWith: ["SHAMPOO_WAX"],
    marginPercent: 65,
    isOperationallyConfirmed: false, // PENDING OPERATIONAL CONFIRMATION
  },
] as const;

// ============================================
// COMBO OFFERS
// ============================================

/**
 * Combo Offer Bundles
 */
export const COMBO_OFFERS = [
  {
    name: "Car + Bike Bundle",
    description:
      "Shampoo wash — 1 hatchback + 1 standard bike (same address)",
    normalPrice: 1798, // 1299 + 499
    comboPrice: 1499,
    validityRule: "Same address",
  },
  {
    name: "Dual Car Bundle",
    description: "Shampoo wash — 2 hatchbacks / sedans, same household",
    normalPrice: 2598, // 1299 × 2
    comboPrice: 2249,
    validityRule: "Same household",
  },
  {
    name: "Premium Care Pack (Car)",
    description:
      "Shampoo+Wax + Interior vacuum 4x/mo + Tyre dressing 2x/mo + Fragrance",
    normalPrice: 2893, // 1999 + (199×4) + (99×2)
    comboPrice: 2549,
    validityRule: "Hatchback/Sedan",
  },
  {
    name: "Premium Care Pack (SUV)",
    description:
      "Shampoo+Wax + Interior vacuum 4x/mo + Tyre dressing 2x/mo + Fragrance",
    normalPrice: 3489, // 2699 + (199×4) + (99×2)
    comboPrice: 2999,
    validityRule: "SUV / MUV",
  },
  {
    name: "Bike Full Care Pack",
    description: "Premium bike wash + Engine clean 1x/mo + Tyre dressing 2x/mo",
    normalPrice: 1245, // 699 + (149×1) + (99×2) + adjustments
    comboPrice: 1049,
    validityRule: "Sports/Premium bike",
  },
  {
    name: "Society / Fleet Block (5+ vehicles)",
    description:
      "Any 5+ vehicles same address — flat 15% off each vehicle plan",
    normalPrice: 0, // Variable based on vehicles
    comboPrice: 0, // Calculated as 15% off
    validityRule: "Same society/fleet, minimum 5 vehicles",
  },
] as const;

// ============================================
// SERVICE FREQUENCIES
// ============================================

export const SERVICE_FREQUENCIES = {
  EVERY_WASH: "Every Wash (Daily)",
  WEEKLY: "Weekly (1x per week)",
  MONTHLY: "Monthly (1x per month)",
} as const;

// ============================================
// ADMIN ROLE PERMISSIONS
// ============================================

/**
 * Default Permissions by Role
 */
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canCreatePlan: true,
    canEditPlan: true,
    canEditPricing: true,
    canEditFeatures: true,
    canEditDurationDiscounts: true,
    canDisablePlan: true,
    canDeletePlan: true,
    canManageAddons: true,
    canManageCombos: true,
    canViewAuditLog: true,
  },
  ADMIN: {
    canCreatePlan: true,
    canEditPlan: true,
    canEditPricing: true,
    canEditFeatures: true,
    canEditDurationDiscounts: false, // Read only for ADMIN
    canDisablePlan: true,
    canDeletePlan: false, // Cannot delete
    canManageAddons: true,
    canManageCombos: true,
    canViewAuditLog: true, // Can view audit logs
  },
  MANAGER: {
    canCreatePlan: false,
    canEditPlan: false,
    canEditPricing: false,
    canEditFeatures: false,
    canEditDurationDiscounts: false,
    canDisablePlan: false,
    canDeletePlan: false,
    canManageAddons: false,
    canManageCombos: false,
    canViewAuditLog: false,
  },
  VIEWER: {
    canCreatePlan: false,
    canEditPlan: false,
    canEditPricing: false,
    canEditFeatures: false,
    canEditDurationDiscounts: false,
    canDisablePlan: false,
    canDeletePlan: false,
    canManageAddons: false,
    canManageCombos: false,
    canViewAuditLog: false,
  },
} as const;

// ============================================
// UI DISPLAY CONSTANTS
// ============================================

/** Badge for best value duration */
export const BEST_VALUE_BADGE = "Best Value";

/** Maximum number of plans to show per row on desktop */
export const PLANS_PER_ROW = 3;

/** Colors for plan tier highlights */
export const PLAN_TIER_COLORS = {
  WATER_WASH: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  SHAMPOO_WASH: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
  },
  SHAMPOO_WAX: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
  },
  SHAMPOO_POLISH: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
} as const;

// ============================================
// VALIDATION CONSTANTS
// ============================================

/** Minimum base monthly price (in rupees) */
export const MIN_BASE_PRICE = 100;

/** Maximum base monthly price (in rupees) */
export const MAX_BASE_PRICE = 10000;

/** Minimum discount percentage */
export const MIN_DISCOUNT_PERCENT = 0;

/** Maximum discount percentage */
export const MAX_DISCOUNT_PERCENT = 50;

/** Minimum margin percentage for add-ons */
export const MIN_MARGIN_PERCENT = 0;

/** Maximum margin percentage for add-ons */
export const MAX_MARGIN_PERCENT = 100;
