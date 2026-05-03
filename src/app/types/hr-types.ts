/**
 * Comprehensive HR Data Type Definitions
 * Central type definitions for all HR, Payroll, and Attendance modules
 */

// ==================== EMPLOYEE TYPES ====================

export interface Employee {
  id: string;
  employeeCode: string;
  personalInfo: PersonalInfo;
  employmentInfo: EmploymentInfo;
  salaryInfo: SalaryInfo;
  attendanceInfo: AttendanceInfo;
  leaveInfo: LeaveInfo;
  documents: DocumentInfo[];
  onboardingStatus: OnboardingStatus;
  status: "active" | "inactive" | "on_leave" | "terminated";
  // MC-09: Fraud Detection - Work location for GPS validation
  workLocation?: {
    lat: number;
    lng: number;
    radius: number; // meters (e.g., 200m)
  };
  // MC-10: Shift Management
  shiftId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed";
  bloodGroup?: string;
  nationality: string;
  religion?: string;
  contactInfo: ContactInfo;
  emergencyContact: EmergencyContact;
  identityProof: IdentityProof;
}

export interface ContactInfo {
  email: string;
  phone: string;
  alternatePhone?: string;
  currentAddress: Address;
  permanentAddress: Address;
  sameAsCurrentAddress: boolean;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
}

export interface IdentityProof {
  aadhaarNumber?: string;
  panNumber?: string;
  passportNumber?: string;
  drivingLicenseNumber?: string;
  voterIdNumber?: string;
}

export interface EmploymentInfo {
  employeeType: "Full-Time" | "Part-Time" | "Contract" | "Intern";
  department: string;
  designation: string;
  role: string;
  reportingManager?: string;
  dateOfJoining: string;
  confirmationDate?: string;
  probationPeriod: number; // In months
  noticePeriod: number; // In days
  location: string;
  shift: string;
  workingHoursPerDay: number;
  standardFtHours: number;
}

export interface SalaryInfo {
  salaryStructureId: string;
  salaryStructureName: string;
  ctc: number;
  basicSalary: number;
  earnings: SalaryComponent[];
  deductions: SalaryComponent[];
  employerContributions: SalaryComponent[];
  grossSalary: number;
  netSalary: number;
  effectiveFrom: string;
  bankDetails: BankDetails;
  pfDetails?: PFDetails;
  esicDetails?: ESICDetails;
}

export interface SalaryComponent {
  id: number;
  name: string;
  type: "Fixed" | "%";
  value: string;
  baseOn?: "Basic" | "Gross";
  calculatedAmount?: number;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: "Savings" | "Current";
}

export interface PFDetails {
  uanNumber?: string;
  pfNumber?: string;
  isPfApplicable: boolean;
  employeeContribution: number;
  employerContribution: number;
}

export interface ESICDetails {
  esicNumber?: string;
  isEsicApplicable: boolean;
  employeeContribution: number;
  employerContribution: number;
}

export interface AttendanceInfo {
  attendanceMode: "Biometric" | "Manual" | "Mobile" | "Web";
  attendanceDeviceId?: string;
  weeklyOff: string; // e.g., "Sunday"
  workSchedule: WorkSchedule;
}

export interface WorkSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isWorkingDay: boolean;
  startTime?: string;
  endTime?: string;
  breakDuration?: number; // In minutes
}

export interface LeaveInfo {
  leaveBalance: LeaveBalance;
  leaveHistory: LeaveRecord[];
}

export interface LeaveBalance {
  casualLeave: number;
  sickLeave: number;
  privilegedLeave: number;
  earnedLeave: number;
  compOff: number;
  maternityLeave?: number;
  paternityLeave?: number;
  lwp: number;
}

export interface LeaveRecord {
  id: string;
  leaveType: "CL" | "SL" | "PL" | "EL" | "COFF" | "ML" | "PTL" | "LWP";
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  rejectionReason?: string;
}

export interface DocumentInfo {
  id: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  uploadedOn: string;
  uploadedBy: string;
  verificationStatus: "Pending" | "Verified" | "Rejected";
  verifiedBy?: string;
  verifiedOn?: string;
}

export interface OnboardingStatus {
  currentStage: "Not Started" | "In Progress" | "Completed";
  personalInfoCompleted: boolean;
  employmentInfoCompleted: boolean;
  documentsUploaded: boolean;
  bankDetailsCompleted: boolean;
  statutoryDetailsCompleted: boolean;
  offerLetterGenerated: boolean;
  appointmentLetterGenerated: boolean;
  idCardGenerated: boolean;
  completedOn?: string;
}

// ==================== ATTENDANCE TYPES ====================

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  cityId: string; // City scope for multi-city isolation
  date: string;
  day: string;
  attendanceType: "P" | "A" | "WOFF" | "PH" | "CL" | "SL" | "PL" | "EL" | "HPL" | "COFF" | "LWP" | "ML" | "PTL";
  inTime: string | null;
  outTime: string | null;
  workingHours: number;
  lateComingCount: number;
  autoLogoutCount: number;
  isSunday: boolean;
  isPublicHoliday: boolean;
  publicHolidayName?: string;
  overtimeHours?: number;
  remarks?: string;
  // MC-09: Fraud Detection
  gpsLat?: number;
  gpsLng?: number;
  deviceId?: string;
  flag?: "NONE" | "GPS_MISMATCH" | "TIME_ANOMALY" | "DUPLICATE" | "MULTI_DEVICE";
  flagReason?: string;
  // MC-10: Shift & Overtime
  workMinutes?: number;
  lateMinutes?: number;
  overtimeMinutes?: number;
}

