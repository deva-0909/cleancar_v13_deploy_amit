// Subscription Plans Data - Complete Plan Management System
// Updated April 2026 - V2 (New Plan Structure per Developer Handoff)

export type VehicleCategory =
  | "Hatchback / Compact Sedan"
  | "SUV / MUV / Sedan"
  | "Luxury / Large SUV"
  | "2W - Standard / Commuter Bike"
  | "2W - Sports / Premium Bike"
  | "2W - Scooter";

export type PlanType =
  | "Water Wash"
  | "Shampoo Wash"
  | "Shampoo+Wax"
  | "Shampoo+Polish"
  | "One-Time Member"
  | "One-Time Non-Member";

export interface PlanDeliverables {
  planName: string;
  tagline: string;
  included: string[];
  notIncluded: string[];
  bestFor: string;
  complimentaryBenefits?: string;
  discountStructure?: string;
}

export interface PlanVersion {
  version: string;
  versionLabel: string;
  effectiveFrom: string;
  effectiveTo: string | "Current";
  createdBy: string;
  createdOn: string;
  status: "Active" | "Superseded" | "Draft" | "Scheduled";
  goLiveDate?: string;
  pricingMatrix: Record<VehicleCategory, Record<PlanType, number | "NA">>;
  deliverables: Record<PlanType, PlanDeliverables>;
  approvalStatus?: "Pending" | "Approved" | "Rejected";
  approvedBy?: string;
  approvedOn?: string;
  rejectionReason?: string;
}

// Add-On Services
export interface AddOnService {
  id: string;
  name: string;
  description: string;
  billing: "Per visit" | "Per month";
  pricing: {
    "4W": number | "NA";
    "2W": number | "NA";
  };
  bestPairedWith: PlanType[];
  estimatedMargin: number; // percentage
  isActive: boolean;
  icon?: string;
  category: "Cleaning" | "Protection" | "Maintenance";
}

// Combo Offers
export interface ComboOffer {
  id: string;
  name: string;
  description: string;
  planCombination: {
    vehicle1: {
      category: VehicleCategory;
      plan: PlanType;
      individualPrice: number;
    };
    vehicle2?: {
      category: VehicleCategory;
      plan: PlanType;
      individualPrice: number;
    };
  };
  totalIndividualPrice: number;
  comboPrice: number;
  savings: number;
  savingsPercentage: number;
  isActive: boolean;
  validUntil?: string;
}

// One-Time Wash Pricing
export interface OneTimeWashPricing {
  vehicleCategory: VehicleCategory;
  memberPrice: number;
  nonMemberPrice: number;
  washType: "Basic" | "Premium" | "Elite";
}

