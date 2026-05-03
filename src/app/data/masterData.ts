// Master Synchronized Data for CleanCar 360° Doorstep Service - Surat
// All data synchronized across modules - March 2026

import { WASHER_PERFORMANCE_DATA } from "./washerPerformanceData";
import { REVENUE_DATA_MARCH_2026 } from "./revenueData";

// ============================================
// CUSTOMERS & SUBSCRIPTIONS
// ============================================

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  pinCode: string;
  area: string;
  address: string;
  carNo: string;
  carModel: string;
  carType: string; // Hatchback, Sedan, SUV
  plan: string; // Package name
  subscriptionType: string; // Weekly, Monthly, Quarterly
  status: "Active" | "Paused" | "Cancelled";
  mrr: number;
  startDate: string;
  nextWash: string;
  assignedWasherId: string;
  assignedWasherName: string;
  totalWashes: number;
  avgRating: number;
}

export const MASTER_CUSTOMERS: Customer[] = [
  {
    id: "CUST-395005-001",
    name: "Rajesh Patel",
    mobile: "+91 98765 43210",
    email: "rajesh.patel@gmail.com",
    pinCode: "395005",
    area: "Vesu",
    address: "A-202, Sarjan Towers, Vesu, Surat",
    carNo: "GJ05AB1234",
    carModel: "Honda City",
    carType: "Sedan",
    plan: "Premium",
    subscriptionType: "Monthly",
    status: "Active",
    mrr: 1200,
    startDate: "2026-01-01",
    nextWash: "2026-03-20",
    assignedWasherId: "washer-001",
    assignedWasherName: "Suresh Kumar",
    totalWashes: 47,
    avgRating: 4.8,
  },
  {
    id: "CUST-395005-012",
    name: "Sneha Desai",
    mobile: "+91 98765 43211",
    email: "sneha.desai@yahoo.com",
    pinCode: "395005",
    area: "Vesu",
    address: "B-105, Orchid Residency, Vesu, Surat",
    carNo: "GJ05CD5678",
    carModel: "Maruti Swift",
    carType: "Hatchback",
    plan: "Basic",
    subscriptionType: "Weekly",
    status: "Active",
    mrr: 400,
    startDate: "2025-12-15",
    nextWash: "2026-03-19",
    assignedWasherId: "washer-001",
    assignedWasherName: "Suresh Kumar",
    totalWashes: 52,
    avgRating: 4.6,
  },
  {
    id: "CUST-395005-025",
    name: "Vijay Shah",
    mobile: "+91 98765 43212",
    email: "vijay.shah@outlook.com",
    pinCode: "395005",
    area: "Vesu",
    address: "C-301, Green Avenue, Vesu, Surat",
    carNo: "GJ05EF9012",
    carModel: "Toyota Fortuner",
    carType: "SUV",
    plan: "Elite",
    subscriptionType: "Monthly",
    status: "Active",
    mrr: 2000,
    startDate: "2026-02-01",
    nextWash: "2026-03-21",
    assignedWasherId: "washer-001",
    assignedWasherName: "Suresh Kumar",
    totalWashes: 18,
    avgRating: 4.9,
  },
  {
    id: "CUST-395001-008",
    name: "Anil Verma",
    mobile: "+91 98765 43213",
    email: "anil.verma@gmail.com",
    pinCode: "395001",
    area: "Adajan",
    address: "D-501, Sky Heights, Adajan, Surat",
    carNo: "GJ05GH3456",
    carModel: "BMW X5",
    carType: "SUV",
    plan: "Elite Plus",
    subscriptionType: "Monthly",
    status: "Active",
    mrr: 2800,
    startDate: "2025-11-01",
    nextWash: "2026-03-22",
    assignedWasherId: "washer-002",
    assignedWasherName: "Ramesh K.",
    totalWashes: 65,
    avgRating: 4.9,
  },
  {
    id: "CUST-395002-014",
    name: "Pooja Mehta",
    mobile: "+91 98765 43214",
    email: "pooja.mehta@hotmail.com",
    pinCode: "395002",
    area: "Athwa",
    address: "E-102, Pearl Residency, Athwa, Surat",
    carNo: "GJ05IJ7890",
    carModel: "Hyundai Creta",
    carType: "SUV",
    plan: "Premium",
    subscriptionType: "Monthly",
    status: "Active",
    mrr: 1200,
    startDate: "2026-01-15",
    nextWash: "2026-03-20",
    assignedWasherId: "washer-002",
    assignedWasherName: "Ramesh K.",
    totalWashes: 32,
    avgRating: 4.7,
  },
  {
    id: "CUST-395004-021",
    name: "Karthik Iyer",
    mobile: "+91 98765 43215",
    email: "karthik.iyer@gmail.com",
    pinCode: "395004",
    area: "Althan",
    address: "F-203, Silver Oak, Althan, Surat",
    carNo: "GJ05KL1234",
    carModel: "Mercedes C-Class",
    carType: "Sedan",
    plan: "Elite",
    subscriptionType: "Monthly",
    status: "Active",
    mrr: 2000,
    startDate: "2025-10-01",
    nextWash: "2026-03-23",
    assignedWasherId: "washer-003",
    assignedWasherName: "Mahesh S.",
    totalWashes: 72,
    avgRating: 4.8,
  },
];

