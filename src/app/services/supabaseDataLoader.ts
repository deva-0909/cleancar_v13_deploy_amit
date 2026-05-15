/**
 * Supabase Data Loader — FIXED
 * Only loads small/critical tables. Large tables are NOT stored in localStorage.
 * This prevents the 5MB localStorage quota from being exceeded on startup.
 */

import { isSupabaseEnabled } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
};

// ONLY small tables stored in localStorage. Max 4MB total budget.
// Large tables (customers, leads, jobs, attendance, subscriptions) are
// read directly from context memory — NOT stored in localStorage.
const SMALL_TABLES: Array<{ table: string; localKey: string; maxRows: number }> = [
  { table: "cleancar_salary_structures",   localKey: "salary_structures",   maxRows: 50  },
  { table: "cleancar_incentive_plans",     localKey: "incentive_plans",     maxRows: 20  },
  { table: "cleancar_payroll_runs",        localKey: "payroll_runs",        maxRows: 100 },
  { table: "cleancar_employee_incentives", localKey: "employee_incentives", maxRows: 100 },
  { table: "cleancar_inventory",           localKey: "inventory_items",     maxRows: 100 },
  { table: "cleancar_mrr",                 localKey: "mrr",                 maxRows: 50  },
  { table: "cleancar_public_holidays",     localKey: "public_holidays",     maxRows: 30  },
];

function getStorageUsedBytes(): number {
  let total = 0;
  try {
    Object.keys(localStorage).forEach(k => {
      total += (localStorage.getItem(k) || "").length * 2;
    });
  } catch {}
  return total;
}

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

function safeWrite(key: string, data: any[]): void {
  const BUDGET = 4 * 1024 * 1024; // 4MB — leave 1MB headroom
  if (getStorageUsedBytes() > BUDGET) {
    console.warn(`[Supabase] Skipping ${key} — storage > 4MB`);
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.warn(`[Supabase] Could not store ${key} — localStorage full`);
  }
}

export async function loadAllDataFromSupabase(forceReload = false): Promise<void> {
  if (!isSupabaseEnabled) {
    console.log("[Supabase] Not configured — using localStorage only");
    return;
  }

  // Skip if small tables already loaded (unless forced)
  if (!forceReload) {
    try {
      const existing = localStorage.getItem("cleancar_salary_structures");
      if (existing && JSON.parse(existing).length > 0) {
        console.log("[Supabase] Small tables already cached — skipping fetch");
        return;
      }
    } catch {}
  }

  // Remove ONLY stale migration backups — do NOT clear all data
  const staleKeys = Object.keys(localStorage).filter(k =>
    k.startsWith("BACKUP_PAYROLL_PRE") ||
    k.startsWith("BACKUP_SALARY_PRE") ||
    k === "cleancar_CITY-SURAT_undefined"
  );
  if (staleKeys.length > 0) {
    staleKeys.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    console.log(`[Supabase] Removed ${staleKeys.length} stale keys`);
  }

  console.log("[Supabase] Loading critical tables...");

  for (const { table, localKey, maxRows } of SMALL_TABLES) {
    try {
      const rows = await fetchTable(table, maxRows);
      if (rows.length === 0) continue;
      safeWrite(`cleancar_${localKey}`, rows);
      console.log(`[Supabase] ✅ ${table}: ${rows.length} records`);
    } catch (err) {
      console.error(`[Supabase] Failed ${table}:`, err);
    }
  }

  console.log("[Supabase] ✅ Done. Storage: " +
    (getStorageUsedBytes() / 1024).toFixed(0) + "KB");
}
