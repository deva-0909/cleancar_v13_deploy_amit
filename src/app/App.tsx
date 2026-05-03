import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect } from "react";
import { initializeHRData } from "./utils/hr-data-initializer";
import { seedDummyLogins } from "./utils/seedDummyLogins";
import { seedHistoricData } from "./utils/seedHistoricData";
import { EventMonitor } from "./components/crm/EventMonitor";
import { useGlobalEventHandlers } from "./hooks/useGlobalEventHandlers";
import { AppProvider } from "./contexts/AppProvider";

function AppContent() {
  try {
    useEffect(() => {
      // Initialize HR data on first load
      try {
        initializeHRData();
      } catch (error) {
        console.error("Failed to initialize HR data:", error);
      }
      try {
        seedDummyLogins();
      } catch (error) {
        console.error("Failed to seed dummy logins:", error);
      }
      try {
        seedHistoricData();
      } catch (error) {
        console.error("Failed to seed historic data:", error);
      }
    }, []);

    // Activate global event listeners
    useGlobalEventHandlers();

    if (!router) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading router...</p>
        </div>
      );
    }

    return (
      <>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
        <EventMonitor />
      </>
    );
  } catch (error) {
    console.error("AppContent error:", error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-orange-50">
        <div className="text-center p-8">
          <h2 className="text-lg font-semibold text-orange-900 mb-2">Content Error</h2>
          <p className="text-sm text-orange-700">
            {error instanceof Error ? error.message : "Unknown content error"}
          </p>
        </div>
      </div>
    );
  }
}

export default function App() {
  try {
    // Emergency fallback - if all else fails, at least render something
    if (!router) {
      console.error("Router not initialized");
      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="text-center p-8">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Router Error</h2>
            <p className="text-sm text-red-700">Failed to initialize router</p>
          </div>
        </div>
      );
    }

    return (
      <ErrorBoundary>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("App component error:", error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-8 max-w-2xl">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Application Error</h2>
          <p className="text-sm text-red-700 mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
// Cache bust: 1776656006