// ============================================
// LEADS & CRM
// ============================================

export interface Lead {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  source: string;
  pinCode: string;
  area: string;
  carType: string;
  carModel?: string;
  status: "New" | "In Progress" | "Converted" | "Lost";
  assignedTo: string;
  assignedToRole: string;
  createdAt: string;
  updatedAt: string;
  sla: string;
  notes?: string;
  interestedPackage?: string;
}

export const MASTER_LEADS: Lead[] = [
  {
    id: "LD-MAR-001",
    name: "Rahul Sharma",
    mobile: "+91 99887 76655",
    email: "rahul.sharma@gmail.com",
    source: "Website",
    pinCode: "395007",
    area: "Pal",
    carType: "Sedan",
    carModel: "Honda City",
    status: "New",
    assignedTo: "Neha Singh",
    assignedToRole: "TSE",
    createdAt: "2026-03-18 10:30",
    updatedAt: "2026-03-18 10:30",
    sla: "2h remaining",
    interestedPackage: "Premium",
  },
  {
    id: "LD-MAR-002",
    name: "Priya Kapoor",
    mobile: "+91 99887 76656",
    email: "priya.kapoor@yahoo.com",
    source: "Google Ads",
    pinCode: "395004",
    area: "Althan",
    carType: "SUV",
    carModel: "Toyota Fortuner",
    status: "In Progress",
    assignedTo: "Neha Singh",
    assignedToRole: "TSE",
    createdAt: "2026-03-17 14:20",
    updatedAt: "2026-03-18 09:15",
    sla: "On Track",
    notes: "Interested in Elite package, requested callback",
    interestedPackage: "Elite",
  },
  {
    id: "LD-MAR-003",
    name: "Amit Desai",
    mobile: "+91 99887 76657",
    email: "amit.desai@outlook.com",
    source: "Referral",
    pinCode: "395009",
    area: "Piplod",
    carType: "Hatchback",
    carModel: "Maruti Swift",
    status: "Converted",
    assignedTo: "Vikram Kumar",
    assignedToRole: "TSM",
    createdAt: "2026-03-15 09:15",
    updatedAt: "2026-03-17 16:30",
    sla: "Closed",
    notes: "Converted to Basic Monthly subscription",
    interestedPackage: "Basic",
  },
  {
    id: "LD-MAR-004",
    name: "Meera Kulkarni",
    mobile: "+91 99887 76658",
    email: "meera.kulkarni@gmail.com",
    source: "Facebook",
    pinCode: "395006",
    area: "Rander",
    carType: "Sedan",
    carModel: "Hyundai Verna",
    status: "New",
    assignedTo: "Neha Singh",
    assignedToRole: "TSE",
    createdAt: "2026-03-18 11:45",
    updatedAt: "2026-03-18 11:45",
    sla: "1h 30m remaining",
    interestedPackage: "Premium",
  },
];

// ============================================
// COMPLAINTS
// ============================================

