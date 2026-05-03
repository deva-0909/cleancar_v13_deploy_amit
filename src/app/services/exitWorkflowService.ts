/**
 * Exit Workflow Service
 *
 * Manages employee exit process with:
 * - Notice period tracking
 * - Asset checklist
 * - Final settlement calculation
 */

import { DataService } from "./DataService";
import { logger } from "./logger";

// ========== TYPES ==========

export type ExitType = "Resignation" | "Termination" | "Retirement" | "Contract End";
export type ExitStatus = "Initiated" | "Notice Period" | "Clearance Pending" | "Completed";
export type AssetStatus = "Pending" | "Returned" | "Missing" | "Waived";
export type ClearanceStatus = "Pending" | "Approved" | "Rejected";

export interface ExitWorkflow {
  exitId: string;
  employeeId: string;
  employeeName: string;
  cityId: string;
  roleId: string;

  // Exit details
  exitType: ExitType;
  exitStatus: ExitStatus;
  initiatedDate: string;
  initiatedBy: string;
  reason?: string;

  // Notice period
  noticePeriodDays: number; // Required notice period
  lastWorkingDate: string; // Calculated or user-set
  actualLastDate?: string; // Actual exit date
  noticePeriodServed: number; // Days actually served
  noticeShortfall: number; // Days short of required notice

  // Asset checklist
  assets: AssetItem[];
  allAssetsReturned: boolean;

  // Clearances
  clearances: ClearanceItem[];
  allClearancesApproved: boolean;

  // Final settlement
  settlement?: FinalSettlement;

  // Metadata
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
}

export interface AssetItem {
  assetId: string;
  assetName: string;
  assetType: "Laptop" | "Mobile" | "ID Card" | "Keys" | "Uniform" | "Other";
  assignedDate: string;
  status: AssetStatus;
  returnedDate?: string;
  returnedTo?: string;
  condition?: string;
  replacementCost?: number;
  notes?: string;
}

export interface ClearanceItem {
  clearanceId: string;
  department: string; // "HR", "IT", "Finance", "Admin"
  status: ClearanceStatus;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
  required: boolean;
}

export interface FinalSettlement {
  settlementId: string;
  calculatedAt: string;
  calculatedBy: string;

  // Earnings
  pendingSalary: number; // Pro-rated for days worked
  leaveEncashment: number;
  bonus: number;
  otherEarnings: Record<string, number>;
  totalEarnings: number;

  // Deductions
  noticeShortfallDeduction: number;
  advancesNotRepaid: number;
  assetRecovery: number; // Missing asset costs
  otherDeductions: Record<string, number>;
  totalDeductions: number;

  // Final amount
  netSettlement: number;

  // Payment
  paymentStatus: "Pending" | "Processed" | "Paid";
  paymentDate?: string;
  paymentReference?: string;
}

// ========== SERVICE ==========

class ExitWorkflowService {
  private readonly STORAGE_KEY = "EXIT_WORKFLOWS";

