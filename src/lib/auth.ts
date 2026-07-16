import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearStoredAuthState, installAuthStorageGuard, markSignOutInProgress } from "@/lib/authStorage";

const PROFILE_RETRY_DELAY_MS = 250;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function fetchOwnProfile<T>(userId: string, select: string, retryCount = 1): Promise<{
  data: T | null;
  error: PostgrestError | null;
}> {
  let lastError: PostgrestError | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const { data, error } = await supabase
      .from("profiles")
      .select(select)
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      return { data: data as T, error: null };
    }

    lastError = error;

    if (attempt < retryCount) {
      await delay(PROFILE_RETRY_DELAY_MS);
    }
  }

  return { data: null, error: lastError };
}

/**
 * Sign the user out from THIS device only. Other devices where the same
 * account is logged in remain signed in. Clears cached tokens from local
 * and session storage on this device.
 */
export async function signOutEverywhere() {
  installAuthStorageGuard();
  // Mark sign-out in progress so any in-flight auth events (TOKEN_REFRESHED,
  // SIGNED_IN from a racing tab, etc.) can be ignored by listeners.
  markSignOutInProgress();

  try { supabase.auth.stopAutoRefresh(); } catch { /* noop */ }

  // Clear before and after signOut so even a racing refresh cannot leave a
  // valid token behind for the next /auth load to pick up.
  clearStoredAuthState();

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch { /* noop */ }

  clearStoredAuthState();

  // Hard-reload to /auth so no in-memory Supabase client state (cached user,
  // pending refresh timers) can restore the previous session.
  try {
    window.location.replace("/auth");
  } catch { /* noop */ }
}

/**
 * Verify the current session is still valid on the server. Returns true when
 * the session was revoked (e.g. signed out from another device) so callers
 * can force a local sign-out. Returns false on network errors so transient
 * failures don't kick the user out.
 */
export async function isSessionRevoked(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // AuthApiError with status 401/403 means the refresh token was revoked.
      const status = (error as { status?: number }).status;
      if (status === 401 || status === 403) return true;
      return false;
    }
    return !data?.user;
  } catch {
    return false;
  }
}
