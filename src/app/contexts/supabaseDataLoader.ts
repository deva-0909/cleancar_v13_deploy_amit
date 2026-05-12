/**
 * Supabase Data Loader
 * Loads ONLY small/critical tables from Supabase into localStorage.
 * Large tables (customers, leads, jobs, attendance) are read directly from
 * Supabase at query time via their respective contexts — NOT stored in localStorage.
 * 
 * This prevents localStorage from exceeding the 5MB browser limit.
 */

import { isSupabaseEnabled } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
};

// ONLY small/critical tables are stored in localStorage
// Large tables (customers, leads, jobs, attendance, subscriptions) are NOT cached here
const SMALL_TABLES: Array<{ table: string; localKey: string; maxRows: number }> = [
  { table: "cleancar_salary_structures",   localKey: "salary_structures",   maxRows: 50  },
  { table: "cleancar_incentive_plans",     localKey: "incentive_plans",     maxRows: 20  },
  { table: "cleancar_payroll_runs",        localKey: "payroll_runs",        maxRows: 100 },
  { table: "cleancar_employee_incentives", localKey: "employee_incentives", maxRows: 100 },
  { table: "cleancar_inventory",           localKey: "inventory",           maxRows: 200 },
  { table: "cleancar_mrr",                 localKey: "mrr",                 maxRows: 50  },
];

async function fetchTable(table: string, limit: number): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=data&limit=${limit}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows.map((r: any) => r.data).filter(Boolean);
  } catch {
    return [];
  }
}

function safeWrite(key: string, data: any[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    // Quota exceeded — skip this table
    console.warn(`[Supabase] Skipped ${key} — localStorage quota exceeded`);
    return false;
  }
}

export async function loadAllDataFromSupabase(forceReload = false): Promise<void> {
  if (!isSupabaseEnabled) {
    console.log("[Supabase] Not configured — using localStorage only");
    return;
  }

  // Skip if already loaded (unless forced)
  if (!forceReload) {
    const alreadyLoaded = localStorage.getItem("cleancar_salary_structures");
    if (alreadyLoaded) {
      console.log("[Supabase] Small tables already in localStorage — skipping fetch");
      return;
    }
  }

  // ONLY remove stale backup and migration keys — do NOT clear all cleancar_ keys
  // Clearing all keys would remove valid data like HRDataContext employees
  const staleKeys = Object.keys(localStorage).filter(k =>
    k.startsWith("BACKUP_PAYROLL_PRE") || k.startsWith("BACKUP_SALARY_PRE")
  );
  staleKeys.forEach(k => { try { localStorage.removeItem(k); } catch {} });

  console.log("[Supabase] Loading small/critical tables into localStorage...");

  for (const { table, localKey, maxRows } of SMALL_TABLES) {
    try {
      const rows = await fetchTable(table, maxRows);
      if (rows.length === 0) continue;
      const key = `cleancar_${localKey}`;
      safeWrite(key, rows);
      console.log(`[Supabase] ✅ ${table}: ${rows.length} records`);
    } catch (err) {
      console.error(`[Supabase] Failed ${table}:`, err);
    }
  }

  console.log("[Supabase] ✅ Critical tables loaded. Large tables (customers/leads/jobs) read from Supabase at query time.");
}