export interface Complaint {
  id: string;
  customerId: string;
  customerName: string;
  carNo: string;
  mobile: string;
  type: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  status: "Open" | "In Progress" | "Escalated" | "Resolved" | "Closed";
  assignedTo: string;
  assignedToRole: string;
  washerId?: string;
  washerName?: string;
  jobReference?: string;
  createdAt: string;
  updatedAt: string;
  sla: string;
  resolution?: string;
  resolutionDate?: string;
}

export const MASTER_COMPLAINTS: Complaint[] = [
  {
    id: "CM-MAR-001",
    customerId: "CUST-395005-001",
    customerName: "Rajesh Patel",
    carNo: "GJ05AB1234",
    mobile: "+91 98765 43210",
    type: "Service Quality",
    severity: "Medium",
    description: "Interior cleaning was not thorough, dashboard still dusty",
    status: "In Progress",
    assignedTo: "Ramesh Patel",
    assignedToRole: "Supervisor",
    washerId: "washer-001",
    washerName: "Suresh Kumar",
    jobReference: "JOB-2026-03-15-142",
    createdAt: "2026-03-17 11:00",
    updatedAt: "2026-03-17 14:30",
    sla: "2h remaining",
    resolution: "Re-wash scheduled for tomorrow morning",
  },
  {
    id: "CM-MAR-002",
    customerId: "CUST-395005-012",
    customerName: "Sneha Desai",
    carNo: "GJ05CD5678",
    mobile: "+91 98765 43211",
    type: "Missed Service",
    severity: "High",
    description: "Washer didn't arrive on scheduled date (16 Mar)",
    status: "Resolved",
    assignedTo: "Ramesh Patel",
    assignedToRole: "Supervisor",
    washerId: "washer-001",
    washerName: "Suresh Kumar",
    jobReference: "JOB-2026-03-16-MISSED",
    createdAt: "2026-03-16 10:30",
    updatedAt: "2026-03-17 09:00",
    sla: "Resolved",
    resolution: "Washer was on sick leave. Service rescheduled and completed on 17 Mar with complimentary premium wash",
    resolutionDate: "2026-03-17",
  },
  {
    id: "CM-MAR-003",
    customerId: "CUST-395001-008",
    customerName: "Anil Verma",
    carNo: "GJ05GH3456",
    mobile: "+91 98765 43213",
    type: "Payment Issue",
    severity: "Low",
    description: "UPI payment debited but not reflected in system",
    status: "Closed",
    assignedTo: "Accounts Team",
    assignedToRole: "Accounts",
    createdAt: "2026-03-15 14:20",
    updatedAt: "2026-03-15 16:45",
    sla: "Closed",
    resolution: "Payment gateway sync issue. Manually verified and updated in system",
    resolutionDate: "2026-03-15",
  },
];

// ============================================
// INVENTORY & CONSUMABLES
// ============================================

export interface InventoryItem {
  id: string;
  materialId?: string; // Links to MATERIALS_MASTER
  itemName: string;
  category: "Consumable" | "Equipment" | "Tool" | "PPE";
  currentStock: number;
  unit: string;
  minStockLevel: number;
  reorderPoint: number;
  valuePerUnit: number;
  totalValue: number;
  lastRestocked: string;
  vendor: string;
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Reorder";
}

