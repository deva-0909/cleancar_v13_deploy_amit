/**
 * salesHeadService.ts  (v2 — full management visibility layer)
 *
 * Adds to the existing SH service:
 *   getReporteesSummary()  — aggregates TSM pipeline + SM locations + TCE
 *                            drill-down for the Management Visibility tab
 *   getPayrollPreview()    — wires salesIncentiveEngine for payroll output
 *
 * Management Visibility Layer (Section 12 of Sales Head Module v1.1):
 *   SH sees: own TCE data (existing), TSM pipeline, all SM locations,
 *            all TCEs under TSM, installment tranche liability,
 *            incentive forecasts for every reportee.
 */

import { DataService } from "./DataService";
import {
  salesHeadIncentiveEngine,
  type SHPayrollBreakdown,
} from "./salesIncentiveEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TCEGateColor = "RED" | "AMBER" | "GREEN" | "GOLD";

export interface TCEStatus {
  id: string;
  name: string;
  closuresMTD: number;
  gateColor: TCEGateColor;
  slaCompliancePct: number;
  planMixPct: number;
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
  assignedTo: string | null;
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
  overdueLeads: number;
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
  installmentCalendar: Array<{
    label: string; amount: number; dueDate: string;
    status: "on_track" | "at_risk";
  }>;
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

// ── Management visibility types (Section 12) ──────────────────────────────────

export interface TSMSummary {
  id: string;
  name: string;
  // Pipeline metrics
  leadsNew: number;
  leadsConverted: number;
  conversionRatePct: number;
  revenueMTD: number;
  revenueTarget: number;
  slaBreaches: number;
  // Team (TSEs under TSM)
  tseCount: number;
  tsePerformance: Array<{
    id: string; name: string; status: string;
    closuresMTD: number; slaCompliancePct: number; planMixPct: number;
    incentiveForecast: number; health: "GREEN" | "AMBER" | "RED";
  }>;
  // Incentive
  incentiveForecast: number;
  // Tranche exposure
  pendingTranches: number;
}

export interface SMSummaryForSH {
  id: string;
  name: string;
  activeLocations: number;
  leadsMTD: number;
  conversionsMTD: number;
  conversionRatePct: number;
  gateCleared: boolean;
  blockDealsActive: number;
  incentiveForecast: number;
  atRiskLocations: number;
  inactiveLocations: number;
  pendingApprovals: number;
}

export interface TrancheItem {
  id: string;
  ownerName: string;
  ownerRole: "SH" | "TSM" | "SM" | "TCE";
  label: string;
  amount: number;
  dueDate: string;
  subscriptionActive: boolean;
  status: "on_track" | "at_risk" | "forfeited";
}

export interface ReporteesSummary {
  // TSM the SH manages
  tsmSummary: TSMSummary;
  // Sales Managers reporting to this SH
  smSummaries: SMSummaryForSH[];
  // All TCEs across the team (SH's own 3 + TSM's TCEs)
  allTCEs: Array<{
    id: string; name: string; teamOwner: "SH-Direct" | "TSM";
    closuresMTD: number; slaCompliancePct: number; planMixPct: number;
    churnCount30d: number; incentiveForecast: number;
    health: "GREEN" | "AMBER" | "RED";
  }>;
  // Tranche liability calendar
  trancheLiability: TrancheItem[];
  // Incentive cost forecast
  totalTeamIncentiveForecast: number;
  shPersonalForecast: number;
  tsmForecast: number;
  smsTotalForecast: number;
  tcesForecast: number;
}

// ── Seed helpers ──────────────────────────────────────────────────────────────

const minsAgo = (n: number) => new Date(Date.now() - n * 60 * 1000).toISOString();

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

  // ── Existing getters ──────────────────────────────────────────────────────

