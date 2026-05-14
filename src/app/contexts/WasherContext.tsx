/**
 * Washer Context - Centralized State Management
 * Provides global state and actions for the entire washer module
 * Eliminates prop drilling and ensures data consistency
 *
 * REFACTORED: Uses currentUser.employeeId from RoleContext instead of hardcoded WASHER-001
 * CRITICAL: Delegates attendance to washerAttendanceService for proper HR integration
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo} from "react";
import { useRole } from "./RoleContext";
import { useEmployeeData } from "../hooks/useEmployeeData";
import { useEvents } from "./EventSystem";
import { useJobs } from "./JobContext";
import { logger } from "../services/logger";
import { washerDataService } from "../services/washerDataService";
import { incentiveEngineService } from "../services/incentiveEngineService";
import { weekOffCoverService } from "../services/weekOffCoverService";
import { WasherAttendanceService } from "../services/washerAttendanceService";
import type { CustomerJob, WasherStats } from "../services/mockWasherDataService";
import type {
  WasherProfile,
  DayStatus,
  JobExecution,
  CheckInData,
  CheckOutData
} from "../services/washerDataService";
import type { AttendanceRecord } from "./HRDataContext";

// ========== HELPER FUNCTIONS ==========

/**
 * Derive DayStatus from AttendanceRecord (single source of truth)
 * Replaces local washerDataService.getDayStatus() cache
 */
function deriveDayStatusFromAttendance(attendance: AttendanceRecord): DayStatus {
  const hasCheckIn = !!attendance.checkInTime;
  const hasCheckOut = !!attendance.checkOutTime;

  let status: DayStatus["status"] = "NOT_STARTED";
  if (hasCheckOut) {
    status = "CHECKED_OUT";
  } else if (hasCheckIn) {
    status = "CHECKED_IN";
  }

  return {
    date: new Date(attendance.date),
    isCheckedIn: hasCheckIn,
    isCheckedOut: hasCheckOut,
    checkInTime: attendance.checkInTime ? new Date(`${attendance.date}T${attendance.checkInTime}`) : undefined,
    checkOutTime: attendance.checkOutTime ? new Date(`${attendance.date}T${attendance.checkOutTime}`) : undefined,
    status,
    isWeekOff: false, // Could be derived from employee schedule if needed
    isLate: attendance.status === "Late",
    lateReason: attendance.status === "Late" ? `Late by ${attendance.lateMinutes} minutes` : undefined,
  };
}

// ========== CONTEXT TYPES ==========

interface WasherContextType {
  // Profile
  profile: WasherProfile | null;

  // Day Status
  dayStatus: DayStatus;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  checkInTime: Date | null;
  checkOutTime: Date | null;

  // Jobs
  jobs: CustomerJob[];
  activeJob: CustomerJob | null;
  jobExecution: JobExecution | null;

  // Stats
  stats: WasherStats;