// V2 - Current Active Plan (April 2026) - New Structure
export const CURRENT_PLAN_VERSION: PlanVersion = {
  version: "V2",
  versionLabel: "V2 - April 2026 Plan Restructure",
  effectiveFrom: "2026-04-11",
  effectiveTo: "Current",
  createdBy: "Product Team",
  createdOn: "2026-04-11",
  status: "Active",
  pricingMatrix: {
    "Hatchback / Compact Sedan": {
      "Water Wash": 699,
      "Shampoo Wash": 1299,
      "Shampoo+Wax": 1999,
      "Shampoo+Polish": "NA",
      "One-Time Member": 250,
      "One-Time Non-Member": 299,
    },
    "SUV / MUV / Sedan": {
      "Water Wash": 899,
      "Shampoo Wash": 1699,
      "Shampoo+Wax": 2699,
      "Shampoo+Polish": "NA",
      "One-Time Member": 300,
      "One-Time Non-Member": 349,
    },
    "Luxury / Large SUV": {
      "Water Wash": 1099,
      "Shampoo Wash": "NA",
      "Shampoo+Wax": 2999,
      "Shampoo+Polish": "NA",
      "One-Time Member": 400,
      "One-Time Non-Member": 449,
    },
    "2W - Standard / Commuter Bike": {
      "Water Wash": 299,
      "Shampoo Wash": 499,
      "Shampoo+Wax": "NA",
      "Shampoo+Polish": 799,
      "One-Time Member": 120,
      "One-Time Non-Member": 149,
    },
    "2W - Sports / Premium Bike": {
      "Water Wash": 399,
      "Shampoo Wash": 699,
      "Shampoo+Wax": "NA",
      "Shampoo+Polish": 999,
      "One-Time Member": 150,
      "One-Time Non-Member": 179,
    },
    "2W - Scooter": {
      "Water Wash": "NA",
      "Shampoo Wash": "NA",
      "Shampoo+Wax": "NA",
      "Shampoo+Polish": 699,
      "One-Time Member": 100,
      "One-Time Non-Member": 129,
    },
  },
  deliverables: {
    "Water Wash": {
      planName: "Water Wash",
      tagline: "Essential Daily Cleaning. Perfect for routine maintenance.",
      included: [
        "Full exterior water rinse (pressure gun)",
        "Wheel rim rinse",
        "Tyre & mudguard pressure spray",
        "Roof + running boards / step-board clean",
        "Exterior glass wipe / clean",
        "Wiper blade clean",
        "Under-body water flush (monthly)",
      ],
      notIncluded: [
        "Car-safe shampoo foam wash",
        "Microfibre dry + glass polish",
        "Tyre dressing application",
        "Interior cleaning",
        "Wax protection",
      ],
      bestFor: "Daily basic maintenance and dust removal",
    },
    "Shampoo Wash": {
      planName: "Shampoo Wash",
      tagline: "Deep Cleaning with Foam Shampoo. Most popular choice.",
      included: [
        "Everything in Water Wash",
        "Car-safe shampoo foam wash",
        "Microfibre dry + glass polish",
        "Tyre dressing application (weekly)",
      ],
      notIncluded: [
        "Wax paint protection coating",
        "Interior dashboard wipe",
        "Interior vacuum",
      ],
      bestFor: "Regular professional cleaning with enhanced finish",
    },
    "Shampoo+Wax": {
      planName: "Shampoo+Wax",
      tagline: "Complete Care with Wax Protection. Premium exterior & interior service.",
      included: [
        "Everything in Shampoo Wash",
        "Interior dashboard wipe (weekly)",
        "Interior full vacuum (weekly)",
        "Interior vacuum deep clean (monthly)",
        "Full hand wax polish whole body (monthly)",
        "Door sill & boot area clean (monthly)",
      ],
      notIncluded: [
        "Ceramic coating",
        "Paint correction",
        "Leather conditioning",
      ],
      bestFor: "Complete vehicle care - exterior shine + interior cleanliness",
    },
    "Shampoo+Polish": {
      planName: "Shampoo+Polish",
      tagline: "Premium 2-Wheeler Care. Complete shine and protection for bikes and scooters.",
      included: [
        "Full body water rinse (pressure gun)",
        "Tyre & mudguard pressure spray",
        "Bike/scooter shampoo wash",
        "Chain & sprocket water rinse",
        "Seat + headlight / instrument wipe",
        "Full dry + microfibre wipe",
        "Spoke & rim scrub (weekly)",
        "Engine bay surface wipe (monthly)",
        "Full body spray wax / liquid polish (monthly)",
      ],
      notIncluded: [
        "Deep engine cleaning",
        "Chain lubrication",
        "Seat shampoo",
      ],
      bestFor: "2-Wheeler owners wanting complete care and protection",
    },
    "One-Time Member": {
      planName: "One-Time Wash (Member)",
      tagline: "Single wash service for existing subscription members",
      included: [
        "Full exterior shampoo wash",
        "Wheel cleaning & tyre dressing",
        "Microfibre dry",
        "Glass cleaning",
        "Member discount applied",
      ],
      notIncluded: [
        "Interior cleaning",
        "Wax application",
        "Subscription benefits",
      ],
      bestFor: "Subscription members needing additional one-time service",
      complimentaryBenefits: "10% discount on all add-on services",
    },
    "One-Time Non-Member": {
      planName: "One-Time Wash (Walk-in)",
      tagline: "Single wash service for walk-in customers",
      included: [
        "Full exterior shampoo wash",
        "Wheel cleaning",
        "Microfibre dry",
        "Glass cleaning",
      ],
      notIncluded: [
        "Interior cleaning",
        "Wax application",
        "Tyre dressing",
        "Member discounts",
      ],
      bestFor: "First-time customers or occasional wash needs",
      discountStructure: "Subscribe today and save up to 60% on per-wash cost",
    },
  },
};

