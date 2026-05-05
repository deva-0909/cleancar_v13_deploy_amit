/**
 * Supabase Data Loader
 * Loads ALL data from Supabase into localStorage on app startup.
 * Strategy: write ONLY legacy combined keys to avoid localStorage quota issues.
 * DataService falls back to legacy key when city-namespaced key is missing.
 */

import { isSupabaseEnabled } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
};

// Map: Supabase table → localStorage legacy key (format: cleancar_{key})
// DataService falls back to this when city-namespaced key is missing
const TABLE_MAP: Array<{ table: string; localKey: string; limit?: number }> = [
  { table: "cleancar_revenues",            localKey: "revenues"           },
  { table: "cleancar_payables",            localKey: "payables"           },
  { table: "cleancar_mrr",                 localKey: "mrr"                },
  { table: "cleancar_customers",           localKey: "customers"          },
  { table: "cleancar_leads",               localKey: "leads"              },
  { table: "cleancar_subscriptions",       localKey: "subscriptions"      },
  { table: "cleancar_inventory",           localKey: "inventory"          },
  { table: "cleancar_salary_structures",   localKey: "salary_structures"  },
  { table: "cleancar_incentive_plans",     localKey: "incentive_plans"    },
  { table: "cleancar_employee_incentives", localKey: "employee_incentives"},
  { table: "cleancar_payroll_runs",        localKey: "payroll_runs"       },
  { table: "cleancar_employees",           localKey: "employees"          },
  { table: "cleancar_jobs",                localKey: "jobs",        limit: 1500 },
  { table: "cleancar_attendance",          localKey: "attendance_records", limit: 1000 },
];


// ── Field Normalizers ────────────────────────────────────────────────────────
// Seed data uses different field names than what contexts expect.
// These normalizers map seed fields → context fields at load time.

function normalizeEmployee(e: any): any {
  if (!e) return e;
  return {
    ...e,
    // Map seed fields to context fields
    phone:            e.phone       || e.mobile        || "",
    role:             e.role        || e.designation   || "",
    city:             e.city        || e.workLocation  || e.cityId || "",
    joiningDate:      e.joiningDate || e.dateOfJoining || "",
    assignedPincodes: e.assignedPincodes || e.pinCodes || [],
    incentiveEligible: e.incentiveEligible !== undefined ? e.incentiveEligible : true,
    // Keep originals too for backward compat
    designation: e.designation || e.role || "",
    mobile:      e.mobile      || e.phone || "",
    workLocation: e.workLocation || e.cityId || "",
    dateOfJoining: e.dateOfJoining || e.joiningDate || "",
    pinCodes: e.pinCodes || e.assignedPincodes || [],
  };
}

function normalizeJob(j: any): any {
  if (!j) return j;
  // Ensure scheduledDate is a full ISO string for date comparisons
  const d = j.scheduledDate || "";
  return {
    ...j,
    scheduledDate: d.length === 10 ? d + "T00:00:00.000Z" : d,
  };
}

function normalizeRecord(table: string, record: any): any {
  switch (table) {
    case "cleancar_employees": return normalizeEmployee(record);
    case "cleancar_jobs":      return normalizeJob(record);
    default:                   return record;
  }
}

async function fetchTable(table: string, limit?: number): Promise<any[]> {
  const allRows: any[] = [];
  const pageSize = Math.min(limit || 1000, 1000);
  let offset = 0;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=data&limit=${pageSize}&offset=${offset}`;
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) break;
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) break;
      allRows.push(...rows.map((r: any) => r.data));
      if (rows.length < pageSize) break;
      if (limit && allRows.length >= limit) break;
      offset += pageSize;
    } catch (e) {
      break;
    }
  }
  return allRows;
}

function safeWrite(key: string, data: any[]): void {
  // Try full data first, then progressively smaller until it fits
  const attempts = [data, data.slice(0, 500), data.slice(0, 200), data.slice(0, 50)];
  for (const attempt of attempts) {
    try {
      localStorage.setItem(key, JSON.stringify(attempt));
      return; // Success
    } catch (e) {
      // Quota exceeded — try smaller
    }
  }
  console.warn(`[Supabase] Could not store ${key} even at 50 records — localStorage full`);
}

export async function loadAllDataFromSupabase(forceReload = false): Promise<void> {
  if (!isSupabaseEnabled) {
    console.log("[Supabase] Not configured — using localStorage only");
    return;
  }

  // Always reload on first visit - use sessionStorage to skip on navigation within same session
  const SESSION_KEY = "cc360_data_loaded";
  if (!forceReload && sessionStorage.getItem(SESSION_KEY) === "1") {
    // Verify data actually exists before skipping
    try {
      const existing = localStorage.getItem("cleancar_revenues");
      const parsed = existing ? JSON.parse(existing) : null;
      if (Array.isArray(parsed) && parsed.length > 10) {
        console.log(`[Supabase] Data verified in localStorage (${parsed.length} revenues) — skipping fetch`);
        return;
      }
    } catch(e) {}
    // Data missing or corrupt — force reload
    console.log("[Supabase] Session flag set but data missing — reloading from Supabase");
  }

  console.log("[Supabase] Loading all data into localStorage...");

  // Clear ALL existing cleancar keys first to free up space
  const keysToDelete = Object.keys(localStorage).filter(k => k.startsWith("cleancar_"));
  keysToDelete.forEach(k => {
    try { localStorage.removeItem(k); } catch (e) {}
  });
  console.log(`[Supabase] Cleared ${keysToDelete.length} existing keys`);

  // Fetch and store each table sequentially (not parallel) to avoid race conditions
  for (const { table, localKey, limit } of TABLE_MAP) {
    try {
      const rows = await fetchTable(table, limit);
      if (rows.length === 0) {
        console.log(`[Supabase] ⚠️ ${table}: 0 records`);
        continue;
      }

      // Write ONLY the legacy key: cleancar_{localKey}
      // DataService automatically falls back to this when city-namespaced key is missing
      const legacyKey = `cleancar_${localKey}`;
      // Normalize field names to match context interfaces
      const normalized = rows.map((r: any) => normalizeRecord(table, r));
      safeWrite(legacyKey, normalized);
      console.log(`[Supabase] ✅ ${table}: ${normalized.length} records → ${legacyKey}`);

    } catch (err) {
      console.error(`[Supabase] Failed ${table}:`, err);
    }
  }

  console.log("[Supabase] ✅ All data loaded");
  sessionStorage.setItem("cc360_data_loaded", "1");
}
