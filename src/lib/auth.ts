import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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