  /**
   * Initiate exit workflow
   */
  initiateExit(data: {
    employeeId: string;
    employeeName: string;
    cityId: string;
    roleId: string;
    exitType: ExitType;
    initiatedBy: string;
    reason?: string;
    noticePeriodDays?: number;
    lastWorkingDate?: string;
  }): ExitWorkflow {
    const now = new Date();
    const noticePeriodDays = data.noticePeriodDays || 30; // Default 30 days

    // Calculate last working date if not provided
    let lastWorkingDate = data.lastWorkingDate;
    if (!lastWorkingDate) {
      const lwd = new Date(now);
      lwd.setDate(lwd.getDate() + noticePeriodDays);
      lastWorkingDate = lwd.toISOString().split('T')[0];
    }

    const workflow: ExitWorkflow = {
      exitId: this.generateExitId(),
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      cityId: data.cityId,
      roleId: data.roleId,
      exitType: data.exitType,
      exitStatus: "Initiated",
      initiatedDate: now.toISOString().split('T')[0],
      initiatedBy: data.initiatedBy,
      reason: data.reason,
      noticePeriodDays,
      lastWorkingDate,
      noticePeriodServed: 0,
      noticeShortfall: 0,
      assets: this.createDefaultAssets(),
      allAssetsReturned: false,
      clearances: this.createDefaultClearances(),
      allClearancesApproved: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.saveWorkflow(workflow);

    logger.log("ExitWorkflow: Initiated", {
      exitId: workflow.exitId,
      employeeId: data.employeeId,
      exitType: data.exitType,
    });

    return workflow;
  }

  /**
   * Update exit workflow
   */
  updateWorkflow(exitId: string, updates: Partial<ExitWorkflow>): ExitWorkflow | null {
    const workflows = this.getAllWorkflows();
    const index = workflows.findIndex(w => w.exitId === exitId);

    if (index === -1) return null;

    const updated: ExitWorkflow = {
      ...workflows[index],
      ...updates,
      exitId, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };

    workflows[index] = updated;
    DataService.setAll(this.STORAGE_KEY, workflows);

    return updated;
  }

  /**
   * Update asset status
   */
  updateAsset(
    exitId: string,
    assetId: string,
    status: AssetStatus,
    data?: {
      returnedTo?: string;
      condition?: string;
      notes?: string;
    }
  ): ExitWorkflow | null {
    const workflow = this.getById(exitId);
    if (!workflow) return null;

    const assetIndex = workflow.assets.findIndex(a => a.assetId === assetId);
    if (assetIndex === -1) return null;

    workflow.assets[assetIndex].status = status;
    if (status === "Returned") {
      workflow.assets[assetIndex].returnedDate = new Date().toISOString().split('T')[0];
      workflow.assets[assetIndex].returnedTo = data?.returnedTo;
      workflow.assets[assetIndex].condition = data?.condition;
    }
    if (data?.notes) {
      workflow.assets[assetIndex].notes = data.notes;
    }

    // Check if all assets returned
    workflow.allAssetsReturned = workflow.assets.every(
      a => a.status === "Returned" || a.status === "Waived"
    );

    return this.updateWorkflow(exitId, {
      assets: workflow.assets,
      allAssetsReturned: workflow.allAssetsReturned,
    });
  }

  /**
   * Process clearance
   */
  processClearance(
    exitId: string,
    clearanceId: string,
    status: ClearanceStatus,
    approvedBy?: string,
    comments?: string
  ): ExitWorkflow | null {
    const workflow = this.getById(exitId);
    if (!workflow) return null;

    const clearanceIndex = workflow.clearances.findIndex(c => c.clearanceId === clearanceId);
    if (clearanceIndex === -1) return null;

    workflow.clearances[clearanceIndex].status = status;
    if (status === "Approved") {
      workflow.clearances[clearanceIndex].approvedBy = approvedBy;
      workflow.clearances[clearanceIndex].approvedAt = new Date().toISOString();
    }
    if (comments) {
      workflow.clearances[clearanceIndex].comments = comments;
    }

    // Check if all required clearances approved
    workflow.allClearancesApproved = workflow.clearances
      .filter(c => c.required)
      .every(c => c.status === "Approved");

    return this.updateWorkflow(exitId, {
      clearances: workflow.clearances,
      allClearancesApproved: workflow.allClearancesApproved,
    });
  }

  /**
   * Calculate final settlement
   */
  calculateSettlement(
    exitId: string,
    calculatedBy: string,
    data: {
      pendingSalary: number;
      leaveEncashment: number;
      bonus?: number;
      advancesNotRepaid?: number;
      dailyRate?: number; // For notice shortfall calculation
    }
  ): FinalSettlement {
    const workflow = this.getById(exitId);
    if (!workflow) {
      throw new Error("Exit workflow not found");
    }

    // Calculate notice shortfall deduction
    const today = new Date().toISOString().split('T')[0];
    const actualLastDate = workflow.actualLastDate || today;
    const lastWorkingDate = new Date(workflow.lastWorkingDate);
    const actualDate = new Date(actualLastDate);
    const daysDiff = Math.ceil((lastWorkingDate.getTime() - actualDate.getTime()) / (1000 * 60 * 60 * 24));

    const noticeShortfall = Math.max(0, daysDiff);
    const dailyRate = data.dailyRate || 0;
    const noticeShortfallDeduction = noticeShortfall * dailyRate;

    // Calculate asset recovery
    const missingAssets = workflow.assets.filter(a => a.status === "Missing");
    const assetRecovery = missingAssets.reduce((sum, asset) => {
      return sum + (asset.replacementCost || 0);
    }, 0);

    // Calculate totals
    const totalEarnings =
      data.pendingSalary +
      data.leaveEncashment +
      (data.bonus || 0);

    const totalDeductions =
      noticeShortfallDeduction +
      (data.advancesNotRepaid || 0) +
      assetRecovery;

    const netSettlement = totalEarnings - totalDeductions;

    const settlement: FinalSettlement = {
      settlementId: `SETTLE-${exitId}`,
      calculatedAt: new Date().toISOString(),
      calculatedBy,
      pendingSalary: data.pendingSalary,
      leaveEncashment: data.leaveEncashment,
      bonus: data.bonus || 0,
      otherEarnings: {},
      totalEarnings,
      noticeShortfallDeduction,
      advancesNotRepaid: data.advancesNotRepaid || 0,
      assetRecovery,
      otherDeductions: {},
      totalDeductions,
      netSettlement,
      paymentStatus: "Pending",
    };

    // Update workflow with settlement
    this.updateWorkflow(exitId, {
      settlement,
      noticePeriodServed: workflow.noticePeriodDays - noticeShortfall,
      noticeShortfall,
    });

    logger.log("ExitWorkflow: Settlement calculated", {
      exitId,
      netSettlement,
    });

    return settlement;
  }

  /**
   * Complete exit workflow
   */
  completeExit(exitId: string, completedBy: string): ExitWorkflow | null {
    const workflow = this.getById(exitId);
    if (!workflow) return null;

    if (!workflow.allAssetsReturned) {
      throw new Error("Cannot complete exit: Not all assets returned");
    }

    if (!workflow.allClearancesApproved) {
      throw new Error("Cannot complete exit: Not all clearances approved");
    }

    if (!workflow.settlement) {
      throw new Error("Cannot complete exit: Settlement not calculated");
    }

    return this.updateWorkflow(exitId, {
      exitStatus: "Completed",
      completedAt: new Date().toISOString(),
      completedBy,
    });
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): ExitWorkflow[] {
    return DataService.get<ExitWorkflow>(this.STORAGE_KEY);
  }

  /**
   * Get by ID
   */
  getById(exitId: string): ExitWorkflow | null {
    const workflows = this.getAllWorkflows();
    return workflows.find(w => w.exitId === exitId) || null;
  }

  /**
   * Get by employee
   */
  getByEmployee(employeeId: string): ExitWorkflow[] {
    return this.getAllWorkflows()
      .filter(w => w.employeeId === employeeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get by status
   */
  getByStatus(status: ExitStatus): ExitWorkflow[] {
    return this.getAllWorkflows().filter(w => w.exitStatus === status);
  }

  /**
   * Get active exits
   */
  getActiveExits(): ExitWorkflow[] {
    return this.getAllWorkflows().filter(w => w.exitStatus !== "Completed");
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Create default assets
   */
  private createDefaultAssets(): AssetItem[] {
    return [
      {
        assetId: `ASSET-${Date.now()}-1`,
        assetName: "ID Card",
        assetType: "ID Card",
        assignedDate: new Date().toISOString().split('T')[0],
        status: "Pending",
      },
      {
        assetId: `ASSET-${Date.now()}-2`,
        assetName: "Office Keys",
        assetType: "Keys",
        assignedDate: new Date().toISOString().split('T')[0],
        status: "Pending",
      },
    ];
  }

  /**
   * Create default clearances
   */
  private createDefaultClearances(): ClearanceItem[] {
    return [
      {
        clearanceId: `CLR-${Date.now()}-1`,
        department: "HR",
        status: "Pending",
        required: true,
      },
      {
        clearanceId: `CLR-${Date.now()}-2`,
        department: "Finance",
        status: "Pending",
        required: true,
      },
      {
        clearanceId: `CLR-${Date.now()}-3`,
        department: "IT",
        status: "Pending",
        required: true,
      },
      {
        clearanceId: `CLR-${Date.now()}-4`,
        department: "Admin",
        status: "Pending",
        required: false,
      },
    ];
  }

  /**
   * Generate exit ID
   */
  private generateExitId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `EXIT-${timestamp}-${random}`;
  }

  /**
   * Save workflow
   */
  private saveWorkflow(workflow: ExitWorkflow): void {
    const workflows = this.getAllWorkflows();
    workflows.push(workflow);
    DataService.setAll(this.STORAGE_KEY, workflows);
  }
}

// ========== EXPORT ==========

export const exitWorkflowService = new ExitWorkflowService();
