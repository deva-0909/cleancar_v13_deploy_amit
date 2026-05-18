/**
 * seedAllData — Complete 3-Month Historic Dataset
 * Covers EVERY screen in the left navigation.
 *
 * Replaces seedHistoricData.ts + seedAccountingData.ts with one unified file.
 *
 * DataService key → localStorage key mapping (buildKey convention):
 *   DataService.get("EMPLOYEES", cityId) → cleancar_CITY-SURAT_employees
 *   DataService.get("CUSTOMERS", cityId) → cleancar_CITY-SURAT_customers
 *   etc.
 *
 * Raw keys (not via DataService):
 *   cleancar_accounting_entries  (accountingEntryService)
 *   cleancar_journal_entries     (accountingEntryService)
 *   cleancar_ledger_masters      (accountingEntryService)
 *   cleancar_complaints          (customerCareExecutiveService)
 *   EMPLOYEE_DATABASE_RECORDS    (auth system)
 */

const SEED_FLAG = "ALL_DATA_SEEDED_V1";

// ─── Shared helpers ───────────────────────────────────────────────────────────
const NOW   = new Date().toISOString();
const FY    = "25-26";
const MONTHS = [2, 3, 4] as const;
const MONTH_DAYS: Record<number, number> = { 2: 28, 3: 31, 4: 30 };
const MONTH_NAMES = ["","","Feb","Mar","Apr","May"];

