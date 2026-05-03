/**
 * StorageService — Dual-mode persistence layer
 *
 * MODE 1 (localStorage): Default. Works immediately, data stays in browser.
 * MODE 2 (supabase):     Cloud-persistent, multi-device, multi-user.
 *
 * Switch: StorageService.setBackend("supabase") after env vars are set.
 * All contexts call this — nothing else changes when switching modes.
 */

import { supabase } from '../lib/supabase';

export type StorageNamespace =
  | 'hrdata' | 'finance' | 'subscription' | 'inventory' | 'demo'
  | 'scenario' | 'notification' | 'job' | 'advance' | 'cloth'
  | 'complaint' | 'customer' | 'lead' | 'user' | 'settings'
  | 'gst' | 'adjustments';

const TABLE_MAP: Record<string, string> = {
  'hrdata:employees':          'employees',
  'hrdata:attendance_records': 'attendance_records',
  'hrdata:payroll_runs':       'payroll_runs',
  'hrdata:salary_structures':  'salary_structures',
  'hrdata:leave_balances':     'leave_balances',
  'hrdata:advance_requests':   'advance_requests',
  'finance:revenues':          'finance_revenues',
  'finance:payables':          'finance_payables',
  'finance:mrr':               'finance_mrr',
  'finance:ledger':            'finance_ledger',
  'customer:list':             'customers',
  'customer:subscriptions':    'subscriptions',
  'job:list':                  'jobs',
  'inventory:items':           'inventory_items',
  'lead:list':                 'leads',
  'gst:vendors':               'gst_vendors',
  'gst:customers':             'gst_customers',
  'gst:transactions':          'gst_transactions',
  'gst:reconciliation':        'gst_reconciliation',
  'adjustments:records':       'other_adjustments',
};

type BackendMode = 'localStorage' | 'supabase';

export class StorageService {
  private static mode: BackendMode = 'localStorage';

  static setBackend(mode: BackendMode): void {
    this.mode = mode;
    console.log(`[StorageService] Backend → ${mode}`);
  }

  static getBackend(): BackendMode { return this.mode; }

  private static key(ns: StorageNamespace, k: string): string {
    return `${ns}:${k}`;
  }

  // ── Sync localStorage ─────────────────────────────────────

  static get<T>(namespace: StorageNamespace, key: string): T | null {
    try {
      const raw = localStorage.getItem(this.key(namespace, key));
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (e) {
      console.error(`[StorageService] get ${namespace}:${key}`, e);
      return null;
    }
  }

  static set<T>(namespace: StorageNamespace, key: string, data: T): boolean {
    try {
      localStorage.setItem(this.key(namespace, key), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`[StorageService] set ${namespace}:${key}`, e);
      return false;
    }
  }

  static remove(namespace: StorageNamespace, key: string): boolean {
    try { localStorage.removeItem(this.key(namespace, key)); return true; }
    catch { return false; }
  }

  static has(namespace: StorageNamespace, key: string): boolean {
    return localStorage.getItem(this.key(namespace, key)) !== null;
  }

  // ── Async Supabase ────────────────────────────────────────

  static async getAsync<T>(
    namespace: StorageNamespace,
    key: string,
    cityId?: string
  ): Promise<T[]> {
    if (this.mode !== 'supabase') return this.get<T[]>(namespace, key) ?? [];
    const table = TABLE_MAP[this.key(namespace, key)];
    if (!table) return this.get<T[]>(namespace, key) ?? [];
    try {
      let q = supabase.from(table).select('*');
      if (cityId) q = q.eq('city_id', cityId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    } catch (err) {
      console.warn(`[StorageService] Supabase GET ${table} failed, using localStorage`, err);
      return this.get<T[]>(namespace, key) ?? [];
    }
  }

  static async setAsync<T extends { id: string }>(
    namespace: StorageNamespace,
    key: string,
    data: T[]
  ): Promise<boolean> {
    this.set(namespace, key, data);
    if (this.mode !== 'supabase') return true;
    const table = TABLE_MAP[this.key(namespace, key)];
    if (!table) return true;
    try {
      const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn(`[StorageService] Supabase UPSERT ${table} failed`, err);
      return false;
    }
  }

  static async deleteAsync(
    namespace: StorageNamespace,
    key: string,
    id: string
  ): Promise<boolean> {
    if (this.mode !== 'supabase') return false;
    const table = TABLE_MAP[this.key(namespace, key)];
    if (!table) return false;
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch { return false; }
  }

  // ── Utilities ─────────────────────────────────────────────

  static clearNamespace(namespace: StorageNamespace): number {
    const prefix = `${namespace}:`;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(prefix)) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    return keys.length;
  }

  static getStorageSize(): string {
    let bytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) bytes += k.length + (localStorage.getItem(k)?.length ?? 0);
    }
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  }
}