export interface MonthlyAttendanceSummary {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  month: number;
  year: number;
  totalDays: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  paidDays: number;
  weeklyOff: number;
  publicHolidays: number;
  leaveWithSalary: number;
  leaveWithoutPay: number;
  halfDays: number;
  lateComingCount: number;
  autoLogoutCount: number;
  attendanceDeduction: number;
  daysDeducted: number;
  leaveAdjustment: LeaveAdjustment;
}

export interface LeaveAdjustment {
  casualLeave: number;
  sickLeave: number;
  privilegedLeave: number;
  earnedLeave: number;
  halfDayLeave: number;
  compOff: number;
  maternityLeave: number;
  paternityLeave: number;
  lwp: number;
}

// ==================== PAYROLL TYPES ====================

export interface SalaryStructure {
  id: string;
  name: string;
  description: string;
  applicableFor: {
    employeeTypes: ("Full-Time" | "Part-Time" | "Contract" | "Intern")[];
    departments: string[];
    designations: string[];
    roles: string[];
  };
  components: {
    earnings: SalaryComponent[];
    deductions: SalaryComponent[];
    employerContributions: SalaryComponent[];
  };
  rules: SalaryRule[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryRule {
  id: string;
  ruleType: "Percentage" | "Fixed" | "Conditional";
  condition?: string;
  formula?: string;
  description: string;
}

export interface PayrollRun {
  id: string;
  runName: string;
  month: number;
  year: number;
  runDate: string;
  status: "Draft" | "Processing" | "Review" | "Approved" | "Processed" | "Completed";
  employees: PayrollEmployee[];
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  processedBy?: string;
  approvedBy?: string;
  approvedOn?: string;
  processedOn?: string;
}

export interface PayrollEmployee {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  attendanceSummary: MonthlyAttendanceSummary;
  salaryCalculation: SalaryCalculation;
  payslipGenerated: boolean;
  paymentStatus: "Pending" | "Processed" | "Failed";
}

export interface SalaryCalculation {
  basicSalary: number;
  earnings: ComponentCalculation[];
  grossSalary: number;
  deductions: ComponentCalculation[];
  employerContributions: ComponentCalculation[];
  totalDeductions: number;
  netSalary: number;
  daysWorked: number;
  daysInMonth: number;
  proratedSalary: boolean;
  adjustments: SalaryAdjustment[];
}

export interface ComponentCalculation {
  componentName: string;
  componentType: "Fixed" | "%";
  baseValue: string;
  baseOn?: "Basic" | "Gross";
  calculatedAmount: number;
}

export interface SalaryAdjustment {
  type: "Arrears" | "Deduction" | "Bonus" | "Incentive" | "Reimbursement";
  amount: number;
  reason: string;
  approvedBy?: string;
}

// ==================== LEAVE TYPES ====================

export interface LeavePolicy {
  id: string;
  policyName: string;
  applicableFor: {
    employeeTypes: ("Full-Time" | "Part-Time" | "Contract" | "Intern")[];
    departments: string[];
  };
  leaveTypes: LeavePolicyType[];
  rules: LeavePolicyRule[];
  isActive: boolean;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface LeavePolicyType {
  leaveType: string;
  leaveCode: string;
  annualQuota: number;
  carryForward: boolean;
  maxCarryForward?: number;
  encashment: boolean;
  maxEncashment?: number;
  isPaid: boolean;
  requiresApproval: boolean;
  minNoticeRequired: number; // In days
  maxConsecutiveDays?: number;
  applicableAfter: number; // In months of service
  accrualType: "Monthly" | "Yearly" | "Custom";
}

export interface LeavePolicyRule {
  id: string;
  ruleType: string;
  condition: string;
  action: string;
  description: string;
}

// ==================== HOLIDAY TYPES ====================

export interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  day: string;
  type: "National" | "State" | "Regional" | "Optional";
  locations: string[];
  year: number;
  isOptional: boolean;
  description?: string;
}

// ==================== DEPARTMENT & ROLE TYPES ====================

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string;
  headOfDepartment?: string;
  parentDepartment?: string;
  costCenter?: string;
  isActive: boolean;
}

export interface Designation {
  id: string;
  code: string;
  name: string;
  level: number;
  department: string;
  reportsTo?: string;
  description: string;
  isActive: boolean;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  category: string;
  department: string;
  baseValues: {
    basic: number;
    hra: number;
    allowances: number;
    pt: number;
  };
  isActive: boolean;
}

// ==================== AUDIT & SYSTEM TYPES ====================

export interface AuditLog {
  id: string;
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performedAt: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress?: string;
  userAgent?: string;
}

export interface SystemConfiguration {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string;
  updatedBy: string;
  updatedAt: string;
}

// ==================== SHIFT TYPES (MC-10) ====================

export interface Shift {
  id: string;
  name: string;
  cityId: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  graceMinutes: number; // Late grace period
  overtimeThresholdMinutes: number; // When overtime kicks in
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
