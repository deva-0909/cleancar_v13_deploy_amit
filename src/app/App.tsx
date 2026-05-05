import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect } from "react";
import { initializeHRData } from "./utils/hr-data-initializer";
import { EventMonitor } from "./components/crm/EventMonitor";
import { useGlobalEventHandlers } from "./hooks/useGlobalEventHandlers";
import { AppProvider } from "./contexts/AppProvider";
import { employeeDatabaseService } from "./services/employeeDatabaseService";
import { loadAllDataFromSupabase } from "./services/supabaseDataLoader";

function AppContent() {
  // IMPORTANT: Hooks must be called unconditionally at the top level
  useEffect(() => {
    // Load ALL data from Supabase into localStorage, then load employees for auth
    loadAllDataFromSupabase().then(() => {
      return employeeDatabaseService.loadFromSupabase();
    }).finally(() => {
      try { initializeHRData(); } catch (e) {
        console.error("Failed to initialize HR data:", e);
      }
    });
  }, []);

  // Activate global event listeners
  useGlobalEventHandlers();

  // Router is statically exported and always defined
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
      <EventMonitor />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
