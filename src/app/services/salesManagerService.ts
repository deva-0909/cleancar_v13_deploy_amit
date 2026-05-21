/**
 * salesManagerService.ts
 *
 * Service layer for the Sales Manager (SM) Alliance module.
 * SM is a pure alliance manager — does NOT submit leads.
 *
 * Incentive rules (from SM Module v2.0):
 *   Gate: ≥5 active locations | ≥30 leads MTD | ≥5 conversions MTD
 *   Per-conversion fee: ₹33 (1M) / ₹100 (3M) / ₹200 (6M) / ₹400 (12M)
 *   Alliance Activation Bonus: ₹500 on 5th customer, ₹100 per additional 5
 *   Block Bonus: ₹3,750 M1 + pro-rata M3
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type LocationStatus =
  | "Pending Approval"
  | "Active Prospect"
  | "Active"
  | "At Risk"
  | "Inactive"
  | "Rejected";

export type LocationType =
  | "Society" | "Corporate" | "Petrol Pump" | "RWA" | "Shop-in-Shop";

export interface SMLocation {
  id: string;
  name: string;
  type: LocationType;
  address: string;
  gpsLat: number;
  gpsLng: number;
  contactPerson: string;
  contactPhone: string;
  status: LocationStatus;
  approvedDate?: string;
  qrCodeActive: boolean;
  supervisorId?: string;
  supervisorName?: string;
  leadsMTD: number;         // sum of all 3 mechanisms
  leadsMTDM1: number;       // Supervisor-submitted
  leadsMTDM2: number;       // QR scan
  leadsMTDM3: number;       // WhatsApp digital share
  conversionsMTD: number;
  conversionRatePct: number;
  payingCustomers: number;  // for Alliance Activation Bonus
  lastSupervisorActivity: string;
  activationBonusStatus: "pending" | "triggered" | "paid";
}

export interface SMBlockDeal {
  id: string;
  locationId: string;
  locationName: string;
  vehicleCount: number;
  packageType: string;
  commitmentTerm: 3 | 6 | 12;
  status: "Pending Approval" | "Approved" | "Active" | "Partially Churned";
  approvedDate?: string;
  activeVehicles: number;
  phase1Paid: boolean;
  phase1Amount: number;
  phase2Amount: number;
  phase2CheckDate: string;
  phase2Status: "pending" | "due" | "paid";
}

export interface SMGateStatus {
  locationGate: { current: number; target: 5; met: boolean };
  leadGate:     { current: number; target: 30; met: boolean };
  conversionGate: { current: number; target: 5; met: boolean };
  allMet: boolean;
}

export interface SMIncentiveBreakdown {
  gateStatus: SMGateStatus;
  perConversionFee: number;
  activationBonus: number;
  blockBonusM1: number;
  blockBonusM3Forecast: number;
  installmentCalendar: Array<{
    label: string; amount: number; dueDate: string;
    status: "on_track" | "at_risk" | "paid";
  }>;
  totalForecast: number;
  fixedSalary: number;
}

export interface SMAlert {
  id: string;
  type: "SUPERVISOR_LATE" | "LOCATION_AT_RISK" | "LOCATION_INACTIVE" |
        "QR_ZERO_SCANS" | "GATE_AT_RISK" | "BLOCK_PENDING" | "CONVERSION_LOW";
  severity: "CRITICAL" | "WARNING" | "INFO";
  locationName?: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
}

export interface SMExpenseClaim {
  id: string;
  activityDate: string;
  locationId: string;
  locationName: string;
  activityType: string;
  amount: number;
  hasReceipt: boolean;
  status: "Draft" | "Submitted" | "Approved" | "Rejected" | "Paid";
}

// ── Seed helpers ─────────────────────────────────────────────────────────────

const minsAgo = (n: number) => new Date(Date.now() - n * 60 * 1000).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

function seedLocations(): SMLocation[] {
  return [
    {
      id: "LOC-001", name: "Adajan Heights Society", type: "Society",
      address: "Adajan, Surat", gpsLat: 21.2154, gpsLng: 72.7872,
      contactPerson: "Mr. Mehta (Secretary)", contactPhone: "+91 98765 11111",
      status: "Active", approvedDate: daysAgo(45),
      qrCodeActive: true, supervisorId: "SUP-001", supervisorName: "Vijay Kumar",
      leadsMTD: 18, leadsMTDM1: 12, leadsMTDM2: 4, leadsMTDM3: 2,
      conversionsMTD: 7, conversionRatePct: 39, payingCustomers: 12,
      lastSupervisorActivity: minsAgo(180), activationBonusStatus: "paid",
    },
    {
      id: "LOC-002", name: "Reliance Corporate Park", type: "Corporate",
      address: "Ring Road, Surat", gpsLat: 21.2048, gpsLng: 72.8358,
      contactPerson: "HR Dept — Anita Shah", contactPhone: "+91 98765 22222",
      status: "Active", approvedDate: daysAgo(30),
      qrCodeActive: true, supervisorId: "SUP-002", supervisorName: "Mohan Das",
      leadsMTD: 9, leadsMTDM1: 6, leadsMTDM2: 3, leadsMTDM3: 0,
      conversionsMTD: 4, conversionRatePct: 44, payingCustomers: 7,
      lastSupervisorActivity: minsAgo(360), activationBonusStatus: "triggered",
    },
    {
      id: "LOC-003", name: "HP Petrol Pump - Vesu", type: "Petrol Pump",
      address: "Vesu, Surat", gpsLat: 21.1622, gpsLng: 72.7889,
      contactPerson: "Rajesh Patel (Owner)", contactPhone: "+91 98765 33333",
      status: "At Risk", approvedDate: daysAgo(25),
      qrCodeActive: true, supervisorId: "SUP-001", supervisorName: "Vijay Kumar",
      leadsMTD: 3, leadsMTDM1: 3, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 1, conversionRatePct: 33, payingCustomers: 2,
      lastSupervisorActivity: minsAgo(2880), activationBonusStatus: "pending",
    },
    {
      id: "LOC-004", name: "Ghod Dod RWA", type: "RWA",
      address: "Ghod Dod Road, Surat", gpsLat: 21.1930, gpsLng: 72.8052,
      contactPerson: "President RWA - Mr. Iyer", contactPhone: "+91 98765 44444",
      status: "Active Prospect", approvedDate: daysAgo(8),
      qrCodeActive: true, supervisorId: "SUP-003", supervisorName: "Sanjay Rane",
      leadsMTD: 0, leadsMTDM1: 0, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 0, conversionRatePct: 0, payingCustomers: 0,
      lastSupervisorActivity: "", activationBonusStatus: "pending",
    },
    {
      id: "LOC-005", name: "VIP Road Mall", type: "Shop-in-Shop",
      address: "VIP Road, Surat", gpsLat: 21.2178, gpsLng: 72.8340,
      contactPerson: "Mall Manager", contactPhone: "+91 98765 55555",
      status: "Inactive", approvedDate: daysAgo(60),
      qrCodeActive: false, supervisorId: "SUP-002", supervisorName: "Mohan Das",
      leadsMTD: 0, leadsMTDM1: 0, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 0, conversionRatePct: 0, payingCustomers: 8,
      lastSupervisorActivity: minsAgo(8640), activationBonusStatus: "paid",
    },
    {
      id: "LOC-006", name: "Piplod Township Society", type: "Society",
      address: "Piplod, Surat", gpsLat: 21.1512, gpsLng: 72.7802,
      contactPerson: "Secretary", contactPhone: "+91 98765 66666",
      status: "Pending Approval",
      qrCodeActive: false,
      leadsMTD: 0, leadsMTDM1: 0, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 0, conversionRatePct: 0, payingCustomers: 0,
      lastSupervisorActivity: "", activationBonusStatus: "pending",
    },
  ];
}

function seedBlockDeals(): SMBlockDeal[] {
  return [
    {
      id: "BD-001", locationId: "LOC-001", locationName: "Adajan Heights Society",
      vehicleCount: 12, packageType: "Water + Shampoo", commitmentTerm: 3,
      status: "Active", approvedDate: daysAgo(30),
      activeVehicles: 10, phase1Paid: true, phase1Amount: 3750,
      phase2Amount: 3125, phase2CheckDate: daysAgo(-60), phase2Status: "pending",
    },
  ];
}

function seedAlerts(): SMAlert[] {
  return [
    {
      id: "SA-001", type: "LOCATION_AT_RISK", severity: "WARNING",
      locationName: "HP Petrol Pump - Vesu",
      message: "HP Petrol Pump - Vesu has only 3 leads this month — at risk. Re-engage within 48 hours.",
      timestamp: minsAgo(30), actionRequired: true,
    },
    {
      id: "SA-002", type: "LOCATION_INACTIVE", severity: "CRITICAL",
      locationName: "VIP Road Mall",
      message: "VIP Road Mall — 0 leads this month. Contact location contact within 24 hours.",
      timestamp: minsAgo(60), actionRequired: true,
    },
    {
      id: "SA-003", type: "QR_ZERO_SCANS", severity: "INFO",
      locationName: "Ghod Dod RWA",
      message: "Ghod Dod RWA — QR code 0 scans since placement. Confirm QR is displayed.",
      timestamp: minsAgo(180), actionRequired: false,
    },
  ];
}

function seedExpenseClaims(): SMExpenseClaim[] {
  return [
    {
      id: "EC-001", activityDate: daysAgo(3), locationId: "LOC-001",
      locationName: "Adajan Heights Society", activityType: "Standee & Print Materials",
      amount: 850, hasReceipt: true, status: "Approved",
    },
    {
      id: "EC-002", activityDate: daysAgo(1), locationId: "LOC-003",
      locationName: "HP Petrol Pump - Vesu", activityType: "Travel & Refreshments",
      amount: 350, hasReceipt: true, status: "Submitted",
    },
  ];
}

// ── Service class ─────────────────────────────────────────────────────────────

class SalesManagerService {
  private readonly KEYS = {
    LOCATIONS:     "sm_locations",
    BLOCK_DEALS:   "sm_block_deals",
    ALERTS:        "sm_alerts",
    EXPENSES:      "sm_expenses",
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

  getLocations(): SMLocation[] {
    return this.load<SMLocation>(this.KEYS.LOCATIONS, seedLocations);
  }

  getBlockDeals(): SMBlockDeal[] {
    return this.load<SMBlockDeal>(this.KEYS.BLOCK_DEALS, seedBlockDeals);
  }

  getAlerts(): SMAlert[] {
    return this.load<SMAlert>(this.KEYS.ALERTS, seedAlerts);
  }

  getExpenseClaims(): SMExpenseClaim[] {
    return this.load<SMExpenseClaim>(this.KEYS.EXPENSES, seedExpenseClaims);
  }

  getGateStatus(): SMGateStatus {
    const locs = this.getLocations();
    const activeCount = locs.filter(l =>
      l.status === "Active" || l.status === "Active Prospect"
    ).length;
    const totalLeads  = locs.reduce((s, l) => s + l.leadsMTD, 0);
    const totalConv   = locs.reduce((s, l) => s + l.conversionsMTD, 0);
    return {
      locationGate:   { current: activeCount, target: 5, met: activeCount >= 5 },
      leadGate:       { current: totalLeads,  target: 30, met: totalLeads >= 30 },
      conversionGate: { current: totalConv,   target: 5,  met: totalConv >= 5 },
      allMet: activeCount >= 5 && totalLeads >= 30 && totalConv >= 5,
    };
  }

  getIncentiveBreakdown(): SMIncentiveBreakdown {
    const gate = this.getGateStatus();
    const locs = this.getLocations();
    const blocks = this.getBlockDeals();

    // Per-conversion fee (if gate met) — assume avg 3-month term
    const perConvFee = gate.allMet
      ? locs.reduce((s, l) => s + l.conversionsMTD, 0) * 50 // 50% of ₹100 for M1
      : 0;

    // Alliance activation bonus
    const activationBonus = locs
      .filter(l => l.activationBonusStatus === "triggered").length * 500;

    // Block bonus
    const blockBonusM1 = blocks.filter(b => b.phase1Paid).reduce((s, b) => s + b.phase1Amount, 0);
    const blockBonusM3Forecast = blocks.reduce((s, b) =>
      s + Math.round((b.activeVehicles / b.vehicleCount) * b.phase2Amount), 0
    );

    return {
      gateStatus: gate,
      perConversionFee: perConvFee,
      activationBonus,
      blockBonusM1,
      blockBonusM3Forecast,
      installmentCalendar: [
        {
          label: "Adajan Heights — M3 Block Phase 2",
          amount: blockBonusM3Forecast,
          dueDate: "2026-05-31",
          status: "on_track",
        },
      ],
      totalForecast: perConvFee + activationBonus + blockBonusM3Forecast,
      fixedSalary: 35000,
    };
  }

  submitLocation(location: Omit<SMLocation, "id" | "qrCodeActive" | "leadsMTD" | "leadsMTDM1" |
    "leadsMTDM2" | "leadsMTDM3" | "conversionsMTD" | "conversionRatePct" | "payingCustomers" |
    "lastSupervisorActivity" | "activationBonusStatus">): SMLocation {
    const locs = this.getLocations();
    const newLoc: SMLocation = {
      ...location, id: `LOC-${Date.now()}`, qrCodeActive: false,
      leadsMTD: 0, leadsMTDM1: 0, leadsMTDM2: 0, leadsMTDM3: 0,
      conversionsMTD: 0, conversionRatePct: 0, payingCustomers: 0,
      lastSupervisorActivity: "", activationBonusStatus: "pending",
    };
    localStorage.setItem(this.KEYS.LOCATIONS, JSON.stringify([...locs, newLoc]));
    return newLoc;
  }

  dismissAlert(alertId: string): void {
    const alerts = this.getAlerts();
    const updated = alerts.map(a => a.id === alertId ? { ...a, actionRequired: false } : a);
    localStorage.setItem(this.KEYS.ALERTS, JSON.stringify(updated));
  }
}

export const salesManagerService = new SalesManagerService();
