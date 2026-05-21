/**
 * salesHeadService.ts
 *
 * Service layer for the Sales Head (SH) module.
 * Reads from DataService / localStorage — no backend required.
 *
 * Incentive rules (from Sales Head Module v1.1):
 *   Coaching bonus: ALL 3 TCEs individually ≥25 → ₹1,500 | ≥75 → ₹7,500 | ≥100 → ₹12,500
 *   Quality bonuses: SLA ≥90% → ₹2,000 | Zero churn → ₹1,500 | Plan mix ≥60% → ₹1,000
 *   Personal conversion: slab × term (same as TCE, M1 cap ₹100 at slab4 × 12-month)
 */

import { DataService } from "./DataService";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TCEGateColor = "RED" | "AMBER" | "GREEN" | "GOLD";

export interface TCEStatus {
  id: string;
  name: string;
  closuresMTD: number;
  gateColor: TCEGateColor;  // RED <25 | AMBER 25–74 | GREEN 75–99 | GOLD ≥100
  slaCompliancePct: number;
  planMixPct: number;       // share of Shampoo+Wax or 3-month+ closures
  churnCount30d: number;
  lastCallTime: string;
  incentiveForecast: number;
  status: "ACTIVE" | "ON_CALL" | "OFFLINE";
}

export interface SHLead {
  id: string;
  customerName: string;
  phone: string;
  vehicleType: "2W" | "4W";
  vehicleCategory: string;
  source: "Digital-Inbound" | "SM-Alliance-Supervisor" | "SM-Alliance-QR" |
          "SM-Alliance-WhatsApp" | "Referral" | "SM-Direct";
  status: "New" | "Assigned" | "Contacted" | "Demo Done" |
          "Negotiation" | "Closed Won" | "Closed Lost";
  assignedTo: string | null; // TCE id or "SELF"
  ageMinutes: number;
  estimatedValue: number;
  smId?: string;
  smLocationName?: string;
}

export interface SHCoachingNote {
  id: string;
  tceId: string;
  tceName: string;
  date: string;
  issue: string;
  action: string;
  nextCheckDate: string;
}

export interface SHCommandMetrics {
  tceStatuses: TCEStatus[];
  unassignedLeads: number;
  overdueLeads: number;        // assigned but no contact >30 min
  slaTeamPct: number;
  planMixTeamPct: number;
  churnTeamCount: number;
  personalClosuresMTD: number;
  personalTarget: number;
  alertCount: number;
}

export interface SHIncentiveBreakdown {
  lowestTCECount: number;
  coachingBonusLevel: 0 | 1 | 2 | 3;
  coachingBonus: number;
  slaBonus: number;
  zeroChurnBonus: number;
  planMixBonus: number;
  personalIncentive: number;
  installmentCalendar: Array<{ label: string; amount: number; dueDate: string; status: "on_track" | "at_risk" }>;
  totalForecast: number;
}

export interface SHAlert {
  id: string;
  type: "UNASSIGNED_LEAD" | "SLA_BREACH" | "TCE_OFFLINE" | "COACHING_REQUIRED" |
        "CHURN_EVENT" | "MONTH_END" | "GPS_FAIL" | "LOCATION_AT_RISK";
  severity: "CRITICAL" | "WARNING" | "INFO";
  message: string;
  timestamp: string;
  actionRequired: boolean;
}

// ── Seed helpers ─────────────────────────────────────────────────────────────

const now = () => new Date().toISOString();
const minsAgo = (n: number) =>
  new Date(Date.now() - n * 60 * 1000).toISOString();

function seedTCEStatuses(): TCEStatus[] {
  return [
    {
      id: "TCE-001", name: "Priya Sharma", closuresMTD: 42,
      gateColor: "AMBER", slaCompliancePct: 91, planMixPct: 65,
      churnCount30d: 1, lastCallTime: minsAgo(8), incentiveForecast: 840, status: "ON_CALL",
    },
    {
      id: "TCE-002", name: "Rahul Mehta", closuresMTD: 29,
      gateColor: "AMBER", slaCompliancePct: 87, planMixPct: 52,
      churnCount30d: 0, lastCallTime: minsAgo(3), incentiveForecast: 580, status: "ACTIVE",
    },
    {
      id: "TCE-003", name: "Neha Patel", closuresMTD: 18,
      gateColor: "RED", slaCompliancePct: 78, planMixPct: 44,
      churnCount30d: 2, lastCallTime: minsAgo(25), incentiveForecast: 270, status: "ACTIVE",
    },
  ];
}

