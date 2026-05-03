/**
 * useSync Hook - Automatic Background Sync
 *
 * Purpose:
 * - Auto-sync local data to backend on change
 * - Non-blocking (doesn't delay UI)
 * - Debounced to prevent excessive syncs
 * - Integrates with SyncService
 *
 * Usage in Contexts:
 * ```typescript
 * const [customers, setCustomers] = useState<Customer[]>(...);
 *
 * // Existing DataService persistence (keep this)
 * useEffect(() => {
 *   DataService.setAll("CUSTOMERS", customers);
 * }, [customers]);
 *
 * // Add backend sync (new)
 * useSync("CUSTOMERS", customers);
 * ```
 */

import { useEffect, useRef } from "react";
import { SyncService } from "../services/SyncService";
import type { EntityKey } from "../services/APIService";
import { logger } from "../services/logger";

/**
 * Auto-sync data to backend on change
 * Debounced to prevent excessive syncs
 */
export function useSync<T>(entityKey: EntityKey, data: T[], debounceMs: number = 1000) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    // Skip sync on initial mount (avoid syncing empty data)
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce sync to prevent excessive API calls
    timeoutRef.current = setTimeout(() => {
      logger.debug(`[useSync] Syncing ${entityKey}`, { count: data.length });

      // Non-blocking background sync
      SyncService.push(entityKey, data).catch((error) => {
        logger.error(`[useSync] Sync failed for ${entityKey}`, error);
      });
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [entityKey, data, debounceMs]);
}

/**
 * INTEGRATION PATTERN
 *
 * Before (local-only):
 * ```typescript
 * const [customers, setCustomers] = useState<Customer[]>(() => {
 *   const stored = DataService.get<Customer>("CUSTOMERS");
 *   return stored;
 * });
 *
 * useEffect(() => {
 *   DataService.setAll("CUSTOMERS", customers);
 * }, [customers]);
 * ```
 *
 * After (hybrid local + backend):
 * ```typescript
 * const [customers, setCustomers] = useState<Customer[]>(() => {
 *   const stored = DataService.get<Customer>("CUSTOMERS");
 *   return stored;
 * });
 *
 * // Local persistence (instant)
 * useEffect(() => {
 *   DataService.setAll("CUSTOMERS", customers);
 * }, [customers]);
 *
 * // Backend sync (background, non-blocking)
 * useSync("CUSTOMERS", customers);
 * ```
 *
 * Benefits:
 * - Instant UI updates (DataService)
 * - Automatic backend sync (useSync)
 * - Non-blocking (no UI delays)
 * - Offline-first (works without backend)
 * - Auto-retry on failure (RetryQueue)
 */
