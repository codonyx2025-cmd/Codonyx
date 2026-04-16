import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { renderEmailLayout, renderCtaButton, escapeHtml } from "../_shared/email-layout.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 3;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

interface ContactEmailRequest {
  name: string;
  email: string;
  organisation: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`contact:${clientIP}`)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const { name, email, organisation, message }: ContactEmailRequest = await req.json();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending contact form email from:", email);

    const fieldRow = (label: string, value: string, isLink = false) => `
      <tr><td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
        <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">${escapeHtml(label)}</p>
        <p style="margin:0;color:#0f172a;font-size:15px;line-height:1.5;">${isLink ? `<a href="mailto:${escapeHtml(value)}" style="color:#059669;text-decoration:none;">${escapeHtml(value)}</a>` : escapeHtml(value)}</p>
      </td></tr>`;

    const messageHtml = escapeHtml(message).replace(/\n/g, "<br>");

    const body = `
      <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 20px;">
        A new message has been submitted through the Codonyx contact form.
      </p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin:0 0 24px;">
        <tr><td style="padding:8px 22px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${fieldRow("Name", name)}
            ${fieldRow("Email", email, true)}
            ${organisation ? fieldRow("Organisation", organisation) : ""}
          </table>
        </td></tr>
      </table>

      <div style="margin:0 0 24px;">
        <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Message</p>
        <div style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;">
          <p style="margin:0;color:#0f172a;font-size:15px;line-height:1.7;">${messageHtml}</p>
        </div>
      </div>

      ${renderCtaButton(`Reply to ${name}`, `mailto:${email}`)}
    `;

    const html = renderEmailLayout({
      preheader: `New contact form submission from ${name}`,
      headerEmoji: "💬",
      headerTitle: "New Contact Form Submission",
      headerSubtitle: "Someone reached out via the Codonyx website",
      body,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Codonyx Contact Form <notifications@codonyx.org>",
        to: ["info@codonyx.org"],
        reply_to: email,
        subject: `New Contact Form Submission from ${name}`,
        html,
      }),
    });

    const emailResponse = await res.json();
    console.log("Contact email response:", emailResponse);

    if (!res.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-contact-email] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
