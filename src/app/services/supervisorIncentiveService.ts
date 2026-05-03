/**
 * Supervisor Incentive Service
 * Read-only performance tracking (system-calculated)
 */

export interface IncentiveEarnings {
  totalMonth: number;
  earned70Percent: number;
  pending30Percent: number;
  forfeited: number;
}

export interface QualityMultiplier {
  retentionRate: number; // Active / Converted
  multiplier: 1.0 | 1.2;
  status: "BONUS" | "STANDARD" | "WARNING";
  label: string;
  color: "green" | "gray" | "red";
}

export interface KPIScore {
  conversion: number; // Out of 40
  retention: number; // Out of 30
  audit: number; // Out of 20
  complaints: number; // Out of 10
  total: number; // Out of 100
  threshold: number; // Minimum required (e.g., 70)
}

export interface PerformanceAlert {
  type: "CONVERSION_LOW" | "RETENTION_LOW" | "AUDIT_LOW";
  message: string;
  severity: "CRITICAL" | "WARNING";
}

export interface LeadIncentiveDetail {
  leadId: string;
  customerName: string;
  status: "CONVERTED" | "PENDING" | "EXPIRED" | "CHURNED";
  conversionDate?: Date;
  retentionStatus: "ACTIVE" | "CHURNED" | "PENDING";
  incentive70Paid: boolean;
  incentive30Status: "PAID" | "PENDING" | "FORFEITED";
  amount70: number;
  amount30: number;
  totalEarned: number;
}

export interface IncentiveDashboard {
  earnings: IncentiveEarnings;
  qualityMultiplier: QualityMultiplier;
  kpiScore: KPIScore;
  alerts: PerformanceAlert[];
  leadDetails: LeadIncentiveDetail[];
  monthYear: string;
  calculatedAt: Date;
}

class SupervisorIncentiveService {
  private readonly BASE_LEAD_INCENTIVE = 500; // ₹500 per lead
  private readonly SPLIT_70_PERCENT = 0.7;
  private readonly SPLIT_30_PERCENT = 0.3;

  // Thresholds
  private readonly BONUS_RETENTION_THRESHOLD = 0.8; // 80%
  private readonly WARNING_RETENTION_THRESHOLD = 0.6; // 60%
  private readonly LOW_CONVERSION_THRESHOLD = 0.3; // 30%
  private readonly KPI_THRESHOLD = 70; // 70/100

  // ========== INCENTIVE CALCULATION ==========

  getIncentiveDashboard(supervisorId: string): IncentiveDashboard {
    // In production: GET /api/supervisor/:id/incentive

    // Mock data
    const leadDetails = this.getMockLeadDetails();

    // Calculate earnings
    const earnings = this.calculateEarnings(leadDetails);

    // Calculate quality multiplier
    const qualityMultiplier = this.calculateQualityMultiplier(leadDetails);

    // Calculate KPI score
    const kpiScore = this.calculateKPIScore(supervisorId);

    // Generate alerts
    const alerts = this.generateAlerts(kpiScore, qualityMultiplier);

    return {
      earnings,
      qualityMultiplier,
      kpiScore,
      alerts,
      leadDetails,
      monthYear: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      calculatedAt: new Date(),
    };
  }

  // ========== EARNINGS CALCULATION ==========

  private calculateEarnings(leads: LeadIncentiveDetail[]): IncentiveEarnings {
    let earned70 = 0;
    let pending30 = 0;
    let forfeited = 0;

    leads.forEach((lead) => {
      if (lead.incentive70Paid) {
        earned70 += lead.amount70;
      }

      if (lead.incentive30Status === "PAID") {
        pending30 += lead.amount30; // This goes to "earned" actually
      } else if (lead.incentive30Status === "PENDING") {
        pending30 += lead.amount30;
      } else if (lead.incentive30Status === "FORFEITED") {
        forfeited += lead.amount30;
      }
    });

    // Adjust: pending30 should only include actual pending
    const actualPending30 = leads
      .filter((l) => l.incentive30Status === "PENDING")
      .reduce((sum, l) => sum + l.amount30, 0);

    const actualEarned30 = leads
      .filter((l) => l.incentive30Status === "PAID")
      .reduce((sum, l) => sum + l.amount30, 0);

    return {
      totalMonth: earned70 + actualEarned30,
      earned70Percent: earned70,
      pending30Percent: actualPending30,
      forfeited,
    };
  }

  // ========== QUALITY MULTIPLIER ==========

