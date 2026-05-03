/**
 * Employee Database Service
 * Shared service for storing and retrieving employee data from the Employee Database
 */

export type SkillLevel = "Skilled" | "Semi-Skilled" | "Unskilled";
export type EmploymentStage = "Temporary" | "Permanent" | "Not Converted";
export type EmployeeStatus = "Active" | "On Leave" | "Inactive" | "Exited";
export type EmployeeType = "Full Time" | "Contract" | "Part Time";

export interface EmployeeDatabaseRecord {
  id: string;
  tempId: string;
  tempIdAssignedDate: string;
  permanentIdAssignedDate?: string;
  conversionDueDate: string; // 7 days from date of joining
  daysInTempStatus: number;
  isOverdue: boolean; // If conversion is overdue (>7 days from joining)
  employmentStage: EmploymentStage;
  nonConversionReason?: string;
  skillLevel: SkillLevel;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  fatherFirstName: string;
  fatherMiddleName?: string;
  fatherLastName: string;
  fatherName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  permanentAddress: string;
  currentAddress: string;
  emergencyContact: string;
  designation: string;
  department: string;
  reportingManager: string;
  workLocation: string;
  pinCodes: string[];
  employeeType: EmployeeType;
  dateOfJoining: string;
  probationPeriod: string;
  status: EmployeeStatus;
  confirmationDate?: string;
  journeyStage?: number;
  journeyStageName?: string;

  // ── AUTHENTICATION FIELDS ──────────────────────────────────────
  loginMobile?: string;           // Primary login ID (10-digit mobile number)
  passwordHash?: string;          // Hashed password (use btoa() for now — replace with bcrypt in production)
  tempPin?: string;               // 6-digit temporary PIN set by HR for first login
  onboardingPasswordSet: boolean; // false until employee sets own password after onboarding
  accountStatus: "pending_onboarding" | "pending_password" | "active" | "locked" | "suspended";
  failedLoginAttempts: number;    // Lock after 5 consecutive failures
  lockedUntil?: string;           // ISO timestamp — account locked until this time
  lastLogin?: string;             // ISO timestamp of most recent successful login
  passwordChangedAt?: string;     // ISO timestamp of last password change
  passwordResetRequestedAt?: string; // ISO timestamp when HR triggered a reset
  passwordResetOTP?: string;      // 6-digit OTP sent to employee's mobile for reset
  passwordResetOTPExpiry?: string; // ISO timestamp — OTP valid for 15 minutes
}

const STORAGE_KEY = "EMPLOYEE_DATABASE_RECORDS";

class EmployeeDatabaseService {
  private subscribers: Set<(employees: EmployeeDatabaseRecord[]) => void> = new Set();

  /**
   * Get all employees from the database
   */
  getAll(): EmployeeDatabaseRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return (stored ? JSON.parse(stored) : []).map((emp: any) => ({
        onboardingPasswordSet: false,
        accountStatus: "pending_onboarding",
        failedLoginAttempts: 0,
        ...emp,
      }));
    } catch (error) {
      console.error("Error loading employees from storage:", error);
      return [];
    }
  }

  /**
   * Get a single employee by ID (temp or permanent)
   */
  getById(id: string): EmployeeDatabaseRecord | undefined {
    const employees = this.getAll();
    return employees.find(emp => emp.id === id || emp.tempId === id);
  }

  /**
   * Add a new employee
   */
  add(employee: EmployeeDatabaseRecord): void {
    const employees = this.getAll();
    employees.unshift(employee); // Add at beginning
    this.save(employees);
  }

  /**
   * Update an existing employee
   */
  update(id: string, updates: Partial<EmployeeDatabaseRecord>): void {
    const employees = this.getAll();
    const index = employees.findIndex(emp => emp.id === id || emp.tempId === id);

    if (index !== -1) {
      employees[index] = { ...employees[index], ...updates };
      this.save(employees);
    }
  }

  /**
   * Delete an employee
   */
  delete(id: string): void {
    const employees = this.getAll();
    const filtered = employees.filter(emp => emp.id !== id && emp.tempId !== id);
    this.save(filtered);
  }

  /**
   * Save employees to localStorage and notify subscribers
   */
  private save(employees: EmployeeDatabaseRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
      this.notifySubscribers(employees);
    } catch (error) {
      console.error("Error saving employees to storage:", error);
    }
  }

  /**
   * Subscribe to employee data changes
   */
  subscribe(callback: (employees: EmployeeDatabaseRecord[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of data changes
   */
  private notifySubscribers(employees: EmployeeDatabaseRecord[]): void {
    this.subscribers.forEach(callback => callback(employees));
  }

  /**
   * Clear all employees (for testing/reset)
   */
  clear(): void {
    this.save([]);
  }
}

export const employeeDatabaseService = new EmployeeDatabaseService();