function d(m: number, day: number) {
  return `2026-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}
function iso(m: number, day: number, h = 9) {
  return `2026-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}T${String(h).padStart(2,"0")}:00:00.000Z`;
}
function writeByCityId(baseKey: string, records: any[]) {
  const sur = records.filter(r => (r.cityId || "CITY-SURAT") === "CITY-SURAT");
  const mum = records.filter(r => r.cityId === "CITY-MUMBAI");
  localStorage.setItem(`cleancar_${baseKey}`,             JSON.stringify(records));
  localStorage.setItem(`cleancar_CITY-SURAT_${baseKey}`,  JSON.stringify(sur));
  localStorage.setItem(`cleancar_CITY-MUMBAI_${baseKey}`, JSON.stringify(mum));
}

// ─── Salary helper ────────────────────────────────────────────────────────────
function sal(gross: number) {
  const basic   = Math.round(gross * 0.4);
  const hra     = Math.round(basic * 0.5);
  const conv    = 1600;
  const special = Math.max(0, gross - basic - hra - conv);
  const pf      = Math.min(Math.round(basic * 0.12), 1800);
  const esic    = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
  const pt      = gross >= 12000 ? 200 : gross >= 9000 ? 150 : 80;
  const net     = gross - pf - esic - pt;
  return { gross, basic, hra, conv, special, pf, esic, pt, net,
           empf: pf, emesic: gross <= 21000 ? Math.round(gross * 0.0325) : 0 };
}

const PWD = "RGVtb0AxMjM0Q0MzNjBTQUxU";
const BASE_EMP = {
  tempIdAssignedDate: "2025-10-01", conversionDueDate: "2025-10-08",
  daysInTempStatus: 0, isOverdue: false, employmentStage: "Permanent",
  skillLevel: "Skilled", fatherName: "Demo Father",
  dob: "1992-01-01", gender: "Male",
  permanentAddress: "Demo Address, Surat", currentAddress: "Demo Address, Surat",
  emergencyContact: "9000099999", employeeType: "Full Time",
  dateOfJoining: "2025-10-01", probationPeriod: "3 months",
  status: "Active", onboardingPasswordSet: true, accountStatus: "active",
  failedLoginAttempts: 0, passwordHash: PWD,
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. EMPLOYEES — 55 staff, Surat + Mumbai
// ═════════════════════════════════════════════════════════════════════════════
const EMPLOYEES_RAW: any[] = [
  // ── SURAT MANAGEMENT ──────────────────────────────────────────────────────
  { ...BASE_EMP, id:"EDB-SA-01",  loginMobile:"9100000001", mobile:"9100000001", fullName:"Rajesh Patel",    firstName:"Rajesh",   lastName:"Patel",    email:"rajesh@cleancar.com",   designation:"Super Admin",         department:"Management",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Board",       pinCodes:["395001"], dateOfJoining:"2025-08-01", ...sal(90000) },
  { ...BASE_EMP, id:"EDB-ADM-01", loginMobile:"9100000002", mobile:"9100000002", fullName:"Kavita Shah",    firstName:"Kavita",   lastName:"Shah",   gender:"Female", email:"kavita@cleancar.com",   designation:"Admin",               department:"Management",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Rajesh Patel",pinCodes:["395001"], dateOfJoining:"2025-08-01", ...sal(65000) },
  { ...BASE_EMP, id:"EDB-CM-SUR", loginMobile:"9100000003", mobile:"9100000003", fullName:"Amit Desai",     firstName:"Amit",     lastName:"Desai",    email:"amit@cleancar.com",     designation:"City Manager",         department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Rajesh Patel",pinCodes:["395001","395002","395005","395007"], dateOfJoining:"2025-08-01", ...sal(72000) },
  { ...BASE_EMP, id:"EDB-CLM-SUR1",loginMobile:"9100000004",mobile:"9100000004",fullName:"Priya Mehta",    firstName:"Priya",    lastName:"Mehta",  gender:"Female", email:"priya@cleancar.com",    designation:"Cluster Manager",     department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Amit Desai",  pinCodes:["395001","395002"], dateOfJoining:"2025-09-01", ...sal(52000) },
  { ...BASE_EMP, id:"EDB-SOM-SUR1",loginMobile:"9100000005",mobile:"9100000005",fullName:"Deepak Thakkar", firstName:"Deepak",   lastName:"Thakkar",  email:"deepak@cleancar.com",   designation:"Sr Operations Manager",department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Priya Mehta", pinCodes:["395001","395002"], dateOfJoining:"2025-09-15", ...sal(47000) },
  { ...BASE_EMP, id:"EDB-OM-SUR1", loginMobile:"9100000006",mobile:"9100000006",fullName:"Neha Rana",      firstName:"Neha",     lastName:"Rana",   gender:"Female", email:"neha@cleancar.com",     designation:"Operations Manager",  department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Deepak Thakkar",pinCodes:["395001"], dateOfJoining:"2025-10-01", ...sal(40000) },
  { ...BASE_EMP, id:"EDB-OM-SUR2", loginMobile:"9100000007",mobile:"9100000007",fullName:"Ravi Pandya",    firstName:"Ravi",     lastName:"Pandya",   email:"ravi@cleancar.com",     designation:"Operations Manager",  department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Deepak Thakkar",pinCodes:["395002"], dateOfJoining:"2025-10-01", ...sal(40000) },
  // SURAT TEAM 1 — Adajan (395001)
  { ...BASE_EMP, id:"EDB-SUP-SUR1",loginMobile:"9100000008",mobile:"9100000008",fullName:"Harish Solanki", firstName:"Harish",   lastName:"Solanki",  email:"harish@cleancar.com",   designation:"Supervisor",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Neha Rana",   pinCodes:["395001"], dateOfJoining:"2025-10-15", ...sal(28000) },
  { ...BASE_EMP, id:"EDB-CW-SUR1A",loginMobile:"9100000009",mobile:"9100000009",fullName:"Mahesh Bharwad", firstName:"Mahesh",   lastName:"Bharwad",  email:"mahesh1@cleancar.com",  designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Harish Solanki",pinCodes:["395001"],dateOfJoining:"2025-11-01", ...sal(16000), skillLevel:"Semi-Skilled" },
  { ...BASE_EMP, id:"EDB-CW-SUR1B",loginMobile:"9100000010",mobile:"9100000010",fullName:"Ramesh Koli",    firstName:"Ramesh",   lastName:"Koli",     email:"ramesh@cleancar.com",   designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Harish Solanki",pinCodes:["395001"],dateOfJoining:"2025-11-15",...sal(14500),skillLevel:"Unskilled" },
  { ...BASE_EMP, id:"EDB-CW-SUR1C",loginMobile:"9100000011",mobile:"9100000011",fullName:"Sunil Thakor",   firstName:"Sunil",    lastName:"Thakor",   email:"sunil@cleancar.com",    designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Harish Solanki",pinCodes:["395001"],dateOfJoining:"2025-11-01", ...sal(17000) },
  // SURAT TEAM 2 — Vesu (395007)
  { ...BASE_EMP, id:"EDB-SUP-SUR2",loginMobile:"9100000012",mobile:"9100000012",fullName:"Bhavesh Modi",   firstName:"Bhavesh",  lastName:"Modi",     email:"bhavesh@cleancar.com",  designation:"Supervisor",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Ravi Pandya", pinCodes:["395007"], dateOfJoining:"2025-10-15", ...sal(27000) },
  { ...BASE_EMP, id:"EDB-CW-SUR2A",loginMobile:"9100000013",mobile:"9100000013",fullName:"Nilesh Chauhan", firstName:"Nilesh",   lastName:"Chauhan",  email:"nilesh@cleancar.com",   designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Bhavesh Modi",pinCodes:["395007"],  dateOfJoining:"2025-11-01", ...sal(16500) },
  { ...BASE_EMP, id:"EDB-CW-SUR2B",loginMobile:"9100000014",mobile:"9100000014",fullName:"Dinesh Parmar",  firstName:"Dinesh",   lastName:"Parmar",   email:"dinesh@cleancar.com",   designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Bhavesh Modi",pinCodes:["395007"],  dateOfJoining:"2025-11-15",...sal(15000),status:"On Leave" },
  { ...BASE_EMP, id:"EDB-CW-SUR2C",loginMobile:"9100000015",mobile:"9100000015",fullName:"Arvind Vasava",  firstName:"Arvind",   lastName:"Vasava",   email:"arvind@cleancar.com",   designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Bhavesh Modi",pinCodes:["395007"],  dateOfJoining:"2025-12-15",...sal(13500),skillLevel:"Unskilled" },
  // SURAT SUPPORT
  { ...BASE_EMP, id:"EDB-TSM-SUR1",loginMobile:"9100000016",mobile:"9100000016",fullName:"Sanjay Kapoor",  firstName:"Sanjay",   lastName:"Kapoor",   email:"sanjay@cleancar.com",   designation:"TSM",                 department:"Sales",          workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Amit Desai",  pinCodes:["395001","395002","395007"], dateOfJoining:"2025-09-01", ...sal(35000) },
  { ...BASE_EMP, id:"EDB-TSE-SUR1",loginMobile:"9100000017",mobile:"9100000017",fullName:"Pooja Sharma",   firstName:"Pooja",    lastName:"Sharma", gender:"Female", email:"pooja@cleancar.com",    designation:"TSE",                 department:"Sales",          workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Sanjay Kapoor",pinCodes:["395001","395002"],dateOfJoining:"2025-10-01", ...sal(22000) },
  { ...BASE_EMP, id:"EDB-TSE-SUR2",loginMobile:"9100000018",mobile:"9100000018",fullName:"Ankit Trivedi",  firstName:"Ankit",    lastName:"Trivedi",  email:"ankit@cleancar.com",    designation:"TSE",                 department:"Sales",          workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Sanjay Kapoor",pinCodes:["395005","395007"],dateOfJoining:"2025-10-15", ...sal(21000) },
  { ...BASE_EMP, id:"EDB-CCE-SUR1",loginMobile:"9100000019",mobile:"9100000019",fullName:"Meera Jain",     firstName:"Meera",    lastName:"Jain",   gender:"Female", email:"meera@cleancar.com",    designation:"CCE",                 department:"Customer Care",  workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Kavita Shah", pinCodes:["395001","395002","395007"], dateOfJoining:"2025-09-15", ...sal(20000) },
  { ...BASE_EMP, id:"EDB-HR-SUR1",  loginMobile:"9100000020",mobile:"9100000020",fullName:"Rekha Solanki",  firstName:"Rekha",    lastName:"Solanki",gender:"Female", email:"rekha@cleancar.com",    designation:"HR",                  department:"Human Resources",workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Kavita Shah", pinCodes:["395001"], dateOfJoining:"2025-08-01", ...sal(30000) },
  { ...BASE_EMP, id:"EDB-ACC-SUR1", loginMobile:"9100000021",mobile:"9100000021",fullName:"Chirag Doshi",   firstName:"Chirag",   lastName:"Doshi",    email:"chirag@cleancar.com",   designation:"Accounts",            department:"Finance",        workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Kavita Shah", pinCodes:["395001"], dateOfJoining:"2025-08-01", ...sal(32000) },
  { ...BASE_EMP, id:"EDB-SM-SUR1",  loginMobile:"9100000022",mobile:"9100000022",fullName:"Nayan Desai",    firstName:"Nayan",    lastName:"Desai",    email:"nayan@cleancar.com",    designation:"Store Manager",       department:"Inventory",      workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Amit Desai",  pinCodes:["395001"], dateOfJoining:"2025-09-01", ...sal(28000) },
  // ── MUMBAI ────────────────────────────────────────────────────────────────
  { ...BASE_EMP, id:"EDB-CM-MUM",   loginMobile:"9200000001",mobile:"9200000001",fullName:"Ananya Singh",   firstName:"Ananya",   lastName:"Singh",  gender:"Female", email:"ananya@cleancar.com",   designation:"City Manager",        department:"Operations",     workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Rajesh Patel",pinCodes:["400001","400002","400003"], dateOfJoining:"2025-08-15", ...sal(75000) },
  { ...BASE_EMP, id:"EDB-OM-MUM1",  loginMobile:"9200000002",mobile:"9200000002",fullName:"Kiran More",     firstName:"Kiran",    lastName:"More",   gender:"Female", email:"kiran@cleancar.com",    designation:"Operations Manager",  department:"Operations",     workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",pinCodes:["400001","400002"],   dateOfJoining:"2025-09-15", ...sal(42000) },
  { ...BASE_EMP, id:"EDB-SUP-MUM1", loginMobile:"9200000003",mobile:"9200000003",fullName:"Santosh Yadav",  firstName:"Santosh",  lastName:"Yadav",    email:"santosh@cleancar.com",  designation:"Supervisor",          department:"Operations",     workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Kiran More",  pinCodes:["400001"],           dateOfJoining:"2025-10-01", ...sal(30000) },
  { ...BASE_EMP, id:"EDB-CW-MUM1A", loginMobile:"9200000004",mobile:"9200000004",fullName:"Ajay Gupta",     firstName:"Ajay",     lastName:"Gupta",    email:"ajay@cleancar.com",     designation:"Car Washer",          department:"Operations",     workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Santosh Yadav",pinCodes:["400001"],          dateOfJoining:"2025-11-01", ...sal(18000) },
  { ...BASE_EMP, id:"EDB-CW-MUM1B", loginMobile:"9200000005",mobile:"9200000005",fullName:"Raju Shinde",    firstName:"Raju",     lastName:"Shinde",   email:"raju@cleancar.com",     designation:"Car Washer",          department:"Operations",     workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Santosh Yadav",pinCodes:["400001"],          dateOfJoining:"2025-11-15",...sal(16000),skillLevel:"Semi-Skilled" },
  { ...BASE_EMP, id:"EDB-TSM-MUM1", loginMobile:"9200000006",mobile:"9200000006",fullName:"Vikram Shetty",  firstName:"Vikram",   lastName:"Shetty",   email:"vikram@cleancar.com",   designation:"TSM",                 department:"Sales",          workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",pinCodes:["400001","400002"],  dateOfJoining:"2025-09-01", ...sal(36000) },
  { ...BASE_EMP, id:"EDB-TSE-MUM1", loginMobile:"9200000007",mobile:"9200000007",fullName:"Swati Parab",    firstName:"Swati",    lastName:"Parab",  gender:"Female", email:"swati@cleancar.com",    designation:"TSE",                 department:"Sales",          workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Vikram Shetty",pinCodes:["400001","400002"], dateOfJoining:"2025-10-01", ...sal(22000) },
  { ...BASE_EMP, id:"EDB-CCE-MUM1", loginMobile:"9200000008",mobile:"9200000008",fullName:"Nisha Kapoor",   firstName:"Nisha",    lastName:"Kapoor", gender:"Female", email:"nisha@cleancar.com",    designation:"CCE",                 department:"Customer Care",  workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",pinCodes:["400001","400002"],  dateOfJoining:"2025-09-15", ...sal(21000) },
  { ...BASE_EMP, id:"EDB-ACC-MUM1", loginMobile:"9200000009",mobile:"9200000009",fullName:"Suhas Kadam",    firstName:"Suhas",    lastName:"Kadam",    email:"suhas@cleancar.com",    designation:"Accounts",            department:"Finance",        workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",pinCodes:["400001"],           dateOfJoining:"2025-09-01", ...sal(33000) },
  { ...BASE_EMP, id:"EDB-HR-MUM1",  loginMobile:"9200000010",mobile:"9200000010",fullName:"Shilpa Jadhav",  firstName:"Shilpa",   lastName:"Jadhav", gender:"Female", email:"shilpa@cleancar.com",   designation:"HR",                  department:"Human Resources",workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",pinCodes:["400001"],           dateOfJoining:"2025-09-01", ...sal(31000) },
];

// Map to Employee interface (employeeId, phone, role, joiningDate)
const EMPLOYEES = EMPLOYEES_RAW.map(e => ({
  ...e,
  employeeId: e.id,
  phone:      e.mobile,
  role:       e.designation,
  joiningDate: e.dateOfJoining,
  cityId:     e.workLocation,
}));

const SUR_EMPS = EMPLOYEES.filter(e => e.cityId === "CITY-SURAT");
const MUM_EMPS = EMPLOYEES.filter(e => e.cityId === "CITY-MUMBAI");
const WASHER_IDS_SUR = SUR_EMPS.filter(e => e.designation === "Car Washer").map(e => e.id);
const WASHER_IDS_MUM = MUM_EMPS.filter(e => e.designation === "Car Washer").map(e => e.id);

// ═════════════════════════════════════════════════════════════════════════════
// 2. SALARY STRUCTURES — needed by Payroll screens
// ═════════════════════════════════════════════════════════════════════════════
const SALARY_STRUCTURES: any[] = [
  { structureId:"SS-WASHER-SUR",     name:"Car Washer - Surat",      description:"Standard washer structure",   type:"per_car",  components:{ basic:6400,  hra:3200,  allowances:1600, deductions:1200 }, applicableRoles:["Car Washer"],         cityId:"CITY-SURAT",  createdAt:NOW },
  { structureId:"SS-SUPERVISOR-SUR", name:"Supervisor - Surat",      description:"Supervisor fixed + incentive",type:"hybrid",   components:{ basic:11200, hra:5600,  allowances:1600, deductions:2000 }, applicableRoles:["Supervisor"],         cityId:"CITY-SURAT",  createdAt:NOW },
  { structureId:"SS-OM-SUR",        name:"Operations Manager - Surat",description:"OM fixed salary",            type:"fixed",    components:{ basic:16000, hra:8000,  allowances:1600, deductions:3200 }, applicableRoles:["Operations Manager","Sr Operations Manager"], cityId:"CITY-SURAT", createdAt:NOW },
  { structureId:"SS-TSE-SUR",       name:"TSE - Surat",              description:"TSE fixed + commission",     type:"hybrid",   components:{ basic:8800,  hra:4400,  allowances:1600, deductions:1600 }, applicableRoles:["TSE"],               cityId:"CITY-SURAT",  createdAt:NOW },
  { structureId:"SS-TSM-SUR",       name:"TSM - Surat",              description:"TSM fixed + commission",     type:"hybrid",   components:{ basic:14000, hra:7000,  allowances:1600, deductions:2800 }, applicableRoles:["TSM"],               cityId:"CITY-SURAT",  createdAt:NOW },
  { structureId:"SS-MGMT-SUR",      name:"Management - Surat",       description:"Senior management fixed",    type:"fixed",    components:{ basic:28800, hra:14400, allowances:1600, deductions:5600 }, applicableRoles:["City Manager","Cluster Manager","Admin","Super Admin","HR","Accounts","Store Manager"], cityId:"CITY-SURAT", createdAt:NOW },
  { structureId:"SS-CCE-SUR",       name:"CCE - Surat",              description:"CCE fixed",                  type:"fixed",    components:{ basic:8000,  hra:4000,  allowances:1600, deductions:1400 }, applicableRoles:["CCE"],               cityId:"CITY-SURAT",  createdAt:NOW },
  { structureId:"SS-WASHER-MUM",    name:"Car Washer - Mumbai",      description:"Standard washer structure",   type:"per_car",  components:{ basic:7200,  hra:3600,  allowances:1600, deductions:1400 }, applicableRoles:["Car Washer"],         cityId:"CITY-MUMBAI", createdAt:NOW },
  { structureId:"SS-MGMT-MUM",      name:"Management - Mumbai",      description:"Senior management fixed",    type:"fixed",    components:{ basic:30000, hra:15000, allowances:1600, deductions:5800 }, applicableRoles:["City Manager","Operations Manager","HR","Accounts","CCE","TSM","TSE"], cityId:"CITY-MUMBAI", createdAt:NOW },
  { structureId:"SS-SUPERVISOR-MUM",name:"Supervisor - Mumbai",      description:"Supervisor fixed + incentive",type:"hybrid",  components:{ basic:12000, hra:6000,  allowances:1600, deductions:2200 }, applicableRoles:["Supervisor"],         cityId:"CITY-MUMBAI", createdAt:NOW },
];

// ═════════════════════════════════════════════════════════════════════════════
// 3. INCENTIVE PLANS — needed by Incentives, Payroll, Analytics screens
// ═════════════════════════════════════════════════════════════════════════════
const INCENTIVE_PLANS: any[] = [
  { planId:"IP-PER-CAR-SUR",    name:"Per Car Incentive — Surat",    type:"per_car",       description:"₹15 per car washed above daily quota", rules:{ perCarAmount:15 },                 applicableRoles:["Car Washer"],  payoutCycle:"monthly", minPayout:500,  maxPayout:5000,  isActive:true, cityId:"CITY-SURAT",  city:"Surat",  createdAt:NOW },
  { planId:"IP-TARGET-TSE-SUR", name:"TSE Target Incentive — Surat", type:"target_based",  description:"Monthly subscription target",          rules:{ targetCars:15, targetAmount:15000, achievementBonus:1500 }, applicableRoles:["TSE"], payoutCycle:"monthly", minPayout:0, maxPayout:8000, isActive:true, cityId:"CITY-SURAT", city:"Surat", createdAt:NOW },
  { planId:"IP-TARGET-TSM-SUR", name:"TSM Target Incentive — Surat", type:"target_based",  description:"Monthly team target",                  rules:{ targetCars:30, targetAmount:30000, achievementBonus:3000 }, applicableRoles:["TSM"], payoutCycle:"monthly", minPayout:0, maxPayout:15000, isActive:true, cityId:"CITY-SURAT", city:"Surat", createdAt:NOW },
  { planId:"IP-REV-SHARE-SUR",  name:"Supervisor Revenue Share — Surat", type:"revenue_share", description:"3% of team revenue",              rules:{ revenueSharePercentage:3 },           applicableRoles:["Supervisor"],  payoutCycle:"monthly", minPayout:1000, maxPayout:8000, isActive:true, cityId:"CITY-SURAT",  city:"Surat",  createdAt:NOW },
  { planId:"IP-PER-CAR-MUM",    name:"Per Car Incentive — Mumbai",   type:"per_car",       description:"₹18 per car washed above daily quota", rules:{ perCarAmount:18 },                 applicableRoles:["Car Washer"],  payoutCycle:"monthly", minPayout:500,  maxPayout:6000,  isActive:true, cityId:"CITY-MUMBAI", city:"Mumbai", createdAt:NOW },
  { planId:"IP-TARGET-TSE-MUM", name:"TSE Target Incentive — Mumbai",type:"target_based",  description:"Monthly subscription target",          rules:{ targetCars:15, targetAmount:18000, achievementBonus:2000 }, applicableRoles:["TSE"], payoutCycle:"monthly", minPayout:0, maxPayout:10000, isActive:true, cityId:"CITY-MUMBAI", city:"Mumbai", createdAt:NOW },
];

// ═════════════════════════════════════════════════════════════════════════════
// 4. PAYROLL RUNS — Feb / Mar / Apr 2026
// ═════════════════════════════════════════════════════════════════════════════
const PAYROLL_RUNS: any[] = [];
for (const emp of EMPLOYEES) {
  for (const m of MONTHS) {
    const td    = MONTH_DAYS[m];
    const lop   = (emp.id === "EDB-CW-SUR1B" && m === 2) ? 3
                : (emp.id === "EDB-CW-SUR2B") ? 5 : 0;
    const present = td - lop;
    const adj   = Math.round(emp.gross * present / td);
    const pf    = Math.min(Math.round(adj * 0.4 * 0.12), 1800);
    const esic  = adj <= 21000 ? Math.round(adj * 0.0075) : 0;
    const pt    = present >= 20 ? (adj >= 12000 ? 200 : adj >= 9000 ? 150 : 80) : 0;
    const incv  = emp.designation === "Car Washer" && m === 3 ? 1200
                : emp.designation === "Supervisor" && m === 4 ? 2500
                : ["TSE","TSM"].includes(emp.designation) ? 3000 + m * 200 : 0;
    const net   = adj + incv - pf - esic - pt;
    PAYROLL_RUNS.push({
      payrollId:       `PR-${emp.id}-2026-${m}`,
      employeeId:      emp.id,
      month:           `2026-${String(m).padStart(2,"0")}`,
      period:          { startDate: d(m,1), endDate: d(m, td) },
      cityId:          emp.cityId || "CITY-SURAT",
      baseSalary:      adj,
      incentiveAmount: incv,
      addOnEarnings:   0,
      allowances:      0,
      grossSalary:     adj + incv,
      pf, esic, pt,
      tds: 0, advances: 0, penalties: 0,
      totalDeductions: pf + esic + pt,
      netSalary:       net,
      presentDays:     present,
      absentDays:      lop,
      lopDays:         lop,
      workingDays:     td,
      status:          m < 4 ? "Paid" : "Processed",
      createdAt:       new Date(2026, m, 5).toISOString(),
      updatedAt:       new Date(2026, m, 5).toISOString(),
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. EMPLOYEE INCENTIVES (individual records per employee per month)
// ═════════════════════════════════════════════════════════════════════════════
const EMPLOYEE_INCENTIVES: any[] = [];
for (const emp of EMPLOYEES) {
  for (const m of MONTHS) {
    const isSur = emp.cityId === "CITY-SURAT";
    if (emp.designation === "Car Washer") {
      const washed = 80 + (m * 5);
      EMPLOYEE_INCENTIVES.push({
        employeeId: emp.id, cityId: emp.cityId,
        planId: isSur ? "IP-PER-CAR-SUR" : "IP-PER-CAR-MUM",
        currentPeriod: { startDate: d(m,1), endDate: d(m, MONTH_DAYS[m]) },
        target: 90, achieved: washed, achievementPercentage: Math.round(washed/90*100),
        calculatedAmount: washed * (isSur ? 15 : 18),
        status: m < 4 ? "Paid" : "Approved",
        createdAt: d(m,1) + "T00:00:00.000Z",
      });
    } else if (["TSE","TSM"].includes(emp.designation)) {
      const target  = emp.designation === "TSM" ? 30 : 15;
      const achieved = target - 2 + (m % 4);
      const pct     = Math.round(achieved / target * 100);
      const base    = emp.designation === "TSM" ? 8000 : 4000;
      const earned  = pct >= 100 ? Math.round(base*1.25) : pct >= 80 ? base : pct >= 60 ? Math.round(base*0.6) : 0;
      EMPLOYEE_INCENTIVES.push({
        employeeId: emp.id, cityId: emp.cityId,
        planId: isSur ? (emp.designation === "TSM" ? "IP-TARGET-TSM-SUR" : "IP-TARGET-TSE-SUR")
                      : "IP-TARGET-TSE-MUM",
        currentPeriod: { startDate: d(m,1), endDate: d(m, MONTH_DAYS[m]) },
        target, achieved, achievementPercentage: pct,
        calculatedAmount: earned,
        status: m < 4 ? "Paid" : "Approved",
        createdAt: d(m,1) + "T00:00:00.000Z",
      });
    } else if (emp.designation === "Supervisor") {
      const teamRev = 85000 + m * 5000;
      EMPLOYEE_INCENTIVES.push({
        employeeId: emp.id, cityId: emp.cityId,
        planId: "IP-REV-SHARE-SUR",
        currentPeriod: { startDate: d(m,1), endDate: d(m, MONTH_DAYS[m]) },
        target: 85000, achieved: teamRev, achievementPercentage: 100,
        calculatedAmount: Math.round(teamRev * 0.03),
        status: m < 4 ? "Paid" : "Approved",
        createdAt: d(m,1) + "T00:00:00.000Z",
      });
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. ATTENDANCE RECORDS — each washer/supervisor, every working day
// ═════════════════════════════════════════════════════════════════════════════
const ATTENDANCE_RECORDS: any[] = [];
const FIELD_STAFF = EMPLOYEES.filter(e =>
  ["Car Washer","Supervisor","Operations Manager","Sr Operations Manager"].includes(e.designation)
);
for (const emp of FIELD_STAFF) {
  for (const m of MONTHS) {
    for (let day = 1; day <= MONTH_DAYS[m]; day++) {
      const dateStr = d(m, day);
      const dow     = new Date(2026, m-1, day).getDay();
      if (dow === 0) {
        ATTENDANCE_RECORDS.push({ attendanceId:`ATT-${emp.id}-${dateStr}`, employeeId:emp.id, cityId:emp.cityId, date:dateStr, status:"Week Off", createdAt:NOW });
        continue;
      }
      const isLeave  = (emp.id === "EDB-CW-SUR1B" && m===2 && day<=3)
                    || (emp.id === "EDB-CW-SUR2B" && [5,6,7,8,9].includes(day));
      const isLate   = !isLeave && day % 7 === 0;
      ATTENDANCE_RECORDS.push({
        attendanceId: `ATT-${emp.id}-${dateStr}`,
        employeeId:   emp.id,
        cityId:       emp.cityId,
        date:         dateStr,
        status:       isLeave ? "Leave" : isLate ? "Late" : "Present",
        checkInTime:  isLeave ? undefined : isLate ? "09:35:00" : "09:00:00",
        checkOutTime: isLeave ? undefined : "18:00:00",
        hoursWorked:  isLeave ? 0 : 9,
        lateMinutes:  isLate ? 35 : 0,
        workMinutes:  isLeave ? 0 : 540,
        overtimeMinutes: 0,
        flag: "NONE",
        createdAt:    NOW,
      });
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. CUSTOMERS — 200 records (100 Surat + 100 Mumbai)
// ═════════════════════════════════════════════════════════════════════════════
const AREAS_SUR  = ["Adajan","Vesu","Dumas","Althan","Piplod","Varachha","Katargam"];
const AREAS_MUM  = ["Bandra","Andheri","Dadar","Thane","Borivali","Malad","Powai"];
const PINS_SUR   = ["395001","395005","395006","395007","395002","395003","395004"];
const PINS_MUM   = ["400001","400002","400003","400004","400005","400006","400007"];
const VEHICLES   = ["Maruti Baleno","Honda City","Hyundai Creta","Tata Nexon","Toyota Fortuner","Maruti Swift","Honda Amaze","Kia Seltos"];

const CUSTOMERS: any[] = [];
function makeCust(i: number, city: "Surat"|"Mumbai") {
  const isMum = city === "Mumbai";
  const areas = isMum ? AREAS_MUM : AREAS_SUR;
  const pins  = isMum ? PINS_MUM  : PINS_SUR;
  const cid   = isMum ? "CITY-MUMBAI" : "CITY-SURAT";
  const idx   = i % areas.length;
  return {
    customerId: `CUST-${city.slice(0,3).toUpperCase()}-${String(i+1).padStart(3,"0")}`,
    firstName: `Customer ${city.slice(0,3)}`,
    lastName: String(i+1),
    email: `cust${i+1}${city.slice(0,3).toLowerCase()}@example.com`,
    phone: `${isMum?"9900":"9800"}${String(100000+i).slice(-6)}`,
    address: { line1: `${100+i} Main Road`, area: areas[idx], city, pinCode: pins[idx] },
    vehicleDetails: { category: i%3===0?"SUV":i%3===1?"Sedan":"Hatchback", brand: VEHICLES[i%VEHICLES.length].split(" ")[0], color:"White", registrationNumber:`${isMum?"MH01":"GJ05"}${String(1000+i)}` },
    leadSource: ["Walk-in","WhatsApp","Google Ads","Referral"][i%4],
    status: i%10===9 ? "Churned" : "Active",
    cityId: cid,
    createdAt: new Date(2026, 1+(i%3), 1).toISOString(),
    updatedAt: new Date(2026, 1+(i%3), 1).toISOString(),
    tags: [], notes: "",
  };
}
for (let i = 0; i < 100; i++) CUSTOMERS.push(makeCust(i, "Surat"));
for (let i = 0; i < 100; i++) CUSTOMERS.push(makeCust(i, "Mumbai"));

// ═════════════════════════════════════════════════════════════════════════════
// 8. LEADS — 120 leads (40 per month × 2 cities)
// ═════════════════════════════════════════════════════════════════════════════
const LEAD_SOURCES = ["Walk-in","WhatsApp","Google Ads","Referral","Cold Call","Website","Instagram"];
const LEAD_STAGES  = ["New","Contacted","Demo Scheduled","Demo Done","Converted","Lost"];
const LEADS: any[] = [];
let leadIdx = 1;
for (const city of ["Surat","Mumbai"] as const) {
  const cid  = city === "Surat" ? "CITY-SURAT" : "CITY-MUMBAI";
  const tse  = city === "Surat" ? "EDB-TSE-SUR1" : "EDB-TSE-MUM1";
  const areas = city === "Surat" ? AREAS_SUR : AREAS_MUM;
  const pins  = city === "Surat" ? PINS_SUR  : PINS_MUM;
  for (const m of MONTHS) {
    for (let i = 0; i < 20; i++) {
      const stage = LEAD_STAGES[i % LEAD_STAGES.length];
      LEADS.push({
        leadId:     `LEAD-${city.slice(0,3).toUpperCase()}-${String(leadIdx++).padStart(3,"0")}`,
        name:       `Lead ${city.slice(0,3)} ${leadIdx}`,
        mobile:     `98765${String(43200+leadIdx).slice(-5)}`,
        email:      `lead${leadIdx}@example.com`,
        area:       areas[i%7],
        pinCode:    pins[i%7],
        source:     LEAD_SOURCES[i%LEAD_SOURCES.length],
        stage,
        status:     stage,
        assignedTo: tse,
        cityId:     cid, city,
        vehicleCategory: i%3===0?"SUV":i%3===1?"Sedan":"Hatchback",
        planOfInterest: ["Water Wash","Shampoo Wash","Shampoo+Wax"][i%3],
        createdAt:  new Date(2026,m-1,1+(i%28)).toISOString(),
        followUpDate: new Date(2026,m-1,5+(i%20)).toISOString(),
        convertedAt: stage==="Converted" ? new Date(2026,m-1,15+(i%10)).toISOString() : undefined,
        lostReason: stage==="Lost" ? ["Price too high","Not interested","Competitor","Area not serviceable"][i%4] : undefined,
        notes: `Status: ${stage}.`,
      });
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. DEMOS — needed by TSE App, Supervisor, Demo Management screens
// ═════════════════════════════════════════════════════════════════════════════
const DEMOS: any[] = [];
const DEMO_TIME_SLOTS = ["09:00 AM","11:00 AM","02:00 PM","04:00 PM"];
for (let i = 0; i < 30; i++) {
  const m   = 2 + (i % 3);
  const day = 3 + (i % 25);
  const isCompleted = i < 20;
  const isSur = i % 2 === 0;
  DEMOS.push({
    id:    `DEMO-${isSur?"SUR":"MUM"}-${String(i+1).padStart(3,"0")}`,
    leadId: `LEAD-${isSur?"SUR":"MUM"}-${String((i%20)+1).padStart(3,"0")}`,
    customerName: `Demo Customer ${i+1}`,
    customerFirstName: `Customer`,
    mobile: `98766${String(10000+i).slice(-5)}`,
    email: `demo${i+1}@example.com`,
    addressLine1: `${200+i} Demo Street`,
    area: isSur ? AREAS_SUR[i%7] : AREAS_MUM[i%7],
    city: isSur ? "Surat" : "Mumbai",
    pinCode: isSur ? PINS_SUR[i%7] : PINS_MUM[i%7],
    vehicleCategory: i%2===0 ? "Sedan" : "SUV",
    vehicleColor: "White",
    vehicleRegistrationNumber: `${isSur?"GJ05":"MH01"}${String(2000+i)}`,
    demoType: i%3===0 ? "One-Time Service Demo" : "Subscription Package Demo",
    demoDate: d(m, day),
    demoTimeSlot: DEMO_TIME_SLOTS[i%4],
    planName: ["Water Wash","Shampoo Wash","Shampoo+Wax"][i%3],
    planPrice: [699,1299,1999][i%3],
    planOfInterest: ["Water Wash","Shampoo Wash","Shampoo+Wax"][i%3],
    tseScheduled: true,
    tseScheduledBy: isSur ? "EDB-TSE-SUR1" : "EDB-TSE-MUM1",
    tseScheduledAt: iso(m, day-1),
    assignedSupervisor: isSur ? "EDB-SUP-SUR1" : "EDB-SUP-MUM1",
    washerAssigned: true,
    washerName: isSur ? "Mahesh Bharwad" : "Ajay Gupta",
    washerAssignedAt: iso(m, day-1, 10),
    washerAssignedBy: isSur ? "EDB-SUP-SUR1" : "EDB-SUP-MUM1",
    assignmentDeadline: iso(m, day, 7),
    assignmentDeadlinePassed: false,
    acknowledgmentStatus: "Accepted",
    acknowledgedAt: iso(m, day-1, 11),
    demoCompleted: isCompleted,
    demoCompletedAt: isCompleted ? iso(m, day, 12) : null,
    demoOutcome: isCompleted ? (i%5===0?"Not Converted":i%3===0?"Converted":"Interested") : null,
    jobStartedAt: isCompleted ? iso(m, day, 9) : null,
    servicesPerformed: ["Exterior Wash","Tyre Dressing"],
    vehicleConditionBefore: "Dusty",
    vehicleConditionAfter: "Clean",
    productsUsed: ["Car Shampoo","Tyre Shine"],
    customerPresentDuringWash: true,
    customerVerbalFeedback: isCompleted ? "Very satisfied with the service" : undefined,
    status: isCompleted ? "Completed" : "Assigned",
    assignmentStatus: isCompleted ? "Completed" : "Assigned",
    isPreviousDemo: i%10===0,
    tlApprovalRequired: i%10===0,
    tlApprovalStatus: i%10===0 ? "Approved" : undefined,
    notificationsSent: ["TSE","Supervisor","Washer"],
    timelineEntries: [
      { timestamp: iso(m, day-1), actor: "TSE", action: "Demo scheduled" },
      { timestamp: iso(m, day-1, 10), actor: "Supervisor", action: "Washer assigned" },
      { timestamp: iso(m, day, 9), actor: "Washer", action: "Demo started" },
    ],
    cityId: isSur ? "CITY-SURAT" : "CITY-MUMBAI",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. SUBSCRIPTIONS — 120 records
// ═════════════════════════════════════════════════════════════════════════════
const PKG_MAP: Record<string,string> = {
  "Water Wash":"Basic","Shampoo Wash":"Standard","Shampoo+Wax":"Premium"
};
const PLAN_PRICES: Record<string,number> = {
  "Basic":999,"Standard":1299,"Premium":1999
};
const SUBS: any[] = [];
for (let i = 0; i < 120; i++) {
  const isSur  = i < 80;
  const cust   = CUSTOMERS[isSur ? i%100 : 100+(i%100)];
  const pkgKey = ["Water Wash","Shampoo Wash","Shampoo+Wax"][i%3];
  const pkg    = PKG_MAP[pkgKey];
  const price  = PLAN_PRICES[pkg];
  const disc   = i%5===0 ? 100 : 0;
  const m      = 2 + (i%3);
  const day    = 1 + (i%28);
  SUBS.push({
    subscriptionId: `SUB-${isSur?"SUR":"MUM"}-${String(i+1).padStart(4,"0")}`,
    customerId:     cust.customerId,
    packageType:    pkg,
    packageName:    pkgKey,
    frequency:      ["Daily","Alternate Days","Weekly"][i%3],
    status:         i%15===0?"Cancelled": i%10===0?"Paused":"Active",
    startDate:      d(m, day),
    renewalDate:    d(Math.min(m+1,12), day),
    pricing:        { basePrice:price, discount:disc, finalPrice:price-disc, currency:"INR" },
    priceLocked:    price - disc,
    serviceDetails: { vehicleType: i%2===0?"SUV":"Sedan", addOns:i%4===0?["Interior Cleaning"]:[], preferredTimeSlot:["Morning","Afternoon","Evening"][i%3] },
    billingCycle:   ["Monthly","Quarterly","Annual"][i%3],
    paymentStatus:  i%8===0?"Pending": i%12===0?"Overdue":"Paid",
    cityId:         isSur ? "CITY-SURAT" : "CITY-MUMBAI",
    createdAt:      d(m,day)+"T08:00:00.000Z",
    updatedAt:      d(m,day)+"T08:00:00.000Z",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. JOBS — 300 completed jobs
// ═════════════════════════════════════════════════════════════════════════════
const JOBS: any[] = [];
let jobIdx = 1;
for (const sub of SUBS.filter(s => s.status !== "Cancelled").slice(0, 100)) {
  const isSur   = sub.cityId === "CITY-SURAT";
  const washers = isSur ? WASHER_IDS_SUR : WASHER_IDS_MUM;
  const washer  = washers[jobIdx % Math.max(washers.length,1)];
  for (const m of MONTHS) {
    const day  = 1 + (jobIdx % 25);
    const cust = CUSTOMERS.find(c => c.customerId === sub.customerId) || CUSTOMERS[0];
    JOBS.push({
      jobId:        `JOB-${isSur?"SUR":"MUM"}-${String(jobIdx*3+m-2).padStart(5,"0")}`,
      customerId:   sub.customerId,
      subscriptionId: sub.subscriptionId,
      washerId:     washer,
      scheduledDate: d(m, day),
      timeSlot:     ["07:00 AM","09:00 AM","11:00 AM","02:00 PM"][jobIdx%4],
      status:       "Completed",
      jobType:      "Regular",
      packageName:  sub.packageName,
      vehicleDetails: { category: sub.serviceDetails.vehicleType||"Sedan", color:"White", brand:"Maruti", registration:`GJ05${String(jobIdx).padStart(4,"0")}` },
      location:     { addressLine1: cust.address?.line1||"123 Main St", area: cust.address?.area||"Adajan", city: isSur?"Surat":"Mumbai", pinCode: cust.address?.pinCode||(isSur?"395001":"400001") },
      serviceDetails: { addOns: sub.serviceDetails.addOns||[], specialInstructions:"" },
      verificationStatus: "verified",
      qualityScore:     80 + (jobIdx%20),
      complianceScore:  85 + (jobIdx%15),
      cityId:    sub.cityId,
      city:      isSur ? "Surat" : "Mumbai",
      completedAt: d(m, day)+"T12:30:00.000Z",
      createdAt:   d(m, day)+"T07:00:00.000Z",
      updatedAt:   d(m, day)+"T12:30:00.000Z",
    });
  }
  jobIdx++;
}

// ═════════════════════════════════════════════════════════════════════════════
// 12. COMPLAINTS — 72 records (12/month × 2 cities × 3 months)
// ═════════════════════════════════════════════════════════════════════════════
const COMP_TYPES  = ["Missed wash","Water on seat","Scratch on car","Not cleaned properly","Washer was late","Billing issue","App not working","Washer was rude"];
const COMP_STATUS = ["Open","In Progress","Resolved","Escalated","Closed"];
const COMPLAINTS_DS: any[] = [];   // for DataService (COMPLAINTS key)
const COMPLAINTS_RAW: any[] = [];  // for raw key (customerCareExecutiveService)
let compIdx = 1;
for (const city of ["Surat","Mumbai"] as const) {
  const cid   = city === "Surat" ? "CITY-SURAT" : "CITY-MUMBAI";
  const cce   = city === "Surat" ? "EDB-CCE-SUR1" : "EDB-CCE-MUM1";
  const custs = CUSTOMERS.filter(c => c.cityId === cid);
  for (const m of MONTHS) {
    for (let i = 0; i < 12; i++) {
      const status  = COMP_STATUS[i % COMP_STATUS.length];
      const compObj = {
        id:          `COMP-${city.slice(0,3).toUpperCase()}-${String(compIdx++).padStart(3,"0")}`,
        customerId:  custs[i%custs.length]?.customerId || `CUST-${city.slice(0,3).toUpperCase()}-001`,
        customerName: custs[i%custs.length]?.firstName+" "+custs[i%custs.length]?.lastName,
        type:        COMP_TYPES[i%COMP_TYPES.length],
        description: `Customer reported: ${COMP_TYPES[i%COMP_TYPES.length]}.`,
        status,
        priority:    i%5===0?"High": i%3===0?"Medium":"Low",
        cityId:      cid, city,
        assignedTo:  cce,
        resolvedAt:  ["Resolved","Closed"].includes(status) ? new Date(2026,m-1,15+(i%10)).toISOString() : undefined,
        rating:      status==="Closed" ? (3+i%3) : undefined,
        createdAt:   new Date(2026,m-1,1+(i*2)).toISOString(),
      };
      COMPLAINTS_DS.push(compObj);
      COMPLAINTS_RAW.push(compObj);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 13. INVENTORY ITEMS — 14 items (Surat + Mumbai)
// ═════════════════════════════════════════════════════════════════════════════
const INVENTORY_ITEMS: any[] = [
  { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",         category:"Cleaning Supplies", unit:"L",   centralStock:45,  reorderLevel:20, unitCost:480, cityId:"CITY-SURAT",  supervisorStock:{"EDB-SUP-SUR1":3,"EDB-SUP-SUR2":2}, washerStock:{}, lastProcurementDate:d(2,15), supplierId:"LM-SHREEJI", createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large",  category:"Equipment",         unit:"Pcs", centralStock:120, reorderLevel:50, unitCost:85,  cityId:"CITY-SURAT",  supervisorStock:{"EDB-SUP-SUR1":10,"EDB-SUP-SUR2":8}, washerStock:{"EDB-CW-SUR1A":2,"EDB-CW-SUR1B":2}, lastProcurementDate:d(3,1), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",        category:"Cleaning Supplies", unit:"L",   centralStock:30,  reorderLevel:15, unitCost:220, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,20), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-004", itemName:"Dashboard Polish",         category:"Cleaning Supplies", unit:"L",   centralStock:8,   reorderLevel:20, unitCost:150, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,10), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle",  category:"Equipment",         unit:"Pcs", centralStock:6,   reorderLevel:4,  unitCost:350, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,15), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",       category:"Consumables",       unit:"Pcs", centralStock:25,  reorderLevel:15, unitCost:650, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,5),  createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",         category:"Cleaning Supplies", unit:"L",   centralStock:18,  reorderLevel:12, unitCost:185, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,10), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-008", itemName:"Glass Cleaner 500ml",      category:"Cleaning Supplies", unit:"L",   centralStock:0,   reorderLevel:10, unitCost:120, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,5),  createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-MUM-001", itemName:"Car Shampoo 5L",           category:"Cleaning Supplies", unit:"L",   centralStock:50,  reorderLevel:20, unitCost:490, cityId:"CITY-MUMBAI", supervisorStock:{"EDB-SUP-MUM1":4}, washerStock:{}, lastProcurementDate:d(3,1), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-MUM-002", itemName:"Microfiber Cloth Large",   category:"Equipment",         unit:"Pcs", centralStock:90,  reorderLevel:50, unitCost:90,  cityId:"CITY-MUMBAI", supervisorStock:{"EDB-SUP-MUM1":8}, washerStock:{}, lastProcurementDate:d(3,10), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-MUM-003", itemName:"Dashboard Polish",          category:"Cleaning Supplies", unit:"L",   centralStock:22,  reorderLevel:20, unitCost:155, cityId:"CITY-MUMBAI", supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,20), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-MUM-004", itemName:"Washer Uniform Set",        category:"Consumables",       unit:"Pcs", centralStock:30,  reorderLevel:15, unitCost:680, cityId:"CITY-MUMBAI", supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,5), createdAt:NOW, updatedAt:NOW },
];

// ═════════════════════════════════════════════════════════════════════════════
// 14. STOCK TRANSACTIONS — procurement + issuances (needed by Inventory screens)
// ═════════════════════════════════════════════════════════════════════════════
const STOCK_TRANSACTIONS: any[] = [];
let stIdx = 1;
for (const m of MONTHS) {
  // Procurement into Central
  STOCK_TRANSACTIONS.push({ transactionId:`ST-PROC-SUR-${m}-001`, itemId:"INV-SUR-001", type:"Procurement", quantity:20, fromLocation:"Central", toLocation:"Central", reason:"Monthly replenishment", requestedBy:"EDB-SM-SUR1", approvedBy:"EDB-CM-SUR", status:"Completed", cityId:"CITY-SURAT", createdAt:d(m,8)+"T09:00:00.000Z", completedAt:d(m,9)+"T10:00:00.000Z" });
  STOCK_TRANSACTIONS.push({ transactionId:`ST-PROC-SUR-${m}-002`, itemId:"INV-SUR-002", type:"Procurement", quantity:50, fromLocation:"Central", toLocation:"Central", reason:"Replenishment", requestedBy:"EDB-SM-SUR1", approvedBy:"EDB-CM-SUR", status:"Completed", cityId:"CITY-SURAT", createdAt:d(m,8)+"T09:00:00.000Z", completedAt:d(m,9)+"T10:00:00.000Z" });
  // Issue to Supervisor
  STOCK_TRANSACTIONS.push({ transactionId:`ST-ISSUE-SUR-${m}-001`, itemId:"INV-SUR-001", type:"Issue", quantity:5, fromLocation:"Central", toLocation:"Supervisor", toId:"EDB-SUP-SUR1", reason:"Weekly issue", requestedBy:"EDB-SUP-SUR1", approvedBy:"EDB-SM-SUR1", status:"Completed", cityId:"CITY-SURAT", createdAt:d(m,2)+"T08:00:00.000Z", completedAt:d(m,2)+"T09:00:00.000Z" });
  STOCK_TRANSACTIONS.push({ transactionId:`ST-ISSUE-SUR-${m}-002`, itemId:"INV-SUR-002", type:"Issue", quantity:12, fromLocation:"Central", toLocation:"Supervisor", toId:"EDB-SUP-SUR1", reason:"Weekly issue", requestedBy:"EDB-SUP-SUR1", approvedBy:"EDB-SM-SUR1", status:"Completed", cityId:"CITY-SURAT", createdAt:d(m,2)+"T08:00:00.000Z", completedAt:d(m,2)+"T09:00:00.000Z" });
  // Issue to Washer
  STOCK_TRANSACTIONS.push({ transactionId:`ST-ISSUE-SUR-${m}-003`, itemId:"INV-SUR-002", type:"Issue", quantity:3, fromLocation:"Supervisor", fromId:"EDB-SUP-SUR1", toLocation:"Washer", toId:"EDB-CW-SUR1A", reason:"Daily issue", requestedBy:"EDB-CW-SUR1A", approvedBy:"EDB-SUP-SUR1", status:"Completed", cityId:"CITY-SURAT", createdAt:d(m,3)+"T07:00:00.000Z", completedAt:d(m,3)+"T07:30:00.000Z" });
  // Mumbai procurement
  STOCK_TRANSACTIONS.push({ transactionId:`ST-PROC-MUM-${m}-001`, itemId:"INV-MUM-001", type:"Procurement", quantity:25, fromLocation:"Central", toLocation:"Central", reason:"Monthly replenishment", requestedBy:"EDB-SM-SUR1", approvedBy:"EDB-CM-MUM", status:"Completed", cityId:"CITY-MUMBAI", createdAt:d(m,8)+"T09:00:00.000Z", completedAt:d(m,9)+"T10:00:00.000Z" });
  stIdx += 6;
}

// ═════════════════════════════════════════════════════════════════════════════
// 15. FINANCE (MRR, Payables, Revenues) — for FinanceContext
// ═════════════════════════════════════════════════════════════════════════════
const FINANCE_MRR: any[] = [];
for (const m of MONTHS) {
  const ms = `2026-${String(m).padStart(2,"0")}`;
  const surSubs = SUBS.filter(s => s.cityId==="CITY-SURAT" && s.status!=="Cancelled").slice(0,15);
  const mumSubs = SUBS.filter(s => s.cityId==="CITY-MUMBAI" && s.status!=="Cancelled").slice(0,12);
  surSubs.forEach((s,i) => FINANCE_MRR.push({ mrrId:`MRR-SUR-${m}-${String(i+1).padStart(3,"0")}`, month:ms, subscriptionId:s.subscriptionId, customerId:s.customerId, revenue:s.pricing.finalPrice, status:s.status==="Paused"?"Paused":"Active", cityId:"CITY-SURAT", createdAt:`${ms}-01T00:00:00.000Z`, updatedAt:`${ms}-01T00:00:00.000Z` }));
  mumSubs.forEach((s,i) => FINANCE_MRR.push({ mrrId:`MRR-MUM-${m}-${String(i+1).padStart(3,"0")}`, month:ms, subscriptionId:s.subscriptionId, customerId:s.customerId, revenue:s.pricing.finalPrice, status:s.status==="Paused"?"Paused":"Active", cityId:"CITY-MUMBAI", createdAt:`${ms}-01T00:00:00.000Z`, updatedAt:`${ms}-01T00:00:00.000Z` }));
}

const TYPE_MAP: Record<string,string> = { Vendor:"Vendor", Statutory:"Statutory", Salary:"Salary", Overdue:"Vendor" };
const FINANCE_PAYABLES: any[] = [
  { payableId:"PAY-SUR-001", type:"Vendor",    vendorName:"Shreeji Chemicals",          invoiceNumber:"INV-2026-0142", amount:18500, dueDate:d(2,28), status:"Paid",    description:"Feb chemicals supply",            cityId:"CITY-SURAT",  paidAt:d(2,25), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-SUR-002", type:"Vendor",    vendorName:"Rajkot Equipment Traders",   invoiceNumber:"INV-2026-0201", amount:12000, dueDate:d(3,15), status:"Paid",    description:"Pressure washer nozzles",         cityId:"CITY-SURAT",  paidAt:d(3,14), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-SUR-003", type:"Statutory", vendorName:"ESIC Office",                statutoryType:"ESIC",          amount:8450,  dueDate:d(3,15), status:"Paid",    description:"ESIC contribution Feb 2026",      cityId:"CITY-SURAT",  paidAt:d(3,10), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-SUR-004", type:"Statutory", vendorName:"EPFO",                       statutoryType:"PF",            amount:24600, dueDate:d(3,15), status:"Paid",    description:"PF contribution Feb 2026",        cityId:"CITY-SURAT",  paidAt:d(3,12), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-SUR-005", type:"Vendor",    vendorName:"Shreeji Chemicals",          invoiceNumber:"INV-2026-0289", amount:21000, dueDate:d(3,31), status:"Pending", description:"March chemicals supply",          cityId:"CITY-SURAT",  createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-SUR-006", type:"Statutory", vendorName:"Gujarat Professional Tax",   statutoryType:"PT",            amount:4200,  dueDate:d(4,15), status:"Pending", description:"PT Q4 FY 2025-26",               cityId:"CITY-SURAT",  createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-MUM-001", type:"Vendor",    vendorName:"Mumbai Wash Supplies",       invoiceNumber:"INV-2026-0155", amount:22000, dueDate:d(2,28), status:"Paid",    description:"Feb chemicals + equipment",       cityId:"CITY-MUMBAI", paidAt:d(2,26), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-MUM-002", type:"Statutory", vendorName:"ESIC Office",                statutoryType:"ESIC",          amount:9200,  dueDate:d(3,15), status:"Paid",    description:"ESIC contribution Feb 2026",      cityId:"CITY-MUMBAI", paidAt:d(3,11), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-MUM-003", type:"Vendor",    vendorName:"Rapid Wash Tools",           invoiceNumber:"INV-2026-0098", amount:15500, dueDate:d(2,15), status:"Overdue", description:"Equipment repair — overdue 30+ days", cityId:"CITY-MUMBAI", createdAt:NOW, updatedAt:NOW },
];

const FINANCE_REVENUES: any[] = [];
const PM = ["UPI","UPI","UPI","Card","Cash","Bank Transfer"] as const;
for (const m of MONTHS) {
  const ms = String(m).padStart(2,"0");
  SUBS.filter(s => s.cityId==="CITY-SURAT").slice(0,12).forEach((s,i) => {
    FINANCE_REVENUES.push({ revenueId:`REV-SUR-SUB-${m}-${String(i+1).padStart(3,"0")}`, customerId:s.customerId, subscriptionId:s.subscriptionId, type:"Subscription", amount:s.pricing.finalPrice, receivedDate:`2026-${ms}-01`, paymentMethod:PM[i%PM.length], invoiceNumber:`INV-SUR-${m}-${String(i+1).padStart(4,"0")}`, status:"Received", cityId:"CITY-SURAT", createdAt:`2026-${ms}-01T09:00:00.000Z` });
  });
  for (let day=5; day<=25; day+=5) {
    FINANCE_REVENUES.push({ revenueId:`REV-SUR-OT-${m}-${day}`, customerId:CUSTOMERS[day%100].customerId, type:"One-Time", amount:499+(day%2===0?200:0), receivedDate:`2026-${ms}-${String(day).padStart(2,"0")}`, paymentMethod:"Cash", invoiceNumber:`INV-SUR-OT-${m}-${day}`, status:"Received", cityId:"CITY-SURAT", createdAt:`2026-${ms}-${String(day).padStart(2,"0")}T10:00:00.000Z` });
  }
  SUBS.filter(s => s.cityId==="CITY-MUMBAI").slice(0,8).forEach((s,i) => {
    FINANCE_REVENUES.push({ revenueId:`REV-MUM-SUB-${m}-${String(i+1).padStart(3,"0")}`, customerId:s.customerId, subscriptionId:s.subscriptionId, type:"Subscription", amount:s.pricing.finalPrice, receivedDate:`2026-${ms}-01`, paymentMethod:PM[i%PM.length], invoiceNumber:`INV-MUM-${m}-${String(i+1).padStart(4,"0")}`, status:"Received", cityId:"CITY-MUMBAI", createdAt:`2026-${ms}-01T09:00:00.000Z` });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 16. ADVANCES
// ═════════════════════════════════════════════════════════════════════════════
const ADVANCES: any[] = [
  { id:"ADV-SUR-001", employeeId:"EDB-CW-SUR1A", type:"short_term", amount:5000, reason:"Medical emergency", status:"Approved", cityId:"CITY-SURAT", requestDate:d(2,5), approvedDate:d(2,7), deductMonth:3, deductYear:2026 },
  { id:"ADV-SUR-002", employeeId:"EDB-CW-SUR2B", type:"short_term", amount:3000, reason:"Family function",   status:"Approved", cityId:"CITY-SURAT", requestDate:d(3,1), approvedDate:d(3,3), deductMonth:4, deductYear:2026 },
  { id:"ADV-SUR-003", employeeId:"EDB-CW-SUR1C", type:"short_term", amount:8000, reason:"House rent advance", status:"Pending", cityId:"CITY-SURAT", requestDate:d(4,1) },
  { id:"ADV-MUM-001", employeeId:"EDB-CW-MUM1B", type:"short_term", amount:6000, reason:"Medical treatment", status:"Approved", cityId:"CITY-MUMBAI",requestDate:d(2,10),approvedDate:d(2,12),deductMonth:3, deductYear:2026 },
];

// ═════════════════════════════════════════════════════════════════════════════
// 17. CLOTH TRACKING
// ═════════════════════════════════════════════════════════════════════════════
const CLOTH: any[] = [];
for (const emp of EMPLOYEES.filter(e => e.designation === "Car Washer")) {
  CLOTH.push({ id:`CLT-${emp.id}`, employeeId:emp.id, cityId:emp.cityId, uniformsIssued:2, uniformsReturned:0, currentlyWith:2, lastIssuedDate:emp.dateOfJoining, condition:"Good", exchanges:[{ date:d(3,1), type:"Damaged", oldQty:1, newQty:1, reason:"Torn during work" }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 18. ACCOUNTING — Ledgers + Entries + Journals (for Finance/Accounts/GST)
// ═════════════════════════════════════════════════════════════════════════════
const LEDGERS: any[] = [
  { id:"LM-AXB-SUR",    name:"Axis Bank",           accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"bank",            openingBalance:320000, openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CASH-SUR",   name:"Petty Cash",           accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"other",           openingBalance:25000,  openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RZP-SUR",    name:"Razorpay",             accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"payment_gateway", openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-DEBTOR-SUR", name:"Customer Debtors",     accountHead:"accounts_receivable", accountHeadLabel:"Accounts Receivable",  nature:"asset",     type:"customer",        openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ITC-SUR",    name:"Input Tax Credits",    accountHead:"gst_input",           accountHeadLabel:"GST Input (ITC)",      nature:"asset",     type:"other",           openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ADVTAX-SUR", name:"Advance Tax",          accountHead:"current_assets",      accountHeadLabel:"Current Assets",       nature:"asset",     type:"other",           openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-TDS194C-SUR",name:"TDS Payable 194C",     accountHead:"tds_payable",         accountHeadLabel:"TDS Payable",          nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-TDS194J-SUR",name:"TDS Payable 194J",     accountHead:"tds_payable",         accountHeadLabel:"TDS Payable",          nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-OCGST-SUR",  name:"Output CGST",          accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-OSGST-SUR",  name:"Output SGST",          accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-SALARY-SUR", name:"Salary Payable",       accountHead:"other_liabilities",   accountHeadLabel:"Other Liabilities",    nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-PF-SUR",     name:"PF Payable",           accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ESIC-SUR",   name:"ESIC Payable",         accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RZPCHG-SUR", name:"Transaction Charges (Razorpay)", accountHead:"indirect_expenses", accountHeadLabel:"Indirect Expenses", nature:"expense", type:"expense", openingBalance:0, openingBalanceType:"Dr", city:"Surat", cityId:"CITY-SURAT", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-SUBREV-SUR", name:"Subscription - 4W",    accountHead:"sales_subscription",  accountHeadLabel:"Sales — Subscription", nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", packageCode:"4W" },
  { id:"LM-OT-SUR",     name:"One-time Service",     accountHead:"sales_service",       accountHeadLabel:"Sales — Service",      nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RENEW-SUR",  name:"Renewal Fees",         accountHead:"sales_renewal",       accountHeadLabel:"Sales — Renewal",      nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-LABOR-SUR",  name:"Salaries and Employee Wages", accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses", nature:"expense",   type:"expense",           openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CHEM-SUR",   name:"Raw Materials And Consumables",accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses",nature:"expense",   type:"expense",           openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RENT-SUR",   name:"Rent Expense",         accountHead:"indirect_expenses",   accountHeadLabel:"Indirect Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ELEC-SUR",   name:"Electricity Expense",  accountHead:"indirect_expenses",   accountHeadLabel:"Indirect Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CONS-SUR",   name:"Consultant Expense",   accountHead:"indirect_expenses",   accountHeadLabel:"Indirect Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-SHREEJI",    name:"Shreeji Chemicals",    accountHead:"accounts_payable",    accountHeadLabel:"Accounts Payable",     nature:"liability", type:"vendor",          openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", gstin:"24AABCS1234C1Z5" },
  { id:"LM-RAJKOT",     name:"Rajkot Equipment Traders",accountHead:"accounts_payable", accountHeadLabel:"Accounts Payable",     nature:"liability", type:"vendor",          openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", gstin:"24AABCR5678D1Z2" },
  // MUMBAI
  { id:"LM-AXB-MUM",    name:"Axis Bank",            accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"bank",            openingBalance:280000, openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CASH-MUM",   name:"Petty Cash",           accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"other",           openingBalance:20000,  openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RZP-MUM",    name:"Razorpay",             accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"payment_gateway", openingBalance:0,      openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-SUBREV-MUM", name:"Subscription - 4W",    accountHead:"sales_subscription",  accountHeadLabel:"Sales — Subscription", nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", packageCode:"4W" },
  { id:"LM-LABOR-MUM",  name:"Salaries and Employee Wages",accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CHEM-MUM",   name:"Raw Materials And Consumables",accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses",  nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
];

// ── Accounting Entries (Sales + Purchases + Expenses) ────────────────────────
let accSeq = 1;
const ACC_ENTRIES: any[] = [];
function gst18(taxable: number) { return { taxableValue:taxable, gstRate:18, cgst:Math.round(taxable*0.09), sgst:Math.round(taxable*0.09), igst:0, totalBillValue:taxable+Math.round(taxable*0.18) }; }
function noGst(amt: number) { return { taxableValue:amt, gstRate:0, cgst:0, sgst:0, igst:0, totalBillValue:amt }; }

for (const m of MONTHS) {
  const ms = String(m).padStart(2,"0");
  // Surat — subscription sales
  [1150,1150,1499,1150,1999,1150,1150,1499,1150,1499,1150,1999].forEach((base,i)=>{
    const g=gst18(base);
    ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`SAL/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Sales", date:`2026-${ms}-01`, gstEntryType:"B2B", ...g, invoiceNumber:`SUB-SUR-${m}-${i+1}`, hsnSacCode:"998519", debitAccount:"LM-RZP-SUR", creditAccount:"LM-SUBREV-SUR", paymentMode:"Bank", isRCM:false, narration:`Subscription — ${["Water Wash","Shampoo Wash","Shampoo+Wax"][i%3]}`, city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-01T10:00:00.000Z`, status:"Posted", changeHistory:[] });
  });
  // Surat — one-time washes
  [5,9,13,17,21].forEach((day,i)=>{ const g=gst18(499+(i%2===0?200:0)); ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`SAL/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Sales", date:`2026-${ms}-${String(day).padStart(2,"0")}`, gstEntryType:"Unregistered", ...g, invoiceNumber:`OT-SUR-${m}-${i+1}`, hsnSacCode:"998519", debitAccount:"LM-CASH-SUR", creditAccount:"LM-OT-SUR", paymentMode:"Cash", isRCM:false, narration:"One-time wash", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-${String(day).padStart(2,"0")}T10:00:00.000Z`, status:"Posted", changeHistory:[] });});
  // Surat — chemical purchase (B2B, ITC)
  const chemAmt=[18500,21000,19500][m-2]; const gc=gst18(chemAmt);
  ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`PUR/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Purchase", date:`2026-${ms}-10`, gstEntryType:"B2B", ...gc, vendorName:"Shreeji Chemicals", vendorGstin:"24AABCS1234C1Z5", vendorStateCode:"24", invoiceNumber:`SHREEJI-${m}-001`, hsnSacCode:"34022000", expenseAccount:"direct_expenses", expenseAccountLabel:"Direct Expenses", debitAccount:"LM-CHEM-SUR", creditAccount:"LM-SHREEJI", paymentMode:"Bank", isRCM:false, narration:"Chemicals — shampoo, tyre shine, polish", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-10T10:00:00.000Z`, status:"Posted", changeHistory:[] });
  // Surat — rent (RCM)
  const rent=35000; const rcmC=Math.round(rent*0.09); const rcmS=Math.round(rent*0.09);
  ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`EXP/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Expense", date:`2026-${ms}-01`, gstEntryType:"RCM", taxableValue:rent, gstRate:18, cgst:rcmC, sgst:rcmS, igst:0, totalBillValue:rent, vendorName:"Proprietor (Landlord)", vendorStateCode:"24", invoiceNumber:`RENT-${m}`, hsnSacCode:"997211", expenseAccount:"indirect_expenses", expenseAccountLabel:"Indirect Expenses", debitAccount:"LM-RENT-SUR", creditAccount:"LM-AXB-SUR", paymentMode:"Bank", isRCM:true, rcmCgst:rcmC, rcmSgst:rcmS, narration:"Office/depot rent — RCM", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-01T11:00:00.000Z`, status:"Posted", changeHistory:[] });
  // Surat — electricity (NonGST)
  const elec=[4200,4600,5100][m-2];
  ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`EXP/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Expense", date:`2026-${ms}-18`, gstEntryType:"NonGST", ...noGst(elec), vendorName:"DGVCL", vendorStateCode:"24", invoiceNumber:`ELEC-${m}`, hsnSacCode:"", expenseAccount:"indirect_expenses", expenseAccountLabel:"Indirect Expenses", debitAccount:"LM-ELEC-SUR", creditAccount:"LM-AXB-SUR", paymentMode:"Bank", isRCM:false, narration:"Electricity bill", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-18T10:00:00.000Z`, status:"Posted", changeHistory:[] });
  // Renewals
  [1299,1499,999].forEach((base,i)=>{ const g=gst18(base); ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`SAL/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Sales", date:`2026-${ms}-${String(2+i*7).padStart(2,"0")}`, gstEntryType:"B2B", ...g, invoiceNumber:`REN-SUR-${m}-${i+1}`, hsnSacCode:"998519", debitAccount:"LM-RZP-SUR", creditAccount:"LM-RENEW-SUR", paymentMode:"Bank", isRCM:false, narration:"Subscription renewal", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-${String(2+i*7).padStart(2,"0")}T10:00:00.000Z`, status:"Posted", changeHistory:[] });});
  // Mumbai sales
  [1280,1280,1690,1280,1280].forEach((base,i)=>{ const g=gst18(base); ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`SAL/MUMBAI/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Sales", date:`2026-${ms}-01`, gstEntryType:"B2B", ...g, invoiceNumber:`SUB-MUM-${m}-${i+1}`, hsnSacCode:"998519", debitAccount:"LM-RZP-MUM", creditAccount:"LM-SUBREV-MUM", paymentMode:"Bank", isRCM:false, narration:"Subscription Mumbai", city:"Mumbai", cityId:"CITY-MUMBAI", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-01T10:00:00.000Z`, status:"Posted", changeHistory:[] });});
  // Mumbai chemicals
  const mchemAmt=[22000,25000,21000][m-2]; const mcg=gst18(mchemAmt);
  ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`PUR/MUMBAI/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Purchase", date:`2026-${ms}-12`, gstEntryType:"B2B", ...mcg, vendorName:"Mumbai Wash Supplies", vendorGstin:"27AABCM5432G1Z1", vendorStateCode:"27", invoiceNumber:`MWS-${m}-001`, hsnSacCode:"34022000", expenseAccount:"direct_expenses", expenseAccountLabel:"Direct Expenses", debitAccount:"LM-CHEM-MUM", creditAccount:"LM-AXB-MUM", paymentMode:"Bank", isRCM:false, narration:"Chemicals — Mumbai", city:"Mumbai", cityId:"CITY-MUMBAI", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-12T10:00:00.000Z`, status:"Posted", changeHistory:[] });
}
// Apr — asset purchase
ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:"AST/SURAT/25-26/0001", entryType:"AssetPurchase", date:"2026-04-10", gstEntryType:"B2B", ...gst18(45000), vendorName:"Clean Tech India", vendorGstin:"24AABCC4321F1Z3", vendorStateCode:"24", invoiceNumber:"ASSET-APR-001", hsnSacCode:"84248990", expenseAccount:"fixed_assets", expenseAccountLabel:"Fixed Assets", debitAccount:"LM-AXB-SUR", creditAccount:"LM-SHREEJI", paymentMode:"Bank", isRCM:false, narration:"Honda GX160 pressure washer — 2 units", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:"2026-04-10T10:00:00.000Z", status:"Posted", changeHistory:[] });