  // Actions
  checkIn: (data: CheckInData) => Promise<{ success: boolean; message?: string }>;
  checkOut: (data: CheckOutData) => Promise<{ success: boolean; message?: string }>;
  startJob: (jobId: string) => void;
  completeStep: (stepId: string) => void;
  addPhoto: (type: "BEFORE" | "DURING" | "AFTER", url: string, stepId?: string) => void;
  markConsumableUsed: (consumableId: string) => void;
  completeJob: () => void;
  refreshData: () => void;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

const WasherContext = createContext<WasherContextType | undefined>(undefined);

// ========== PROVIDER ==========

interface WasherProviderProps {
  children: ReactNode;
}

export function WasherProvider({ children }: WasherProviderProps) {
  // CRITICAL: Call ALL hooks first (Rules of Hooks)
  const { currentUser, currentRole } = useRole();
  const { addAttendanceRecord, updateAttendance, attendanceRecords } = useEmployeeData();
  const { emit } = useEvents();
  const jobContext = useJobs();

  // Check if this provider should be active
  const isCarWasherRole = currentRole === "Car Washer";
  const washerId = currentUser.employeeId || "";
  const shouldActivate = isCarWasherRole && !!washerId;

  // Log warnings but don't early return
  if (!shouldActivate && isCarWasherRole && !washerId) {
    logger.warn("WasherContext: No employeeId found in currentUser", { currentUser });
  }

  // State
  const [profile, setProfile] = useState<WasherProfile | null>(null);
  const [dayStatus, setDayStatus] = useState<DayStatus>({
    date: new Date(),
    isCheckedIn: false,
    isCheckedOut: false,
    status: "NOT_STARTED",
    isWeekOff: false,
    isLate: false,
  });
  const [jobs, setJobs] = useState<CustomerJob[]>([]);
  const [activeJob, setActiveJob] = useState<CustomerJob | null>(null);
  const [jobExecution, setJobExecution] = useState<JobExecution | null>(null);
  const [stats, setStats] = useState<WasherStats>({
    completed: 0,
    inProgress: 0,
    pending: 0,
    totalEarnings: 0,
    todayEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(!shouldActivate);
  const [error, setError] = useState<string | null>(null);

  // Dev mode debug logging
  if (shouldActivate) {
    logger.debug("WasherContext initialized", { employeeId: washerId });
  }

  // Derived state
  const isCheckedIn = dayStatus.isCheckedIn;
  const isCheckedOut = dayStatus.isCheckedOut;
  const checkInTime = dayStatus.checkInTime || null;
  const checkOutTime = dayStatus.checkOutTime || null;

  // ========== LOAD DATA ==========

  const loadData = useCallback(() => {
    if (!shouldActivate || !washerId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load profile
      const profileData = washerDataService.getWasherProfile(washerId);
      setProfile(profileData);

      // Load day status from AttendanceContext (single source of truth)
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceRecords.find(
        (a) => a.employeeId === washerId && a.date === today
      );

      if (todayAttendance) {
        const statusData = deriveDayStatusFromAttendance(todayAttendance);
        setDayStatus(statusData);
      } else {
        // No attendance record for today yet
        setDayStatus({
          date: new Date(),
          isCheckedIn: false,
          isCheckedOut: false,
          status: "NOT_STARTED",
          isWeekOff: false,
          isLate: false,
        });
      }

      // Load jobs - Bridge to JobContext (single source of truth)
      const realJobs = jobContext.getJobsByWasherId(washerId).filter(j =>
        j.scheduledDate === new Date().toISOString().split("T")[0] ||
        j.status === "In Progress" || j.status === "Assigned" || j.status === "Acknowledged"
      );
      // Map JobContext.Job to WasherContext's CustomerJob format
      // Keep washerDataService fallback if no real jobs assigned yet
      const jobsData = realJobs.length > 0 ? realJobs.map(j => ({
        id:           j.jobId,
        customerId:   j.customerId,
        customerName: j.customerName || j.customerId,
        packageType:  j.packageName,
        vehicleCategory: j.vehicleType || j.vehicleDetails?.category || "4W",
        vehicleReg:   j.vehicleReg || j.vehicleDetails?.registration || "",
        address:      j.location?.addressLine1 || "",
        pinCode:      j.pinCode || j.location?.pinCode || "",
        status:       j.status === "Assigned" ? "ASSIGNED"
                    : j.status === "Acknowledged" ? "ACKNOWLEDGED"
                    : j.status === "In Progress" ? "IN_PROGRESS"
                    : j.status === "Completed" ? "COMPLETED" : "PENDING",
        amount:       j.amount || 0,
        cityId:       j.cityId,
        scheduledDate:j.scheduledDate,
        timeSlot:     j.timeSlot,
      } as CustomerJob)) : washerDataService.getTodayJobs(washerId);
      setJobs(jobsData);

      // Load stats
      const statsData = washerDataService.getWasherStats(washerId);
      setStats(statsData);

      // Load active job
      const activeJobData = washerDataService.getInProgressJob(washerId);
      setActiveJob(activeJobData);

      if (activeJobData) {
        const executionData = washerDataService.getJobExecution(activeJobData.id);
        setJobExecution(executionData);
      }

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setIsLoading(false);
    }
  }, [shouldActivate, washerId, attendanceRecords]);

  // Load on mount and when washerId or attendanceRecords change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-sync dayStatus from AttendanceContext (single source of truth)
  useEffect(() => {
    if (!shouldActivate || !washerId) return;

    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendanceRecords.find(
      (a) => a.employeeId === washerId && a.date === today
    );

    if (todayAttendance) {
      const statusData = deriveDayStatusFromAttendance(todayAttendance);
      setDayStatus((prev) => {
        // Only update if actually changed to prevent unnecessary re-renders
        if (
          prev.isCheckedIn !== statusData.isCheckedIn ||
          prev.isCheckedOut !== statusData.isCheckedOut ||
          prev.isLate !== statusData.isLate
        ) {
          return statusData;
        }
        return prev;
      });
    }
  }, [shouldActivate, attendanceRecords, washerId]);

  // ========== ACTIONS ==========

  const checkIn = async (data: CheckInData): Promise<{ success: boolean; message?: string }> => {
    if (!shouldActivate || !washerId) {
      return { success: false, message: "Not logged in as Car Washer" };
    }

    try {
      // CRITICAL: Delegate to WasherAttendanceService for proper HR integration
      const result = WasherAttendanceService.checkIn(
        {
          employeeId: washerId,
          date: new Date().toISOString().split('T')[0],
          checkInTime: data.timestamp.toTimeString().split(' ')[0],
          location: {
            latitude: data.gpsLocation.lat,
            longitude: data.gpsLocation.lng,
          },
        },
        {
          addAttendanceRecord,
          getAttendanceForDate: (date: string) => {
            return attendanceRecords.filter(a => a.date === date);
          },
          emit,
        }
      );

      if (result.success && result.attendanceRecord) {
        // Derive day status from AttendanceContext (single source of truth)
        const newStatus = deriveDayStatusFromAttendance(result.attendanceRecord);
        setDayStatus(newStatus);
      }

      return result;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Check-in failed"
      };
    }
  };

  const checkOut = async (data: CheckOutData): Promise<{ success: boolean; message?: string }> => {
    if (!shouldActivate || !washerId) {
      return { success: false, message: "Not logged in as Car Washer" };
    }

    try {
      // CRITICAL: Delegate to WasherAttendanceService for proper HR integration
      const result = WasherAttendanceService.checkOut(
        {
          employeeId: washerId,
          date: new Date().toISOString().split('T')[0],
          checkOutTime: data.timestamp.toTimeString().split(' ')[0],
        },
        {
          attendanceRecords,
          getAttendanceForDate: (date: string) => {
            return attendanceRecords.filter(a => a.date === date);
          },
          updateAttendanceRecord: updateAttendance,
          emit,
        }
      );

      if (result.success && result.attendanceRecord) {
        // Derive day status from AttendanceContext (single source of truth)
        const newStatus = deriveDayStatusFromAttendance(result.attendanceRecord);
        setDayStatus(newStatus);

        // Refresh stats
        const newStats = washerDataService.getWasherStats(washerId);
        setStats(newStats);
      }

      return result;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Check-out failed"
      };
    }
  };

  const startJob = (jobId: string) => {
    if (!shouldActivate || !washerId) return;
    washerDataService.startJob(washerId, jobId);
    loadData(); // Refresh to get updated job
  };

  const completeStep = (stepId: string) => {
    if (!shouldActivate || !activeJob) return;

    washerDataService.completeJobStep(activeJob.id, stepId);
    const updatedExecution = washerDataService.getJobExecution(activeJob.id);
    setJobExecution(updatedExecution);
  };

  const addPhoto = (type: "BEFORE" | "DURING" | "AFTER", url: string, stepId?: string) => {
    if (!shouldActivate || !activeJob) return;

    washerDataService.addJobPhoto(activeJob.id, type, url, stepId);
    const updatedExecution = washerDataService.getJobExecution(activeJob.id);
    setJobExecution(updatedExecution);
  };

  const markConsumableUsed = (consumableId: string) => {
    if (!shouldActivate || !activeJob) return;

    washerDataService.markConsumableUsed(activeJob.id, consumableId);
    const updatedExecution = washerDataService.getJobExecution(activeJob.id);
    setJobExecution(updatedExecution);
  };

  const completeJob = () => {
    if (!shouldActivate || !activeJob) return;

    washerDataService.completeJob(activeJob.id);

    // ✅ Bridge: update the canonical JobContext record
    const jobContextJob = jobContext.getJobById(activeJob.id);
    if (jobContextJob) {
      jobContext.completeJob(activeJob.id, {
        qualityScore:   activeJob.qualityScore   || 85,
        complianceScore:activeJob.complianceScore || 90,
      });
      // emit is handled inside jobContext.completeJob with the amount field
    } else {
      // Job only exists in washer service — emit event directly
      emit("JOB_COMPLETED", {
        jobId:       activeJob.id,
        washerId:    washerId,
        washerName:  profile?.name || washerId,
        customerId:  activeJob.customerId,
        packageName: activeJob.packageType,
        amount:      activeJob.amount || 0,
        cityId:      activeJob.cityId,
        completedAt: new Date().toISOString(),
      }, "WasherContext");
    }

    // ✅ Trigger incentive calculation after job completion
    if (washerId) {
      incentiveEngineService.processJobCompletion?.({
        washerId,
        jobId:      activeJob.id,
        cityId:     activeJob.cityId,
        packageName:activeJob.packageType,
        completedAt:new Date().toISOString(),
      });
    }

    loadData();
  };

  const refreshData = () => {
    loadData();
  };

  // ========== PROVIDER VALUE ==========

  const contextValue: WasherContextType = useMemo(() => ({
    profile,
    dayStatus,
    isCheckedIn,
    isCheckedOut,
    checkInTime,
    checkOutTime,
    jobs,
    activeJob,
    jobExecution,
    stats,
    checkIn,
    checkOut,
    startJob,
    completeStep,
    addPhoto,
    markConsumableUsed,
    completeJob,
    refreshData,
    isLoading,
    error,
  }),
  [profile, dayStatus, isCheckedIn, isCheckedOut, checkInTime, checkOutTime, jobs, activeJob, jobExecution, stats]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WasherContext.Provider value={contextValue}>
      {children}
    </WasherContext.Provider>
  );
}

// ========== HOOK ==========

export function useWasher() {
  const context = useContext(WasherContext);
  if (!context) {
    throw new Error(
      "useWasher must be used within WasherProvider. " +
      "Make sure: (1) You're logged in as a 'Car Washer' role, and (2) The component is wrapped with AppProvider."
    );
  }
  return context;
}

// ========== HELPER HOOKS ==========

export function useWasherJobs() {
  const { jobs } = useWasher();

  return {
    pendingJobs: jobs.filter(job => job.status === "ASSIGNED" || job.status === "PENDING"),
    completedJobs: jobs.filter(job => job.status === "COMPLETED"),
  };
}

/**
 * BEFORE (WRONG):
 * ```typescript
 * export function WasherProvider({ children, washerId = "WASHER-001" }: WasherProviderProps) {
 *   // Hardcoded washerId
 * }
 * ```
 *
 * AFTER (CORRECT):
 * ```typescript
 * export function WasherProvider({ children }: WasherProviderProps) {
 *   const { currentUser } = useRole();
 *   const washerId = currentUser.employeeId || "WASHER-FALLBACK";
 *   // Uses logged-in user's employeeId
 * }
 * ```
 *
 * BENEFIT:
 * - Different washers see their own data
 * - Multi-user capable
 * - No hardcoded IDs
 * - Single source of truth from RoleContext
 */