// Add-On Services Data
// All add-ons carry 74-80% EBITDA margin (from EBITDA calculations)
export const ADD_ON_SERVICES: AddOnService[] = [
  {
    id: "addon-001",
    name: "Interior Deep Vacuum",
    description: "Thorough vacuum cleaning of seats, floor mats, and trunk area",
    billing: "Per visit",
    pricing: {
      "4W": 199,
      "2W": "NA",
    },
    bestPairedWith: ["Water Wash", "Shampoo Wash"],
    estimatedMargin: 77.9, // Actual EBITDA: ₹155/₹199 = 77.9%
    isActive: true,
    category: "Cleaning",
  },
  {
    id: "addon-002",
    name: "Dashboard Clean",
    description: "Complete dashboard, console, and door panel wipe & polish",
    billing: "Per visit",
    pricing: {
      "4W": 149,
      "2W": 99,
    },
    bestPairedWith: ["Water Wash", "Shampoo Wash"],
    estimatedMargin: 79.9, // Actual EBITDA: 4W ₹119/₹149 = 79.9%
    isActive: true,
    category: "Cleaning",
  },
  {
    id: "addon-003",
    name: "Tyre Dressing",
    description: "Professional tyre shine & rubber protection coating",
    billing: "Per visit",
    pricing: {
      "4W": 99,
      "2W": 49,
    },
    bestPairedWith: ["Water Wash"],
    estimatedMargin: 79.8, // Actual EBITDA: ₹79/₹99 = 79.8%
    isActive: true,
    category: "Protection",
  },
  {
    id: "addon-004",
    name: "Glass Coating",
    description: "Hydrophobic glass coating (RainX) for improved visibility in rain",
    billing: "Per visit",
    pricing: {
      "4W": 349,
      "2W": 249,
    },
    bestPairedWith: ["Shampoo Wash", "Shampoo+Wax"],
    estimatedMargin: 77.1, // Actual EBITDA: ₹269/₹349 = 77.1%
    isActive: true,
    category: "Protection",
  },
  {
    id: "addon-005",
    name: "One-Time Wax Polish",
    description: "Full body hand wax application for showroom-like shine",
    billing: "Per visit",
    pricing: {
      "4W": 599,
      "2W": 399,
    },
    bestPairedWith: ["Shampoo Wash"],
    estimatedMargin: 74.9, // Actual EBITDA: ₹449/₹599 = 74.9%
    isActive: true,
    category: "Protection",
  },
  {
    id: "addon-006",
    name: "Underbody Anti-Rust Spray",
    description: "High-pressure underbody cleaning & anti-rust protection spray",
    billing: "Per visit",
    pricing: {
      "4W": 799,
      "2W": "NA",
    },
    bestPairedWith: ["Shampoo Wash", "Shampoo+Wax"],
    estimatedMargin: 74.9, // Actual EBITDA: ₹599/₹799 = 74.9%
    isActive: false, // ⚠ PENDING OPERATIONAL CONFIRMATION
    category: "Maintenance",
  },
];

