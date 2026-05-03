/**
 * SyncInitializer - Initial Backend Sync on App Load
 *
 * Purpose:
 * - Pull latest data from backend on app startup
 * - Update local cache with backend data
 * - Run once per session
 * - Non-blocking (doesn't delay app render)
 *
 * Usage:
 * Add to AppProvider or root component:
 * ```tsx
 * <AppProvider>
 *   <SyncInitializer />
 *   <App />
 * </AppProvider>
 * ```
 */

import { useEffect, useState } from "react";
import { SyncService } from "../services/SyncService";
import { APIService } from "../services/APIService";
import { logger } from "../services/logger";

export function SyncInitializer() {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // Run initial sync only once
    if (synced) {
      return;
    }

    // Check if backend sync is enabled
    if (!APIService.isEnabled()) {
      logger.debug("[SyncInitializer] Backend sync disabled, skipping initial sync");
      setSynced(true);
      return;
    }

    // Run initial sync in background
    logger.log("[SyncInitializer] Starting initial sync...");

    SyncService.syncAll()
      .then((results) => {
        const totalSynced = Object.values(results).reduce(
          (sum, result) => sum + result.synced,
          0
        );
        logger.log("[SyncInitializer] Initial sync complete", {
          totalSynced,
          results,
        });
        setSynced(true);
      })
      .catch((error) => {
        logger.error("[SyncInitializer] Initial sync failed", error);
        setSynced(true); // Mark as synced anyway to prevent retry loops
      });
  }, [synced]);

  // This component doesn't render anything
  return null;
}

/**
 * INTEGRATION GUIDE
 *
 * Step 1: Add to AppProvider
 * ```tsx
 * export function AppProvider({ children }: { children: ReactNode }) {
 *   return (
 *     <EventProvider>
 *       <CustomerProvider>
 *         <JobProvider>
 *           <FinanceProvider>
 *             <SyncInitializer />
 *             {children}
 *           </FinanceProvider>
 *         </JobProvider>
 *       </CustomerProvider>
 *     </EventProvider>
 *   );
 * }
 * ```
 *
 * Step 2: Enable backend sync (when ready)
 * ```typescript
 * // In main.tsx or App.tsx
 * import { APIService } from "./services/APIService";
 *
 * // Enable when backend is ready
 * APIService.setEnabled(true);
 * ```
 *
 * Step 3: Backend stays disabled until you're ready
 * - Current state: Backend sync disabled (local-only mode)
 * - When backend ready: Call APIService.setEnabled(true)
 * - Everything works offline until then
 */