export const MASTER_INVENTORY: InventoryItem[] = [
  {
    id: "INV-001",
    materialId: "1",
    itemName: "Foam Shampoo",
    category: "Consumable",
    currentStock: 125000, // ml
    unit: "ml",
    minStockLevel: 50000,
    reorderPoint: 75000,
    valuePerUnit: 0.82,
    totalValue: 102500,
    lastRestocked: "2026-03-10",
    vendor: "ChemClean Industries",
    status: "In Stock",
  },
  {
    id: "INV-002",
    materialId: "2",
    itemName: "Wheel Cleaner",
    category: "Consumable",
    currentStock: 68000, // ml
    unit: "ml",
    minStockLevel: 40000,
    reorderPoint: 60000,
    valuePerUnit: 1.20,
    totalValue: 81600,
    lastRestocked: "2026-03-08",
    vendor: "AutoCare Solutions",
    status: "In Stock",
  },
  {
    id: "INV-003",
    materialId: "7",
    itemName: "Glass Cleaner",
    category: "Consumable",
    currentStock: 32000, // ml
    unit: "ml",
    minStockLevel: 30000,
    reorderPoint: 45000,
    valuePerUnit: 0.60,
    totalValue: 19200,
    lastRestocked: "2026-03-12",
    vendor: "ChemClean Industries",
    status: "Low Stock",
  },
  {
    id: "INV-004",
    materialId: "9",
    itemName: "Tire Shine",
    category: "Consumable",
    currentStock: 22000, // ml
    unit: "ml",
    minStockLevel: 20000,
    reorderPoint: 30000,
    valuePerUnit: 1.50,
    totalValue: 33000,
    lastRestocked: "2026-03-05",
    vendor: "AutoCare Solutions",
    status: "Low Stock",
  },
  {
    id: "INV-005",
    itemName: "Microfiber Cloth (Premium)",
    category: "Tool",
    currentStock: 240,
    unit: "pieces",
    minStockLevel: 100,
    reorderPoint: 150,
    valuePerUnit: 50,
    totalValue: 12000,
    lastRestocked: "2026-03-01",
    vendor: "CarCare Supplies",
    status: "In Stock",
  },
  {
    id: "INV-006",
    itemName: "Foam Gun",
    category: "Equipment",
    currentStock: 12,
    unit: "units",
    minStockLevel: 8,
    reorderPoint: 10,
    valuePerUnit: 2400,
    totalValue: 28800,
    lastRestocked: "2026-02-15",
    vendor: "ProWash Equipment",
    status: "In Stock",
  },
  {
    id: "INV-007",
    itemName: "Vacuum Cleaner (Portable)",
    category: "Equipment",
    currentStock: 8,
    unit: "units",
    minStockLevel: 6,
    reorderPoint: 8,
    valuePerUnit: 14500,
    totalValue: 116000,
    lastRestocked: "2026-02-10",
    vendor: "ProWash Equipment",
    status: "Reorder",
  },
];

// ============================================
// WASH RECORDS & JOB EXECUTION
// ============================================

export interface WashRecord {
  id: string;
  jobReference: string;
  customerId: string;
  customerName: string;
  carNo: string;
  carModel: string;
  packageType: string;
  washerId: string;
  washerName: string;
  supervisorId: string;
  supervisorName: string;
  date: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  duration?: number; // minutes
  status: "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Missed";
  location: string; // Customer address
  pinCode: string;
  beforePhoto: boolean;
  afterPhoto: boolean;
  customerRating?: number;
  customerFeedback?: string;
  materialsUsed?: {
    materialId: string;
    quantity: number;
    unit: string;
  }[];
}

export const MASTER_WASH_RECORDS: WashRecord[] = [
  {
    id: "WR-MAR-001",
    jobReference: "JOB-2026-03-18-001",
    customerId: "CUST-395005-001",
    customerName: "Rajesh Patel",
    carNo: "GJ05AB1234",
    carModel: "Honda City",
    packageType: "Premium",
    washerId: "washer-001",
    washerName: "Suresh Kumar",
    supervisorId: "supervisor-ramesh",
    supervisorName: "Ramesh Patel",
    date: "2026-03-18",
    scheduledTime: "07:30 AM",
    actualStartTime: "07:32 AM",
    actualEndTime: "08:05 AM",
    duration: 33,
    status: "Completed",
    location: "A-202, Sarjan Towers, Vesu, Surat",
    pinCode: "395005",
    beforePhoto: true,
    afterPhoto: true,
    customerRating: 5,
    customerFeedback: "Excellent work as always!",
    materialsUsed: [
      { materialId: "1", quantity: 200, unit: "ml" },
      { materialId: "2", quantity: 150, unit: "ml" },
      { materialId: "7", quantity: 80, unit: "ml" },
    ],
  },
  {
    id: "WR-MAR-002",
    jobReference: "JOB-2026-03-18-002",
    customerId: "CUST-395005-012",
    customerName: "Sneha Desai",
    carNo: "GJ05CD5678",
    carModel: "Maruti Swift",
    packageType: "Basic",
    washerId: "washer-001",
    washerName: "Suresh Kumar",
    supervisorId: "supervisor-ramesh",
    supervisorName: "Ramesh Patel",
    date: "2026-03-18",
    scheduledTime: "08:30 AM",
    actualStartTime: "08:35 AM",
    status: "In Progress",
    location: "B-105, Orchid Residency, Vesu, Surat",
    pinCode: "395005",
    beforePhoto: true,
    afterPhoto: false,
  },
  {
    id: "WR-MAR-003",
    jobReference: "JOB-2026-03-17-045",
    customerId: "CUST-395001-008",
    customerName: "Anil Verma",
    carNo: "GJ05GH3456",
    carModel: "BMW X5",
    packageType: "Elite Plus",
    washerId: "washer-002",
    washerName: "Ramesh K.",
    supervisorId: "supervisor-ramesh",
    supervisorName: "Ramesh Patel",
    date: "2026-03-17",
    scheduledTime: "09:00 AM",
    actualStartTime: "09:05 AM",
    actualEndTime: "09:42 AM",
    duration: 37,
    status: "Completed",
    location: "D-501, Sky Heights, Adajan, Surat",
    pinCode: "395001",
    beforePhoto: true,
    afterPhoto: true,
    customerRating: 5,
    customerFeedback: "Premium service, very satisfied",
    materialsUsed: [
      { materialId: "1", quantity: 250, unit: "ml" },
      { materialId: "2", quantity: 200, unit: "ml" },
      { materialId: "7", quantity: 120, unit: "ml" },
      { materialId: "9", quantity: 100, unit: "ml" },
    ],
  },
];

