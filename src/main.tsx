import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "./app/App";
import { seedAllData } from "./app/utils/seedAllData";

// ── Run seed SYNCHRONOUSLY before React mounts ────────────────────────────
// MUST be before createRoot so every Context's useState(() => DataService.get())
// reads fresh seeded data. Running seed in a useEffect is too late — contexts
// already captured stale localStorage values during their first render.
try { seedAllData(); } catch (e) { console.error("Seed failed:", e); }
import MinimalTest from "./app/MinimalTest";
import { EmergencyFallback } from "./app/EmergencyFallback";

// EMERGENCY DEBUG MODE - Set to true to test if React works at all
const USE_MINIMAL_TEST = false;
const USE_EMERGENCY_FALLBACK = false;
const isPreviewMode = new URLSearchParams(window.location.search).get("preview-route") !== null
  || import.meta.env.MODE === "development";

// FIX 8: Handle Figma Make ?preview-route= query param.
// createHashRouter reads window.location.hash, not the path.
// Figma Make sets preview-route as a query param — convert it to a hash
// so the router picks it up correctly before React mounts.
const params = new URLSearchParams(window.location.search);
const previewRoute = params.get("preview-route");
if (previewRoute && window.location.pathname === "/") {
  const cleanRoute = previewRoute.startsWith("/") ? previewRoute : "/" + previewRoute;
  history.replaceState(null, "", cleanRoute);
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element #root not found in index.html");
}

const getComponent = () => {
  if (USE_EMERGENCY_FALLBACK) return <EmergencyFallback />;
  if (USE_MINIMAL_TEST) return <MinimalTest />;
  return <App />;
};

try {
  createRoot(container).render(
    <React.Fragment>
      {getComponent()}
    </React.Fragment>
  );
} catch (error) {
  console.error("Fatal error rendering app:", error);
  // Last resort - render without StrictMode
  createRoot(container).render(<EmergencyFallback />);
}
