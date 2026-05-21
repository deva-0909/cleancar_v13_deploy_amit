/**
 * CustomerPlanPage.tsx
 * Public-facing 6-step car wash plan purchase flow
 * - 4-wheelers only (no 2-wheelers)
 * - All content (prices, plans, pincodes, addons, hero text) driven by
 *   SuperAdmin config stored in localStorage: "cleancar_plan_page_config"
 * - Falls back to DEFAULT_CONFIG if not set
 *
 * Route: /buy  (public, no auth required)
 */

import { useState, useEffect, useMemo } from "react";
import { useFinance } from "../../contexts/FinanceContext";
import { useCustomers } from "../../contexts/AppProvider";
import { useCustomerSubscriptions } from "../../contexts/AppProvider";
import { useCity } from "../../contexts/CityContext";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG TYPES & DEFAULTS
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanPageConfig {
  brand: { name: string; tagline: string; phone: string; whatsappNumber: string };
  hero: { badge: string; headline: string; headlineAccent: string; subheadline: string };
  trustItems: string[];
  trustStrip: string[];
  vehicleCategories: VehicleCategoryConfig[];
  carModelMap: Record<string, string>; // model keyword → category id
  serviceablePincodes: { code: string; label: string }[];
  monthlyPlans: MonthlyPlanConfig[];
  packs: PackConfig[];
  commitments: CommitmentConfig[];
  addons: AddonConfig[];
  timeSlots: string[];
  postPaymentSteps: string[];
}

export interface VehicleCategoryConfig {
  id: string;
  label: string;
  icon: string;
}

export interface MonthlyPlanConfig {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  popular?: boolean;
  features: { text: string; included: boolean }[];
  prices: Record<string, number>; // categoryId → price
}

export interface PackConfig {
  id: string;
  name: string;
  icon: string;
  price: number;
  perLabel: string;
  discount: string;
}

export interface CommitmentConfig {
  id: string;
  term: string;
  discountLabel: string;
  perk: string;
  highlight?: "best" | "great";
}

export interface AddonConfig {
  id: string;
  name: string;
  price: number;
  unit: string;
  description: string;
}

