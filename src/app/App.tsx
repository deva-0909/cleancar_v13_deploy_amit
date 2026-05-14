import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { employeeDatabaseService } from "./services/employeeDatabaseService";
import { loadAllDataFromSupabase } from "./services/supabaseDataLoader";
import { startupStorageCleanup } from "./services/DataService";
import { seedHistoricData } from "./utils/seedHistoricData";
import { seedDummyLogins } from "./utils/seedDummyLogins";
import { initializeAttendanceData } from "./services/seedAttendanceData";

/**
 * ARCHITECTURE NOTE — why AppProvider is NOT here:
 *
 * createBrowserRouter + RouterProvider creates its own React context tree that
 * is ISOLATED from any context provided by wrappers in this file. Wrapping
 * AppProvider around RouterProvider does NOT make those contexts available to
 * route components rendered via <Outlet />.
 *
 * AppProvider is placed inside RootLayoutWrapper (the root route element) so
 * it lives INSIDE the router tree and every page component can access it.
 */

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white">CleanCar 360°</h1>
      <div className="flex items-center gap-3 mt-2">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-blue-300 text-sm">{message}</p>
      </div>
      <p className="text-blue-500 text-xs mt-2">Loading your data — this takes a few seconds on first load</p>
    </div>
  );
}

// Production error monitoring
if (import.meta.env.PROD) {
  window.addEventListener("error", (e) => {
    console.error("[CC360] Error:", e.message, e.filename, e.lineno);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("[CC360] Unhandled rejection:", e.reason);
  });
}

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Connecting to database...");

  useEffect(() => {
    async function bootstrap() {
      try {
        startupStorageCleanup();

        // Seed local data first — each function has a guard flag and runs only once.
        // Supabase data loaded below will overwrite seeds if Supabase is configured.
        setLoadingMsg("Initialising data...");
        try { seedHistoricData(); } catch (e) { console.error("[Bootstrap] seedHistoricData:", e); }
        try { seedDummyLogins(); } catch (e) { console.error("[Bootstrap] seedDummyLogins:", e); }
        try { initializeAttendanceData(); } catch (e) { console.error("[Bootstrap] initializeAttendanceData:", e); }

        setLoadingMsg("Loading employees...");
        await employeeDatabaseService.loadFromSupabase();

        setLoadingMsg("Loading data from database...");
        await loadAllDataFromSupabase();

      } catch (err) {
        console.error("Bootstrap error:", err);
      } finally {
        setAppReady(true);
      }
    }
    bootstrap();
  }, []);

  if (!appReady) {
    return <LoadingScreen message={loadingMsg} />;
  }

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </ErrorBoundary>
  );
}