// ============================================
// ATTENDANCE
// ============================================

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "Present" | "Absent" | "Half Day" | "Leave" | "Working";
  location?: string;
  jobsCompleted?: number;
  selfieVerified: boolean;
  gpsVerified: boolean;
}

export const MASTER_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "ATT-2026-03-18-001",
    employeeId: "washer-001",
    employeeName: "Suresh Kumar",
    role: "Car Washer",
    date: "2026-03-18",
    checkIn: "04:02 AM",
    checkOut: "09:05 AM",
    status: "Working",
    location: "Vesu Zone (395005)",
    jobsCompleted: 18,
    selfieVerified: true,
    gpsVerified: true,
  },
  {
    id: "ATT-2026-03-18-002",
    employeeId: "washer-002",
    employeeName: "Ramesh K.",
    role: "Car Washer",
    date: "2026-03-18",
    checkIn: "04:00 AM",
    checkOut: "08:58 AM",
    status: "Present",
    location: "Adajan Zone (395001)",
    jobsCompleted: 21,
    selfieVerified: true,
    gpsVerified: true,
  },
  {
    id: "ATT-2026-03-18-003",
    employeeId: "washer-003",
    employeeName: "Mahesh S.",
    role: "Car Washer",
    date: "2026-03-18",
    checkIn: "04:05 AM",
    status: "Working",
    location: "Althan Zone (395004)",
    jobsCompleted: 16,
    selfieVerified: true,
    gpsVerified: true,
  },
  {
    id: "ATT-2026-03-16-001",
    employeeId: "washer-001",
    employeeName: "Suresh Kumar",
    role: "Car Washer",
    date: "2026-03-16",
    status: "Leave",
    location: "—",
    jobsCompleted: 0,
    selfieVerified: false,
    gpsVerified: false,
  },
];

// ============================================
// APPROVALS
// ============================================

export interface Approval {
  id: string;
  type: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  description: string;
  amount?: number;
  item?: string;
  status: "Pending" | "Approved" | "Rejected";
  priority: "Low" | "Medium" | "High" | "Critical";
  approverId?: string;
  approverName?: string;
  approverRole: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  comments?: string;
}