export const DEFAULT_CONFIG: PlanPageConfig = {
  brand: {
    name: "249 Carwashing",
    tagline: "Daily car wash at your doorstep",
    phone: "+91 82387 05601",
    whatsappNumber: "918238705601",
  },
  hero: {
    badge: "🚗 Surat's #1 Daily Car Wash Service",
    headline: "Your car, clean",
    headlineAccent: "every single day.",
    subheadline: "Professional doorstep car wash — before you wake up, after every drive. Photos after every wash on WhatsApp.",
  },
  trustItems: ["📸 Before & after photos every wash", "🔄 Free re-wash within 24h", "🏠 We come to you", "📞 Cancel anytime"],
  trustStrip: [
    "🔒 Razorpay secured payments",
    "📸 Before & after photos every wash",
    "🔄 Free re-wash within 24 hours",
    "📞 7-day cancellation — no questions asked",
    "🏠 We come to you — home, office, society",
  ],
  vehicleCategories: [
    { id: "hatchback", label: "Hatchback / Compact Sedan", icon: "🚗" },
    { id: "suv",       label: "SUV / Sedan / MUV",         icon: "🚙" },
    { id: "luxury",    label: "Luxury / Large SUV",         icon: "🏎️" },
  ],
  carModelMap: {
    // ── MARUTI SUZUKI ──────────────────────────────────────────────────────
    // Hatchbacks
    "alto":"hatchback", "alto800":"hatchback", "altok10":"hatchback",
    "swift":"hatchback", "swiftdzire":"hatchback",
    "baleno":"hatchback", "celerio":"hatchback", "ignis":"hatchback",
    "wagon":"hatchback", "wagonr":"hatchback",
    "ritz":"hatchback", "estilo":"hatchback", "zen":"hatchback",
    "sx4":"hatchback", "splash":"hatchback",
    "dzire":"hatchback", "ciaz":"hatchback",
    // SUV/Sedan
    "ertiga":"suv", "xertiga":"suv", "vitara":"suv", "vitarabrezza":"suv",
    "brezza":"suv", "scross":"suv", "s-cross":"suv",
    "grand":"suv", "grandvitara":"suv",
    "eeco":"suv", "omni":"suv",
    "fronx":"suv", "jimny":"suv",
    "invicto":"luxury",

    // ── HYUNDAI ────────────────────────────────────────────────────────────
    "i10":"hatchback", "grandi10":"hatchback", "i10nios":"hatchback",
    "i20":"hatchback", "i20active":"hatchback", "i20n":"hatchback",
    "aura":"hatchback", "santro":"hatchback", "eon":"hatchback",
    "accent":"hatchback", "getz":"hatchback",
    "verna":"suv", "elantra":"suv", "sonata":"suv",
    "creta":"suv", "venue":"suv", "alcazar":"suv",
    "tucson":"suv", "ioniq5":"luxury",
    "kona":"suv",

    // ── TATA MOTORS ────────────────────────────────────────────────────────
    "tiago":"hatchback", "tiagoev":"hatchback",
    "tigor":"hatchback", "tigorev":"hatchback",
    "indica":"hatchback", "indicav2":"hatchback", "indigo":"hatchback",
    "nexon":"suv", "nexonev":"suv", "nexonmax":"suv",
    "harrier":"suv", "safari":"suv",
    "punch":"hatchback", "punchev":"hatchback",
    "altroz":"hatchback",
    "hexa":"suv", "aria":"suv", "sumo":"suv",
    "nano":"hatchback", "manza":"hatchback",
    "zest":"hatchback", "bolt":"hatchback",
    "avinya":"luxury", "curvv":"suv", "curvvev":"suv",

    // ── MAHINDRA ───────────────────────────────────────────────────────────
    "thar":"suv", "tharre":"suv",
    "scorpio":"suv", "scorpioclassic":"suv", "scorpion":"suv",
    "scorpioe":"suv", "scorpion":"suv",
    "xuv300":"suv", "xuv400":"suv", "xuv700":"luxury",
    "bolero":"suv", "boleropik":"suv", "boleromax":"suv",
    "kuv100":"hatchback", "kuv300":"suv",
    "marazzo":"suv", "alturas":"luxury",
    "xylo":"suv", "verito":"hatchback",
    "roxor":"suv", "marshal":"suv",
    "be6":"luxury", "xe9":"luxury",

    // ── HONDA ──────────────────────────────────────────────────────────────
    "jazz":"hatchback", "brio":"hatchback",
    "amaze":"hatchback", "city":"suv",
    "civic":"suv", "accord":"luxury",
    "wrv":"suv", "hrv":"suv", "brv":"suv",
    "crv":"luxury", "pilot":"luxury",
    "elevate":"suv",

    // ── TOYOTA ─────────────────────────────────────────────────────────────
    "etios":"hatchback", "etiosliva":"hatchback", "etiosgd":"hatchback",
    "yaris":"hatchback", "yariscross":"suv",
    "glanza":"hatchback",
    "innova":"suv", "innovacrystal":"suv", "innovahycross":"suv", "crysta":"suv",
    "fortuner":"luxury", "fortunelegender":"luxury",
    "camry":"luxury", "vellfire":"luxury", "hilux":"luxury",
    "land":"luxury", "landcruiser":"luxury", "prado":"luxury",
    "urban":"suv", "urbancruiser":"suv", "raize":"suv",
    "hyryder":"suv", "taisor":"suv",

    // ── KIA ────────────────────────────────────────────────────────────────
    "seltos":"suv", "carnival":"luxury", "sonet":"suv",
    "ev6":"luxury", "ev9":"luxury",
    "carens":"suv",

    // ── SKODA ──────────────────────────────────────────────────────────────
    "rapid":"hatchback", "fabia":"hatchback",
    "octavia":"suv", "superb":"luxury",
    "kushaq":"suv", "slavia":"suv",
    "kodiaq":"luxury", "karoq":"suv",
    "enyaq":"luxury",

    // ── VOLKSWAGEN ─────────────────────────────────────────────────────────
    "polo":"hatchback", "vento":"hatchback", "ameo":"hatchback",
    "virtus":"suv", "taigun":"suv",
    "passat":"luxury", "tiguan":"luxury", "tiguarallspace":"luxury",
    "touareg":"luxury", "id4":"luxury",

    // ── RENAULT ────────────────────────────────────────────────────────────
    "kwid":"hatchback", "triber":"suv",
    "kiger":"suv", "duster":"suv",
    "lodgy":"suv", "scala":"hatchback",
    "fluence":"suv",

    // ── NISSAN ─────────────────────────────────────────────────────────────
    "micra":"hatchback", "sunny":"hatchback",
    "magnite":"suv", "kicks":"suv",
    "teana":"luxury", "xtrail":"luxury",
    "patrol":"luxury",

    // ── FORD (discontinued India, still on roads) ──────────────────────────
    "figo":"hatchback", "aspire":"hatchback",
    "freestyle":"suv", "ecosport":"suv",
    "endeavour":"luxury",
    "mondeo":"suv", "mustang":"luxury",
    "fusion":"suv",

    // ── MERCEDES-BENZ ──────────────────────────────────────────────────────
    "aclass":"luxury", "bclass":"luxury", "cclass":"luxury",
    "eclass":"luxury", "sclass":"luxury",
    "gla":"luxury", "glb":"luxury", "glc":"luxury",
    "gle":"luxury", "gls":"luxury", "gclass":"luxury",
    "amg":"luxury", "cla":"luxury", "cls":"luxury",
    "eqb":"luxury", "eqc":"luxury", "eqs":"luxury",
    "c200":"luxury", "c220":"luxury", "e200":"luxury",
    "s450":"luxury", "s500":"luxury",

    // ── BMW ────────────────────────────────────────────────────────────────
    "1series":"luxury", "2series":"luxury", "3series":"luxury",
    "4series":"luxury", "5series":"luxury", "6series":"luxury",
    "7series":"luxury", "8series":"luxury",
    "x1":"luxury", "x2":"luxury", "x3":"luxury",
    "x4":"luxury", "x5":"luxury", "x6":"luxury", "x7":"luxury",
    "m3":"luxury", "m5":"luxury", "z4":"luxury",
    "i4":"luxury", "ix":"luxury", "ix3":"luxury",

    // ── AUDI ───────────────────────────────────────────────────────────────
    "a3":"luxury", "a4":"luxury", "a5":"luxury",
    "a6":"luxury", "a7":"luxury", "a8":"luxury",
    "q2":"luxury", "q3":"luxury", "q5":"luxury",
    "q7":"luxury", "q8":"luxury",
    "rs":"luxury", "r8":"luxury", "tt":"luxury",
    "e-tron":"luxury", "etron":"luxury",

    // ── VOLVO ──────────────────────────────────────────────────────────────
    "xc40":"luxury", "xc60":"luxury", "xc90":"luxury",
    "s60":"luxury", "s90":"luxury",
    "v60":"luxury", "v90":"luxury",
    "c40":"luxury",

    // ── JAGUAR ─────────────────────────────────────────────────────────────
    "jaguar":"luxury", "xf":"luxury", "xe":"luxury", "xj":"luxury",
    "fpace":"luxury", "epace":"luxury", "ipace":"luxury",

    // ── LAND ROVER ─────────────────────────────────────────────────────────
    "landrover":"luxury", "defender":"luxury", "discovery":"luxury",
    "freelander":"luxury", "rangerover":"luxury",
    "sport":"luxury", "velar":"luxury", "evoque":"luxury",

    // ── PORSCHE ────────────────────────────────────────────────────────────
    "porsche":"luxury", "cayenne":"luxury", "macan":"luxury",
    "panamera":"luxury", "taycan":"luxury", "911":"luxury",
    "boxster":"luxury", "cayman":"luxury",

    // ── JEEP ───────────────────────────────────────────────────────────────
    "compass":"suv", "meridian":"luxury",
    "wrangler":"luxury", "cherokee":"luxury",
    "grand cherokee":"luxury", "grandcherokee":"luxury",
    "renegade":"suv",

    // ── MG (MORRIS GARAGES) ────────────────────────────────────────────────
    "hector":"suv", "hectorplus":"suv",
    "gloster":"luxury", "astor":"suv",
    "zs":"suv", "zsev":"suv",
    "comet":"hatchback", "cometev":"hatchback",
    "mg":"suv",

    // ── CITROEN ────────────────────────────────────────────────────────────
    "c3":"hatchback", "c3aircross":"suv",
    "c5":"suv", "c5aircross":"suv",
    "basalt":"suv", "ec3":"hatchback",

    // ── LEXUS ──────────────────────────────────────────────────────────────
    "lexus":"luxury", "lx":"luxury", "rx":"luxury",
    "nx":"luxury", "ux":"luxury",
    "es":"luxury", "ls":"luxury", "lc":"luxury",

    // ── MASERATI / FERRARI / LAMBORGHINI ───────────────────────────────────
    "maserati":"luxury", "ferrari":"luxury", "lamborghini":"luxury",
    "ghibli":"luxury", "levante":"luxury", "grecale":"luxury",
    "huracan":"luxury", "urus":"luxury", "aventador":"luxury",

    // ── BENTLEY / ROLLS ROYCE / ASTON MARTIN ──────────────────────────────
    "bentley":"luxury", "rollsroyce":"luxury", "astonmartin":"luxury",
    "ghost":"luxury", "phantom":"luxury", "cullinan":"luxury",
    "continental":"luxury", "vantage":"luxury", "dbx":"luxury",

    // ── OLA / PURE EV / EV SEGMENT ─────────────────────────────────────────
    "ola":"hatchback", "olaes1":"hatchback",
    "nexonev":"suv", "tiagoev":"hatchback",
    "minicooper":"luxury", "mini":"luxury",

    // ── ISUZU ──────────────────────────────────────────────────────────────
    "dmax":"suv", "mux":"suv",

    // ── MITSUBISHI ─────────────────────────────────────────────────────────
    "outlander":"luxury", "pajero":"luxury", "eclipse":"luxury",
    "lancer":"hatchback",
  },
  serviceablePincodes: [
    { code: "395007", label: "Vesu / Pal" },
    { code: "395005", label: "Piplod / Citylight" },
    { code: "395009", label: "Adajan" },
    { code: "394510", label: "Sachin / Hazira" },
    { code: "394518", label: "Udhna / Katargam" },
  ],
  monthlyPlans: [
    {
      id: "water",
      name: "Water Wash",
      icon: "💧",
      tagline: "Clean every day, essentials done right",
      features: [
        { text: "Full exterior pressure rinse", included: true },
        { text: "Wheel rim & tyre spray", included: true },
        { text: "Roof & glass wipe", included: true },
        { text: "Monthly underbody flush", included: true },
        { text: "Shampoo foam wash", included: false },
        { text: "Interior vacuum", included: false },
      ],
      prices: { hatchback: 999, suv: 1099, luxury: 1499 },
    },
    {
      id: "shampoo",
      name: "Shampoo Wash",
      icon: "🧴",
      tagline: "Deep clean with professional shampoo",
      popular: true,
      features: [
        { text: "Everything in Water Wash", included: true },
        { text: "Car-safe shampoo foam wash", included: true },
        { text: "Microfibre dry + glass polish", included: true },
        { text: "Weekly tyre dressing", included: true },
        { text: "Monthly underbody flush", included: true },
        { text: "Interior vacuum", included: false },
      ],
      prices: { hatchback: 1499, suv: 1699, luxury: 1999 },
    },
    {
      id: "wax",
      name: "Shampoo + Wax",
      icon: "✨",
      tagline: "Full care — inside and out",
      features: [
        { text: "Everything in Shampoo Wash", included: true },
        { text: "Weekly interior dashboard wipe", included: true },
        { text: "Weekly interior vacuum", included: true },
        { text: "Monthly deep interior vacuum", included: true },
        { text: "Monthly full hand wax polish", included: true },
        { text: "Door sill & boot area clean", included: true },
      ],
      prices: { hatchback: 1999, suv: 2699, luxury: 2999 },
    },
  ],
  packs: [
    { id: "onetime",  name: "One-Time Wash", icon: "1️⃣", price: 200, perLabel: "per wash",                    discount: "Standard rate" },
    { id: "biweekly", name: "Bi-Weekly",     icon: "🔁", price: 372, perLabel: "2× per month · ₹186/wash",    discount: "7% off" },
    { id: "3x",       name: "3× per Month",  icon: "3️⃣", price: 552, perLabel: "3× per month · ₹184/wash",    discount: "8% off" },
    { id: "weekly",   name: "Weekly",        icon: "📅", price: 720, perLabel: "4× per month · ₹180/wash",    discount: "10% off" },
  ],
  commitments: [
    { id: "monthly",  term: "Month to Month", discountLabel: "No lock-in",  perk: "Cancel anytime. 7 days' notice." },
    { id: "3month",   term: "3 Months",       discountLabel: "5% off",      perk: "On renewal. ₹225 saving on Hatchback Shampoo." },
    { id: "6month",   term: "6 Months",       discountLabel: "10% off",     perk: "Renewal + free interior vacuum every month.", highlight: "great" },
    { id: "12month",  term: "12 Months",      discountLabel: "18% off",     perk: "Renewal + vacuum + tyre dressing monthly + priority slots.", highlight: "best" },
  ],
  addons: [
    { id: "vacuum",   name: "Interior Deep Vacuum",      price: 199, unit: "per visit", description: "Seats, mats, footwells, boot area. Full interior clean." },
    { id: "dashboard",name: "Dashboard & Console Clean", price: 149, unit: "per visit", description: "Dashboard, centre console, door pads — dust-free finish." },
    { id: "tyre",     name: "Tyre Dressing",             price: 99,  unit: "per visit", description: "Shine and protect all 4 tyres. Makes them look brand new." },
    { id: "glass",    name: "Glass Coating (RainX)",     price: 349, unit: "per month", description: "Applied once/month on all glass. Repels rain, better visibility." },
    { id: "waxpolish",name: "One-time Wax Polish",       price: 599, unit: "per visit", description: "For Water/Shampoo plan users wanting full wax protection occasionally." },
    { id: "antirust", name: "Underbody Anti-rust Spray", price: 799, unit: "per visit", description: "Protective coating for underbody. Recommended quarterly." },
  ],
  timeSlots: [
    "Early morning (5am – 7am)",
    "Morning (7am – 9am)",
    "Late morning (9am – 11am)",
    "Afternoon (11am – 1pm)",
    "Evening (5pm – 7pm)",
  ],
  postPaymentSteps: [
    "Receipt sent to your WhatsApp immediately",
    "Confirmation call within 1 working day",
    "Service activates within 2 working days",
    "Before & after photos after every wash",
  ],
};