  getCommandMetrics(): SHCommandMetrics {
    const tces    = this.load<TCEStatus>(this.STORE_KEYS.TCE_STATUSES, seedTCEStatuses);
    const leads   = this.load<SHLead>(this.STORE_KEYS.LEADS, seedLeads);
    const alerts  = this.load<SHAlert>(this.STORE_KEYS.ALERTS, seedAlerts);
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

  getLeads(): SHLead[] { return this.load<SHLead>(this.STORE_KEYS.LEADS, seedLeads); }
  getAlerts(): SHAlert[] { return this.load<SHAlert>(this.STORE_KEYS.ALERTS, seedAlerts).slice(0, 10); }
  getCoachingNotes(): SHCoachingNote[] { return this.load<SHCoachingNote>(this.STORE_KEYS.COACHING_NOTES, seedCoachingNotes); }

  getIncentiveBreakdown(): SHIncentiveBreakdown {
    const tces    = this.load<TCEStatus>(this.STORE_KEYS.TCE_STATUSES, seedTCEStatuses);
    const personal = parseInt(localStorage.getItem("sh_personal_closures_count") || "14");
    const avgSLA  = tces.reduce((s, t) => s + t.slaCompliancePct, 0) / tces.length;
    const avgMix  = tces.reduce((s, t) => s + t.planMixPct, 0) / tces.length;
    const churn   = tces.reduce((s, t) => s + t.churnCount30d, 0);

    // Use the engine for precise calculation
    const month = new Date().toISOString().slice(0, 7);
    const payroll = salesHeadIncentiveEngine.computeFullPayroll(
      { tceClosures: tces.map(t => t.closuresMTD), teamSLAPct: avgSLA, teamPlanMixPct: avgMix, teamChurnCount: churn },
      { personalClosures: personal, byTerm: { "1": 4, "3": 6, "6": 2, "12": 2 } },
      month
    );

    const lowest = Math.min(...tces.map(t => t.closuresMTD));
    return {
      lowestTCECount: lowest,
      coachingBonusLevel: payroll.coachingBonus.level,
      coachingBonus: payroll.coachingBonus.bonus,
      slaBonus: payroll.qualityBonuses.slaBonus.amount,
      zeroChurnBonus: payroll.qualityBonuses.zeroChurnBonus.amount,
      planMixBonus: payroll.qualityBonuses.planMixBonus.amount,
      personalIncentive: payroll.personalIncentive.totalM1,
      installmentCalendar: payroll.personalIncentive.futureTransches.slice(0, 5).map(t => ({
        label: `${t.term}M sub (M${t.checkMonth} check)`,
        amount: t.amount,
        dueDate: t.dueDate,
        status: "on_track" as const,
      })),
      totalForecast: payroll.totalVariableM1,
    };
  }

  // ── Payroll line items ─────────────────────────────────────────────────────

  getPayrollPreview(month: string): SHPayrollBreakdown {
    const tces   = this.load<TCEStatus>(this.STORE_KEYS.TCE_STATUSES, seedTCEStatuses);
    const personal = parseInt(localStorage.getItem("sh_personal_closures_count") || "14");
    const avgSLA = tces.reduce((s, t) => s + t.slaCompliancePct, 0) / tces.length;
    const avgMix = tces.reduce((s, t) => s + t.planMixPct, 0) / tces.length;
    const churn  = tces.reduce((s, t) => s + t.churnCount30d, 0);
    return salesHeadIncentiveEngine.computeFullPayroll(
      { tceClosures: tces.map(t => t.closuresMTD), teamSLAPct: avgSLA, teamPlanMixPct: avgMix, teamChurnCount: churn },
      { personalClosures: personal, byTerm: { "1": 4, "3": 6, "6": 2, "12": 2 } },
      month
    );
  }

  // ── Management Visibility Layer (Section 12) ───────────────────────────────

  getReporteesSummary(): ReporteesSummary {
    // TSM summary — reads from teleSalesManagerService data shape
    const tsmTCEs = [
      { id: "TSE-101", name: "Rahul Sharma",  teamOwner: "TSM" as const,
        closuresMTD: 45, slaCompliancePct: 92, planMixPct: 68, churnCount30d: 0, incentiveForecast: 900, health: "GREEN" as const },
      { id: "TSE-102", name: "Priya Patel",   teamOwner: "TSM" as const,
        closuresMTD: 38, slaCompliancePct: 88, planMixPct: 55, churnCount30d: 1, incentiveForecast: 760, health: "GREEN" as const },
      { id: "TSE-103", name: "Amit Kumar",    teamOwner: "TSM" as const,
        closuresMTD: 22, slaCompliancePct: 75, planMixPct: 42, churnCount30d: 2, incentiveForecast: 330, health: "AMBER" as const },
    ];

    const tsmSummary: TSMSummary = {
      id: "TSM-001", name: "Kiran Desai",
      leadsNew: 45, leadsConverted: 35, conversionRatePct: 42,
      revenueMTD: 4850000, revenueTarget: 5500000,
      slaBreaches: 12, tseCount: 3,
      tsePerformance: tsmTCEs,
      incentiveForecast: 52000,
      pendingTranches: 3,
    };

    // SM summaries — from salesManagerService data
    const smSummaries: SMSummaryForSH[] = [
      {
        id: "SM-001", name: "Priya Nair",
        activeLocations: 4, leadsMTD: 30, conversionsMTD: 6, conversionRatePct: 20,
        gateCleared: false, blockDealsActive: 1, incentiveForecast: 8200,
        atRiskLocations: 1, inactiveLocations: 1, pendingApprovals: 1,
      },
      {
        id: "SM-002", name: "Ravi Shah",
        activeLocations: 6, leadsMTD: 48, conversionsMTD: 9, conversionRatePct: 19,
        gateCleared: true, blockDealsActive: 0, incentiveForecast: 6800,
        atRiskLocations: 0, inactiveLocations: 0, pendingApprovals: 0,
      },
    ];

    // All TCEs = SH's own team + TSM's team
    const shTCEs = this.load<TCEStatus>(this.STORE_KEYS.TCE_STATUSES, seedTCEStatuses);
    const allTCEs = [
      ...shTCEs.map(t => ({
        id: t.id, name: t.name, teamOwner: "SH-Direct" as const,
        closuresMTD: t.closuresMTD, slaCompliancePct: t.slaCompliancePct,
        planMixPct: t.planMixPct, churnCount30d: t.churnCount30d,
        incentiveForecast: t.incentiveForecast,
        health: (t.gateColor === "RED" ? "RED" : t.slaCompliancePct < 85 ? "AMBER" : "GREEN") as "GREEN" | "AMBER" | "RED",
      })),
      ...tsmTCEs,
    ];

    // Tranche liability — all pending tranches across team
    const trancheLiability: TrancheItem[] = [
      { id: "TL-001", ownerName: "Priya Sharma (TCE)",  ownerRole: "TCE", label: "3M sub M3 check",   amount: 30,   dueDate: "2026-05-31", subscriptionActive: true,  status: "on_track" },
      { id: "TL-002", ownerName: "Amit Joshi (SH)",     ownerRole: "SH",  label: "6M sub M3 tranche", amount: 36,   dueDate: "2026-05-31", subscriptionActive: true,  status: "on_track" },
      { id: "TL-003", ownerName: "Priya Nair (SM)",     ownerRole: "SM",  label: "3M block M3 pro-rata",amount: 3125, dueDate: "2026-05-31", subscriptionActive: true,  status: "on_track" },
      { id: "TL-004", ownerName: "Rahul Sharma (TSE-TSM)",ownerRole:"TCE", label: "12M sub M3 check",  amount: 100,  dueDate: "2026-05-31", subscriptionActive: false, status: "at_risk" },
      { id: "TL-005", ownerName: "Kiran Desai (TSM)",   ownerRole: "TSM", label: "Q1 conversion M3",   amount: 2400, dueDate: "2026-06-30", subscriptionActive: true,  status: "on_track" },
    ];

    const shForecast  = this.getIncentiveBreakdown().totalForecast;
    const smForecast  = smSummaries.reduce((s, sm) => s + sm.incentiveForecast, 0);
    const tceForecast = allTCEs.reduce((s, t) => s + t.incentiveForecast, 0);

    return {
      tsmSummary,
      smSummaries,
      allTCEs,
      trancheLiability,
      totalTeamIncentiveForecast: shForecast + tsmSummary.incentiveForecast + smForecast + tceForecast,
      shPersonalForecast: shForecast,
      tsmForecast: tsmSummary.incentiveForecast,
      smsTotalForecast: smForecast,
      tcesForecast: tceForecast,
    };
  }

  // ── Mutators ───────────────────────────────────────────────────────────────

  assignLead(leadId: string, toTCEId: string | "SELF"): void {
    const leads = this.getLeads();
    const updated = leads.map(l =>
      l.id === leadId ? { ...l, assignedTo: toTCEId, status: "Assigned" as const } : l
    );
    localStorage.setItem(this.STORE_KEYS.LEADS, JSON.stringify(updated));
  }

  logCoachingNote(note: Omit<SHCoachingNote, "id">): SHCoachingNote {
    const notes = this.getCoachingNotes();
    const n: SHCoachingNote = { ...note, id: `CN-${Date.now()}` };
    localStorage.setItem(this.STORE_KEYS.COACHING_NOTES, JSON.stringify([n, ...notes]));
    return n;
  }

  dismissAlert(alertId: string): void {
    const alerts = this.getAlerts();
    localStorage.setItem(
      this.STORE_KEYS.ALERTS,
      JSON.stringify(alerts.map(a => a.id === alertId ? { ...a, actionRequired: false } : a))
    );
  }
}

export const salesHeadService = new SalesHeadService();
