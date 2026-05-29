/**
 * incentiveStructureService.ts
 *
 * Authoritative implementation of Incentive Structure v6 Final (28 May 2026).
 *
 * GOVERNING RULES (from §1):
 *   1. Pool = ₹150 × (months ÷ 3). Prorate for other terms.
 *   2. 30/70 disbursement — 30% at M1, 70% across check-months per term.
 *      Applies to: SM · SH · TSE · TSM · Supervisor.
 *   3. Split % determined by SOURCE only (Digital/TSE or BTL). Plan sold ≠ affects %.
 *   4. Express Wash Hatchback = ₹0 for ALL roles. Express Wash SUV/Lux = full pool.
 *   5. Bulk Deal = SM ONLY in pool. SH earns 1% rolling separately (no pool).
 *   6. Car Washer: NOT in subscription pool. Daily unit incentive only.
 */

import { DataService } from "./DataService";

// ── Types ─────────────────────────────────────────────────────────────────────

export type IncentiveSource  = "DIGITAL" | "BTL" | "BULK_DEAL";
export type IncentiveTerm    = 1 | 2 | 3 | 6 | 9 | 12;
export type CheckMonth       = "M1" | "M2" | "M3" | "M6" | "M9" | "M12";
export type TrancheStatus    = "PENDING" | "PAID" | "FORFEITED";
export type IncentiveRole    = "TSE" | "SM" | "SH" | "TSM" | "SUPERVISOR";

export interface SubscriptionIncentiveRecord {
  id:                 string;    // e.g. "INC-SUB-001"
  subscriptionId:     string;
  customerId:         string;
  customerName:       string;
  planType:           string;    // EXPRESS_WASH / SMART_WASH / ELITE
  vehicleCategory:    string;    // "Hatchback / Compact Sedan" etc
  monthlyAmount:      number;    // e.g. 1599
  term:               IncentiveTerm;
  source:             IncentiveSource;
  activationDate:     string;    // ISO date
  status:             "ACTIVE" | "CANCELLED" | "COMPLETED";
  cancelledDate?:     string;
  cityId:             string;
  // Role assignments
  tseId?:             string;
  smId?:              string;
  shId?:              string;
  tsmId?:             string;
  supervisorId?:      string;
  // Computed
  poolTotal:          number;    // e.g. ₹150 for 3M
  isZeroPool:         boolean;   // true for Express Wash Hatchback
  tranches:           IncentiveTranche[];
  createdAt:          string;
}

export interface IncentiveTranche {
  id:               string;
  subscriptionId:   string;
  checkMonth:       CheckMonth;
  dueDate:          string;       // ISO date
  poolAmount:       number;       // portion of pool (e.g. ₹45 M1, ₹105 M3)
  rolePayouts:      RolePayout[];
  status:           TrancheStatus;
  paidDate?:        string;
  forfeitedReason?: "CANCELLATION" | "GATE_NOT_MET" | "INACTIVE";
}

export interface RolePayout {
  role:           IncentiveRole;
  employeeId:     string;
  employeeName:   string;
  amount:         number;
  pct:            number;         // e.g. 20
  status:         TrancheStatus;
}

export interface RoleIncentiveSummary {
  employeeId:       string;
  role:             IncentiveRole;
  totalEarned:      number;       // sum of PAID
  totalPending:     number;       // sum of PENDING (future tranches, active subs)
  totalForfeited:   number;       // sum of FORFEITED (cancelled subs)
  tranches: {
    record:           SubscriptionIncentiveRecord;
    tranche:          IncentiveTranche;
    myPayout:         RolePayout;
  }[];
}

