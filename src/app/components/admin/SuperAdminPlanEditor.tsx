/**
 * SuperAdminPlanEditor.tsx
 * Full editor for the customer-facing plan page.
 * Accessible only to Super Admin.
 *
 * Route: /admin/plan-page-editor
 *
 * Editable sections:
 *  1. Brand & Contact
 *  2. Hero (badge, headline, subheadline, trust items)
 *  3. Serviceable Pincodes
 *  4. Vehicle Categories
 *  5. Monthly Plan Prices (per category)
 *  6. Pack Prices
 *  7. Commitment Options
 *  8. Add-ons
 *  9. Time Slots
 * 10. Post-payment Steps
 * 11. Trust Strip Items
 *
 * Saves to localStorage key "cleancar_plan_page_config"
 * and dispatches "planConfigUpdated" event so CustomerPlanPage hot-reloads.
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { DEFAULT_CONFIG, type PlanPageConfig, type MonthlyPlanConfig, type AddonConfig, type PackConfig } from "../subscription/CustomerPlanPage";
import { BackButton } from "../ui/back-button";

const STORAGE_KEY = "cleancar_plan_page_config";

function loadConfig(): PlanPageConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(cfg: PlanPageConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event("planConfigUpdated"));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

// ─── Small reusable field components ─────────────────────────────────────────
const Field = ({ label, value, onChange, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string;
}) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
    {hint && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>{hint}</p>}
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", cursor: "pointer", background: "#F9FAFB", borderBottom: open ? "1px solid #E5E7EB" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 15, color: "#111827" }}>
          <span>{icon}</span>{title}
        </div>
        <span style={{ color: "#6B7280", fontSize: 18 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && <div style={{ padding: "20px" }}>{children}</div>}
    </div>
  );
};

// ─── AddModelRow: small inline form to add a new car model ───────────────────
function AddModelRow({ categories, onAdd }: {
  categories: { id: string; label: string; icon: string }[];
  onAdd: (keyword: string, categoryId: string) => void;
}) {
  const [kw, setKw] = useState("");
  const [cat, setCat] = useState(categories[0]?.id || "hatchback");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const clean = kw.trim().toLowerCase().replace(/\s+/g, "");
    if (!clean) { setError("Enter a keyword"); return; }
    if (clean.length < 2) { setError("Keyword must be at least 2 characters"); return; }
    onAdd(clean, cat);
    setKw("");
    setError("");
    toast.success(`Added "${clean}" → ${categories.find(c => c.id === cat)?.label}`);
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px auto", gap: 8, alignItems: "center" }}>
        <div>
          <input
            value={kw}
            onChange={e => { setKw(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="e.g. punch, taisor, curvv"
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${error ? "#FCA5A5" : "#E5E7EB"}`, borderRadius: 8, fontSize: 14, fontFamily: "monospace", background: "#fff" }}
          />
          {error && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 3 }}>{error}</p>}
        </div>
        <select value={cat} onChange={e => setCat(e.target.value)}
          style={{ padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, background: "#fff", fontWeight: 600 }}>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
        <button onClick={handleAdd}
          style={{ padding: "9px 20px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
          + Add
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function SuperAdminPlanEditor() {
  const { currentRole } = useRole();
  const [cfg, setCfg] = useState<PlanPageConfig>(loadConfig);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [isDirty, setIsDirty] = useState(false);

  // Guard: Super Admin only
  if (currentRole !== "Super Admin") {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <h2 style={{ fontFamily: "inherit", marginBottom: 8 }}>Super Admin Only</h2>
        <p style={{ color: "#6B7280" }}>This editor is restricted to Super Admins.</p>
      </div>
    );
  }

  const update = (updater: (prev: PlanPageConfig) => PlanPageConfig) => {
    setCfg(updater);
    setIsDirty(true);
  };

  const handleSave = () => {
    saveConfig(cfg);
    setIsDirty(false);
    toast.success("Plan page configuration saved & published live!");
  };

  const handleReset = () => {
    if (!confirm("Reset all settings to factory defaults? This cannot be undone.")) return;
    setCfg(DEFAULT_CONFIG);
    saveConfig(DEFAULT_CONFIG);
    setIsDirty(false);
    toast.success("Configuration reset to defaults.");
  };

  const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

  const CATEGORIES = cfg.vehicleCategories;

  // ── Helpers for list editing ──────────────────────────────────────────────
  const updateStringList = (list: string[], idx: number, val: string): string[] =>
    list.map((item, i) => i === idx ? val : item);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif, system-ui", background: "#F3F4F6", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: "#fff", borderBottom: "1.5px solid #E5E7EB", padding: "14px 24px", position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BackButton />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>Plan Page Editor</h1>
            <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>Super Admin · Customer-facing plan purchase page</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isDirty && <span style={{ fontSize: 12, color: "#F59E0B", background: "#FEF3C7", padding: "4px 10px", borderRadius: 20, fontWeight: 600 }}>● Unsaved changes</span>}
          <a href="/buy" target="_blank" rel="noreferrer"
            style={{ padding: "8px 16px", background: "#F3F4F6", color: "#374151", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "1.5px solid #E5E7EB" }}>
            👁 Preview Page
          </a>
          <button onClick={handleReset}
            style={{ padding: "8px 14px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Reset
          </button>
          <button onClick={handleSave}
            style={{ padding: "9px 22px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            💾 Save & Publish
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 24px 60px" }}>

        {/* ── §1 BRAND ─────────────────────────────────────────────────── */}
        <Section title="Brand & Contact" icon="🏢">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <Field label="Brand Name" value={cfg.brand.name} onChange={v => update(c => ({ ...c, brand: { ...c.brand, name: v } }))} />
            <Field label="Phone (displayed in nav)" value={cfg.brand.phone} onChange={v => update(c => ({ ...c, brand: { ...c.brand, phone: v } }))} />
            <Field label="WhatsApp Number (digits only, no +)" value={cfg.brand.whatsappNumber} onChange={v => update(c => ({ ...c, brand: { ...c.brand, whatsappNumber: v } }))} hint="e.g. 918238705601" />
            <Field label="Tagline (meta)" value={cfg.brand.tagline} onChange={v => update(c => ({ ...c, brand: { ...c.brand, tagline: v } }))} />
          </div>
        </Section>

        {/* ── §2 HERO ─────────────────────────────────────────────────── */}
        <Section title="Hero Section" icon="🎯">
          <Field label="Badge Text (top pill)" value={cfg.hero.badge} onChange={v => update(c => ({ ...c, hero: { ...c.hero, badge: v } }))} hint="e.g. 🚗 Surat's #1 Daily Car Wash Service" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <Field label="Headline (plain part)" value={cfg.hero.headline} onChange={v => update(c => ({ ...c, hero: { ...c.hero, headline: v } }))} hint="e.g. Your car, clean" />
            <Field label="Headline Accent (yellow highlight)" value={cfg.hero.headlineAccent} onChange={v => update(c => ({ ...c, hero: { ...c.hero, headlineAccent: v } }))} hint="e.g. every single day." />
          </div>
          <Field label="Subheadline" value={cfg.hero.subheadline} onChange={v => update(c => ({ ...c, hero: { ...c.hero, subheadline: v } }))} />
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#374151" }}>Trust Items (shown under hero headline)</label>
            {cfg.trustItems.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input value={item} onChange={e => update(c => ({ ...c, trustItems: updateStringList(c.trustItems, i, e.target.value) }))}
                  style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
                <button onClick={() => update(c => ({ ...c, trustItems: c.trustItems.filter((_, j) => j !== i) }))}
                  style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>✕</button>
              </div>
            ))}
            <button onClick={() => update(c => ({ ...c, trustItems: [...c.trustItems, "🚀 New trust item"] }))}
              style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Item</button>
          </div>
        </Section>

        {/* ── §3 PINCODES ─────────────────────────────────────────────── */}
        <Section title="Serviceable Pincodes" icon="📍">
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>These appear as clickable chips and determine if a customer sees "✅ Serviceable" or "⚠️ Waitlist".</p>
          {cfg.serviceablePincodes.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={p.code} maxLength={6} onChange={e => update(c => ({ ...c, serviceablePincodes: c.serviceablePincodes.map((pp, j) => j === i ? { ...pp, code: e.target.value.replace(/\D/g,"").slice(0,6) } : pp) }))}
                style={{ width: 100, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "inherit", letterSpacing: 2, fontWeight: 700 }} placeholder="395007" />
              <input value={p.label} onChange={e => update(c => ({ ...c, serviceablePincodes: c.serviceablePincodes.map((pp, j) => j === i ? { ...pp, label: e.target.value } : pp) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }} placeholder="Vesu / Pal" />
              <button onClick={() => update(c => ({ ...c, serviceablePincodes: c.serviceablePincodes.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, serviceablePincodes: [...c.serviceablePincodes, { code: "", label: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Pincode</button>
        </Section>

        {/* ── §4 MONTHLY PLAN PRICES ──────────────────────────────────── */}
        <Section title="Monthly Plan Prices" icon="💰">
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>Set prices per plan per vehicle category. Leave at 0 if plan is not available for that category.</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1.5px solid #E5E7EB" }}>Plan</th>
                  {CATEGORIES.map(cat => (
                    <th key={cat.id} style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600, color: "#374151", borderBottom: "1.5px solid #E5E7EB" }}>
                      {cat.icon} {cat.label}
                    </th>
                  ))}
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#374151", borderBottom: "1.5px solid #E5E7EB" }}>Popular?</th>
                </tr>
              </thead>
              <tbody>
                {cfg.monthlyPlans.map((plan, pi) => (
                  <tr key={plan.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", align: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{plan.icon}</span>
                        <div>
                          <div style={{ fontWeight: 700 }}>{plan.name}</div>
                          <div style={{ fontSize: 12, color: "#6B7280" }}>{plan.tagline}</div>
                        </div>
                      </div>
                    </td>
                    {CATEGORIES.map(cat => (
                      <td key={cat.id} style={{ padding: "10px 14px", textAlign: "center" }}>
                        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                          <span style={{ position: "absolute", left: 10, color: "#6B7280", fontWeight: 600, fontSize: 13 }}>₹</span>
                          <input type="number" value={plan.prices[cat.id] ?? 0}
                            onChange={e => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, prices: { ...p.prices, [cat.id]: parseInt(e.target.value) || 0 } }) }))}
                            style={{ width: 90, padding: "8px 8px 8px 22px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, textAlign: "right", fontWeight: 700 }} />
                        </div>
                      </td>
                    ))}
                    <td style={{ padding: "10px 14px" }}>
                      <input type="checkbox" checked={!!plan.popular}
                        onChange={e => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, popular: e.target.checked }) }))}
                        style={{ width: 18, height: 18, cursor: "pointer" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── §5 PLAN FEATURES ─────────────────────────────────────────── */}
        <Section title="Monthly Plan Features & Names" icon="📋">
          {cfg.monthlyPlans.map((plan, pi) => (
            <div key={plan.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: pi < cfg.monthlyPlans.length - 1 ? "1px solid #E5E7EB" : "none" }}>
              <div style={{ display: "flex", align: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{plan.icon}</span>
                <strong style={{ fontSize: 15 }}>{plan.name}</strong>
              </div>
              <Field label="Plan Name" value={plan.name} onChange={v => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, name: v }) }))} />
              <Field label="Tagline" value={plan.tagline} onChange={v => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, tagline: v }) }))} />
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#374151" }}>Features</label>
              {plan.features.map((f, fi) => (
                <div key={fi} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <input type="checkbox" checked={f.included}
                    onChange={e => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, features: p.features.map((ff, ffi) => ffi !== fi ? ff : { ...ff, included: e.target.checked }) }) }))}
                    style={{ width: 16, height: 16, cursor: "pointer", flexShrink: 0 }} />
                  <input value={f.text}
                    onChange={e => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, features: p.features.map((ff, ffi) => ffi !== fi ? ff : { ...ff, text: e.target.value }) }) }))}
                    style={{ flex: 1, padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 7, fontSize: 13, fontFamily: "inherit" }} />
                  <button onClick={() => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, features: p.features.filter((_, ffi) => ffi !== fi) }) }))}
                    style={{ padding: "6px 10px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 7, cursor: "pointer", fontSize: 13 }}>✕</button>
                </div>
              ))}
              <button onClick={() => update(c => ({ ...c, monthlyPlans: c.monthlyPlans.map((p, i) => i !== pi ? p : { ...p, features: [...p.features, { text: "New feature", included: true }] }) }))}
                style={{ padding: "6px 12px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600, marginTop: 6 }}>+ Feature</button>
            </div>
          ))}
        </Section>

        {/* ── §6 PACKS ─────────────────────────────────────────────────── */}
        <Section title="Repeat / One-Time Packs" icon="🎟️">
          {cfg.packs.map((pack, i) => (
            <div key={pack.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr 1fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <input value={pack.name} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, name: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Pack name" />
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: 10, color: "#6B7280", fontSize: 13 }}>₹</span>
                <input type="number" value={pack.price} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, price: parseInt(e.target.value) || 0 }) }))}
                  style={{ width: "100%", padding: "8px 8px 8px 22px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontWeight: 700 }} />
              </div>
              <input value={pack.perLabel} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, perLabel: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="e.g. 2× per month · ₹186/wash" />
              <input value={pack.discount} onChange={e => update(c => ({ ...c, packs: c.packs.map((p, j) => j !== i ? p : { ...p, discount: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="7% off" />
              <button onClick={() => update(c => ({ ...c, packs: c.packs.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, packs: [...c.packs, { id: `pack-${Date.now()}`, name: "New Pack", icon: "📦", price: 0, perLabel: "", discount: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Pack</button>
        </Section>

        {/* ── §7 COMMITMENTS ───────────────────────────────────────────── */}
        <Section title="Commitment / Loyalty Options" icon="🤝">
          {cfg.commitments.map((c, i) => (
            <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 3fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <input value={c.term} onChange={e => update(cfg => ({ ...cfg, commitments: cfg.commitments.map((cc, j) => j !== i ? cc : { ...cc, term: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="e.g. 3 Months" />
              <input value={c.discountLabel} onChange={e => update(cfg => ({ ...cfg, commitments: cfg.commitments.map((cc, j) => j !== i ? cc : { ...cc, discountLabel: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="5% off" />
              <input value={c.perk} onChange={e => update(cfg => ({ ...cfg, commitments: cfg.commitments.map((cc, j) => j !== i ? cc : { ...cc, perk: e.target.value }) }))}
                style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Perk description" />
              <button onClick={() => update(cfg => ({ ...cfg, commitments: cfg.commitments.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, commitments: [...c.commitments, { id: `commit-${Date.now()}`, term: "New Option", discountLabel: "0%", perk: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Option</button>
        </Section>

        {/* ── §8 ADD-ONS ───────────────────────────────────────────────── */}
        <Section title="Add-ons" icon="➕">
          {cfg.addons.map((addon, i) => (
            <div key={addon.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, marginBottom: 10, alignItems: "center" }}>
                <input value={addon.name} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, name: e.target.value }) }))}
                  style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Add-on name" />
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span style={{ position: "absolute", left: 10, color: "#6B7280", fontSize: 13 }}>₹</span>
                  <input type="number" value={addon.price} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, price: parseInt(e.target.value) || 0 }) }))}
                    style={{ width: "100%", padding: "8px 8px 8px 22px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 14, fontWeight: 700 }} />
                </div>
                <input value={addon.unit} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, unit: e.target.value }) }))}
                  style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="per visit" />
                <button onClick={() => update(c => ({ ...c, addons: c.addons.filter((_, j) => j !== i) }))}
                  style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
              </div>
              <input value={addon.description} onChange={e => update(c => ({ ...c, addons: c.addons.map((a, j) => j !== i ? a : { ...a, description: e.target.value }) }))}
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} placeholder="Short description" />
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, addons: [...c.addons, { id: `addon-${Date.now()}`, name: "New Add-on", price: 0, unit: "per visit", description: "" }] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Add-on</button>
        </Section>

        {/* ── §9 TIME SLOTS ────────────────────────────────────────────── */}
        <Section title="Preferred Time Slots" icon="⏰">
          {cfg.timeSlots.map((slot, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={slot} onChange={e => update(c => ({ ...c, timeSlots: updateStringList(c.timeSlots, i, e.target.value) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
              <button onClick={() => update(c => ({ ...c, timeSlots: c.timeSlots.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, timeSlots: [...c.timeSlots, "New slot"] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Slot</button>
        </Section>

        {/* ── §10 POST-PAYMENT STEPS ───────────────────────────────────── */}
        <Section title="Post-Payment Steps (shown on success page)" icon="✅">
          {cfg.postPaymentSteps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#2196F3", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
              <input value={step} onChange={e => update(c => ({ ...c, postPaymentSteps: updateStringList(c.postPaymentSteps, i, e.target.value) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
              <button onClick={() => update(c => ({ ...c, postPaymentSteps: c.postPaymentSteps.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, postPaymentSteps: [...c.postPaymentSteps, "New step"] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Step</button>
        </Section>

        {/* ── §11 TRUST STRIP ─────────────────────────────────────────── */}
        <Section title="Trust Strip (bottom bar)" icon="🔵">
          {cfg.trustStrip.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={item} onChange={e => update(c => ({ ...c, trustStrip: updateStringList(c.trustStrip, i, e.target.value) }))}
                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, fontFamily: "inherit" }} />
              <button onClick={() => update(c => ({ ...c, trustStrip: c.trustStrip.filter((_, j) => j !== i) }))}
                style={{ padding: "8px 12px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 8, cursor: "pointer" }}>✕</button>
            </div>
          ))}
          <button onClick={() => update(c => ({ ...c, trustStrip: [...c.trustStrip, "🌟 New trust item"] }))}
            style={{ padding: "7px 14px", background: "#E0F2FE", color: "#0369A1", border: "1.5px solid #BAE6FD", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Item</button>
        </Section>

        {/* ── §12 CAR MODEL MAP ────────────────────────────────────────── */}
        <Section title="Car Model → Category Mapping" icon="🚗">
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>
            Each row is a <strong>keyword</strong> (matched against what the customer types) mapped to a <strong>vehicle category</strong>.
            Matching is case-insensitive and partial — e.g. keyword <code style={{ background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>swift</code> will match "Maruti Swift", "Swift Dzire", etc.
          </p>
          <p style={{ fontSize: 12, color: "#F59E0B", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", marginBottom: 16 }}>
            ⚠️ Keep keywords <strong>short and unique</strong>. Avoid generic words like "car" or "new" — they'll match everything.
          </p>

          {/* Search/filter */}
          <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              placeholder="Filter models..."
              id="modelSearch"
              onChange={e => {
                const q = e.target.value.toLowerCase();
                document.querySelectorAll<HTMLElement>(".model-row").forEach(row => {
                  row.style.display = !q || row.dataset.kw?.includes(q) || row.dataset.cat?.includes(q) ? "" : "none";
                });
              }}
              style={{ padding: "8px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, width: 200 }}
            />
            <span style={{ fontSize: 12, color: "#6B7280" }}>{Object.keys(cfg.carModelMap).length} models</span>
            {/* Per-category counts */}
            {cfg.vehicleCategories.map(cat => (
              <span key={cat.id} style={{ fontSize: 12, background: cat.id === "hatchback" ? "#DBEAFE" : cat.id === "suv" ? "#DCFCE7" : "#FEF9C3", color: cat.id === "hatchback" ? "#1D4ED8" : cat.id === "suv" ? "#15803D" : "#A16207", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>
                {cat.icon} {cat.label.split(" /")[0]}: {Object.values(cfg.carModelMap).filter(v => v === cat.id).length}
              </span>
            ))}
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px auto", gap: 8, marginBottom: 6, padding: "0 4px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>Keyword (what customer types)</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>Category</span>
            <span />
          </div>

          {/* Rows */}
          <div style={{ maxHeight: 420, overflowY: "auto", border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "8px" }}>
            {Object.entries(cfg.carModelMap).map(([kw, cat]) => (
              <div key={kw} className="model-row" data-kw={kw} data-cat={cat}
                style={{ display: "grid", gridTemplateColumns: "1fr 180px auto", gap: 8, marginBottom: 6, alignItems: "center" }}>
                <input
                  value={kw}
                  onChange={e => {
                    const newKw = e.target.value.toLowerCase().replace(/\s+/g, "");
                    if (!newKw || newKw === kw) return;
                    update(c => {
                      const next = { ...c.carModelMap };
                      delete next[kw];
                      next[newKw] = cat;
                      return { ...c, carModelMap: next };
                    });
                  }}
                  style={{ padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 7, fontSize: 13, fontFamily: "monospace", background: "#F9FAFB" }}
                />
                <select
                  value={cat}
                  onChange={e => update(c => ({ ...c, carModelMap: { ...c.carModelMap, [kw]: e.target.value } }))}
                  style={{ padding: "7px 10px", border: "1.5px solid #E5E7EB", borderRadius: 7, fontSize: 13, background: cat === "hatchback" ? "#EFF6FF" : cat === "suv" ? "#F0FDF4" : "#FEFCE8", fontWeight: 600 }}
                >
                  {cfg.vehicleCategories.map(vc => (
                    <option key={vc.id} value={vc.id}>{vc.icon} {vc.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => update(c => { const next = { ...c.carModelMap }; delete next[kw]; return { ...c, carModelMap: next }; })}
                  style={{ padding: "7px 10px", background: "#FEF2F2", color: "#DC2626", border: "1.5px solid #FECACA", borderRadius: 7, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add new model row */}
          <div style={{ marginTop: 14, padding: "14px 16px", background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#166534", marginBottom: 10 }}>➕ Add New Car Model</p>
            <AddModelRow
              categories={cfg.vehicleCategories}
              onAdd={(kw, cat) => update(c => ({ ...c, carModelMap: { ...c.carModelMap, [kw]: cat } }))}
            />
          </div>

          {/* Bulk add hint */}
          <div style={{ marginTop: 12, fontSize: 12, color: "#6B7280" }}>
            💡 <strong>Tip:</strong> Add the main model name only — e.g. <code style={{ background: "#F3F4F6", padding: "1px 4px", borderRadius: 3 }}>creta</code> not "Hyundai Creta 2024 Facelift". The match is partial so it covers all variants.
          </div>
        </Section>

        {/* SAVE BAR */}
        <div style={{ position: "sticky", bottom: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
          {isDirty && (
            <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "14px 24px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>You have unsaved changes</span>
              <button onClick={handleSave}
                style={{ padding: "10px 28px", background: "#2196F3", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                💾 Save & Publish Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
