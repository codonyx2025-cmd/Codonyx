import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMonitoring } from "./lib/monitoring";
import { supabase } from "./integrations/supabase/client";

// Initialize production error monitoring
initMonitoring();

// Only clear corrupted (unparseable) tokens — valid tokens must be preserved for session persistence
const STORAGE_KEY = "sb-ismtjnkzgfsrcstlyops-auth-token";
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    JSON.parse(stored); // Just validate it's valid JSON
  }
} catch {
  localStorage.removeItem(STORAGE_KEY);
}

// Handle invalid refresh token errors globally — clear corrupt session to prevent 400 loops
// CRITICAL: Do NOT await async calls inside onAuthStateChange to prevent deadlocks
const AUTH_RECOVERY_KEY = "auth_token_recovery";
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "TOKEN_REFRESHED" && !session) {
    // Refresh failed — check if we already attempted recovery
    const recoveryAttempt = sessionStorage.getItem(AUTH_RECOVERY_KEY);
    if (recoveryAttempt) {
      // Already tried once — just clear everything, no reload
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(AUTH_RECOVERY_KEY);
      return;
    }
    // First failure — clear and do a single guarded reload
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem(AUTH_RECOVERY_KEY, "1");
    window.location.replace("/auth");
  }
  // On successful auth events, clear recovery flag
  if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
    sessionStorage.removeItem(AUTH_RECOVERY_KEY);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