export interface ExitPayoutSummary {
  subscriptionId:   string;
  exitDate:         string;
  dueToBePaid:      IncentiveTranche[];   // check-months already passed = must pay
  toBeForfeited:    IncentiveTranche[];   // check-months not yet reached = forfeited
  totalDue:         number;
  totalForfeited:   number;
  byRole: {
    role:            IncentiveRole;
    employeeId:      string;
    due:             number;
    forfeited:       number;
  }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cleancar_incentive_records_v6";

// Pool total per term
export const POOL_BY_TERM: Record<IncentiveTerm, number> = {
  1: 50, 2: 100, 3: 150, 6: 300, 9: 450, 12: 600,
};

// Check-months per term
export const CHECK_MONTHS_BY_TERM: Record<IncentiveTerm, CheckMonth[]> = {
  1:  ["M1", "M2"],
  2:  ["M1", "M2"],
  3:  ["M1", "M3"],
  6:  ["M1", "M3", "M6"],
  9:  ["M1", "M3", "M6", "M9"],
  12: ["M1", "M3", "M6", "M9", "M12"],
};

// 30/70 split: M1 = 30%, remaining 70% split equally across remaining check-months
export function calcTrancheAmounts(term: IncentiveTerm): Record<CheckMonth, number> {
  const pool      = POOL_BY_TERM[term];
  const months    = CHECK_MONTHS_BY_TERM[term];
  const m1Amount  = Math.round(pool * 0.30 * 100) / 100;
  const remaining = pool - m1Amount;
  const laterMonths = months.slice(1);
  const laterAmt  = laterMonths.length > 0
    ? Math.round((remaining / laterMonths.length) * 100) / 100
    : 0;

  const result: Partial<Record<CheckMonth, number>> = {};
  months.forEach((m, idx) => {
    result[m] = idx === 0 ? m1Amount : laterAmt;
  });
  return result as Record<CheckMonth, number>;
}

// Role split % by source
export const POOL_SPLIT: Record<IncentiveSource, Partial<Record<IncentiveRole, number>>> = {
  DIGITAL: {
    TSE:         20,
    SM:          10,
    SH:          5,
    TSM:         7.5,
    // SUPERVISOR: not in DIGITAL pool
  },
  BTL: {
    SUPERVISOR:  15,
    TSE:         20,
    SH:          5,
    TSM:         7.5,
    SM:          10,
  },
  BULK_DEAL: {
    SM:          100, // SM only in pool — SH earns 1% rolling separately (not in pool)
  },
};

// Is this a zero-pool case?
export function isZeroPool(planType: string, vehicleCategory: string): boolean {
  const isExpressWash = planType === "EXPRESS_WASH" ||
    planType === "EXPRESS_WASH" || planType === "EXPRESS_WASH";
  const isHatchback   = vehicleCategory.toLowerCase().includes("hatchback") ||
    vehicleCategory.toLowerCase().includes("compact sedan");
  return isExpressWash && isHatchback;
}

// ── Service ───────────────────────────────────────────────────────────────────

class IncentiveStructureService {

  private readAll(): SubscriptionIncentiveRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private writeAll(records: SubscriptionIncentiveRecord[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  // ── Create incentive record when subscription is activated ──────────────────

  createRecord(params: {
    subscriptionId: string;
    customerId:     string;
    customerName:   string;
    planType:       string;
    vehicleCategory:string;
    monthlyAmount:  number;
    term:           IncentiveTerm;
    source:         IncentiveSource;
    activationDate: string;
    cityId:         string;
    tseId?:         string; tseName?: string;
    smId?:          string; smName?:  string;
    shId?:          string; shName?:  string;
    tsmId?:         string; tsmName?: string;
    supervisorId?:  string; supervisorName?: string;
  }): SubscriptionIncentiveRecord {

    const zero       = isZeroPool(params.planType, params.vehicleCategory);
    const poolTotal  = zero ? 0 : POOL_BY_TERM[params.term];
    const split      = POOL_SPLIT[params.source];
    const trancheAmt = zero ? {} as Record<CheckMonth, number>
                            : calcTrancheAmounts(params.term);
    const checkMonths = CHECK_MONTHS_BY_TERM[params.term];
    const activation  = new Date(params.activationDate);

    // Build tranches
    const tranches: IncentiveTranche[] = checkMonths.map((cm, idx) => {
      const monthOffset = cm === "M1" ? 0
        : cm === "M2" ? 1 : cm === "M3" ? 2
        : cm === "M6" ? 5 : cm === "M9" ? 8 : 11;
      const due = new Date(activation);
      due.setMonth(due.getMonth() + monthOffset);
      const poolAmt = zero ? 0 : (trancheAmt[cm] ?? 0);

      // Build role payouts
      const rolePayouts: RolePayout[] = [];
      if (!zero) {
        Object.entries(split).forEach(([role, pct]) => {
          const r = role as IncentiveRole;
          let empId   = "";
          let empName = "";
          if (r === "TSE")        { empId = params.tseId || "";        empName = params.tseName || ""; }
          if (r === "SM")         { empId = params.smId  || "";        empName = params.smName  || ""; }
          if (r === "SH")         { empId = params.shId  || "";        empName = params.shName  || ""; }
          if (r === "TSM")        { empId = params.tsmId || "";        empName = params.tsmName || ""; }
          if (r === "SUPERVISOR") { empId = params.supervisorId || ""; empName = params.supervisorName || ""; }

          if (!empId) return; // skip roles with no assigned employee

          rolePayouts.push({
            role: r, employeeId: empId, employeeName: empName,
            pct: pct ?? 0,
            amount: Math.round(poolAmt * ((pct ?? 0) / 100) * 100) / 100,
            status: "PENDING",
          });
        });
      }

      return {
        id:             `TRN-${params.subscriptionId}-${cm}`,
        subscriptionId: params.subscriptionId,
        checkMonth:     cm,
        dueDate:        due.toISOString().split("T")[0],
        poolAmount:     poolAmt,
        rolePayouts,
        status:         "PENDING",
      };
    });

    const record: SubscriptionIncentiveRecord = {
      id:              `INC-${params.subscriptionId}`,
      subscriptionId:  params.subscriptionId,
      customerId:      params.customerId,
      customerName:    params.customerName,
      planType:        params.planType,
      vehicleCategory: params.vehicleCategory,
      monthlyAmount:   params.monthlyAmount,
      term:            params.term,
      source:          params.source,
      activationDate:  params.activationDate,
      status:          "ACTIVE",
      cityId:          params.cityId,
      tseId:           params.tseId,
      smId:            params.smId,
      shId:            params.shId,
      tsmId:           params.tsmId,
      supervisorId:    params.supervisorId,
      poolTotal,
      isZeroPool:      zero,
      tranches,
      createdAt:       new Date().toISOString(),
    };

    const all = this.readAll();
    all.push(record);
    this.writeAll(all);
    return record;
  }

  // ── Mark a tranche as PAID ──────────────────────────────────────────────────

  markTranchePaid(subscriptionId: string, checkMonth: CheckMonth): boolean {
    const all = this.readAll();
    const rec = all.find(r => r.subscriptionId === subscriptionId);
    if (!rec) return false;
    const t = rec.tranches.find(t => t.checkMonth === checkMonth);
    if (!t || t.status !== "PENDING") return false;
    t.status   = "PAID";
    t.paidDate = new Date().toISOString().split("T")[0];
    t.rolePayouts.forEach(rp => rp.status = "PAID");
    this.writeAll(all);
    return true;
  }

  // ── Process cancellation / exit — compute due vs forfeited ─────────────────

  processCancellation(
    subscriptionId: string,
    cancelDate: string,
  ): ExitPayoutSummary | null {
    const all = this.readAll();
    const rec = all.find(r => r.subscriptionId === subscriptionId);
    if (!rec) return null;

    rec.status       = "CANCELLED";
    rec.cancelledDate = cancelDate;

    const cancelDt = new Date(cancelDate);
    const due: IncentiveTranche[]      = [];
    const forfeited: IncentiveTranche[] = [];

    rec.tranches.forEach(t => {
      if (t.status === "PAID") return; // already paid — untouched
      const dueDt = new Date(t.dueDate);
      if (dueDt <= cancelDt) {
        // Due date has passed → must be paid
        due.push(t);
        t.rolePayouts.forEach(rp => rp.status = "PAID");
        t.status = "PAID";
        t.paidDate = cancelDate;
      } else {
        // Due date in future → forfeited
        forfeited.push(t);
        t.rolePayouts.forEach(rp => rp.status = "FORFEITED");
        t.status           = "FORFEITED";
        t.forfeitedReason  = "CANCELLATION";
      }
    });

    this.writeAll(all);

    // Build per-role summary
    const byRoleMap: Record<string, { role: IncentiveRole; employeeId: string; due: number; forfeited: number }> = {};
    const addToRole = (rp: RolePayout, type: "due" | "forfeited") => {
      const key = rp.employeeId;
      if (!byRoleMap[key]) byRoleMap[key] = { role: rp.role, employeeId: rp.employeeId, due: 0, forfeited: 0 };
      byRoleMap[key][type] += rp.amount;
    };
    due.forEach(t => t.rolePayouts.forEach(rp => addToRole(rp, "due")));
    forfeited.forEach(t => t.rolePayouts.forEach(rp => addToRole(rp, "forfeited")));

    return {
      subscriptionId,
      exitDate:      cancelDate,
      dueToBePaid:   due,
      toBeForfeited: forfeited,
      totalDue:      due.reduce((s, t) => s + t.poolAmount, 0),
      totalForfeited: forfeited.reduce((s, t) => s + t.poolAmount, 0),
      byRole:        Object.values(byRoleMap),
    };
  }

  // ── Auto-process pending tranches that have passed their due date ───────────

  autoProcessDueTranches(today: string): IncentiveTranche[] {
    const all       = this.readAll();
    const processed: IncentiveTranche[] = [];
    const todayDt   = new Date(today);

    all.forEach(rec => {
      if (rec.status !== "ACTIVE") return;
      rec.tranches.forEach(t => {
        if (t.status === "PENDING" && new Date(t.dueDate) <= todayDt) {
          t.status   = "PAID";
          t.paidDate = today;
          t.rolePayouts.forEach(rp => rp.status = "PAID");
          processed.push(t);
        }
      });
    });

    if (processed.length > 0) this.writeAll(all);
    return processed;
  }

  // ── Get all records for a specific employee + role ──────────────────────────

  getForEmployee(employeeId: string, role: IncentiveRole): RoleIncentiveSummary {
    const all = this.readAll();
    const result: RoleIncentiveSummary = {
      employeeId, role,
      totalEarned: 0, totalPending: 0, totalForfeited: 0,
      tranches: [],
    };

    all.forEach(rec => {
      // Check if this employee is assigned in this role
      const isMyRole =
        (role === "TSE"        && rec.tseId        === employeeId) ||
        (role === "SM"         && rec.smId         === employeeId) ||
        (role === "SH"         && rec.shId         === employeeId) ||
        (role === "TSM"        && rec.tsmId        === employeeId) ||
        (role === "SUPERVISOR" && rec.supervisorId === employeeId);
      if (!isMyRole) return;

      rec.tranches.forEach(t => {
        const myPayout = t.rolePayouts.find(rp => rp.employeeId === employeeId);
        if (!myPayout) return;

        result.tranches.push({ record: rec, tranche: t, myPayout });
        if (myPayout.status === "PAID")      result.totalEarned    += myPayout.amount;
        if (myPayout.status === "PENDING")   result.totalPending   += myPayout.amount;
        if (myPayout.status === "FORFEITED") result.totalForfeited += myPayout.amount;
      });
    });

    return result;
  }

  // ── Get all records ─────────────────────────────────────────────────────────

  getAll(): SubscriptionIncentiveRecord[] {
    return this.readAll();
  }

  getById(subscriptionId: string): SubscriptionIncentiveRecord | null {
    return this.readAll().find(r => r.subscriptionId === subscriptionId) ?? null;
  }

  // ── SH 1% rolling reward (separate from pool) ───────────────────────────────

  getSHRollingReward(shId: string, monthStr: string): {
    total: number;
    breakdown: { subscriptionId: string; customerName: string; planAmount: number; reward: number }[];
  } {
    const all = this.readAll().filter(r =>
      r.shId === shId && r.status === "ACTIVE"
    );
    const breakdown = all.map(r => ({
      subscriptionId: r.subscriptionId,
      customerName:   r.customerName,
      planAmount:     r.monthlyAmount,
      reward:         Math.round(r.monthlyAmount * 0.01 * 100) / 100,
    }));
    return {
      total: breakdown.reduce((s, b) => s + b.reward, 0),
      breakdown,
    };
  }

  // ── Stats for admin/finance overview ────────────────────────────────────────

  getStats(cityId?: string): {
    totalRecords: number;
    active: number;
    cancelled: number;
    totalPoolValue: number;
    paidToDate: number;
    pendingPayouts: number;
    forfeitedAmount: number;
  } {
    const all = cityId ? this.readAll().filter(r => r.cityId === cityId) : this.readAll();
    let paid = 0, pending = 0, forfeited = 0;
    all.forEach(rec => {
      rec.tranches.forEach(t => {
        if (t.status === "PAID")      paid      += t.poolAmount;
        if (t.status === "PENDING")   pending   += t.poolAmount;
        if (t.status === "FORFEITED") forfeited += t.poolAmount;
      });
    });
    return {
      totalRecords:    all.length,
      active:          all.filter(r => r.status === "ACTIVE").length,
      cancelled:       all.filter(r => r.status === "CANCELLED").length,
      totalPoolValue:  all.reduce((s, r) => s + r.poolTotal, 0),
      paidToDate:      paid,
      pendingPayouts:  pending,
      forfeitedAmount: forfeited,
    };
  }
}

export const incentiveStructureService = new IncentiveStructureService();