function loadConfig(): PlanPageConfig {
  try {
    const raw = localStorage.getItem("cleancar_plan_page_config");
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONFIG;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const perWash = (price: number, washes = 30) => `₹${Math.round(price / washes)} per wash · ${washes} washes/month`;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function CustomerPlanPage() {
  const [cfg, setCfg] = useState<PlanPageConfig>(loadConfig);
  const [step, setStep] = useState(1);

  // Step 1 state
  const [carModel, setCarModel] = useState("");
  const [detectedCat, setDetectedCat] = useState<string | null>(null);
  const [catConfirmed, setCatConfirmed] = useState(false);

  // Step 2 state
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<"ok" | "waitlist" | null>(null);

  // Step 3 state
  const [planMode, setPlanMode] = useState<"monthly" | "pack">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [commitment, setCommitment] = useState("monthly");

  // Step 4 state
  const [addons, setAddons] = useState<string[]>([]);

  // Step 5 state
  const [custName, setCustName] = useState("");
  const [custMobile, setCustMobile] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custReg, setCustReg] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [prefTime, setPrefTime] = useState("");
  const [parking, setParking] = useState<"dedicated" | "random">("dedicated");
  const [notifyPref, setNotifyPref] = useState<"whatsapp" | "email" | "both">("whatsapp");

  // Step 6.5 — T&C consent
  const [consentTerms, setConsentTerms]     = useState(false);
  const [consentRefund, setConsentRefund]   = useState(false);
  const [consentCancel, setConsentCancel]   = useState(false);
  const [showTnC, setShowTnC]               = useState<"terms" | "refund" | "cancel" | null>(null);

  // Payment processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  // Contexts for data sync
  const { recordRevenue } = useFinance();
  const { addCustomer, customers } = useCustomers();
  const { createSubscription } = useCustomerSubscriptions();
  const { city } = useCity();

  // Listen for config changes from admin
  useEffect(() => {
    const onStorage = () => setCfg(loadConfig());
    window.addEventListener("storage", onStorage);
    window.addEventListener("planConfigUpdated", onStorage);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("planConfigUpdated", onStorage); };
  }, []);

  // Detect car category from model input
  useEffect(() => {
    if (carModel.trim().length < 2) { setDetectedCat(null); setCatConfirmed(false); return; }
    const val = carModel.toLowerCase().trim();
    let found: string | null = null;
    for (const [kw, cat] of Object.entries(cfg.carModelMap)) {
      if (val.includes(kw)) { found = cat; break; }
    }
    setDetectedCat(found || (carModel.trim().length >= 3 ? "hatchback" : null));
    setCatConfirmed(false);
  }, [carModel, cfg.carModelMap]);

  // Pincode check
  useEffect(() => {
    if (pincode.length !== 6) { setPincodeStatus(null); return; }
    const serviceable = cfg.serviceablePincodes.some(p => p.code === pincode);
    setPincodeStatus(serviceable ? "ok" : "waitlist");
  }, [pincode, cfg.serviceablePincodes]);

  const activeCat = detectedCat;
  const catLabel = cfg.vehicleCategories.find(c => c.id === activeCat)?.label || "";

  const planPrice = useMemo(() => {
    if (!selectedPlan || !activeCat) return 0;
    const plan = cfg.monthlyPlans.find(p => p.id === selectedPlan);
    return plan?.prices[activeCat] ?? 0;
  }, [selectedPlan, activeCat, cfg.monthlyPlans]);

  const packPrice = useMemo(() => {
    const p = cfg.packs.find(p => p.id === selectedPack);
    return p?.price ?? 0;
  }, [selectedPack, cfg.packs]);

  const addonTotal = useMemo(() =>
    addons.reduce((s, id) => s + (cfg.addons.find(a => a.id === id)?.price ?? 0), 0),
    [addons, cfg.addons]);

  const basePrice = planMode === "monthly" ? planPrice : packPrice;
  const total = basePrice + addonTotal;

  const step1Ok = !!activeCat && carModel.trim().length >= 2;
  const step2Ok = pincodeStatus !== null;
  const step3Ok = planMode === "monthly" ? !!selectedPlan : !!selectedPack;
  const step5Ok = custName && custMobile && custAddress;
  const consentOk = consentTerms && consentRefund && consentCancel;

  const goTo = (n: number) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // ── Handle Payment + Full Data Sync ──────────────────────────────────────
  const handlePayment = async () => {
    if (!consentOk) return;
    setIsProcessing(true);

    try {
      const now = new Date();
      const invNum = `INV-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${Date.now().toString().slice(-6)}`;
      setInvoiceNumber(invNum);

      const nameParts = custName.trim().split(" ");
      const firstName = nameParts[0] || custName;
      const lastName  = nameParts.slice(1).join(" ") || "—";

      // 1️⃣ Find or create customer record
      const existing = customers.find(c =>
        c.phone === custMobile ||
        (custEmail && c.email === custEmail)
      );

      let customerId: string;
      if (existing) {
        customerId = existing.customerId;
      } else {
        const newCust = addCustomer({
          firstName,
          lastName,
          email: custEmail || "",
          phone: custMobile,
          address: {
            line1: custAddress,
            area: cfg.serviceablePincodes.find(p => p.code === pincode)?.label || pincode,
            city: "Surat",
            pinCode: pincode,
          },
          vehicleDetails: activeCat ? {
            category: activeCat,
            brand: carModel.split(" ")[0] || carModel,
            color: "",
            registrationNumber: custReg.toUpperCase(),
          } : undefined,
          leadSource: "Website — Buy Page",
          status: "Active",
          tags: ["web-signup"],
        });
        customerId = newCust.customerId;
      }

      // 2️⃣ Create subscription record
      const planObj = cfg.monthlyPlans.find(p => p.id === selectedPlan);
      const packObj = cfg.packs.find(p => p.id === selectedPack);
      const renewalDate = new Date(now);
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      const sub = createSubscription({
        customerId,
        packageType: selectedPlan === "wax" ? "Premium" : selectedPlan === "shampoo" ? "Standard" : "Basic",
        packageName: planMode === "monthly"
          ? (planObj?.name || selectedPlan || "Plan")
          : (packObj?.name || selectedPack || "Pack"),
        frequency: "Daily",
        status: "Active",
        startDate: now.toISOString().split("T")[0],
        renewalDate: renewalDate.toISOString().split("T")[0],
        pricing: {
          basePrice: basePrice,
          discount: 0,
          finalPrice: total,
          currency: "INR",
        },
        serviceDetails: {
          vehicleType: activeCat || "hatchback",
          addOns: addons,
          preferredTimeSlot: prefTime,
        },
        billingCycle: "Monthly",
        paymentStatus: "Paid",
      });

      // 3️⃣ Record revenue in FinanceContext (auto-posts double-entry ledger)
      recordRevenue({
        customerId,
        subscriptionId: sub.subscriptionId,
        type: planMode === "monthly" ? "Subscription" : "One-Time",
        amount: total,
        receivedDate: now.toISOString().split("T")[0],
        paymentMethod: "UPI",   // In production: from Razorpay response
        invoiceNumber: invNum,
        status: "Received",
        cityId: city || "CITY-SURAT",
      });

      // 4️⃣ Build invoice object for display + sharing
      const invoice = {
        invoiceNumber: invNum,
        invoiceDate: now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
        customerName: custName,
        customerPhone: custMobile,
        customerEmail: custEmail,
        vehicleReg: custReg,
        address: custAddress,
        pincode,
        items: [
          ...(planMode === "monthly"
            ? [{ name: `${planObj?.name || selectedPlan} — Monthly Subscription (${catLabel})`, qty: 1, rate: planPrice, amount: planPrice }]
            : [{ name: `${packObj?.name || selectedPack} Pack`, qty: 1, rate: packPrice, amount: packPrice }]
          ),
          ...addons.map(id => {
            const a = cfg.addons.find(x => x.id === id);
            return { name: a?.name || id, qty: 1, rate: a?.price || 0, amount: a?.price || 0 };
          }),
        ],
        subtotal: total,
        cgst: parseFloat((total * 0.09).toFixed(2)),
        sgst: parseFloat((total * 0.09).toFixed(2)),
        grandTotal: parseFloat((total * 1.18).toFixed(2)),
        paymentMethod: "Razorpay (UPI/Card/NetBanking)",
        subscriptionId: sub.subscriptionId,
        customerId,
        notifyPref,
        commitment: planMode === "monthly" ? (cfg.commitments.find(c => c.id === commitment)?.term || commitment) : "N/A",
      };
      setGeneratedInvoice(invoice);

      // 5️⃣ Persist invoice to localStorage for InvoiceManagement screen
      try {
        const stored = JSON.parse(localStorage.getItem("cleancar_web_invoices") || "[]");
        stored.unshift({ ...invoice, createdAt: now.toISOString(), status: "PAID" });
        localStorage.setItem("cleancar_web_invoices", JSON.stringify(stored.slice(0, 500)));
      } catch (_) {}

      // 6️⃣ Simulate WhatsApp / Email dispatch
      const waMsg = encodeURIComponent(
        `Hi ${firstName}! 🎉\n\nYour ${invoice.items[0].name} is confirmed!\n\nInvoice: ${invNum}\nAmount Paid: ₹${invoice.grandTotal.toLocaleString("en-IN")} (incl. GST)\n\nService starts within 2 working days. Your washer will send before & after photos after every wash.\n\nThank you for choosing ${cfg.brand.name}! 🚗✨`
      );
      if (notifyPref === "whatsapp" || notifyPref === "both") {
        window._pendingWAInvoice = `https://wa.me/${cfg.brand.whatsappNumber}?text=${waMsg}`;
      }

      setIsProcessing(false);
      goTo(7);
    } catch (err) {
      console.error("Payment/sync error:", err);
      setIsProcessing(false);
    }
  };

  const STEPS = [
    { n: 1, label: "Your Car" },
    { n: 2, label: "Your Area" },
    { n: 3, label: "Plan" },
    { n: 4, label: "Add-ons" },
    { n: 5, label: "Details" },
    { n: 6, label: "Review & T&C" },
  ];

  // ── SUCCESS ─────────────────────────────────────────────────────────────
  if (step === 7) {
    const inv = generatedInvoice;
    const waMsg = encodeURIComponent(
      `Hi! Sharing my invoice ${inv?.invoiceNumber} from ${cfg.brand.name}. Please confirm my subscription.`
    );
    return (
      <div style={{ minHeight: "100vh", background: "#F8FBFF", fontFamily: "'DM Sans', sans-serif", padding: "40px 20px" }}>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* Success header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Payment Confirmed!</h2>
            <p style={{ color: "#4A5568", fontSize: 15 }}>Welcome to {cfg.brand.name}. Your subscription is now active.</p>
          </div>

          {/* Invoice card */}
          {inv && (
            <div style={{ background: "#fff", border: "1.5px solid #E3EEF7", borderRadius: 16, marginBottom: 24, overflow: "hidden" }}>
              {/* Invoice header */}
              <div style={{ background: "linear-gradient(135deg,#1565C0,#2196F3)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>{cfg.brand.name}</div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Tax Invoice</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#FFEB3B", fontWeight: 700, fontSize: 15, fontFamily: "'Syne',sans-serif" }}>{inv.invoiceNumber}</div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{inv.invoiceDate}</div>
                </div>
              </div>

              <div style={{ padding: "20px 24px" }}>
                {/* Bill to */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #E3EEF7" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#90A4AE", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Bill To</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{inv.customerName}</div>
                    <div style={{ fontSize: 13, color: "#4A5568" }}>📱 {inv.customerPhone}</div>
                    {inv.customerEmail && <div style={{ fontSize: 13, color: "#4A5568" }}>✉️ {inv.customerEmail}</div>}
                    <div style={{ fontSize: 13, color: "#4A5568", marginTop: 4 }}>{inv.address}</div>
                    <div style={{ fontSize: 13, color: "#4A5568" }}>Pin: {inv.pincode}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#90A4AE", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Vehicle</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.vehicleReg || "Not provided"}</div>
                    <div style={{ fontSize: 13, color: "#4A5568" }}>{catLabel}</div>
                    <div style={{ fontSize: 11, color: "#90A4AE", marginTop: 8 }}>Subscription ID</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#1565C0" }}>{inv.subscriptionId}</div>
                  </div>
                </div>

                {/* Line items */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: "#F8FBFF" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#374151", borderBottom: "1px solid #E3EEF7" }}>Description</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#374151", borderBottom: "1px solid #E3EEF7", width: 40 }}>Qty</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#374151", borderBottom: "1px solid #E3EEF7" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.items.map((item: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "10px", fontSize: 13 }}>{item.name}</td>
                        <td style={{ padding: "10px", textAlign: "center", fontSize: 13 }}>{item.qty}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontSize: 13, fontWeight: 600 }}>₹{item.amount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tax breakdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 10px", background: "#F8FBFF", borderRadius: 10, marginBottom: 16 }}>
                  {[
                    ["Subtotal (Taxable Value)", `₹${inv.subtotal.toLocaleString("en-IN")}`],
                    ["CGST @ 9%", `₹${inv.cgst.toLocaleString("en-IN")}`],
                    ["SGST @ 9%", `₹${inv.sgst.toLocaleString("en-IN")}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#4A5568" }}>
                      <span>{k}</span><span>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 16, fontFamily: "'Syne',sans-serif", color: "#1565C0", borderTop: "1.5px solid #E3EEF7", paddingTop: 10, marginTop: 4 }}>
                    <span>Grand Total</span>
                    <span>₹{inv.grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Payment info */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#4A5568", marginBottom: 4 }}>
                  <span>Payment Method</span><span style={{ fontWeight: 600 }}>{inv.paymentMethod}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#4A5568" }}>
                  <span>Commitment</span><span style={{ fontWeight: 600 }}>{inv.commitment}</span>
                </div>
              </div>

              {/* Footer */}
              <div style={{ background: "#F8FBFF", borderTop: "1px solid #E3EEF7", padding: "14px 24px", fontSize: 12, color: "#90A4AE", textAlign: "center" }}>
                🔒 This is a computer-generated invoice. {cfg.brand.name} · {cfg.brand.phone}
              </div>
            </div>
          )}

          {/* Share buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              📤 Share invoice via:
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href={`https://wa.me/${cfg.brand.whatsappNumber}?text=${encodeURIComponent(`Hi! My invoice no. is ${inv?.invoiceNumber}. Amount paid: ₹${inv?.grandTotal}. Please confirm my ${cfg.brand.name} subscription.`)}`}
                target="_blank" rel="noreferrer"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "#fff", padding: "12px 20px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                💬 Send on WhatsApp
              </a>
              {inv?.customerEmail && (
                <a href={`mailto:${inv.customerEmail}?subject=Invoice ${inv?.invoiceNumber} — ${cfg.brand.name}&body=Dear ${inv?.customerName},%0A%0AThank you for subscribing to ${cfg.brand.name}.%0A%0AInvoice No: ${inv?.invoiceNumber}%0AAmount: ₹${inv?.grandTotal} (incl. GST)%0A%0AYour service starts within 2 working days.`}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#2196F3", color: "#fff", padding: "12px 20px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                  📧 Send by Email
                </a>
              )}
            </div>
            <button onClick={() => window.print()}
              style={{ padding: "11px 20px", background: "#F3F4F6", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              🖨️ Print / Save as PDF
            </button>
          </div>

          {/* What happens next */}
          <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: "#1B5E20", marginBottom: 12, fontSize: 14 }}>📋 What happens next:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cfg.postPaymentSteps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#2196F3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                  <div style={{ fontSize: 13, color: "#2E7D32", paddingTop: 3 }}>{s}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellation link */}
          <div style={{ textAlign: "center", padding: "16px 0", borderTop: "1px solid #E3EEF7" }}>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>Need to cancel your service in the future?</p>
            <a href="/cancel-service" style={{ fontSize: 13, color: "#546E7A", fontWeight: 600, textDecoration: "underline" }}>
              Request Service Cancellation →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FBFF", fontFamily: "'DM Sans', sans-serif", color: "#0D1B2A" }}>
      {/* Import fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#fff", borderBottom: "1px solid #E3EEF7", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: "#2196F3", display: "flex", alignItems: "center", gap: 10 }}>
          <span>🚿</span>
          <span>{cfg.brand.name.split(" ")[0]}<span style={{ color: "#0D1B2A" }}> {cfg.brand.name.split(" ").slice(1).join(" ")}</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#4A5568" }}>📞 {cfg.brand.phone}</span>
          <a href="/cancel-service"
            style={{ color: "#546E7A", fontSize: 13, fontWeight: 600, textDecoration: "none", padding: "7px 14px", border: "1.5px solid #CFD8DC", borderRadius: 50 }}>
            Cancel Service
          </a>
          <a href={`https://wa.me/${cfg.brand.whatsappNumber}`} target="_blank" rel="noreferrer"
            style={{ background: "#25D366", color: "#fff", padding: "8px 16px", borderRadius: 50, fontSize: 13, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            💬 WhatsApp
          </a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #1565C0 0%, #2196F3 60%, #42A5F5 100%)", padding: "56px 32px 72px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 13, fontWeight: 500, padding: "6px 16px", borderRadius: 50, marginBottom: 20 }}>
          {cfg.hero.badge}
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,5vw,52px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 14 }}>
          {cfg.hero.headline} <em style={{ fontStyle: "normal", color: "#FFEB3B" }}>{cfg.hero.headlineAccent}</em>
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", marginBottom: 32, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>{cfg.hero.subheadline}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {cfg.trustItems.map((t, i) => (
            <span key={i} style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* STEPS BAR */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E3EEF7", padding: "0 32px", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", maxWidth: 860, width: "100%" }}>
          {STEPS.map(({ n, label }) => (
            <div key={n} onClick={() => n < step && goTo(n)}
              style={{ flex: 1, padding: "18px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: step === n ? "3px solid #2196F3" : "3px solid transparent", cursor: n < step ? "pointer" : "default" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: n < step ? "#00C853" : step === n ? "#2196F3" : "#BBDEFB", color: n < step ? "#fff" : step === n ? "#fff" : "#1565C0", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {n < step ? "✓" : n}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === n ? 700 : 500, color: step === n ? "#1565C0" : "#4A5568" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "44px 32px 80px" }}>

        {/* ── STEP 1: YOUR CAR ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Tell us about your car</h2>
            <p style={{ fontSize: 15, color: "#4A5568", marginBottom: 32 }}>We only service 4-wheelers — cars, SUVs, and luxury vehicles. Enter your car model to get the right pricing.</p>

            {/* 4W Only notice */}
            <div style={{ background: "#E3F2FD", border: "1px solid #BBDEFB", borderRadius: 12, padding: "14px 18px", marginBottom: 28, maxWidth: 520, fontSize: 14, color: "#1565C0", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 20 }}>🚗</span>
              <div>
                <strong>4-Wheeler Service Only</strong><br />
                <span style={{ fontWeight: 400 }}>Our service covers all cars, SUVs, MUVs, and luxury vehicles. Bikes and 2-wheelers are not included in our subscription plans.</span>
              </div>
            </div>

            {/* Vehicle category selector */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Select your vehicle category</label>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {cfg.vehicleCategories.map(cat => (
                  <div key={cat.id} onClick={() => { setDetectedCat(cat.id); setCatConfirmed(true); }}
                    style={{ border: `2px solid ${activeCat === cat.id ? "#2196F3" : "#E3EEF7"}`, borderRadius: 14, padding: "20px 24px", cursor: "pointer", background: activeCat === cat.id ? "#E3F2FD" : "#fff", textAlign: "center", minWidth: 160, transition: "all 0.2s" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{cat.icon}</div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14 }}>{cat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Car model input */}
            <div style={{ maxWidth: 480, marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Car model <span style={{ color: "#90A4AE", fontWeight: 400 }}>(helps auto-detect category)</span></label>
              <input
                value={carModel}
                onChange={e => setCarModel(e.target.value)}
                placeholder="e.g. Maruti Swift, Hyundai Creta, Toyota Fortuner"
                style={{ width: "100%", padding: "13px 18px", border: "2px solid #E3EEF7", borderRadius: 12, fontFamily: "'DM Sans',sans-serif", fontSize: 15, outline: "none", background: "#fff" }}
              />
              <p style={{ fontSize: 12, color: "#90A4AE", marginTop: 6 }}>Swift, Baleno, Creta, Innova, Fortuner, XUV700, Nexon…</p>
            </div>

            {/* Detected category badge */}
            {activeCat && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#E3F2FD", border: "1px solid #BBDEFB", borderRadius: 12, padding: "13px 18px", marginBottom: 24, maxWidth: 480 }}>
                <span style={{ fontSize: 20 }}>{cfg.vehicleCategories.find(c => c.id === activeCat)?.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1565C0" }}>{catLabel}</div>
                  <div style={{ fontSize: 12, color: "#4A5568" }}>Pricing will be applied for this category</div>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => goTo(2)} disabled={!step1Ok}
                style={{ padding: "13px 32px", background: step1Ok ? "#2196F3" : "#BBDEFB", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: step1Ok ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
                Next: Check Your Area →
              </button>
              <a href={`https://wa.me/${cfg.brand.whatsappNumber}`} target="_blank" rel="noreferrer"
                style={{ padding: "13px 24px", background: "#f5f5f5", color: "#4A5568", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                📞 Prefer a callback?
              </a>
            </div>
          </div>
        )}

        {/* ── STEP 2: PINCODE ──────────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Are we in your area?</h2>
            <p style={{ fontSize: 15, color: "#4A5568", marginBottom: 32 }}>Enter your pincode to check availability. We're growing fast!</p>

            <div style={{ maxWidth: 420, marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Your pincode</label>
              <input
                value={pincode}
                onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="e.g. 395007"
                maxLength={6}
                style={{ width: "100%", padding: "16px 20px", border: "2px solid #E3EEF7", borderRadius: 12, fontFamily: "'DM Sans',sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 4, outline: "none" }}
              />
            </div>

            {pincodeStatus === "ok" && (
              <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 12, padding: "13px 18px", marginBottom: 20, maxWidth: 480, fontSize: 14, color: "#2E7D32" }}>
                ✅ <strong>Great news!</strong> We service your area. Monthly subscription, repeat packs, and one-time washes all available.
              </div>
            )}
            {pincodeStatus === "waitlist" && (
              <div style={{ background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: 12, padding: "13px 18px", marginBottom: 20, maxWidth: 480, fontSize: 14, color: "#E65100" }}>
                ⚠️ <strong>Monthly subscription not yet available</strong> in this area. One-time and repeat washes still possible — or join the <strong>waitlist</strong>.
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#4A5568", marginBottom: 12 }}>Currently serving:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {cfg.serviceablePincodes.map(p => (
                  <button key={p.code} onClick={() => setPincode(p.code)}
                    style={{ background: "#fff", border: "1px solid #E3EEF7", padding: "6px 14px", borderRadius: 50, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                    📍 {p.label} — {p.code}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => goTo(1)} style={{ padding: "12px 24px", background: "#f0f4f8", color: "#4A5568", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back</button>
              <button onClick={() => goTo(3)} disabled={!step2Ok}
                style={{ padding: "13px 32px", background: step2Ok ? "#2196F3" : "#BBDEFB", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: step2Ok ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
                Next: Choose Your Plan →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: PLAN ─────────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Choose your plan</h2>
            <p style={{ fontSize: 15, color: "#4A5568", marginBottom: 28 }}>Priced for your <strong>{catLabel}</strong>. All monthly plans include 30 washes/month.</p>

            {/* Toggle */}
            <div style={{ display: "flex", background: "#E3EEF7", borderRadius: 50, padding: 4, maxWidth: 340, marginBottom: 32 }}>
              {(["monthly", "pack"] as const).map(m => (
                <button key={m} onClick={() => setPlanMode(m)}
                  style={{ flex: 1, padding: "10px 20px", borderRadius: 50, border: "none", background: planMode === m ? "#fff" : "none", color: planMode === m ? "#1565C0" : "#4A5568", fontWeight: planMode === m ? 700 : 500, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: planMode === m ? "0 2px 8px rgba(33,150,243,0.12)" : "none", transition: "all 0.2s" }}>
                  {m === "monthly" ? "Monthly Subscription" : "Repeat / One-time"}
                </button>
              ))}
            </div>

            {/* Monthly plans */}
            {planMode === "monthly" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 32 }}>
                  {cfg.monthlyPlans.map(plan => {
                    const price = plan.prices[activeCat!] ?? 0;
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <div key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                        style={{ border: `2px solid ${isSelected || plan.popular ? "#2196F3" : "#E3EEF7"}`, borderRadius: 16, background: "#fff", cursor: "pointer", overflow: "hidden", transition: "all 0.2s", boxShadow: isSelected ? "0 8px 32px rgba(33,150,243,0.18)" : "none" }}>
                        {plan.popular && <div style={{ background: "#2196F3", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 12px", textAlign: "center", letterSpacing: 0.5 }}>⭐ Most Popular</div>}
                        <div style={{ padding: 24 }}>
                          <div style={{ fontSize: 28, marginBottom: 10 }}>{plan.icon}</div>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
                          <div style={{ fontSize: 13, color: "#4A5568", marginBottom: 18 }}>{plan.tagline}</div>
                          <div style={{ marginBottom: 4 }}>
                            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, color: "#1565C0" }}>{inr(price)}</span>
                            <span style={{ fontSize: 14, color: "#4A5568" }}>/month</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#90A4AE", marginBottom: 18 }}>{perWash(price)}</div>
                          <div style={{ borderTop: "1px solid #E3EEF7", paddingTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                            {plan.features.map((f, i) => (
                              <div key={i} style={{ fontSize: 13, color: "#4A5568", display: "flex", gap: 8, alignItems: "flex-start" }}>
                                <span style={{ color: f.included ? "#00C853" : "#90A4AE", flexShrink: 0 }}>{f.included ? "✓" : "–"}</span>
                                {f.text}
                              </div>
                            ))}
                          </div>
                          <button style={{ width: "100%", marginTop: 18, padding: 13, borderRadius: 10, border: "2px solid #2196F3", background: isSelected ? "#2196F3" : "none", color: isSelected ? "#fff" : "#2196F3", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                            {isSelected ? "✓ Selected" : `Select ${plan.name}`}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Commitments */}
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Commitment & loyalty rewards</h3>
                  <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 18 }}>Rewards earned on renewal — no upfront lock-in. Cancel anytime with 7 days' notice.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                    {cfg.commitments.map(c => {
                      const isSelected = commitment === c.id;
                      return (
                        <div key={c.id} onClick={() => setCommitment(c.id)}
                          style={{ border: `2px solid ${isSelected ? "#2196F3" : c.highlight === "best" ? "#FF6D00" : "#E3EEF7"}`, borderRadius: 14, padding: 18, cursor: "pointer", background: isSelected ? "#E3F2FD" : "#fff", transition: "all 0.2s" }}>
                          {c.highlight && <div style={{ display: "inline-block", background: c.highlight === "best" ? "#FF6D00" : "#2196F3", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, marginBottom: 8, letterSpacing: 0.5 }}>{c.highlight === "best" ? "BEST DEAL" : "GREAT VALUE"}</div>}
                          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{c.term}</div>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#1565C0", marginBottom: 4 }}>{c.discountLabel}</div>
                          <div style={{ fontSize: 12, color: "#4A5568", lineHeight: 1.4 }}>{c.perk}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Pack plans */}
            {planMode === "pack" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 20 }}>
                  {cfg.packs.map(pack => {
                    const isSelected = selectedPack === pack.id;
                    return (
                      <div key={pack.id} onClick={() => setSelectedPack(pack.id)}
                        style={{ border: `2px solid ${isSelected ? "#2196F3" : "#E3EEF7"}`, borderRadius: 14, padding: "20px 16px", textAlign: "center", cursor: "pointer", background: isSelected ? "#E3F2FD" : "#fff", transition: "all 0.2s" }}>
                        <div style={{ fontSize: 28, marginBottom: 10 }}>{pack.icon}</div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{pack.name}</div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: "#1565C0" }}>{inr(pack.price)}</div>
                        <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 8 }}>{pack.perLabel}</div>
                        <span style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>{pack.discount}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: "#E3F2FD", borderRadius: 12, padding: "13px 18px", fontSize: 13, color: "#1565C0", marginBottom: 24 }}>
                  💡 <strong>Same ₹200 base price</strong> for all vehicle categories. Volume discount applied automatically. No lock-in.
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => goTo(2)} style={{ padding: "12px 24px", background: "#f0f4f8", color: "#4A5568", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back</button>
              <button onClick={() => goTo(4)} disabled={!step3Ok}
                style={{ padding: "13px 32px", background: step3Ok ? "#2196F3" : "#BBDEFB", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: step3Ok ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
                Next: Add-ons →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: ADD-ONS ──────────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Want to add anything?</h2>
            <p style={{ fontSize: 15, color: "#4A5568", marginBottom: 24 }}>Optional add-ons to get more from every wash. Can be added to any plan.</p>
            <div style={{ background: "#E3F2FD", border: "1px solid #BBDEFB", borderRadius: 12, padding: "13px 18px", fontSize: 13, color: "#1565C0", marginBottom: 24 }}>
              ℹ️ Add-ons are <strong>per visit</strong> unless stated otherwise. You can add or remove them anytime from your account.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
              {cfg.addons.map(addon => {
                const selected = addons.includes(addon.id);
                return (
                  <div key={addon.id} onClick={() => setAddons(prev => selected ? prev.filter(a => a !== addon.id) : [...prev, addon.id])}
                    style={{ border: `2px solid ${selected ? "#2196F3" : "#E3EEF7"}`, borderRadius: 14, padding: 18, cursor: "pointer", background: selected ? "#E3F2FD" : "#fff", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{addon.name} {selected && <span style={{ color: "#00C853" }}>✓</span>}</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "#1565C0" }}>{inr(addon.price)}</div>
                        <div style={{ fontSize: 11, color: "#4A5568" }}>{addon.unit}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#4A5568" }}>{addon.description}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => goTo(3)} style={{ padding: "12px 24px", background: "#f0f4f8", color: "#4A5568", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back</button>
              <button onClick={() => goTo(5)} style={{ padding: "13px 32px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                Next: Your Details →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: DETAILS ──────────────────────────────────────────────── */}
        {step === 5 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Your details</h2>
            <p style={{ fontSize: 15, color: "#4A5568", marginBottom: 28 }}>We'll send your confirmation and before/after photos to your WhatsApp.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 620, marginBottom: 28 }}>
              {[
                { label: "Full name *", value: custName, set: setCustName, placeholder: "Amit Patel", col: 1 },
                { label: "Mobile (WhatsApp) *", value: custMobile, set: setCustMobile, placeholder: "+91 98765 43210", col: 1 },
                { label: "Email address", value: custEmail, set: setCustEmail, placeholder: "amit@example.com", col: 1 },
                { label: "Vehicle registration", value: custReg, set: setCustReg, placeholder: "GJ05MJ2345", col: 1 },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#0D1B2A" }}>{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    style={{ width: "100%", padding: "12px 16px", border: "2px solid #E3EEF7", borderRadius: 12, fontFamily: "'DM Sans',sans-serif", fontSize: 15, outline: "none" }} />
                </div>
              ))}
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#0D1B2A" }}>Preferred wash time</label>
                <select value={prefTime} onChange={e => setPrefTime(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", border: "2px solid #E3EEF7", borderRadius: 12, fontFamily: "'DM Sans',sans-serif", fontSize: 15, outline: "none", appearance: "none" }}>
                  <option value="">Select a slot</option>
                  {cfg.timeSlots.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#0D1B2A" }}>Full address *</label>
                <textarea value={custAddress} onChange={e => setCustAddress(e.target.value)} rows={3}
                  placeholder="Flat no, building, society, street..."
                  style={{ width: "100%", padding: "12px 16px", border: "2px solid #E3EEF7", borderRadius: 12, fontFamily: "'DM Sans',sans-serif", fontSize: 15, outline: "none", resize: "vertical" }} />
              </div>
            </div>

            {/* Parking */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Parking type</label>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[
                  { id: "dedicated", label: "Dedicated / Assigned Parking", icon: "🏠", desc: "Fixed spot — washer comes to your exact spot every day." },
                  { id: "random",    label: "Open / Society Parking",        icon: "🏢", desc: "Our team will call you to confirm your spot each day." },
                ].map(p => (
                  <div key={p.id} onClick={() => setParking(p.id as any)}
                    style={{ border: `2px solid ${parking === p.id ? "#2196F3" : "#E3EEF7"}`, borderRadius: 14, padding: "16px 20px", cursor: "pointer", background: parking === p.id ? "#E3F2FD" : "#fff", flex: "1 1 220px", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{p.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: "#4A5568" }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification preference */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Send invoice & updates via</label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { id: "whatsapp", label: "WhatsApp only", icon: "💬" },
                  { id: "email",    label: "Email only",    icon: "📧" },
                  { id: "both",     label: "Both",          icon: "📲" },
                ].map(opt => (
                  <div key={opt.id} onClick={() => setNotifyPref(opt.id as any)}
                    style={{ border: `2px solid ${notifyPref === opt.id ? "#2196F3" : "#E3EEF7"}`, borderRadius: 12, padding: "12px 20px", cursor: "pointer", background: notifyPref === opt.id ? "#E3F2FD" : "#fff", display: "flex", alignItems: "center", gap: 8, fontWeight: notifyPref === opt.id ? 700 : 500, fontSize: 14, transition: "all 0.15s" }}>
                    <span>{opt.icon}</span>{opt.label}
                  </div>
                ))}
              </div>
              {notifyPref !== "whatsapp" && !custEmail && (
                <p style={{ fontSize: 12, color: "#F59E0B", marginTop: 8 }}>⚠️ Please enter your email address above to receive email notifications.</p>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => goTo(4)} style={{ padding: "12px 24px", background: "#f0f4f8", color: "#4A5568", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back</button>
              <button onClick={() => goTo(6)} disabled={!step5Ok}
                style={{ padding: "13px 32px", background: step5Ok ? "#2196F3" : "#BBDEFB", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: step5Ok ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
                Review & Accept T&C →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: REVIEW + T&C + PAY ───────────────────────────────────── */}
        {step === 6 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Review & Confirm</h2>
            <p style={{ fontSize: 15, color: "#4A5568", marginBottom: 24 }}>Review your order, read and accept our policies, then pay securely.</p>

            {/* Photos promise */}
            <div style={{ background: "#E3F2FD", border: "1px solid #BBDEFB", borderRadius: 14, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", marginBottom: 24, maxWidth: 640 }}>
              <span style={{ fontSize: 24 }}>📸</span>
              <span style={{ fontSize: 14 }}>After <strong>every single wash</strong>, your washer will send <strong>before & after photos directly to your WhatsApp</strong>. You don't need to be present.</span>
            </div>

            <div style={{ background: "#fff", border: "1px solid #E3EEF7", borderRadius: 16, maxWidth: 640, marginBottom: 24, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, borderBottom: "1px solid #E3EEF7" }}>Order Summary</div>
              {[
                ["Vehicle", `${carModel} ${custReg ? "· " + custReg : ""}`],
                ["Category", catLabel],
                ["Area", `${pincode}${pincodeStatus === "ok" ? " ✅" : " (waitlist)"}`],
                ["Plan", planMode === "monthly"
                  ? `${cfg.monthlyPlans.find(p => p.id === selectedPlan)?.name} · Monthly · ${cfg.commitments.find(c => c.id === commitment)?.term}`
                  : `${cfg.packs.find(p => p.id === selectedPack)?.name} · Repeat Pack`],
                ["Add-ons", addons.length ? addons.map(id => `${cfg.addons.find(a => a.id === id)?.name}`).join(", ") : "None"],
                ["Washes/month", planMode === "monthly" ? "30" : String(cfg.packs.find(p => p.id === selectedPack)?.perLabel?.split("·")[0].trim() || "1")],
                ["Name", custName],
                ["WhatsApp", custMobile],
                ["Address", `${custAddress}${prefTime ? " · " + prefTime : ""}`],
                ["Parking", parking === "dedicated" ? "Dedicated parking" : "Open / Society parking"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #E3EEF7", fontSize: 14 }}>
                  <span style={{ color: "#4A5568" }}>{k}</span>
                  <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", background: "#F8FBFF" }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Amount to pay</span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "#1565C0" }}>{inr(total)}{planMode === "monthly" ? "/month" : ""}</span>
              </div>
              <div style={{ padding: "14px 20px", fontSize: 13, color: "#4A5568", background: "#F8FBFF", borderTop: "1px solid #E3EEF7" }}>
                🔒 <strong>Razorpay secure payment</strong> — Cards, UPI, Net Banking, Wallets. No cash at doorstep.
              </div>
            </div>

            <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 12, padding: "16px 18px", marginBottom: 24, maxWidth: 640 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1B5E20", marginBottom: 8 }}>📋 What happens after payment:</div>
              <div style={{ fontSize: 13, color: "#2E7D32", lineHeight: 2 }}>
                {cfg.postPaymentSteps.map((s, i) => <div key={i}>✓ {s}</div>)}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => goTo(5)} style={{ padding: "12px 24px", background: "#f0f4f8", color: "#4A5568", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back</button>
            </div>

            {/* ── T&C CONSENT SECTION ──────────────────────────────────────── */}
            <div style={{ maxWidth: 640, marginTop: 32, marginBottom: 8 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Terms & Policies</h3>
              <p style={{ fontSize: 13, color: "#4A5568", marginBottom: 20 }}>Please read and accept all three policies before proceeding to payment.</p>

              {/* T&C 1 — Terms of Service */}
              <div style={{ border: `2px solid ${consentTerms ? "#00C853" : "#E3EEF7"}`, borderRadius: 14, padding: "18px 20px", marginBottom: 12, background: consentTerms ? "#F0FDF4" : "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>📄 Terms of Service</div>
                    <div style={{ fontSize: 12, color: "#4A5568" }}>Service schedule, washer conduct, quality standards, service area</div>
                  </div>
                  <button onClick={() => setShowTnC("terms")}
                    style={{ padding: "5px 14px", background: "#E3F2FD", color: "#1565C0", border: "none", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginLeft: 12 }}>
                    Read →
                  </button>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: consentTerms ? "#15803D" : "#374151" }}>
                  <input type="checkbox" checked={consentTerms} onChange={e => setConsentTerms(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#00C853" }} />
                  I have read and agree to the Terms of Service
                </label>
              </div>

              {/* T&C 2 — Refund Policy */}
              <div style={{ border: `2px solid ${consentRefund ? "#00C853" : "#E3EEF7"}`, borderRadius: 14, padding: "18px 20px", marginBottom: 12, background: consentRefund ? "#F0FDF4" : "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>💰 Refund Policy</div>
                    <div style={{ fontSize: 12, color: "#4A5568" }}>Conditions for refund, pro-rata billing, dispute resolution</div>
                  </div>
                  <button onClick={() => setShowTnC("refund")}
                    style={{ padding: "5px 14px", background: "#E3F2FD", color: "#1565C0", border: "none", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginLeft: 12 }}>
                    Read →
                  </button>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: consentRefund ? "#15803D" : "#374151" }}>
                  <input type="checkbox" checked={consentRefund} onChange={e => setConsentRefund(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#00C853" }} />
                  I have read and agree to the Refund Policy
                </label>
              </div>

              {/* T&C 3 — Cancellation Policy */}
              <div style={{ border: `2px solid ${consentCancel ? "#00C853" : "#E3EEF7"}`, borderRadius: 14, padding: "18px 20px", marginBottom: 24, background: consentCancel ? "#F0FDF4" : "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>🚫 Cancellation Policy</div>
                    <div style={{ fontSize: 12, color: "#4A5568" }}>7-day notice, no lock-in, pause options, penalty-free exit</div>
                  </div>
                  <button onClick={() => setShowTnC("cancel")}
                    style={{ padding: "5px 14px", background: "#E3F2FD", color: "#1565C0", border: "none", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginLeft: 12 }}>
                    Read →
                  </button>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: consentCancel ? "#15803D" : "#374151" }}>
                  <input type="checkbox" checked={consentCancel} onChange={e => setConsentCancel(e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#00C853" }} />
                  I have read and agree to the Cancellation Policy
                </label>
              </div>

              {/* Consent summary */}
              {!consentOk && (
                <div style={{ background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#E65100" }}>
                  ⚠️ Please accept all three policies above to proceed to payment.
                </div>
              )}
              {consentOk && (
                <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#2E7D32", fontWeight: 600 }}>
                  ✅ All policies accepted. You're ready to pay.
                </div>
              )}

              {/* PAY BUTTON */}
              <button
                onClick={handlePayment}
                disabled={!consentOk || isProcessing}
                style={{
                  width: "100%", padding: "16px", borderRadius: 14, border: "none",
                  background: consentOk && !isProcessing ? "linear-gradient(135deg,#1565C0,#2196F3)" : "#BBDEFB",
                  color: "#fff", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18,
                  cursor: consentOk && !isProcessing ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: consentOk && !isProcessing ? "0 8px 24px rgba(33,150,243,0.35)" : "none",
                  transition: "all 0.2s",
                }}>
                {isProcessing ? (
                  <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span> Processing…</>
                ) : (
                  <>🔒 Pay {inr(parseFloat((total * 1.18).toFixed(2)))} Securely via Razorpay</>
                )}
              </button>
              <p style={{ fontSize: 11, color: "#90A4AE", textAlign: "center", marginTop: 10 }}>
                Amount includes GST (CGST 9% + SGST 9%). By paying you confirm all consents above.
              </p>
            </div>

            {/* ── POLICY MODALS ─────────────────────────────────────────────── */}
            {showTnC && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
                onClick={() => setShowTnC(null)}>
                <div style={{ background: "#fff", borderRadius: 18, maxWidth: 560, width: "100%", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, margin: 0 }}>
                      {showTnC === "terms" ? "📄 Terms of Service" : showTnC === "refund" ? "💰 Refund Policy" : "🚫 Cancellation Policy"}
                    </h3>
                    <button onClick={() => setShowTnC(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7280" }}>✕</button>
                  </div>
                  <div style={{ padding: "20px 24px", overflowY: "auto", fontSize: 13, lineHeight: 1.8, color: "#374151" }}>
                    {showTnC === "terms" && <>
                      <p style={{fontSize:12,color:"#6B7280",marginBottom:12}}>Effective Date: 1st June 2025 · 24/9 Carwashing Pvt. Ltd.</p>
                      <p><strong>1. Introduction</strong><br />These Terms constitute a legally binding agreement between you ("Customer") and 24/9 Carwashing Pvt. Ltd. for professional car wash services. By subscribing you confirm you have read, understood, and agree to be bound by these Terms.</p>
                      <p><strong>2. Registered Vehicle Policy</strong><br />The vehicle registration number provided at subscription is the sole vehicle entitled to receive services. No substitution or temporary swap is permissible for any reason, including breakdown or absence. A vehicle change is treated as a new subscription with a 20% vehicle-change fee on the original contract value — no refund is due on the original subscription.</p>
                      <p><strong>3. Service Continuity — No Pause Policy</strong><br />Subscribed service terms run continuously from commencement and <strong>cannot be paused, suspended, or placed on hold</strong> for any reason. Customer travel, vehicle repair, public holidays, or personal choice not to use the service do <em>not</em> entitle any pause or extension. The term lapses regardless of days not availed.</p>
                      <p><strong>4. Scope of Services</strong><br />Services are provided at operational locations in Surat as per the enrolled plan. Availability is subject to operational capacity. The Company may reschedule due to weather, force majeure, or circumstances beyond reasonable control.</p>
                      <p><strong>5. Payments & Fees</strong><br />All fees are payable in advance. GST and statutory levies are charged over and above quoted fees. Payment gateway charges on refunds shall not exceed 2% of the transaction value. Pricing revisions require 7 calendar days' notice and apply only to new subscriptions — existing active subscriptions are not affected.</p>
                      <p><strong>6. Customer Obligations</strong><br />Ensure the Registered Vehicle is available on each service day with at least 2 ft clearance on all 4 sides. Disclose any pre-existing vehicle damage before service commencement. Comply with reasonable instructions of Company staff.</p>
                      <p><strong>7. Limitation of Liability</strong><br />The Company's total liability shall not exceed fees paid in the 30 days preceding the claim. The Company is not liable for consequential, indirect, or punitive damages. Pre-existing damages discovered during service are not the Company's liability.</p>
                      <p><strong>8. Governing Law</strong><br />These Terms are governed by the laws of India. Disputes are subject to exclusive jurisdiction of courts in Surat, Gujarat. Disputes must be raised in writing within 7 calendar days of the triggering event.</p>
                    </>}
                    {showTnC === "refund" && <>
                      <p style={{fontSize:12,color:"#6B7280",marginBottom:12}}>Effective Date: 1st June 2025 · 24/9 Carwashing Pvt. Ltd.</p>
                      <p><strong>1. Refund Eligibility</strong><br />Refunds are considered only in these circumstances: (a) Pre-commencement cancellation more than 5 days before service starts — full refund less gateway charges (max 2%); (b) Cancellation within the first 70% of the Service Term — prorata + 10% cancellation fee deducted; (c) Service failure solely attributable to the Company for 3+ consecutive scheduled days; (d) Duplicate or erroneous payments verified by finance.</p>
                      <p><strong>2. No Refund Situations</strong><br />No refund is applicable for: cancellation after 70%+ of Service Term has elapsed (full fee forfeited); customer non-availability or choice not to use service; vehicle unavailability; vehicle change requests; service quality dissatisfaction where Company has made reasonable remedy efforts; requests after the Service Term expires.</p>
                      <p><strong>3. Refund Computation</strong></p>
                      <div style={{background:"#F9FAFB",borderRadius:8,padding:"10px 12px",marginBottom:8,fontSize:12}}>
                        <div>Total Fee Paid</div>
                        <div>− Prorata Used (daily rate × days elapsed)</div>
                        <div>− Cancellation Fee (10% of total contract value)</div>
                        <div>− Payment Gateway Charges (actual, max 2%)</div>
                        <div style={{borderTop:"1px solid #E5E7EB",paddingTop:6,marginTop:6,fontWeight:700}}>= Net Refund Amount</div>
                        <div style={{marginTop:8,color:"#1565C0"}}>Example: ₹3,000 package / 30 days. Cancel at Day 12. Prorata = ₹1,200. Fee = ₹300. Refund = ₹1,500.</div>
                      </div>
                      <p><strong>4. Processing Timelines</strong><br />UPI/Net Banking: 5–7 business days. Debit Card: 7–10 days. Credit Card: 7–14 days. Cash: Cheque/NEFT within 10 business days. Timelines are indicative; delays due to banking intermediaries are not the Company's liability.</p>
                      <p><strong>5. Refund Process</strong><br />Submit written cancellation request → Company acknowledges within 2 business days → refund quantum computed and communicated → you confirm payment details → refund processed within timelines above → confirmation sent to registered contact.</p>
                      <p><strong>6. GST on Refunds</strong><br />The GST component of a refund is processed per applicable GST law. A credit note is issued as required under GST Act 2017. Consult your tax advisor for treatment in your filings.</p>
                      <p><strong>7. Contact</strong><br />Email: support@249carwashing.com · Phone: 080 4879 4545 (Mon–Sat, 10am–7pm)</p>
                    </>}
                    {showTnC === "cancel" && <>
                      <p style={{fontSize:12,color:"#6B7280",marginBottom:12}}>Effective Date: 1st June 2025 · 24/9 Carwashing Pvt. Ltd.</p>
                      <p><strong>1. How to Request Cancellation</strong><br />Submit a written request via email to the registered Company support address, or in person at a service location. The request must include your name, subscription/invoice number, registered vehicle number, and reason. <strong>Verbal or WhatsApp requests to field staff are not valid</strong> and will not be processed until a formal written request is received. The effective cancellation date is when the Company acknowledges receipt (within 2 business days).</p>
                      <div style={{background:"#FFF3E0",border:"1px solid #FFB74D",borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:12}}>
                        <strong>📋 Cancellation Fee Schedule</strong>
                        <table style={{width:"100%",marginTop:8,borderCollapse:"collapse",fontSize:11}}>
                          <thead><tr style={{background:"#FFF"}}><th style={{textAlign:"left",padding:"4px 6px",borderBottom:"1px solid #FDE68A"}}>Window</th><th style={{padding:"4px 6px",borderBottom:"1px solid #FDE68A"}}>Fee</th><th style={{padding:"4px 6px",borderBottom:"1px solid #FDE68A"}}>Refund</th></tr></thead>
                          <tbody>
                            <tr><td style={{padding:"4px 6px",borderBottom:"1px solid #FEF3C7"}}>Before service starts (&gt;5 days)</td><td style={{padding:"4px 6px",borderBottom:"1px solid #FEF3C7",textAlign:"center"}}>Nil</td><td style={{padding:"4px 6px",borderBottom:"1px solid #FEF3C7"}}>Full refund less gateway charges</td></tr>
                            <tr><td style={{padding:"4px 6px",borderBottom:"1px solid #FEF3C7"}}>Day 1 – 70% of term elapsed</td><td style={{padding:"4px 6px",borderBottom:"1px solid #FEF3C7",textAlign:"center"}}>Prorata used + 10% of contract</td><td style={{padding:"4px 6px",borderBottom:"1px solid #FEF3C7"}}>Balance after deductions</td></tr>
                            <tr style={{background:"#FEF2F2"}}><td style={{padding:"4px 6px",fontWeight:700}}>After 70% of term</td><td style={{padding:"4px 6px",textAlign:"center",fontWeight:700,color:"#DC2626"}}>100% forfeited</td><td style={{padding:"4px 6px",color:"#DC2626",fontWeight:700}}>No refund</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <p><strong>2. No Pause Rule</strong><br />Cancellation due to customer travel, vehicle unavailability, or choice not to use service does not qualify for any fee waiver or term extension.</p>
                      <p><strong>3. Non-Transferability</strong><br />Subscriptions are non-transferable. Remaining service days cannot be assigned to another person or vehicle. Vehicle change requests are not cancellations and are governed by Section 4 of the Terms & Conditions.</p>
                      <p><strong>4. Disputes</strong><br />Raise disputes in writing within 7 days of receiving the cancellation settlement. The Company's decision after review is final and binding.</p>
                    </>}
                  </div>
                  <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 10 }}>
                    <button onClick={() => {
                      if (showTnC === "terms") setConsentTerms(true);
                      if (showTnC === "refund") setConsentRefund(true);
                      if (showTnC === "cancel") setConsentCancel(true);
                      setShowTnC(null);
                    }} style={{ flex: 1, padding: "12px", background: "#00C853", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      ✓ I Accept & Close
                    </button>
                    <button onClick={() => setShowTnC(null)} style={{ padding: "12px 20px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* TRUST STRIP */}
      <div style={{ background: "#1565C0", padding: "14px 32px", display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
        {cfg.trustStrip.map((t, i) => (
          <span key={i} style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 500 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
