import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect } from "react";
import { initializeHRData } from "./utils/hr-data-initializer";
import { seedAllData } from "./utils/seedAllData";
import { EventMonitor } from "./components/crm/EventMonitor";
import { useGlobalEventHandlers } from "./hooks/useGlobalEventHandlers";
import { AppProvider } from "./contexts/AppProvider";

function AppContent() {
  useEffect(() => {
    try { initializeHRData(); } catch (e) { console.error("HR init failed:", e); }
    // Seeds all screens: employees, payroll, attendance, incentives,
    // salary structures, customers, leads, demos, subscriptions, jobs,
    // complaints, inventory, stock transactions, finance MRR/payables/revenues,
    // accounting ledgers/entries/journals, advances, cloth tracking.
    // Guarded by ALL_DATA_SEEDED_V1 — runs once, safe to leave in production.
    try { seedAllData(); } catch (e) { console.error("Seed failed:", e); }
  }, []);

  useGlobalEventHandlers();

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
