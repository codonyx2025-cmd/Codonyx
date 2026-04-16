import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderEmailLayout, renderOtpCode, escapeHtml } from "../_shared/email-layout.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- In-memory rate limiter ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX_SEND = 3;
const RATE_LIMIT_MAX_VERIFY = 5;

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > max;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);
// --- End rate limiter ---

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, email } = body;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Rate limit by action + email
    const isVerify = action === "verify" || action === "verify_code";
    const rateLimitKey = isVerify ? `pwd-verify:${trimmedEmail}` : `pwd-send:${trimmedEmail}`;
    const rateLimitMax = isVerify ? RATE_LIMIT_MAX_VERIFY : RATE_LIMIT_MAX_SEND;
    if (isRateLimited(rateLimitKey, rateLimitMax)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "send") {
      // Check if approved account exists
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .eq("email", trimmedEmail)
        .eq("approval_status", "approved")
        .maybeSingle();

      if (!profile) {
        return new Response(
          JSON.stringify({ error: "No approved account exists with this email address." }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Invalidate any existing OTPs for this email
      await supabaseAdmin
        .from("password_reset_otps")
        .update({ used: true })
        .eq("email", trimmedEmail)
        .eq("used", false);

      // Generate 6-digit OTP
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      // Store OTP
      const { error: insertError } = await supabaseAdmin
        .from("password_reset_otps")
        .insert({ email: trimmedEmail, code, expires_at: expiresAt });

      if (insertError) {
        throw new Error("Failed to store OTP");
      }

      // Send email
      const body = `
        <p style="color:#0f172a;font-size:17px;font-weight:600;margin:0 0 8px;">Hello ${escapeHtml(profile.full_name)},</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 8px;">
          We received a request to reset your Codonyx password. Use the verification code below to continue:
        </p>
        ${renderOtpCode(code)}
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:8px 0 0;text-align:center;">
          This code will expire in <strong style="color:#059669;">10 minutes</strong>.
        </p>
        <p style="color:#94a3b8;font-size:13px;margin:18px 0 0;text-align:center;line-height:1.5;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      `;
      const html = renderEmailLayout({
        preheader: "Your Codonyx password reset code",
        headerEmoji: "🔐",
        headerTitle: "Password Recovery",
        headerSubtitle: "Reset your password securely",
        body,
        footerNote: "🛡️ For your security, never share this code with anyone. Codonyx will never ask for your code via phone or email.",
      });

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Codonyx <notifications@codonyx.org>",
          to: [trimmedEmail],
          subject: `Password Recovery — Codonyx`,
          html,
        }),
      });

      const emailResponse = await res.json();
      console.log("Password reset OTP email response:", emailResponse);

      if (!res.ok) {
        throw new Error(emailResponse.message || "Failed to send email");
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "verify_code") {
      const { code } = body;
      if (!code) {
        return new Response(
          JSON.stringify({ error: "Code is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: otpRecord } = await supabaseAdmin
        .from("password_reset_otps")
        .select("*")
        .eq("email", trimmedEmail)
        .eq("code", code)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check expiration in code to avoid clock skew issues
      if (otpRecord && new Date(otpRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Code has expired. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!otpRecord) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired code. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "verify") {
      const { code, newPassword } = body;

      if (!code || !newPassword) {
        return new Response(
          JSON.stringify({ error: "Code and new password are required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 6 characters" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Find valid OTP
      const { data: otpRecord } = await supabaseAdmin
        .from("password_reset_otps")
        .select("*")
        .eq("email", trimmedEmail)
        .eq("code", code)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check expiration in code to avoid clock skew issues
      if (otpRecord && new Date(otpRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Code has expired. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!otpRecord) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired code. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Mark OTP as used
      await supabaseAdmin
        .from("password_reset_otps")
        .update({ used: true })
        .eq("id", otpRecord.id);

      // Find user by email
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("email", trimmedEmail)
        .eq("approval_status", "approved")
        .maybeSingle();

      if (!profile) {
        return new Response(
          JSON.stringify({ error: "Account not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Update password using admin API
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.user_id,
        { password: newPassword }
      );

      if (updateError) {
        console.error("[reset-password-otp] Password update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update password. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'send' or 'verify'." }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[reset-password-otp] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