// Helper function to get dynamic combo offers with real-time pricing
function generateComboOffers(): ComboOffer[] {
  const getPriceFromMatrix = (category: VehicleCategory, plan: PlanType): number => {
    const price = CURRENT_PLAN_VERSION.pricingMatrix[category][plan];
    return price === "NA" ? 0 : price as number;
  };

  const hatchbackShampoo = getPriceFromMatrix("Hatchback / Compact Sedan", "Shampoo Wash");
  const hatchbackWax = getPriceFromMatrix("Hatchback / Compact Sedan", "Shampoo+Wax");
  const suvShampoo = getPriceFromMatrix("SUV / MUV / Sedan", "Shampoo Wash");
  const suvWax = getPriceFromMatrix("SUV / MUV / Sedan", "Shampoo+Wax");
  const bikePolish = getPriceFromMatrix("2W - Standard / Commuter Bike", "Shampoo+Polish");

  const combo1Total = hatchbackShampoo + bikePolish;
  const combo1Price = Math.round(combo1Total * 0.905); // 9.5% discount

  const combo2Total = suvShampoo + hatchbackShampoo;
  const combo2Price = Math.round(combo2Total * 0.90); // 10% discount

  const combo3Total = hatchbackWax + (199 * 4); // Interior vacuum 4x/month
  const combo3Price = Math.round(combo3Total * 0.894); // ~10.6% discount

  const combo4Total = suvWax + 349; // Glass coating monthly
  const combo4Price = Math.round(combo4Total * 0.951); // ~4.9% discount

  const combo5Total = hatchbackShampoo * 5;
  const combo5Price = Math.round(combo5Total * 0.90); // 10% discount

  const combo6Total = suvShampoo * 10;
  const combo6Price = Math.round(combo6Total * 0.853); // 14.7% discount

  return [
    {
      id: "combo-001",
      name: "Car + Bike Bundle",
      description: "Subscribe to both car and bike plans at discounted rates",
      planCombination: {
        vehicle1: {
          category: "Hatchback / Compact Sedan",
          plan: "Shampoo Wash",
          individualPrice: hatchbackShampoo,
        },
        vehicle2: {
          category: "2W - Standard / Commuter Bike",
          plan: "Shampoo+Polish",
          individualPrice: bikePolish,
        },
      },
      totalIndividualPrice: combo1Total,
      comboPrice: combo1Price,
      savings: combo1Total - combo1Price,
      savingsPercentage: parseFloat((((combo1Total - combo1Price) / combo1Total) * 100).toFixed(1)),
      isActive: true,
    },
    {
      id: "combo-002",
      name: "Dual Car Bundle",
      description: "Two cars, one subscription - save on your second vehicle",
      planCombination: {
        vehicle1: {
          category: "SUV / MUV / Sedan",
          plan: "Shampoo Wash",
          individualPrice: suvShampoo,
        },
        vehicle2: {
          category: "Hatchback / Compact Sedan",
          plan: "Shampoo Wash",
          individualPrice: hatchbackShampoo,
        },
      },
      totalIndividualPrice: combo2Total,
      comboPrice: combo2Price,
      savings: combo2Total - combo2Price,
      savingsPercentage: parseFloat((((combo2Total - combo2Price) / combo2Total) * 100).toFixed(1)),
      isActive: true,
    },
    {
      id: "combo-003",
      name: "Premium Care Pack - Hatchback",
      description: "Shampoo+Wax plan + Interior Deep Vacuum (weekly)",
      planCombination: {
        vehicle1: {
          category: "Hatchback / Compact Sedan",
          plan: "Shampoo+Wax",
          individualPrice: hatchbackWax,
        },
      },
      totalIndividualPrice: combo3Total,
      comboPrice: combo3Price,
      savings: combo3Total - combo3Price,
      savingsPercentage: parseFloat((((combo3Total - combo3Price) / combo3Total) * 100).toFixed(1)),
      isActive: true,
    },
    {
      id: "combo-004",
      name: "Premium Care Pack - SUV",
      description: "Shampoo+Wax plan + Glass Coating (monthly)",
      planCombination: {
        vehicle1: {
          category: "SUV / MUV / Sedan",
          plan: "Shampoo+Wax",
          individualPrice: suvWax,
        },
      },
      totalIndividualPrice: combo4Total,
      comboPrice: combo4Price,
      savings: combo4Total - combo4Price,
      savingsPercentage: parseFloat((((combo4Total - combo4Price) / combo4Total) * 100).toFixed(1)),
      isActive: true,
    },
    {
      id: "combo-005",
      name: "Society Package - 5 Cars",
      description: "Bulk subscription for housing societies - minimum 5 vehicles",
      planCombination: {
        vehicle1: {
          category: "Hatchback / Compact Sedan",
          plan: "Shampoo Wash",
          individualPrice: combo5Total,
        },
      },
      totalIndividualPrice: combo5Total,
      comboPrice: combo5Price,
      savings: combo5Total - combo5Price,
      savingsPercentage: parseFloat((((combo5Total - combo5Price) / combo5Total) * 100).toFixed(1)),
      isActive: true,
    },
    {
      id: "combo-006",
      name: "Fleet Package - 10+ Vehicles",
      description: "Corporate fleet discount - customize your plan mix",
      planCombination: {
        vehicle1: {
          category: "SUV / MUV / Sedan",
          plan: "Shampoo Wash",
          individualPrice: combo6Total,
        },
      },
      totalIndividualPrice: combo6Total,
      comboPrice: combo6Price,
      savings: combo6Total - combo6Price,
      savingsPercentage: parseFloat((((combo6Total - combo6Price) / combo6Total) * 100).toFixed(1)),
      isActive: true,
      validUntil: "2026-12-31",
    },
  ];
}

// Combo Offers Data - Generated dynamically from pricing matrix
export const COMBO_OFFERS: ComboOffer[] = generateComboOffers();

