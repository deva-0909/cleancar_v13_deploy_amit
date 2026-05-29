// TSE incentive values — see incentiveStructureV6.ts TSE constants
// TSE.POOL_TSE_SOURCED_3M = ₹79.50 (53%), TSE.POOL_BTL_3M = ₹30 (20%), TSE.GATE_CLOSURES = 10
/**
 * TELE SALES EXECUTIVE (TSE) - CONSTANTS & CONFIGURATION
 * System-Enforced Business Rules
 */

// ============================================
// TARGETS & THRESHOLDS
// ============================================

/** Daily call volume targets */
export const DAILY_CALL_TARGET = {
  MIN: 80,
  MAX: 120,
  IDEAL: 100,
} as const;

/** Conversion rate targets */
export const CONVERSION_TARGETS = {
  MIN: 15, // 15%
  TARGET: 18, // 18%
  EXCELLENT: 22, // 22%
} as const;

/** SLA thresholds */
export const SLA_THRESHOLDS = {
  FIRST_CALL_MINUTES: 10, // Must call within 10 minutes
  AT_RISK_MINUTES: 7, // Warning at 7 minutes
  CRITICAL_MINUTES: 9, // Critical at 9 minutes
} as const;

/** Lead attempt limits */
export const LEAD_ATTEMPT_LIMITS = {
  MIN_BEFORE_LOST: 15, // Minimum 15 attempts before marking Lost
  TYPICAL: 8, // Typical conversion happens by attempt 8
} as const;

/** CRM compliance */
export const CRM_COMPLIANCE = {
  REQUIRED: 100, // 100% mandatory
  WARNING_THRESHOLD: 95, // Warning below 95%
  PENALTY_THRESHOLD: 100, // 20% penalty if below 100%
  PENALTY_PERCENT: 20, // 20% reduction in variable payout
} as const;

// ============================================
// PRICING ENGINE
// ============================================

/** EBITDA floor - hard system limit */
export const EBITDA_FLOOR = {
  MINIMUM_PERCENT: 30, // 30% minimum EBITDA
  SAFE_PERCENT: 35, // 35%+ is safe zone
  WARNING_PERCENT: 32, // 32-34% is warning zone
  BLOCKED_PERCENT: 29, // Below 30% is blocked
} as const;

/** Add-on options */
export const ADD_ON_OPTIONS = [
  {
    id: "addon-vacuum",
    name: "Interior Deep Vacuum",
    internalCost: 40,
    perceivedValue: 199,
    description: "Seats, mats, footwells, boot area",
    marginPercent: 80,
  },
  {
    id: "addon-tyre",
    name: "Tyre Polish",
    internalCost: 50,
    perceivedValue: 99,
    description: "Shine & protect all 4 tyres",
    marginPercent: 75,
  },
  {
    id: "addon-dashboard",
    name: "Dashboard Polish",
    internalCost: 30,
    perceivedValue: 149,
    description: "Dash, console, door pads",
    marginPercent: 82,
  },
] as const;

/** Bundle pricing templates */
export const BUNDLE_TEMPLATES = {
  SUV_COMBO: {
    HIGH: 2897, // Anchor - sum of all base prices
    MID: 2399, // 15-20% discount - push target
    LOW: 2199, // Floor - only if EBITDA ≥ 30%
  },
  SEDAN_COMBO: {
    HIGH: 2497,
    MID: 2099,
    LOW: 1899,
  },
  BIKE_COMBO: {
    HIGH: 1497,
    MID: 1249, // Bike combo mid tier — NOTE: coincides with EXPRESS_WASH Hatchback price by coincidence only. Do NOT derive from plan pricing.
    LOW: 1099,
  },
} as const;

/** Incentive multipliers by deal type */
export const INCENTIVE_MULTIPLIERS = {
  BASE_PRICE: 70, // 70% of standard commission
  ADD_ON: 90, // 90% of standard commission
  BUNDLE_HIGH: 100, // 100% - not commonly used
  BUNDLE_MID: 100, // 100% - ideal target ⭐
  BUNDLE_LOW: 60, // 60% - discouraged ⚠️
} as const;

// ============================================
// COMPENSATION
// ============================================

/** Fixed salary range */
export const FIXED_SALARY = {
  MIN: 15000,
  MAX: 20000,
  TYPICAL: 17500,
} as const;

/** Commission tiers */
export const COMMISSION_TIERS = [
  {
    tier: "TIER_1" as const,
    min: 0,
    max: 100000,
    rate: 3,
    label: "Up to ₹1 lakh",
  },
  {
    tier: "TIER_2" as const,
    min: 100000,
    max: 200000,
    rate: 5,
    label: "₹1-2 lakh",
  },
  {
    tier: "TIER_3" as const,
    min: 200000,
    max: Infinity,
    rate: 7,
    label: "Above ₹2 lakh",
  },
] as const;

/** Renewal bonus */
export const RENEWAL_BONUS = {
  PER_RENEWAL: 100, // ₹100 per confirmed renewal
  PER_UPGRADE: 100, // ₹100 per upgrade
  NO_CAP: true, // No limit on renewal count
} as const;

/** Maximum variable potential */
export const MAX_VARIABLE = {
  COMMISSION: 25000, // Max ₹25,000 from commission
  RENEWAL_BONUS: Infinity, // No cap on renewals
  TOTAL_CTC_POTENTIAL: 45000, // ₹45,000 total (₹20k fixed + ₹25k variable)
} as const;

// ============================================
// AUTOMATION & ALERTS
// ============================================

