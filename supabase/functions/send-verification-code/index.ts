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
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX_SEND = 3;    // max 3 OTP sends per minute per email
const RATE_LIMIT_MAX_VERIFY = 5;  // max 5 verify attempts per minute per email

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
    const { email, action, code } = await req.json();
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Rate limit by action + email
    const rateLimitKey = action === "verify" ? `verify:${trimmedEmail}` : `send:${trimmedEmail}`;
    const rateLimitMax = action === "verify" ? RATE_LIMIT_MAX_VERIFY : RATE_LIMIT_MAX_SEND;
    if (isRateLimited(rateLimitKey, rateLimitMax)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Action: verify code server-side
    if (action === "verify") {
      if (!code) {
        return new Response(
          JSON.stringify({ error: "Code is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: otpRecord } = await supabaseAdmin
        .from("registration_otps")
        .select("*")
        .eq("email", trimmedEmail)
        .eq("code", code)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!otpRecord) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid code. Please try again." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (new Date(otpRecord.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ success: false, error: "Code has expired. Please request a new one." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Mark as used
      await supabaseAdmin
        .from("registration_otps")
        .update({ used: true })
        .eq("id", otpRecord.id);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Default action: send code

    // Check if email already exists in profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "email_exists", message: "This email is already registered with another account. Please try with a different email." }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Invalidate any existing OTPs for this email
    await supabaseAdmin
      .from("registration_otps")
      .update({ used: true })
      .eq("email", trimmedEmail)
      .eq("used", false);

    // Generate and store code server-side
    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("registration_otps")
      .insert({ email: trimmedEmail, code: generatedCode, expires_at: expiresAt });

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
                <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">Email Verification 🔐</h1>
                <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Verify your email to continue registration</p>
              </td></tr>
              <tr><td style="padding:40px 32px;">
                <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 24px;">
                  Your verification code is:
                </p>
                <div style="text-align:center;margin:0 0 24px;">
                  <span style="display:inline-block;background:#f1f5f9;border:2px solid #059669;border-radius:12px;padding:16px 40px;font-size:32px;font-weight:700;letter-spacing:8px;color:#1e293b;">
                    ${generatedCode}
                  </span>
                </div>
                <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 8px;">
                  This code will expire in <strong>10 minutes</strong>.
                </p>
                <p style="color:#94a3b8;font-size:13px;margin:0;">
                  If you did not request this, please ignore this email.
                </p>
              </td></tr>
              <tr><td style="padding:24px 32px;text-align:center;border-top:1px solid #f1f5f9;">
                <span style="color:#059669;font-size:18px;font-weight:700;">Codonyx</span>
                <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">© ${year} Codonyx. All rights reserved.</p>
                <p style="color:#94a3b8;font-size:12px;margin:8px 0 0;">For any contact, email us at <a href="mailto:info@codonyx.org" style="color:#059669;text-decoration:none;">info@codonyx.org</a></p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body></html>
    `;

    console.log(`Sending verification code to: ${trimmedEmail}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Codonyx <notifications@codonyx.org>",
        to: [trimmedEmail],
        subject: `Your Codonyx Verification Code`,
        html,
      }),
    });

    const emailResponse = await res.json();
    console.log("Verification email response:", emailResponse);

    if (!res.ok) {
      throw new Error(emailResponse.message || "Failed to send verification email");
    }

    // Do NOT return the code to the client
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[send-verification-code] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