// One-Time Wash Pricing Data
export const ONE_TIME_WASH_PRICING: OneTimeWashPricing[] = [
  // Basic One-Time Wash
  {
    vehicleCategory: "Hatchback / Compact Sedan",
    memberPrice: 150,
    nonMemberPrice: 199,
    washType: "Basic",
  },
  {
    vehicleCategory: "SUV / MUV / Sedan",
    memberPrice: 200,
    nonMemberPrice: 249,
    washType: "Basic",
  },
  {
    vehicleCategory: "Luxury / Large SUV",
    memberPrice: 250,
    nonMemberPrice: 299,
    washType: "Basic",
  },
  {
    vehicleCategory: "2W - Standard / Commuter Bike",
    memberPrice: 80,
    nonMemberPrice: 99,
    washType: "Basic",
  },
  {
    vehicleCategory: "2W - Sports / Premium Bike",
    memberPrice: 100,
    nonMemberPrice: 129,
    washType: "Basic",
  },
  {
    vehicleCategory: "2W - Scooter",
    memberPrice: 70,
    nonMemberPrice: 89,
    washType: "Basic",
  },
  // Premium One-Time Wash (with shampoo)
  {
    vehicleCategory: "Hatchback / Compact Sedan",
    memberPrice: 250,
    nonMemberPrice: 299,
    washType: "Premium",
  },
  {
    vehicleCategory: "SUV / MUV / Sedan",
    memberPrice: 300,
    nonMemberPrice: 349,
    washType: "Premium",
  },
  {
    vehicleCategory: "Luxury / Large SUV",
    memberPrice: 400,
    nonMemberPrice: 449,
    washType: "Premium",
  },
  {
    vehicleCategory: "2W - Standard / Commuter Bike",
    memberPrice: 120,
    nonMemberPrice: 149,
    washType: "Premium",
  },
  {
    vehicleCategory: "2W - Sports / Premium Bike",
    memberPrice: 150,
    nonMemberPrice: 179,
    washType: "Premium",
  },
  {
    vehicleCategory: "2W - Scooter",
    memberPrice: 100,
    nonMemberPrice: 129,
    washType: "Premium",
  },
  // Elite One-Time Wash (with shampoo + wax)
  {
    vehicleCategory: "Hatchback / Compact Sedan",
    memberPrice: 450,
    nonMemberPrice: 549,
    washType: "Elite",
  },
  {
    vehicleCategory: "SUV / MUV / Sedan",
    memberPrice: 550,
    nonMemberPrice: 649,
    washType: "Elite",
  },
  {
    vehicleCategory: "Luxury / Large SUV",
    memberPrice: 700,
    nonMemberPrice: 799,
    washType: "Elite",
  },
  {
    vehicleCategory: "2W - Standard / Commuter Bike",
    memberPrice: 200,
    nonMemberPrice: 249,
    washType: "Elite",
  },
  {
    vehicleCategory: "2W - Sports / Premium Bike",
    memberPrice: 250,
    nonMemberPrice: 299,
    washType: "Elite",
  },
  {
    vehicleCategory: "2W - Scooter",
    memberPrice: 180,
    nonMemberPrice: 229,
    washType: "Elite",
  },
];

// All Plan Versions (includes current and historical)
export const ALL_PLAN_VERSIONS: PlanVersion[] = [CURRENT_PLAN_VERSION];

// Helper function to get plan price
export function getPlanPrice(
  version: PlanVersion,
  vehicleCategory: VehicleCategory,
  planType: PlanType
): number | "NA" {
  return version.pricingMatrix[vehicleCategory][planType];
}

// Helper function to format price
export function formatPrice(price: number | "NA"): string {
  if (price === "NA") return "NA";
  return `₹${price.toLocaleString("en-IN")}`;
}

// Helper function to get active plan version
export function getActivePlanVersion(): PlanVersion {
  return ALL_PLAN_VERSIONS.find((v) => v.status === "Active") || CURRENT_PLAN_VERSION;
}

// Helper function to get previous plan version (for TSM/TSE)
export function getPreviousPlanVersion(): PlanVersion | null {
  const sortedVersions = [...ALL_PLAN_VERSIONS]
    .filter((v) => v.status === "Superseded")
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());

  return sortedVersions[0] || null;
}

// Vehicle categories list
export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  "Hatchback / Compact Sedan",
  "SUV / MUV / Sedan",
  "Luxury / Large SUV",
  "2W - Standard / Commuter Bike",
  "2W - Sports / Premium Bike",
  "2W - Scooter",
];