/** Alert timing */
export const ALERT_TIMING = {
  SLA_BREACH_AT_MINUTES: 10,
  CRM_UPDATE_WARNING_MINUTES: 30,
  PAYMENT_LINK_EXPIRY_HOURS: 24,
  RENEWAL_ADVANCE_DAYS: 7,
  RENEWAL_SECOND_CALL_DAYS: 2,
} as const;

/** Refresh intervals (milliseconds) */
export const REFRESH_INTERVALS = {
  LEAD_QUEUE: 30000, // 30 seconds
  SLA_COUNTDOWN: 1000, // 1 second
  CALL_TIMER: 1000, // 1 second
  INCENTIVE_TRACKER: 300000, // 5 minutes
} as const;

// ============================================
// UI CONFIGURATION
// ============================================

/** Color coding */
export const STATUS_COLORS = {
  GREEN: {
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-700",
    badge: "bg-green-600",
  },
  YELLOW: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
    badge: "bg-yellow-600",
  },
  RED: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
    badge: "bg-red-600",
  },
  BLUE: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
    badge: "bg-blue-600",
  },
} as const;

/** Priority icons */
export const PRIORITY_CONFIG = {
  URGENT: {
    label: "URGENT",
    color: "red",
    icon: "AlertTriangle",
  },
  HIGH: {
    label: "HIGH",
    color: "orange",
    icon: "AlertCircle",
  },
  NORMAL: {
    label: "NORMAL",
    color: "blue",
    icon: "Info",
  },
} as const;

// ============================================
// PAYMENT LINK
// ============================================

/** Payment link configuration */
export const PAYMENT_LINK_CONFIG = {
  EXPIRY_HOURS: 24,
  MAX_REGENERATIONS: 2, // Alert TSM if > 2 regenerations
  AUTO_FOLLOW_UP_HOURS: 12, // Follow-up reminder if unpaid after 12 hours
} as const;

// ============================================
// SYSTEM MESSAGES
// ============================================

/** Script templates */
export const SCRIPTS = {
  INTRODUCTION: "This is [Name] from [Company]. I'm calling about the car wash subscription you enquired about...",
  VEHICLE_DISCOVERY: "To recommend the right plan, could you tell me about your vehicle? Is it a car or bike? What model?",
  PRICING_INTRO: "For your [vehicle], our [plan] is ₹[price]/month - that's ₹[per_wash] per wash including [benefits].",
  ADD_ON_OFFER: "Sir, instead of a discount, I'll include [add-on] complimentary for you - that's ₹[value] of value added.",
  BUNDLE_MID: "Sir, instead of cutting the price, I'm giving you ₹[normal] worth of services at ₹[bundle] - three services together.",
  BUNDLE_LOW: "₹[price] is the absolute best I can do - this is our lowest possible price.",
  PAYMENT_LINK: "Perfect! I'm sending you the payment link on WhatsApp right now. It's valid for 24 hours.",
  RENEWAL_FIRST: "Your subscription renews in [days] days - shall I process renewal now so there's no gap in service?",
  RENEWAL_UPGRADE: "You've been on [current_plan] for [months] months - would you like to try [upgrade_plan] this cycle? It's only ₹[diff] more.",
} as const;

/** System safeguard messages */
export const SAFEGUARD_MESSAGES = {
  NO_DISCOUNT_BUTTON: "System does not allow direct price reduction. Use add-on or bundle instead.",
  ADD_ON_LIMIT_REACHED: "Maximum 1 add-on per deal. This lead already has an add-on assigned.",
  EBITDA_BLOCKED: "EBITDA is below 30% floor. Cannot proceed with this price. Consider bundle MID instead.",
  CRM_UPDATE_REQUIRED: "CRM update required before accessing next lead. Please complete all mandatory fields.",
  SLA_BREACH_WARNING: "This lead is approaching 10-minute SLA. Call immediately.",
  LOST_ATTEMPT_LIMIT: "15 attempts not reached. Cannot mark as Lost. Current attempts: [count]",
} as const;

// ============================================
// TAGS & CATEGORIES
// ============================================

/** Quick tags for CRM notes */
export const QUICK_TAGS = [
  "Price Concern",
  "Interested",
  "Needs Follow-up",
  "Competitor Mention",
  "Quality Question",
  "Timing Issue",
  "Budget Constraint",
  "Decision Maker Not Available",
  "Wants Trial",
  "Premium Customer",
] as const;

/** Lead sources */
export const LEAD_SOURCES = {
  DIGITAL: "Website / App",
  BTL_REFERRAL: "Below-the-Line Referral",
  WALK_IN: "Walk-in Enquiry",
  SOCIAL_MEDIA: "Social Media",
  PARTNER: "Partner Channel",
} as const;

// ============================================
// KPI THRESHOLDS
// ============================================

/** KPI color coding thresholds */
export const KPI_THRESHOLDS = {
  CALLS: {
    GREEN: 90, // 90+ calls = green
    AMBER: 70, // 70-89 = amber
    RED: 69, // < 70 = red
  },
  CONVERSION_RATE: {
    GREEN: 18, // 18%+ = green
    AMBER: 15, // 15-17.9% = amber
    RED: 14.9, // < 15% = red
  },
  CRM_COMPLIANCE: {
    GREEN: 100, // 100% = green
    AMBER: 95, // 95-99% = amber
    RED: 94, // < 95% = red
  },
  REVENUE: {
    GREEN: 100, // 100%+ of target = green
    AMBER: 80, // 80-99% = amber
    RED: 79, // < 80% = red
  },
} as const;
