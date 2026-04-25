import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMonitoring } from "./lib/monitoring";
import { restoreSessionStorageToken } from "./lib/rememberMe";

// Restore session-only token (Remember Me = off) BEFORE Supabase client reads it.
restoreSessionStorageToken();

import { supabase } from "./integrations/supabase/client";

// Initialize production error monitoring
initMonitoring();

// Proactively clear corrupted OR expired auth tokens BEFORE the Supabase client
// initializes. This prevents the slow "Invalid Refresh Token" recovery cycle that
// stalls sign-in (both Google OAuth and email/password) for several seconds.
const STORAGE_KEY = "sb-ismtjnkzgfsrcstlyops-auth-token";
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    const expiresAt: number | undefined = parsed?.expires_at;
    const hasRefresh = !!parsed?.refresh_token;
    // If the access token already expired AND there's no refresh token, it's dead — clear it.
    // Also clear if the structure is malformed.
    if (!hasRefresh || (expiresAt && expiresAt * 1000 < Date.now() - 1000 * 60 * 60 * 24 * 30)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
} catch {
  localStorage.removeItem(STORAGE_KEY);
}

// Handle invalid refresh token errors globally — clear corrupt session silently.
// IMPORTANT: Do NOT force a window.location reload on TOKEN_REFRESHED failures —
// that caused redirect loops that made sign-in feel "stuck". Just clear the bad
// token; route guards will redirect to /auth on next navigation if needed.
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "TOKEN_REFRESHED" && !session) {
    localStorage.removeItem(STORAGE_KEY);
  }
  if (event === "SIGNED_OUT") {
    localStorage.removeItem(STORAGE_KEY);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
