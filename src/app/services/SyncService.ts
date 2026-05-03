/**
 * SyncService - Hybrid Sync Orchestration
 *
 * Purpose:
 * - Orchestrate sync between local cache (DataService) and backend (APIService)
 * - Handle failures using RetryQueue
 * - Non-blocking background sync
 * - Conflict resolution using timestamps
 *
 * Architecture:
 * - DataService = Local cache (instant, always works)
 * - APIService = Backend abstraction
 * - RetryQueue = Resilience layer
 * - SyncService = Orchestration
 *
 * Sync Flow:
 * 1. Write to DataService (instant, local)
 * 2. Push to APIService (background, async)
 * 3. On failure → RetryQueue
 * 4. On success → Remove from queue
 */

import { DataService } from "./DataService";
import { APIService, type EntityKey } from "./APIService";
import { RetryQueue } from "./RetryQueue";
import { logger } from "./logger";

type SyncMode = "push" | "pull" | "bidirectional";

interface SyncResult {
  success: boolean;
  synced: number;
  error?: string;
}

class SyncServiceClass {
  private syncInProgress = new Set<string>();
  private lastSyncTime: Record<string, string> = {};

  constructor() {
    if (typeof window !== "undefined") {
      try {
        window.addEventListener("retry-operation", this.handleRetryOperation.bind(this));
      } catch (e) {}
    }
  }

  /**
   * Push local data to backend
   * Non-blocking - runs in background
   */
  async push<T>(entityKey: EntityKey, data: T[]): Promise<SyncResult> {
    // Prevent concurrent syncs for same entity
    if (this.syncInProgress.has(entityKey)) {
      logger.debug(`[SyncService] Sync already in progress for ${entityKey}`);
      return { success: true, synced: 0 };
    }

    // Skip if backend sync disabled
    if (!APIService.isEnabled()) {
      logger.debug(`[SyncService] Backend sync disabled, skipping ${entityKey}`);
      return { success: true, synced: 0 };
    }

    this.syncInProgress.add(entityKey);

    try {
      logger.debug(`[SyncService] PUSH ${entityKey}`, { count: data.length });

      // Push to backend
      const result = await APIService.upsert(entityKey, data);

      if (!result.success) {
        // Add to retry queue on failure
        RetryQueue.enqueue(entityKey, "PUSH", data, result.error);
        logger.warn(`[SyncService] PUSH failed, queued for retry`, {
          entityKey,
          error: result.error,
        });
        return { success: false, synced: 0, error: result.error };
      }

      // Update last sync time
      this.lastSyncTime[entityKey] = new Date().toISOString();

      logger.debug(`[SyncService] PUSH success`, {
        entityKey,
        synced: data.length,
      });

      return { success: true, synced: data.length };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error(`[SyncService] PUSH exception`, error as Error);

      // Add to retry queue
      RetryQueue.enqueue(entityKey, "PUSH", data, errorMsg);

      return { success: false, synced: 0, error: errorMsg };
    } finally {
      this.syncInProgress.delete(entityKey);
    }
  }

  /**
   * Pull backend data to local cache
   * Overwrites local data with backend data
   */
  async pull<T>(entityKey: EntityKey): Promise<SyncResult> {
    // Prevent concurrent syncs for same entity
    if (this.syncInProgress.has(entityKey)) {
      logger.debug(`[SyncService] Sync already in progress for ${entityKey}`);
      return { success: true, synced: 0 };
    }

    // Skip if backend sync disabled
    if (!APIService.isEnabled()) {
      logger.debug(`[SyncService] Backend sync disabled, skipping ${entityKey}`);
      return { success: true, synced: 0 };
    }

    this.syncInProgress.add(entityKey);

    try {
      logger.debug(`[SyncService] PULL ${entityKey}`);

      // Fetch from backend
      const result = await APIService.get<T>(entityKey);

      if (!result.success) {
        // Add to retry queue on failure
        RetryQueue.enqueue(entityKey, "PULL", undefined, result.error);
        logger.warn(`[SyncService] PULL failed, queued for retry`, {
          entityKey,
          error: result.error,
        });
        return { success: false, synced: 0, error: result.error };
      }

      // Merge with local data using conflict resolution
      const localData = DataService.get<T>(entityKey);
      const mergedData = this.mergeWithConflictResolution(localData, result.data || []);

      // Update local cache
      DataService.setAll(entityKey, mergedData);

      // Update last sync time
      this.lastSyncTime[entityKey] = new Date().toISOString();

      logger.debug(`[SyncService] PULL success`, {
        entityKey,
        synced: mergedData.length,
      });

      return { success: true, synced: mergedData.length };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      logger.error(`[SyncService] PULL exception`, error as Error);

      // Add to retry queue
      RetryQueue.enqueue(entityKey, "PULL", undefined, errorMsg);

      return { success: false, synced: 0, error: errorMsg };
    } finally {
      this.syncInProgress.delete(entityKey);
    }
  }

