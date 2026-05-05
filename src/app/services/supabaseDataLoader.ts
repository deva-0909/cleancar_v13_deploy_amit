/**
 * Supabase Data Loader
 * Loads ALL data from Supabase into localStorage on app startup.
 * After this runs, all existing contexts work unchanged via DataService.
 */

import { isSupabaseEnabled } from "./supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
};

// Supabase table → localStorage key mapping
// Tables with their storage strategy
// cityNamespaced: false = store only as combined legacy key (saves localStorage space)
// skip: true = too large for localStorage, read directly from Supabase
const TABLE_MAP: Array<{
  table: string;
  localKey: string;
  cityColumn?: string;
  cityNamespaced?: boolean; // whether to store per-city keys (default true)
}> = [
  { table: "cleancar_customers",           localKey: "customers",           cityColumn: "city_id", cityNamespaced: true  },
  { table: "cleancar_leads",               localKey: "leads",               cityColumn: "city_id", cityNamespaced: true  },
  { table: "cleancar_subscriptions",       localKey: "subscriptions",       cityColumn: "city_id", cityNamespaced: true  },
  { table: "cleancar_revenues",            localKey: "revenues",            cityColumn: "city_id", cityNamespaced: true  },
  { table: "cleancar_payables",            localKey: "payables",            cityColumn: "city_id", cityNamespaced: true  },
  { table: "cleancar_mrr",                 localKey: "mrr",                 cityColumn: "city_id", cityNamespaced: true  },
  { table: "cleancar_inventory",           localKey: "inventory",           cityColumn: "city_id", cityNamespaced: true  },
  { table: "cleancar_salary_structures",   localKey: "salary_structures",   cityColumn: "city_id", cityNamespaced: false },
  { table: "cleancar_incentive_plans",     localKey: "incentive_plans",     cityColumn: "city_id", cityNamespaced: false },
  { table: "cleancar_employee_incentives", localKey: "employee_incentives", cityColumn: "city_id", cityNamespaced: false },
  { table: "cleancar_payroll_runs",        localKey: "payroll_runs",        cityColumn: "city_id", cityNamespaced: false },
  { table: "cleancar_employees",           localKey: "employees",           cityColumn: "city_id", cityNamespaced: false },
  // Jobs and attendance are too large for localStorage - stored as trimmed sample only
  { table: "cleancar_jobs",                localKey: "jobs",                cityColumn: "city_id", cityNamespaced: false },
  { table: "cleancar_attendance",          localKey: "attendance_records",  cityColumn: "city_id", cityNamespaced: false },
];

async function fetchSample(table: string, limit: number): Promise<any[]> {
  // Fetch a limited sample ordered by latest first
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=data&limit=${limit}&order=created_at.desc`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const rows = await res.json();
  return Array.isArray(rows) ? rows.map((r: any) => r.data) : [];
}

async function fetchAll(table: string): Promise<any[]> {
  // Fetch in pages of 1000 to handle large datasets
  const allRows: any[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=data&limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      console.warn(`[Supabase] Failed to fetch ${table}: ${res.status}`);
      break;
    }
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    allRows.push(...rows.map((r: any) => r.data));
    if (rows.length < limit) break;
    offset += limit;
  }
  return allRows;
}

export async function loadAllDataFromSupabase(forceReload = false): Promise<void> {
  if (!isSupabaseEnabled) {
    console.log("[Supabase] Not configured — using localStorage only");
    return;
  }

  // Check if localStorage already has data (fast path - no Supabase call needed)
  if (!forceReload) {
    const existingRevenues = localStorage.getItem("cleancar_revenues") ||
      localStorage.getItem("cleancar_CITY-SURAT_revenues");
    const existingCustomers = localStorage.getItem("cleancar_customers") ||
      localStorage.getItem("cleancar_CITY-SURAT_customers");
    if (existingRevenues && existingCustomers) {
      try {
        const revCount = JSON.parse(existingRevenues).length;
        const custCount = JSON.parse(existingCustomers).length;
        if (revCount > 10 && custCount > 10) {
          console.log(`[Supabase] localStorage has data (${revCount} revenues, ${custCount} customers) — skipping fetch`);
          return;
        }
      } catch(e) { /* parse error — proceed with fetch */ }
    }
  }

  console.log("[Supabase] Loading all data...");
  const start = Date.now();

  try {
    // Load all tables in parallel for speed
    const results = await Promise.allSettled(
      TABLE_MAP.map(async ({ table, localKey, cityColumn, cityNamespaced }) => {
        // For large tables (jobs, attendance), only fetch a sample to save localStorage space
        const isLargeTable = table === "cleancar_jobs" || table === "cleancar_attendance";
        const rows = isLargeTable
          ? await fetchSample(table, 2000)  // Only latest 2000 records
          : await fetchAll(table);
        if (rows.length === 0) return;

        const legacyKey = `cleancar_${localKey}`;

        if (cityColumn && cityNamespaced) {
          // Group by city and store city-namespaced keys (only for small tables)
          const cityGroups: Record<string, any[]> = {};
          rows.forEach(row => {
            const cityId = row?.[cityColumn] || row?.cityId || "CITY-SURAT";
            if (!cityGroups[cityId]) cityGroups[cityId] = [];
            cityGroups[cityId].push(row);
          });

          Object.entries(cityGroups).forEach(([cityId, cityRows]) => {
            const key = `cleancar_${cityId}_${localKey}`;
            try {
              localStorage.setItem(key, JSON.stringify(cityRows));
            } catch (e) {
              // Quota exceeded — store without city namespace
              try { localStorage.setItem(legacyKey, JSON.stringify(rows.slice(0, 500))); } catch(_) {}
            }
          });
        }

        // Always store combined legacy key
        try {
          localStorage.setItem(legacyKey, JSON.stringify(rows));
        } catch (e) {
          // Quota — store trimmed version
          try {
            localStorage.setItem(legacyKey, JSON.stringify(rows.slice(0, 300)));
            console.warn(`[Supabase] Stored trimmed ${table}: ${Math.min(rows.length, 300)} of ${rows.length}`);
          } catch(_) {}
        }

        console.log(`[Supabase] ✅ ${table}: ${rows.length} records`);
      })
    );

    const elapsed = Date.now() - start;
    const failed = results.filter(r => r.status === "rejected").length;
    console.log(`[Supabase] ✅ All data loaded in ${elapsed}ms (${failed} failures)`);

    // Mark as loaded for this session
    sessionStorage.setItem("cc360_supabase_loaded_v1", Date.now().toString());

  } catch (err) {
    console.error("[Supabase] Failed to load data:", err);
  }
}