function seedLeads(): SHLead[] {
  return [
    {
      id: "SH-L-001", customerName: "Vikram Singh", phone: "+91 98765 43219",
      vehicleType: "4W", vehicleCategory: "SUV",
      source: "SM-Alliance-Supervisor", status: "New",
      assignedTo: null, ageMinutes: 35, estimatedValue: 1999,
      smId: "SM-001", smLocationName: "Adajan Society",
    },
    {
      id: "SH-L-002", customerName: "Kavita Rao", phone: "+91 98765 43220",
      vehicleType: "4W", vehicleCategory: "Hatchback",
      source: "Digital-Inbound", status: "New",
      assignedTo: null, ageMinutes: 12, estimatedValue: 899,
    },
    {
      id: "SH-L-003", customerName: "Suresh Iyer", phone: "+91 98765 43221",
      vehicleType: "2W", vehicleCategory: "Bike",
      source: "Referral", status: "Assigned",
      assignedTo: "TCE-001", ageMinutes: 45, estimatedValue: 399,
    },
    {
      id: "SH-L-004", customerName: "Meera Joshi", phone: "+91 98765 43222",
      vehicleType: "4W", vehicleCategory: "Sedan",
      source: "SM-Alliance-QR", status: "Contacted",
      assignedTo: "TCE-002", ageMinutes: 90, estimatedValue: 699,
      smId: "SM-002", smLocationName: "Corporate Park B",
    },
    {
      id: "SH-L-005", customerName: "Deepak Nair", phone: "+91 98765 43223",
      vehicleType: "4W", vehicleCategory: "Luxury",
      source: "SM-Direct", status: "Negotiation",
      assignedTo: "SELF", ageMinutes: 200, estimatedValue: 1299,
    },
  ];
}

function seedAlerts(): SHAlert[] {
  return [
    {
      id: "A-001", type: "UNASSIGNED_LEAD", severity: "CRITICAL",
      message: "Lead from Adajan Society unassigned — 35 minutes in queue",
      timestamp: minsAgo(5), actionRequired: true,
    },
    {
      id: "A-002", type: "COACHING_REQUIRED", severity: "WARNING",
      message: "Neha Patel tracking to close only 14 subs by month-end — coaching intervention needed",
      timestamp: minsAgo(15), actionRequired: true,
    },
    {
      id: "A-003", type: "SLA_BREACH", severity: "WARNING",
      message: "Rahul Mehta — SLA compliance at 87%, below 90% target",
      timestamp: minsAgo(60), actionRequired: false,
    },
    {
      id: "A-004", type: "GPS_FAIL", severity: "INFO",
      message: "GPS mismatch on BTL lead from Corporate Park B — Supervisor outside 500m",
      timestamp: minsAgo(120), actionRequired: false,
    },
  ];
}

function seedCoachingNotes(): SHCoachingNote[] {
  return [
    {
      id: "CN-001", tceId: "TCE-003", tceName: "Neha Patel",
      date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
      issue: "Plan mix below 50% — not pitching 3-month commitment",
      action: "Role-play on 3-month pitch. Daily check-in for 1 week.",
      nextCheckDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    },
    {
      id: "CN-002", tceId: "TCE-002", tceName: "Rahul Mehta",
      date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
      issue: "SLA compliance falling — missing callbacks within 30 min",
      action: "Reviewed call schedule. Set morning callback block 10–11 AM.",
      nextCheckDate: new Date(Date.now() + 0 * 86400000).toISOString().slice(0, 10),
    },
  ];
}

// ── Service class ─────────────────────────────────────────────────────────────

class SalesHeadService {
  private readonly STORE_KEYS = {
    TCE_STATUSES:    "sh_tce_statuses",
    LEADS:           "sh_leads",
    ALERTS:          "sh_alerts",
    COACHING_NOTES:  "sh_coaching_notes",
    PERSONAL_CLOSURES: "sh_personal_closures",
  } as const;