// Plan types list
export const PLAN_TYPES: PlanType[] = [
  "Water Wash",
  "Shampoo Wash",
  "Shampoo+Wax",
  "Shampoo+Polish",
  "One-Time Member",
  "One-Time Non-Member",
];

// Subscription plans (all plans in new structure)
export const SUBSCRIPTION_PLANS: PlanType[] = [
  "Water Wash",
  "Shampoo Wash",
  "Shampoo+Wax",
  "Shampoo+Polish",
];

// Vehicle examples for each category
export const VEHICLE_EXAMPLES: Record<VehicleCategory, string[]> = {
  "Hatchback / Compact Sedan": ["Swift", "i20", "Baleno", "Dzire", "Tiago"],
  "SUV / MUV / Sedan": ["Creta", "Innova", "City", "Thar", "Ertiga"],
  "Luxury / Large SUV": ["Fortuner", "XUV700", "Meridian", "Scorpio N"],
  "2W - Standard / Commuter Bike": ["Splendor", "Passion", "CT100", "HF Deluxe"],
  "2W - Sports / Premium Bike": ["Pulsar", "Apache", "Dominar", "Duke", "R15"],
  "2W - Scooter": ["Activa", "Jupiter", "Dio", "NTorq", "Burgman"],
};

// Cost per wash calculation (26 washes per month)
export const WASHES_PER_MONTH = 26;

export function calculateCostPerWash(monthlyPrice: number): number {
  return monthlyPrice / WASHES_PER_MONTH;
}

// Add-On Helper Functions
export function getAddOnById(id: string): AddOnService | undefined {
  return ADD_ON_SERVICES.find(addon => addon.id === id);
}

export function getAddOnsByCategory(category: "Cleaning" | "Protection" | "Maintenance"): AddOnService[] {
  return ADD_ON_SERVICES.filter(addon => addon.category === category && addon.isActive);
}

export function getAddOnsForPlan(planType: PlanType): AddOnService[] {
  return ADD_ON_SERVICES.filter(addon =>
    addon.isActive && addon.bestPairedWith.includes(planType)
  );
}

export function getAddOnPrice(addonId: string, vehicleType: "4W" | "2W"): number | "NA" {
  const addon = getAddOnById(addonId);
  return addon ? addon.pricing[vehicleType] : "NA";
}

// Combo Offer Helper Functions
export function getComboById(id: string): ComboOffer | undefined {
  return COMBO_OFFERS.find(combo => combo.id === id);
}

export function getActiveComboOffers(): ComboOffer[] {
  return COMBO_OFFERS.filter(combo => combo.isActive);
}

export function getCombosByVehicleCategory(category: VehicleCategory): ComboOffer[] {
  return COMBO_OFFERS.filter(combo =>
    combo.isActive &&
    (combo.planCombination.vehicle1.category === category ||
     combo.planCombination.vehicle2?.category === category)
  );
}

// One-Time Wash Helper Functions
export function getOneTimeWashPrice(
  vehicleCategory: VehicleCategory,
  washType: "Basic" | "Premium" | "Elite",
  isMember: boolean
): number {
  const pricing = ONE_TIME_WASH_PRICING.find(
    p => p.vehicleCategory === vehicleCategory && p.washType === washType
  );

  if (!pricing) return 0;
  return isMember ? pricing.memberPrice : pricing.nonMemberPrice;
}

export function getAllOneTimeWashOptions(vehicleCategory: VehicleCategory): OneTimeWashPricing[] {
  return ONE_TIME_WASH_PRICING.filter(p => p.vehicleCategory === vehicleCategory);
}

// Pricing Summary Helper
export function getPricingSummary(vehicleCategory: VehicleCategory) {
  const activePlan = getActivePlanVersion();
  const subscriptionPrices = PLAN_TYPES.filter(
    plan => !plan.includes("One-Time")
  ).map(plan => ({
    plan,
    price: getPlanPrice(activePlan, vehicleCategory, plan),
  }));

  const oneTimeWashes = getAllOneTimeWashOptions(vehicleCategory);
  const recommendedAddOns = ADD_ON_SERVICES.filter(addon => addon.isActive).slice(0, 3);

  return {
    subscriptionPrices,
    oneTimeWashes,
    recommendedAddOns,
  };
}
