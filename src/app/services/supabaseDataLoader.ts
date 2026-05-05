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

const SEED_FLAG = "cc360_supabase_loaded_v1";

// Supabase table → localStorage key mapping
const TABLE_MAP: Array<{
  table: string;
  localKey: string;
  cityColumn?: string;
  idColumn?: string;
}> = [
  { table: "cleancar_customers",            localKey: "cleancar_customers",            cityColumn: "city_id" },
  { table: "cleancar_leads",                localKey: "cleancar_leads",                cityColumn: "city_id" },
  { table: "cleancar_subscriptions",        localKey: "cleancar_subscriptions",        cityColumn: "city_id" },
  { table: "cleancar_jobs",                 localKey: "cleancar_jobs",                 cityColumn: "city_id" },
  { table: "cleancar_attendance",           localKey: "cleancar_attendance_records",   cityColumn: "city_id" },
  { table: "cleancar_payroll_runs",         localKey: "cleancar_payroll_runs",         cityColumn: "city_id" },
  { table: "cleancar_salary_structures",    localKey: "cleancar_salary_structures",    cityColumn: "city_id" },
  { table: "cleancar_incentive_plans",      localKey: "cleancar_incentive_plans",      cityColumn: "city_id" },
  { table: "cleancar_employee_incentives",  localKey: "cleancar_employee_incentives",  cityColumn: "city_id" },
  { table: "cleancar_revenues",             localKey: "cleancar_revenues",             cityColumn: "city_id" },
  { table: "cleancar_payables",             localKey: "cleancar_payables",             cityColumn: "city_id" },
  { table: "cleancar_inventory",            localKey: "cleancar_inventory",            cityColumn: "city_id" },
  { table: "cleancar_mrr",                  localKey: "cleancar_mrr",                  cityColumn: "city_id" },
  { table: "cleancar_employees",            localKey: "cleancar_employees",            cityColumn: "city_id" },
];

const CITIES = ["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD"];

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
      TABLE_MAP.map(async ({ table, localKey, cityColumn }) => {
        const rows = await fetchAll(table);
        if (rows.length === 0) return;

        if (cityColumn) {
          // Group by city and store in city-namespaced keys
          const cityGroups: Record<string, any[]> = {};
          rows.forEach(row => {
            const cityId = row?.[cityColumn] || row?.cityId || "CITY-SURAT";
            if (!cityGroups[cityId]) cityGroups[cityId] = [];
            cityGroups[cityId].push(row);
          });

          // Store each city's data
          Object.entries(cityGroups).forEach(([cityId, cityRows]) => {
            const key = `cleancar_${cityId}_${localKey.replace("cleancar_", "")}`;
            try {
              localStorage.setItem(key, JSON.stringify(cityRows));
            } catch (e) {
              console.warn(`[Supabase] localStorage quota for ${key}, storing truncated`);
            }
          });

          // Also store combined (legacy key) for backward compat
          try {
            localStorage.setItem(localKey, JSON.stringify(rows));
          } catch (e) { /* quota - skip legacy key */ }

          console.log(`[Supabase] ✅ ${table}: ${rows.length} records`);
        } else {
          try {
            localStorage.setItem(localKey, JSON.stringify(rows));
          } catch (e) {
            console.warn(`[Supabase] localStorage quota for ${table}`);
          }
          console.log(`[Supabase] ✅ ${table}: ${rows.length} records`);
        }
      })
    );

    const elapsed = Date.now() - start;
    const failed = results.filter(r => r.status === "rejected").length;
    console.log(`[Supabase] ✅ All data loaded in ${elapsed}ms (${failed} failures)`);

    // Mark as loaded for this session
    sessionStorage.setItem(SEED_FLAG, Date.now().toString());

  } catch (err) {
    console.error("[Supabase] Failed to load data:", err);
  }
}