// ── Journal Entries ──────────────────────────────────────────────────────────
let jvSeq2 = 1;
const jvNo2 = (city="SURAT") => `JV/${city}/25-26/${String(jvSeq2++).padStart(4,"0")}`;
const JOURNALS: any[] = [];
for (const m of MONTHS) {
  const ms   = String(m).padStart(2,"0");
  const mEnd = MONTH_DAYS[m];
  const nm   = m===4?5:m+1; const nms = String(nm).padStart(2,"0");
  // Salary disbursal
  JOURNALS.push({ id:`JV-SAL-${m}`,    voucherNumber:jvNo2(), date:`2026-${ms}-${mEnd}`, narration:`Salary disbursal — Surat — ${MONTH_NAMES[m]} 2026`, lines:[{accountHead:"LM-LABOR-SUR",accountLabel:"Salaries",debit:550000,credit:0},{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:0,credit:513550},{accountHead:"LM-PF-SUR",accountLabel:"PF Payable",debit:0,credit:28000},{accountHead:"LM-ESIC-SUR",accountLabel:"ESIC Payable",debit:0,credit:8500},{accountHead:"LM-TDS194C-SUR",accountLabel:"TDS Payable",debit:0,credit:4200},{accountHead:"LM-SALARY-SUR",accountLabel:"Salary Payable (PT)",debit:0,credit:3600}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-${mEnd}T18:00:00.000Z`, status:"Posted", changeHistory:[] });
  // PF+ESIC challan
  JOURNALS.push({ id:`JV-PF-${m}`,     voucherNumber:jvNo2(), date:`2026-${nms}-07`,    narration:`PF+ESIC challan — ${MONTH_NAMES[m]} 2026`,   lines:[{accountHead:"LM-PF-SUR",accountLabel:"PF Payable",debit:56000,credit:0},{accountHead:"LM-ESIC-SUR",accountLabel:"ESIC Payable",debit:11750,credit:0},{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:0,credit:67750}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${nms}-07T11:00:00.000Z`, status:"Posted", changeHistory:[] });
  // TDS deposit
  JOURNALS.push({ id:`JV-TDS-${m}`,    voucherNumber:jvNo2(), date:`2026-${nms}-06`,    narration:`TDS deposit 194C — ${MONTH_NAMES[m]} 2026`, lines:[{accountHead:"LM-TDS194C-SUR",accountLabel:"TDS Payable 194C",debit:4200,credit:0},{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:0,credit:4200}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${nms}-06T10:00:00.000Z`, status:"Posted", changeHistory:[] });
  // Razorpay settlement
  const rzpG=[135700,140200,148500][m-2]; const rzpFee=Math.round(rzpG*0.02); const rzpNet=rzpG-rzpFee;
  JOURNALS.push({ id:`JV-RZP-${m}`,    voucherNumber:jvNo2(), date:`2026-${ms}-03`,    narration:`Razorpay settlement — ${MONTH_NAMES[m]} 2026`, lines:[{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:rzpNet,credit:0},{accountHead:"LM-RZPCHG-SUR",accountLabel:"Razorpay Charges",debit:rzpFee,credit:0},{accountHead:"LM-RZP-SUR",accountLabel:"Razorpay",debit:0,credit:rzpG}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-03T14:00:00.000Z`, status:"Posted", changeHistory:[] });
  // GST payment
  const gstPay=[12600,13400,14200][m-2];
  JOURNALS.push({ id:`JV-GST-${m}`,    voucherNumber:jvNo2(), date:`2026-${nms}-20`,   narration:`GST payment CGST+SGST — ${MONTH_NAMES[m]} 2026`, lines:[{accountHead:"LM-OCGST-SUR",accountLabel:"Output CGST",debit:Math.round(gstPay/2),credit:0},{accountHead:"LM-OSGST-SUR",accountLabel:"Output SGST",debit:Math.round(gstPay/2),credit:0},{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:0,credit:gstPay}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${nms}-20T12:00:00.000Z`, status:"Posted", changeHistory:[] });
  // Mumbai salary
  JOURNALS.push({ id:`JV-MUM-SAL-${m}`,voucherNumber:jvNo2("MUMBAI"), date:`2026-${ms}-${mEnd}`, narration:`Salary disbursal — Mumbai — ${MONTH_NAMES[m]} 2026`, lines:[{accountHead:"LM-LABOR-MUM",accountLabel:"Salaries Mumbai",debit:480000,credit:0},{accountHead:"LM-AXB-MUM",accountLabel:"Axis Bank Mumbai",debit:0,credit:480000}], city:"Mumbai", cityId:"CITY-MUMBAI", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-${mEnd}T18:30:00.000Z`, status:"Posted", changeHistory:[] });
}
// Advance tax
JOURNALS.push({ id:"JV-ADVTAX-1", voucherNumber:jvNo2(), date:"2026-03-15", narration:"Advance Tax Instalment 1 (15%) FY 25-26", lines:[{accountHead:"LM-ADVTAX-SUR",accountLabel:"Advance Tax",debit:18500,credit:0},{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:0,credit:18500}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:"2026-03-15T11:00:00.000Z", status:"Posted", changeHistory:[] });

// ═════════════════════════════════════════════════════════════════════════════
// SEEDER FUNCTION
// ═════════════════════════════════════════════════════════════════════════════
export function seedAllData(): void {
  try {
    if (localStorage.getItem(SEED_FLAG)) return;

    // Clear old seed flags so users with broken V4/V5 data get fresh correct seed
    ["HISTORIC_DATA_SEEDED_V1","HISTORIC_DATA_SEEDED_V2","HISTORIC_DATA_SEEDED_V3",
     "HISTORIC_DATA_SEEDED_V4","HISTORIC_DATA_SEEDED_V5","ACC_SEED_V1","ACC_SEED_V2",
     "ALL_DATA_SEEDED_V1"].forEach(f => localStorage.removeItem(f));

    // ── 1. EMPLOYEES ─────────────────────────────────────────────────────────
    const existEmp = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS")||"[]");
    const existIds = new Set(existEmp.map((e:any)=>e.id));
    const allEmp   = [...existEmp, ...EMPLOYEES_RAW.filter(e=>!existIds.has(e.id))];
    localStorage.setItem("EMPLOYEE_DATABASE_RECORDS", JSON.stringify(allEmp)); // auth
    localStorage.setItem("cleancar_employees",              JSON.stringify(EMPLOYEES));       // legacy fallback
    localStorage.setItem("cleancar_CITY-SURAT_employees",   JSON.stringify(SUR_EMPS));
    localStorage.setItem("cleancar_CITY-MUMBAI_employees",  JSON.stringify(MUM_EMPS));

    // ── 2. SALARY STRUCTURES ─────────────────────────────────────────────────
    writeByCityId("salary_structures", SALARY_STRUCTURES);

    // ── 3. INCENTIVE PLANS ───────────────────────────────────────────────────
    writeByCityId("incentive_plans", INCENTIVE_PLANS);

    // ── 4. PAYROLL RUNS ──────────────────────────────────────────────────────
    writeByCityId("payroll_runs", PAYROLL_RUNS);

    // ── 5. EMPLOYEE INCENTIVES ───────────────────────────────────────────────
    writeByCityId("employee_incentives", EMPLOYEE_INCENTIVES);

    // ── 6. ATTENDANCE ────────────────────────────────────────────────────────
    writeByCityId("attendance_records", ATTENDANCE_RECORDS);

    // ── 7. CUSTOMERS ─────────────────────────────────────────────────────────
    writeByCityId("customers", CUSTOMERS);

    // ── 8. LEADS ─────────────────────────────────────────────────────────────
    writeByCityId("leads", LEADS);

    // ── 9. DEMOS ─────────────────────────────────────────────────────────────
    writeByCityId("demos", DEMOS);

    // ── 10. SUBSCRIPTIONS ────────────────────────────────────────────────────
    writeByCityId("subscriptions", SUBS);

    // ── 11. JOBS ─────────────────────────────────────────────────────────────
    writeByCityId("jobs", JOBS);

    // ── 12. COMPLAINTS (DataService + raw key for customerCareExecutiveService)
    writeByCityId("complaints", COMPLAINTS_DS);
    localStorage.setItem("cleancar_complaints", JSON.stringify(COMPLAINTS_RAW));

    // ── 13. INVENTORY ────────────────────────────────────────────────────────
    const invByCityId: Record<string,any[]> = {};
    for (const item of INVENTORY_ITEMS) {
      const cid = item.cityId || "CITY-SURAT";
      if (!invByCityId[cid]) invByCityId[cid] = [];
      invByCityId[cid].push(item);
    }
    for (const [cid, items] of Object.entries(invByCityId)) {
      localStorage.setItem(`cleancar_${cid}_inventory_items`, JSON.stringify(items));
    }

    // ── 14. STOCK TRANSACTIONS ───────────────────────────────────────────────
    writeByCityId("stock_transactions", STOCK_TRANSACTIONS);

    // ── 15. FINANCE ──────────────────────────────────────────────────────────
    writeByCityId("mrr",      FINANCE_MRR);
    writeByCityId("payables", FINANCE_PAYABLES);
    writeByCityId("revenues", FINANCE_REVENUES);

    // ── 16. ADVANCES ─────────────────────────────────────────────────────────
    writeByCityId("advance_management", ADVANCES);

    // ── 17. CLOTH TRACKING ───────────────────────────────────────────────────
    writeByCityId("cloth_tracking", CLOTH);

    // ── 18. ACCOUNTING LEDGERS ───────────────────────────────────────────────
    const existLedgers: any[] = JSON.parse(localStorage.getItem("cleancar_ledger_masters")||"[]");
    const existLedgerIds = new Set(existLedgers.map((l:any)=>l.id));
    localStorage.setItem("cleancar_ledger_masters",
      JSON.stringify([...existLedgers, ...LEDGERS.filter(l=>!existLedgerIds.has(l.id))]));

    // ── 19. ACCOUNTING ENTRIES ───────────────────────────────────────────────
    const existEntries: any[] = JSON.parse(localStorage.getItem("cleancar_accounting_entries")||"[]");
    const existEntryIds = new Set(existEntries.map((e:any)=>e.id));
    localStorage.setItem("cleancar_accounting_entries",
      JSON.stringify([...existEntries, ...ACC_ENTRIES.filter(e=>!existEntryIds.has(e.id))]));

    // ── 20. JOURNAL ENTRIES ──────────────────────────────────────────────────
    const existJournals: any[] = JSON.parse(localStorage.getItem("cleancar_journal_entries")||"[]");
    const existJvIds = new Set(existJournals.map((j:any)=>j.id));
    localStorage.setItem("cleancar_journal_entries",
      JSON.stringify([...existJournals, ...JOURNALS.filter(j=>!existJvIds.has(j.id))]));

    localStorage.setItem(SEED_FLAG, "true");
    console.log(`[seedAllData] ✅ Complete seed done:\n` +
      `  Employees: ${EMPLOYEES.length} | Payroll: ${PAYROLL_RUNS.length} | Attendance: ${ATTENDANCE_RECORDS.length}\n` +
      `  Customers: ${CUSTOMERS.length} | Leads: ${LEADS.length} | Demos: ${DEMOS.length}\n` +
      `  Subscriptions: ${SUBS.length} | Jobs: ${JOBS.length} | Complaints: ${COMPLAINTS_DS.length}\n` +
      `  Inventory: ${INVENTORY_ITEMS.length} items | Stock txns: ${STOCK_TRANSACTIONS.length}\n` +
      `  Salary structures: ${SALARY_STRUCTURES.length} | Incentive plans: ${INCENTIVE_PLANS.length} | Employee incentives: ${EMPLOYEE_INCENTIVES.length}\n` +
      `  Accounting: ${LEDGERS.length} ledgers | ${ACC_ENTRIES.length} entries | ${JOURNALS.length} journals\n` +
      `  Finance: ${FINANCE_MRR.length} MRR | ${FINANCE_PAYABLES.length} payables | ${FINANCE_REVENUES.length} revenues`);
  } catch (err) {
    console.error("[seedAllData] Failed:", err);
  }
}
