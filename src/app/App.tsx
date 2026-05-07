import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useState, useEffect } from "react";
import { initializeHRData } from "./utils/hr-data-initializer";
import { EventMonitor } from "./components/crm/EventMonitor";
import { useGlobalEventHandlers } from "./hooks/useGlobalEventHandlers";
import { AppProvider } from "./contexts/AppProvider";
import { employeeDatabaseService } from "./services/employeeDatabaseService";
import { loadAllDataFromSupabase } from "./services/supabaseDataLoader";

function AppContent() {
  useGlobalEventHandlers();
  useEffect(() => {
    try { initializeHRData(); } catch (e) {
      console.error("Failed to initialize HR data:", e);
    }
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
      <EventMonitor />
    </>
  );
}

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

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Connecting to database...");

  useEffect(() => {
    async function bootstrap() {
      try {
        setLoadingMsg("Loading employees...");
        await employeeDatabaseService.loadFromSupabase();

        setLoadingMsg("Loading data from database (may take 20-30s)...");
        await loadAllDataFromSupabase();

        setLoadingMsg("Almost ready...");
        // Wait for localStorage writes to settle before mounting contexts
        // Data takes ~25s to load from Supabase - wait for it
        await new Promise(r => setTimeout(r, 1500));

      } catch (err) {
        console.error("Bootstrap error:", err);
        // Still show app even if Supabase fails
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
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