  /**
   * Bidirectional sync - pull then push
   * Use on app startup to get latest backend data
   */
  async sync<T>(entityKey: EntityKey): Promise<SyncResult> {
    // First pull backend data
    const pullResult = await this.pull<T>(entityKey);

    if (!pullResult.success) {
      return pullResult;
    }

    // Then push any local changes
    const localData = DataService.get<T>(entityKey);
    const pushResult = await this.push(entityKey, localData);

    return {
      success: pullResult.success && pushResult.success,
      synced: pullResult.synced + pushResult.synced,
      error: pullResult.error || pushResult.error,
    };
  }

  /**
   * Sync all entities
   * Use on app startup
   */
  async syncAll(): Promise<Record<string, SyncResult>> {
    const entityKeys: EntityKey[] = [
      "CUSTOMERS",
      "JOBS",
      "SUBSCRIPTIONS",
      "FINANCE_MRR",
      "FINANCE_PAYABLES",
      "FINANCE_REVENUES",
      "FINANCE_LEDGER",
    ];

    const results: Record<string, SyncResult> = {};

    logger.log("[SyncService] Starting full sync...");

    for (const key of entityKeys) {
      results[key] = await this.pull(key);
    }

    logger.log("[SyncService] Full sync complete", { results });

    return results;
  }

  /**
   * Merge local and backend data with conflict resolution
   * Rule: Latest updatedAt wins
   */
  private mergeWithConflictResolution<T>(local: T[], backend: T[]): T[] {
    const merged = new Map<string, T>();

    // Helper to get ID and updatedAt from record
    const getKey = (record: any): string => {
      return (
        record.id ||
        record.customerId ||
        record.jobId ||
        record.subscriptionId ||
        record.mrrId ||
        record.payableId ||
        record.revenueId ||
        record.ledgerEntryId ||
        "unknown"
      );
    };

    const getUpdatedAt = (record: any): string => {
      return record.updatedAt || record.createdAt || "1970-01-01T00:00:00.000Z";
    };

    // Add all backend records
    for (const record of backend) {
      const key = getKey(record);
      merged.set(key, record);
    }

    // Merge local records (overwrite if newer)
    for (const record of local) {
      const key = getKey(record);
      const existing = merged.get(key);

      if (!existing) {
        // New local record not in backend
        merged.set(key, record);
      } else {
        // Conflict - compare timestamps
        const localTime = new Date(getUpdatedAt(record)).getTime();
        const backendTime = new Date(getUpdatedAt(existing)).getTime();

        if (localTime > backendTime) {
          // Local is newer - use local
          merged.set(key, record);
        }
        // else: backend is newer - keep backend
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Handle retry operation from RetryQueue
   */
  private async handleRetryOperation(event: Event) {
    const customEvent = event as CustomEvent;
    const op = customEvent.detail;

    logger.debug("[SyncService] Handling retry operation", {
      id: op.id,
      entityKey: op.entityKey,
      operation: op.operation,
    });

    let result: SyncResult;

    try {
      switch (op.operation) {
        case "PUSH":
          result = await this.push(op.entityKey, op.data || []);
          break;
        case "PULL":
          result = await this.pull(op.entityKey);
          break;
        default:
          logger.warn("[SyncService] Unknown operation type", { operation: op.operation });
          return;
      }

      // Remove from queue on success
      if (result.success) {
        RetryQueue.dequeue(op.id);
        logger.log("[SyncService] Retry successful, removed from queue", {
          id: op.id,
          entityKey: op.entityKey,
        });
      }
    } catch (error) {
      logger.error("[SyncService] Retry failed", error as Error);
    }
  }

  /**
   * Get last sync time for entity
   */
  getLastSyncTime(entityKey: EntityKey): string | null {
    return this.lastSyncTime[entityKey] || null;
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      backendEnabled: APIService.isEnabled(),
      inProgress: Array.from(this.syncInProgress),
      lastSyncTimes: { ...this.lastSyncTime },
      queueSize: RetryQueue.size(),
    };
  }
}

/**
 * Singleton instance
 */
export const SyncService = new SyncServiceClass();

/**
 * USAGE EXAMPLES
 *
 * // Push local data to backend (non-blocking)
 * SyncService.push("CUSTOMERS", customers);
 *
 * // Pull backend data to local cache
 * await SyncService.pull("CUSTOMERS");
 *
 * // Full sync (pull + push)
 * await SyncService.sync("CUSTOMERS");
 *
 * // Sync all entities on app startup
 * await SyncService.syncAll();
 *
 * // Check sync status
 * const status = SyncService.getSyncStatus();
 * console.log("Sync status:", status);
 */
