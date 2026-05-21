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
    swift:"hatchback", baleno:"hatchback", i20:"hatchback", tiago:"hatchback",
    dzire:"hatchback", alto:"hatchback", wagon:"hatchback", figo:"hatchback",
    polo:"hatchback", jazz:"hatchback", amaze:"hatchback", tigor:"hatchback",
    creta:"suv", innova:"suv", ertiga:"suv", thar:"suv", xuv300:"suv",
    seltos:"suv", venue:"suv", nexon:"suv", ecosport:"suv", city:"suv",
    ciaz:"suv", verna:"suv", brezza:"suv", kushaq:"suv", slavia:"suv",
    fortuner:"luxury", xuv700:"luxury", meridian:"luxury", scorpio:"luxury",
    endeavour:"luxury", harrier:"luxury", safari:"luxury", gloster:"luxury",
    hilux:"luxury", crysta:"luxury",
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
  const [custReg, setCustReg] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [prefTime, setPrefTime] = useState("");
  const [parking, setParking] = useState<"dedicated" | "random">("dedicated");

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

  const goTo = (n: number) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const STEPS = [
    { n: 1, label: "Your Car" },
    { n: 2, label: "Your Area" },
    { n: 3, label: "Plan" },
    { n: 4, label: "Add-ons" },
    { n: 5, label: "Details" },
    { n: 6, label: "Review" },
  ];

  // ── SUCCESS ─────────────────────────────────────────────────────────────
  if (step === 7) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FBFF", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <div style={{ maxWidth: 560, width: "100%", background: "#fff", borderRadius: 24, padding: "48px 40px", textAlign: "center", boxShadow: "0 12px 48px rgba(33,150,243,0.15)" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 12 }}>You're all set!</h2>
          <p style={{ color: "#4A5568", marginBottom: 8 }}>Your payment is confirmed. Welcome to {cfg.brand.name}.</p>
          <p style={{ fontSize: 13, color: "#90A4AE", marginBottom: 32 }}>Receipt sent to your WhatsApp.</p>
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
            {cfg.postPaymentSteps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2196F3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{i+1}</div>
                <div style={{ fontSize: 14, color: "#0D1B2A", paddingTop: 4 }}>{s}</div>
              </div>
            ))}
          </div>
          <a href={`https://wa.me/${cfg.brand.whatsappNumber}`} target="_blank" rel="noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "#fff", padding: "14px 24px", borderRadius: 50, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
            💬 Chat with us on WhatsApp
          </a>
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

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => goTo(4)} style={{ padding: "12px 24px", background: "#f0f4f8", color: "#4A5568", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>← Back</button>
              <button onClick={() => goTo(6)} disabled={!step5Ok}
                style={{ padding: "13px 32px", background: step5Ok ? "#2196F3" : "#BBDEFB", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: step5Ok ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
                Review Order →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: REVIEW ───────────────────────────────────────────────── */}
        {step === 6 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Review your order</h2>
            <p style={{ fontSize: 15, color: "#4A5568", marginBottom: 24 }}>Check everything below, then proceed to pay securely via Razorpay.</p>

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
              <button onClick={() => goTo(7)}
                style={{ padding: "15px 40px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                🔒 Pay Securely via Razorpay →
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#90A4AE", marginTop: 12 }}>By proceeding you agree to our Terms & Conditions and Cancellation Policy.</p>
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