export const MASTER_APPROVALS: Approval[] = [
  {
    id: "APP-MAR-001",
    type: "Cash Collection",
    requesterId: "supervisor-ramesh",
    requesterName: "Ramesh Patel",
    requesterRole: "Supervisor",
    description: "Weekly cash collection from field - 5 washers",
    amount: 18500,
    status: "Pending",
    priority: "High",
    approverRole: "Accounts",
    createdAt: "2026-03-18 10:30",
  },
  {
    id: "APP-MAR-002",
    type: "Material Purchase",
    requesterId: "supervisor-ramesh",
    requesterName: "Ramesh Patel",
    requesterRole: "Supervisor",
    description: "Urgent purchase of Foam Shampoo - 50L",
    amount: 41000,
    status: "Pending",
    priority: "Medium",
    approverRole: "Procurement Manager",
    createdAt: "2026-03-18 09:15",
  },
  {
    id: "APP-MAR-003",
    type: "Leave Request",
    requesterId: "washer-001",
    requesterName: "Suresh Kumar",
    requesterRole: "Car Washer",
    description: "Sick leave - 1 day",
    item: "16 Mar 2026",
    status: "Approved",
    priority: "Medium",
    approverId: "supervisor-ramesh",
    approverName: "Ramesh Patel",
    approverRole: "Supervisor",
    createdAt: "2026-03-15 22:00",
    updatedAt: "2026-03-16 07:30",
    approvedAt: "2026-03-16 07:30",
    comments: "Approved. Medical certificate submitted.",
  },
];

// ============================================
// AUDIT LOGS
// ============================================

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  userId: string;
  userName: string;
  userRole: string;
  details: string;
  timestamp: string;
  ip: string;
  entityType?: string;
  entityId?: string;
}

export const MASTER_AUDIT_LOGS: AuditLog[] = [
  {
    id: "AUD-2026-03-18-001",
    action: "Wash Completed",
    module: "Operations",
    userId: "washer-001",
    userName: "Suresh Kumar",
    userRole: "Car Washer",
    details: "JOB-2026-03-18-001 - GJ05AB1234 marked complete with 5-star rating",
    timestamp: "2026-03-18 08:05:30",
    ip: "192.168.2.15",
    entityType: "WashRecord",
    entityId: "WR-MAR-001",
  },
  {
    id: "AUD-2026-03-18-002",
    action: "Revenue Entry Created",
    module: "Finance",
    userId: "system",
    userName: "Auto-Generated",
    userRole: "System",
    details: "INV-2026-03-001 - ₹1,416 from Rajesh Patel auto-captured",
    timestamp: "2026-03-18 08:06:15",
    ip: "10.0.0.1",
    entityType: "RevenueEntry",
    entityId: "REV-MAR-001",
  },
  {
    id: "AUD-2026-03-17-001",
    action: "Complaint Registered",
    module: "Complaint Management",
    userId: "cce-001",
    userName: "Customer Care",
    userRole: "CCE",
    details: "CM-MAR-001 - Service Quality complaint from Rajesh Patel",
    timestamp: "2026-03-17 11:00:05",
    ip: "192.168.1.67",
    entityType: "Complaint",
    entityId: "CM-MAR-001",
  },
  {
    id: "AUD-2026-03-17-002",
    action: "Complaint Resolved",
    module: "Complaint Management",
    userId: "supervisor-ramesh",
    userName: "Ramesh Patel",
    userRole: "Supervisor",
    details: "CM-MAR-002 - Missed service complaint resolved with re-wash",
    timestamp: "2026-03-17 14:30:22",
    ip: "192.168.2.20",
    entityType: "Complaint",
    entityId: "CM-MAR-002",
  },
];

// ============================================
// KPIs & DASHBOARD DATA
// ============================================

export const MASTER_KPI_DATA = {
  // March 2026 Actuals
  totalCustomers: 856,
  activeSubscriptions: 742,
  pausedSubscriptions: 87,
  cancelledSubscriptions: 27,
  
  // Revenue
  monthlyRevenue: 892450,
  monthlyTarget: 950000,
  revenueGrowth: 12.4, // % vs last month
  
  // Leads & Conversions
  totalLeads: 142,
  newLeads: 38,
  convertedLeads: 24,
  conversionRate: 16.9, // %
  
  // Operations
  totalWashes: 8632, // March 2026
  avgWashesPerDay: 295,
  onTimeServiceRate: 94.2, // %
  avgWashDuration: 31, // minutes
  
  // Complaints
  totalComplaints: 42,
  openComplaints: 8,
  avgResolutionTime: 4.2, // hours
  customerSatisfaction: 4.7, // out of 5
  
  // Team
  totalEmployees: 47,
  activeWashers: 28,
  activeSupervisors: 4,
  attendanceRate: 96.8, // %
  
  // Profitability
  avgCostPerWash: 61.04,
  avgRevenuePerWash: 103.40,
  avgProfitPerWash: 42.36,
  ebitdaMargin: 41.0, // %
};

