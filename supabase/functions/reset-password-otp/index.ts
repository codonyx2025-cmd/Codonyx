import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      const year = new Date().getFullYear();
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:48px 20px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <tr><td style="background:linear-gradient(135deg,#059669 0%,#047857 50%,#065f46 100%);padding:40px 32px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Password Recovery 🔐</h1>
                  <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Reset your password securely</p>
                </td></tr>
                <tr><td style="padding:40px 32px;">
                  <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">
                    Hello <strong style="color:#1e293b;">${profile.full_name}</strong>,
                  </p>
                  <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">
                    You recently requested to reset your password. Use the code below to verify your identity:
                  </p>
                  <div style="text-align:center;margin:0 0 24px;">
                    <span style="display:inline-block;background:#f1f5f9;border:2px solid #059669;border-radius:12px;padding:16px 40px;font-size:32px;font-weight:700;letter-spacing:8px;color:#1e293b;">
                      ${code}
                    </span>
                  </div>
                  <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 8px;">
                    This code will expire in <strong>10 minutes</strong>.
                  </p>
                  <p style="color:#94a3b8;font-size:13px;margin:0;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td></tr>
                <tr><td style="padding:24px 32px;text-align:center;border-top:1px solid #f1f5f9;">
                  <span style="color:#059669;font-size:18px;font-weight:700;">Codonyx</span>
                  <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">© ${year} Codonyx. All rights reserved.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body></html>
      `;

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
        return new Response(
          JSON.stringify({ error: updateError.message }),
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
    console.error("Error in reset-password-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
