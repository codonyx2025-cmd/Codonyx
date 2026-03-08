import { supabase } from "@/integrations/supabase/client";

type EnsureRegistrationUserResult = {
  userId: string | null;
  error: string | null;
};

const parseFunctionError = async (fnError: any, fallback: string) => {
  try {
    const body = await fnError?.context?.json?.();
    if (body?.error) return body.error as string;
  } catch {
    // ignore
  }

  try {
    const text = await fnError?.context?.text?.();
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed?.error) return parsed.error as string;
    }
  } catch {
    // ignore
  }

  return fallback;
};

export const ensureRegistrationUser = async (
  email: string,
  password: string
): Promise<EnsureRegistrationUserResult> => {
  const normalizedEmail = email.trim().toLowerCase();

  // First handle OAuth-created auth users with no profile.
  const { data: existingAuthData, error: existingAuthError } = await supabase.functions.invoke(
    "handle-existing-auth-user",
    { body: { email: normalizedEmail, password } }
  );

  if (!existingAuthError && existingAuthData?.user_id) {
    return { userId: existingAuthData.user_id, error: null };
  }

  if (existingAuthError) {
    const status = (existingAuthError as any)?.context?.status;

    // 404 means no auth user exists yet, continue with normal signup.
    if (status !== 404) {
      return {
        userId: null,
        error: await parseFunctionError(
          existingAuthError,
          "This email is already registered. Please try signing in instead."
        ),
      };
    }
  }

  // Normal registration flow for truly new users.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: { emailRedirectTo: `${window.location.origin}/` },
  });

  if (authError || !authData.user) {
    return {
      userId: null,
      error: authError?.message || "Could not create account.",
    };
  }

  return { userId: authData.user.id, error: null };
};
