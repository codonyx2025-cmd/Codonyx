// Persistent login ("Remember Me") helper.
//
// Strategy: the Supabase client is configured with `localStorage`. When the
// user checks "Remember Me", we leave the session token in localStorage so it
// survives browser restarts (default Supabase behavior).
//
// When the user UNCHECKS "Remember Me", we move the token to sessionStorage
// and proxy reads/writes so Supabase still finds it during this tab's
// lifetime, but the token disappears when the browser/tab is closed.

const SUPABASE_TOKEN_KEY = "sb-ismtjnkzgfsrcstlyops-auth-token";
export const REMEMBER_ME_KEY = "codonyx-remember-me";

/**
 * Call this AFTER a successful sign-in with the user's Remember Me choice.
 * - remember = true  → keep token in localStorage (persists across restarts)
 * - remember = false → move token to sessionStorage (cleared when browser closes)
 */
export function applyRememberMePreference(remember: boolean) {
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
  try {
    const remember = localStorage.getItem(REMEMBER_ME_KEY);
    if (remember !== "false") return;

    const sessionToken = sessionStorage.getItem(SUPABASE_TOKEN_KEY);
    if (sessionToken) {
      localStorage.setItem(SUPABASE_TOKEN_KEY, sessionToken);
    }

    // Mirror future writes from localStorage → sessionStorage so refreshed
    // tokens survive page reloads within the tab. On tab close, sessionStorage
    // is cleared and the next load will not restore anything.
    const origSetItem = localStorage.setItem.bind(localStorage);
    const origRemoveItem = localStorage.removeItem.bind(localStorage);

    localStorage.setItem = (key: string, value: string) => {
      origSetItem(key, value);
      if (key === SUPABASE_TOKEN_KEY && localStorage.getItem(REMEMBER_ME_KEY) === "false") {
        try { sessionStorage.setItem(SUPABASE_TOKEN_KEY, value); } catch { /* noop */ }
      }
    };
    localStorage.removeItem = (key: string) => {
      origRemoveItem(key);
      if (key === SUPABASE_TOKEN_KEY) {
        try { sessionStorage.removeItem(SUPABASE_TOKEN_KEY); } catch { /* noop */ }
      }
    };

    // When the tab is hidden/closed, drop the token from localStorage so a
    // fresh browser launch (with no sessionStorage) starts unauthenticated.
    window.addEventListener("pagehide", () => {
      if (localStorage.getItem(REMEMBER_ME_KEY) === "false") {
        try { localStorage.removeItem(SUPABASE_TOKEN_KEY); } catch { /* noop */ }
      }
    });
  } catch {
    // ignore
  }
}