// ============================================
// STORE BREAK-EVEN ANALYSIS DATA
// ============================================

export const MASTER_STORE_BREAKEVEN = [
  {
    id: "store-1",
    store: "Koramangala",
    setupCost: 2500000,
    equipmentCost: 850000,
    marketingCost: 450000,
    totalInvestment: 3800000,
    monthlyRevenue: 734700,
    monthlyExpenses: 305115,
    monthlyProfit: 429585,
    breakEvenMonths: 8.8,
    currentMonth: 12,
    status: "Profitable" as const,
  },
  {
    id: "store-2",
    store: "Indiranagar",
    setupCost: 2800000,
    equipmentCost: 900000,
    marketingCost: 500000,
    totalInvestment: 4200000,
    monthlyRevenue: 814200,
    monthlyExpenses: 338100,
    monthlyProfit: 476100,
    breakEvenMonths: 8.8,
    currentMonth: 10,
    status: "Profitable" as const,
  },
  {
    id: "store-3",
    store: "Whitefield",
    setupCost: 2200000,
    equipmentCost: 750000,
    marketingCost: 400000,
    totalInvestment: 3350000,
    monthlyRevenue: 525100,
    monthlyExpenses: 218050,
    monthlyProfit: 307050,
    breakEvenMonths: 10.9,
    currentMonth: 8,
    status: "Pre Break-Even" as const,
  },
  {
    id: "store-4",
    store: "Electronic City",
    setupCost: 2400000,
    equipmentCost: 800000,
    marketingCost: 450000,
    totalInvestment: 3650000,
    monthlyRevenue: 619500,
    monthlyExpenses: 257250,
    monthlyProfit: 362250,
    breakEvenMonths: 10.1,
    currentMonth: 6,
    status: "Pre Break-Even" as const,
  },
];

export const MASTER_BREAKEVEN_TIMELINE = [
  { id: "m0", month: 0, investment: -3800000, revenue: 0, cumulative: -3800000 },
  { id: "m1", month: 1, investment: 0, revenue: 429585, cumulative: -3370415 },
  { id: "m2", month: 2, investment: 0, revenue: 429585, cumulative: -2940830 },
  { id: "m3", month: 3, investment: 0, revenue: 429585, cumulative: -2511245 },
  { id: "m4", month: 4, investment: 0, revenue: 429585, cumulative: -2081660 },
  { id: "m5", month: 5, investment: 0, revenue: 429585, cumulative: -1652075 },
  { id: "m6", month: 6, investment: 0, revenue: 429585, cumulative: -1222490 },
  { id: "m7", month: 7, investment: 0, revenue: 429585, cumulative: -792905 },
  { id: "m8", month: 8, investment: 0, revenue: 429585, cumulative: -363320 },
  { id: "m9", month: 9, investment: 0, revenue: 429585, cumulative: 66265 },
  { id: "m10", month: 10, investment: 0, revenue: 429585, cumulative: 495850 },
  { id: "m11", month: 11, investment: 0, revenue: 429585, cumulative: 925435 },
  { id: "m12", month: 12, investment: 0, revenue: 429585, cumulative: 1355020 },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getCustomerByI(customerId: string): Customer | undefined {
  return MASTER_CUSTOMERS.find(c => c.id === customerId);
}

export function getWasherPerformanceById(washerId: string) {
  return WASHER_PERFORMANCE_DATA.find(w => w.id === washerId);
}

export function getRevenueByCustomerId(customerId: string) {
  return REVENUE_DATA_MARCH_2026.filter(r => r.customerId === customerId);
}

export function getComplaintsByCustomerId(customerId: string) {
  return MASTER_COMPLAINTS.filter(c => c.customerId === customerId);
}

export function getWashRecordsByWasherId(washerId: string) {
  return MASTER_WASH_RECORDS.filter(w => w.washerId === washerId);
}
