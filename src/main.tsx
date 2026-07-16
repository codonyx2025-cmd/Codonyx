import { createRoot } from "react-dom/client";
import "./index.css";
import { initMonitoring } from "./lib/monitoring";
import { restoreSessionStorageToken } from "./lib/rememberMe";
import { SUPABASE_TOKEN_KEY, clearStoredAuthState, isSignOutInProgress } from "./lib/authStorage";

// Install the storage guard BEFORE any route imports can initialize Supabase.
restoreSessionStorageToken();

// Proactively clear corrupted OR expired auth tokens BEFORE the Supabase client
// initializes. This prevents the slow "Invalid Refresh Token" recovery cycle that
// stalls sign-in (both Google OAuth and email/password) for several seconds.
try {
  const stored = localStorage.getItem(SUPABASE_TOKEN_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    const expiresAt: number | undefined = parsed?.expires_at;
    const hasRefresh = !!parsed?.refresh_token;
    // If the access token already expired AND there's no refresh token, it's dead — clear it.
    // Also clear if the structure is malformed.
    if (!hasRefresh || (expiresAt && expiresAt * 1000 < Date.now() - 1000 * 60 * 60 * 24 * 30)) {
      localStorage.removeItem(SUPABASE_TOKEN_KEY);
    }
  }
} catch {
  localStorage.removeItem(SUPABASE_TOKEN_KEY);
}

async function bootstrap() {
  const [{ default: App }, { supabase }] = await Promise.all([
    import("./App.tsx"),
    import("./integrations/supabase/client"),
  ]);

  // Initialize production error monitoring
  initMonitoring();

  // Handle invalid refresh token errors globally — clear corrupt session silently.
  // During manual sign-out, also ignore any racing SIGNED_IN/TOKEN_REFRESHED event.
  supabase.auth.onAuthStateChange((event, session) => {
    if (isSignOutInProgress()) {
      clearStoredAuthState();
      return;
    }

    if ((event === "TOKEN_REFRESHED" && !session) || event === "SIGNED_OUT") {
      clearStoredAuthState({ includeRemember: false });
    }
  });

  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
