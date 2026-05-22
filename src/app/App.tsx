import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect } from "react";
import { initializeHRData } from "./utils/hr-data-initializer";
import { EventMonitor } from "./components/crm/EventMonitor";
import { useGlobalEventHandlers } from "./hooks/useGlobalEventHandlers";
import { AppProvider } from "./contexts/AppProvider";

function AppContent() {
  useEffect(() => {
    try { initializeHRData(); } catch (e) { console.error("HR init failed:", e); }
    // seedAllData() now runs synchronously in main.tsx before React mounts
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