  private calculateQualityMultiplier(leads: LeadIncentiveDetail[]): QualityMultiplier {
    const converted = leads.filter((l) => l.status === "CONVERTED").length;
    const active = leads.filter((l) => l.retentionStatus === "ACTIVE").length;

    const retentionRate = converted > 0 ? active / converted : 0;

    if (retentionRate >= this.BONUS_RETENTION_THRESHOLD) {
      return {
        retentionRate,
        multiplier: 1.2,
        status: "BONUS",
        label: "Bonus Active (1.2x)",
        color: "green",
      };
    } else if (retentionRate >= this.WARNING_RETENTION_THRESHOLD) {
      return {
        retentionRate,
        multiplier: 1.0,
        status: "STANDARD",
        label: "Standard (1.0x)",
        color: "gray",
      };
    } else {
      return {
        retentionRate,
        multiplier: 1.0,
        status: "WARNING",
        label: "Warning — No Bonus",
        color: "red",
      };
    }
  }

  // ========== KPI SCORE ==========

  private calculateKPIScore(supervisorId: string): KPIScore {
    // In production: Complex calculation based on actual metrics
    // For now: Mock scoring

    const conversionRate = 0.35; // 35% (out of 40 points)
    const retentionRate = 0.75; // 75% (out of 30 points)
    const auditRate = 0.9; // 90% (out of 20 points)
    const complaintRate = 0.05; // 5% complaints (out of 10 points)

    const conversion = conversionRate * 40;
    const retention = retentionRate * 30;
    const audit = auditRate * 20;
    const complaints = (1 - complaintRate) * 10; // Inverse: fewer complaints = higher score

    const total = conversion + retention + audit + complaints;

    return {
      conversion,
      retention,
      audit,
      complaints,
      total,
      threshold: this.KPI_THRESHOLD,
    };
  }

  // ========== ALERTS ==========

  private generateAlerts(kpi: KPIScore, quality: QualityMultiplier): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    // Conversion alert
    if (kpi.conversion / 40 < this.LOW_CONVERSION_THRESHOLD) {
      alerts.push({
        type: "CONVERSION_LOW",
        message: "Lead Quality Issue — Conversion <30%",
        severity: "CRITICAL",
      });
    }

    // Retention alert
    if (quality.retentionRate < this.WARNING_RETENTION_THRESHOLD) {
      alerts.push({
        type: "RETENTION_LOW",
        message: "Flagged to Ops Manager — Retention <60%",
        severity: "CRITICAL",
      });
    }

    // Audit alert
    if (kpi.audit / 20 < 0.8) {
      alerts.push({
        type: "AUDIT_LOW",
        message: "KPI Failure — Audit score below target",
        severity: "WARNING",
      });
    }

    return alerts;
  }

  // ========== MOCK DATA ==========

  private getMockLeadDetails(): LeadIncentiveDetail[] {
    const leads: LeadIncentiveDetail[] = [];

    const names = [
      "Rajesh Kumar",
      "Priya Patel",
      "Amit Shah",
      "Neha Singh",
      "Suresh Mehta",
      "Anjali Desai",
      "Vikram Joshi",
      "Pooja Sharma",
    ];

    for (let i = 0; i < 8; i++) {
      const isConverted = i < 5; // 5 converted
      const isActive = i < 4; // 4 active (1 churned)
      const daysAgo = 30 + i * 15;
      const conversionDate = isConverted ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) : undefined;

      const amount70 = this.BASE_LEAD_INCENTIVE * this.SPLIT_70_PERCENT;
      const amount30 = this.BASE_LEAD_INCENTIVE * this.SPLIT_30_PERCENT;

      let status: LeadIncentiveDetail["status"] = "PENDING";
      let retentionStatus: LeadIncentiveDetail["retentionStatus"] = "PENDING";
      let incentive30Status: LeadIncentiveDetail["incentive30Status"] = "PENDING";

      if (isConverted) {
        status = "CONVERTED";
        if (isActive) {
          retentionStatus = "ACTIVE";
          if (daysAgo > 120) {
            incentive30Status = "PAID";
          } else {
            incentive30Status = "PENDING";
          }
        } else {
          retentionStatus = "CHURNED";
          incentive30Status = "FORFEITED";
        }
      } else if (daysAgo > 30) {
        status = "EXPIRED";
      }

      leads.push({
        leadId: `LEAD-${i + 1}`,
        customerName: names[i],
        status,
        conversionDate,
        retentionStatus,
        incentive70Paid: isConverted,
        incentive30Status,
        amount70,
        amount30,
        totalEarned: isConverted ? amount70 + (incentive30Status === "PAID" ? amount30 : 0) : 0,
      });
    }

    return leads;
  }
}

// Singleton instance
export const supervisorIncentiveService = new SupervisorIncentiveService();
