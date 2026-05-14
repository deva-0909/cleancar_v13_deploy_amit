/**
 * APIService - Backend Abstraction Layer
 *
 * Purpose:
 * - Generic interface for backend operations
 * - Agnostic to backend implementation (Supabase, REST, GraphQL)
 * - Easy to swap backend without changing app logic
 *
 * Future Implementation:
 * - Replace mock with Supabase client
 * - Add authentication headers
 * - Add request/response interceptors
 */

import { logger } from "./logger";

export type EntityKey =
  | "CUSTOMERS"
  | "JOBS"
  | "SUBSCRIPTIONS"
  | "FINANCE_MRR"
  | "FINANCE_PAYABLES"
  | "FINANCE_REVENUES"
  | "FINANCE_LEDGER"
  // Added: used by FinanceContext useSync() calls
  | "FINANCE_BUDGETS"
  | "FINANCE_ALERTS"
  | "FINANCE_RECOMMENDATIONS";

interface APIResponse<T> {
  success: boolean;
  data?: T[];
  error?: string;
}

class APIServiceClass {
  private baseURL = "/api"; // Future: Use env variable
  private enabled = false; // Toggle for backend integration

  /**
   * Enable/disable backend sync
   * Set to true when backend is ready
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    logger.log(`APIService ${enabled ? "enabled" : "disabled"}`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Fetch all records for an entity from backend
   */
  async get<T>(entityKey: EntityKey): Promise<APIResponse<T>> {
    if (!this.enabled) {
      return { success: true, data: [] };
    }

    try {
      logger.debug(`[APIService] GET /${entityKey}`);

      // Future: Replace with actual API call
      // const response = await fetch(`${this.baseURL}/${entityKey}`);
      // const data = await response.json();
      // return { success: true, data };

      // Mock: Return empty for now
      return { success: true, data: [] };
    } catch (error) {
      logger.error(`[APIService] GET /${entityKey} failed`, error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Upsert (create or update) records to backend
   * Handles both single record and batch operations
   */
  async upsert<T>(entityKey: EntityKey, records: T[]): Promise<APIResponse<T>> {
    if (!this.enabled) {
      return { success: true, data: records };
    }

    try {
      logger.debug(`[APIService] UPSERT /${entityKey}`, { count: records.length });

      // Future: Replace with actual API call
      // const response = await fetch(`${this.baseURL}/${entityKey}`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(records),
      // });
      // const data = await response.json();
      // return { success: true, data };

      // Mock: Simulate success
      return { success: true, data: records };
    } catch (error) {
      logger.error(`[APIService] UPSERT /${entityKey} failed`, error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Delete records from backend
   */
  async delete<T extends { [key: string]: any }>(
    entityKey: EntityKey,
    ids: string[],
    idField: string = "id"
  ): Promise<APIResponse<T>> {
    if (!this.enabled) {
      return { success: true, data: [] };
    }

    try {
      logger.debug(`[APIService] DELETE /${entityKey}`, { count: ids.length });

      // Future: Replace with actual API call
      // const response = await fetch(`${this.baseURL}/${entityKey}`, {
      //   method: "DELETE",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ ids, idField }),
      // });
      // return { success: true, data: [] };

      // Mock: Simulate success
      return { success: true, data: [] };
    } catch (error) {
      logger.error(`[APIService] DELETE /${entityKey} failed`, error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Health check - verify backend is reachable
   */
  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      // Future: Replace with actual health endpoint
      // const response = await fetch(`${this.baseURL}/health`);
      // return response.ok;

      // Mock: Always healthy when enabled
      return true;
    } catch (error) {
      logger.error("[APIService] Health check failed", error as Error);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
export const APIService = new APIServiceClass();

/**
 * INTEGRATION GUIDE
 *
 * Phase 1 - Mock (Current):
 * - APIService.setEnabled(false) - sync disabled, local-only
 *
 * Phase 2 - Supabase:
 * ```typescript
 * import { createClient } from '@supabase/supabase-js';
 *
 * const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
 *
 * async get<T>(entityKey: EntityKey): Promise<APIResponse<T>> {
 *   const { data, error } = await supabase
 *     .from(entityKey.toLowerCase())
 *     .select('*');
 *
 *   if (error) return { success: false, error: error.message };
 *   return { success: true, data };
 * }
 *
 * async upsert<T>(entityKey: EntityKey, records: T[]): Promise<APIResponse<T>> {
 *   const { data, error } = await supabase
 *     .from(entityKey.toLowerCase())
 *     .upsert(records);
 *
 *   if (error) return { success: false, error: error.message };
 *   return { success: true, data };
 * }
 * ```
 *
 * Phase 3 - REST API:
 * Replace fetch mocks with actual endpoints
 */