  private load<T>(key: string, seed: () => T[]): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T[];
    } catch {}
    const data = seed();
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  getCommandMetrics(): SHCommandMetrics {
    const tces = this.load<TCEStatus>(this.STORE_KEYS.TCE_STATUSES, seedTCEStatuses);
    const leads = this.load<SHLead>(this.STORE_KEYS.LEADS, seedLeads);
    const alerts = this.load<SHAlert>(this.STORE_KEYS.ALERTS, seedAlerts);
    const personal = parseInt(localStorage.getItem("sh_personal_closures_count") || "14");

    return {
      tceStatuses: tces,
      unassignedLeads: leads.filter(l => !l.assignedTo).length,
      overdueLeads: leads.filter(l => l.assignedTo && l.ageMinutes > 30 && l.status === "Assigned").length,
      slaTeamPct: Math.round(tces.reduce((s, t) => s + t.slaCompliancePct, 0) / tces.length),
      planMixTeamPct: Math.round(tces.reduce((s, t) => s + t.planMixPct, 0) / tces.length),
      churnTeamCount: tces.reduce((s, t) => s + t.churnCount30d, 0),
      personalClosuresMTD: personal,
      personalTarget: 10,
      alertCount: alerts.filter(a => a.actionRequired).length,
    };
  }

  getLeads(): SHLead[] {
    return this.load<SHLead>(this.STORE_KEYS.LEADS, seedLeads);
  }

  getAlerts(): SHAlert[] {
    return this.load<SHAlert>(this.STORE_KEYS.ALERTS, seedAlerts).slice(0, 10);
  }

  getCoachingNotes(): SHCoachingNote[] {
    return this.load<SHCoachingNote>(this.STORE_KEYS.COACHING_NOTES, seedCoachingNotes);
  }

  getIncentiveBreakdown(): SHIncentiveBreakdown {
    const tces = this.load<TCEStatus>(this.STORE_KEYS.TCE_STATUSES, seedTCEStatuses);
    const personal = parseInt(localStorage.getItem("sh_personal_closures_count") || "14");

    // Coaching bonus — lowest individual TCE count determines level
    const lowestTCE = Math.min(...tces.map(t => t.closuresMTD));
    let coachingBonus = 0;
    let level: 0 | 1 | 2 | 3 = 0;
    if (lowestTCE >= 100) { coachingBonus = 12500; level = 3; }
    else if (lowestTCE >= 75) { coachingBonus = 7500; level = 2; }
    else if (lowestTCE >= 25) { coachingBonus = 1500; level = 1; }

    // Quality bonuses
    const avgSLA = tces.reduce((s, t) => s + t.slaCompliancePct, 0) / tces.length;
    const avgPlanMix = tces.reduce((s, t) => s + t.planMixPct, 0) / tces.length;
    const totalChurn = tces.reduce((s, t) => s + t.churnCount30d, 0);
    const slaBonus      = avgSLA >= 90 ? 2000 : 0;
    const zeroChurnBonus = totalChurn === 0 ? 1500 : 0;
    const planMixBonus  = avgPlanMix >= 60 ? 1000 : 0;

    // Personal incentive (slab based on personal count, assume 3-month avg)
    const rate = personal >= 81 ? 35 : personal >= 51 ? 25 : personal >= 26 ? 20 : 15;
    const personalIncentive = personal * rate * 3; // ×3 for 3-month term avg

    // Installment calendar (mock — 2 × 3-month subs due next payroll)
    const installmentCalendar = [
      { label: "3-month sub × 2 (M3 due)", amount: 60, dueDate: "2026-05-31", status: "on_track" as const },
      { label: "6-month sub × 1 (M6 due)", amount: 36, dueDate: "2026-06-30", status: "on_track" as const },
    ];

    return {
      lowestTCECount: lowestTCE,
      coachingBonusLevel: level,
      coachingBonus,
      slaBonus,
      zeroChurnBonus,
      planMixBonus,
      personalIncentive,
      installmentCalendar,
      totalForecast: coachingBonus + slaBonus + zeroChurnBonus + planMixBonus + personalIncentive,
    };
  }

  // ── Mutators ─────────────────────────────────────────────────────────────

  assignLead(leadId: string, toTCEId: string | "SELF"): void {
    const leads = this.getLeads();
    const updated = leads.map(l =>
      l.id === leadId ? { ...l, assignedTo: toTCEId, status: "Assigned" as const } : l
    );
    localStorage.setItem(this.STORE_KEYS.LEADS, JSON.stringify(updated));
  }

  logCoachingNote(note: Omit<SHCoachingNote, "id">): SHCoachingNote {
    const notes = this.getCoachingNotes();
    const newNote: SHCoachingNote = { ...note, id: `CN-${Date.now()}` };
    localStorage.setItem(this.STORE_KEYS.COACHING_NOTES, JSON.stringify([newNote, ...notes]));
    return newNote;
  }

  dismissAlert(alertId: string): void {
    const alerts = this.getAlerts();
    const updated = alerts.map(a => a.id === alertId ? { ...a, actionRequired: false } : a);
    localStorage.setItem(this.STORE_KEYS.ALERTS, JSON.stringify(updated));
  }
}

export const salesHeadService = new SalesHeadService();
