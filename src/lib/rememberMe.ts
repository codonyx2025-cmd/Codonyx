// Persistent login ("Remember Me") helper.
//
// Strategy: the Supabase client is configured with `localStorage`. When the
// user checks "Remember Me", we leave the session token in localStorage so it
// survives browser restarts (default Supabase behavior).
//
// When the user UNCHECKS "Remember Me", we move the token to sessionStorage
// and proxy reads/writes so Supabase still finds it during this tab's
// lifetime, but the token disappears when the browser/tab is closed.

import {
  REMEMBER_ME_KEY,
  SUPABASE_TOKEN_KEY,
  clearSignOutInProgress,
  installAuthStorageGuard,
  restoreSessionStorageToken as restoreSessionStorageTokenInternal,
} from "./authStorage";

export { REMEMBER_ME_KEY };

/**
 * Call this AFTER a successful sign-in with the user's Remember Me choice.
 * - remember = true  → keep token in localStorage (persists across restarts)
 * - remember = false → move token to sessionStorage (cleared when browser closes)
 */
export function applyRememberMePreference(remember: boolean) {
  installAuthStorageGuard();
  clearSignOutInProgress();

  try {
    if (remember) {
      localStorage.setItem(REMEMBER_ME_KEY, "true");
      // Token is already in localStorage from supabase client — nothing to do.
      sessionStorage.removeItem(SUPABASE_TOKEN_KEY);
    } else {
      localStorage.setItem(REMEMBER_ME_KEY, "false");
      const token = localStorage.getItem(SUPABASE_TOKEN_KEY);
      if (token) {
        sessionStorage.setItem(SUPABASE_TOKEN_KEY, token);
        localStorage.removeItem(SUPABASE_TOKEN_KEY);
      }
    }
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

/**
 * Call this once at app startup BEFORE the Supabase client reads its session.
 * If the user previously chose "Remember Me = false", we copy the token from
 * sessionStorage back into localStorage so the Supabase client (which only
 * reads localStorage) picks it up. We also re-mirror any token writes back
 * into sessionStorage during the tab's lifetime.
 */
export function restoreSessionStorageToken() {
  restoreSessionStorageTokenInternal();
}
