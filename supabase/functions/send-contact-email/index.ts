import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- In-memory rate limiter ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 3; // max 3 requests per minute per IP

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

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);
// --- End rate limiter ---

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

  // Rate limit by IP
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
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:48px 20px;">
              <tr><td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                  <tr>
                    <td style="background:linear-gradient(135deg,#059669 0%,#047857 50%,#065f46 100%);padding:40px 32px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">New Contact Form Submission</h1>
                      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Someone reached out via the Codonyx website</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px 32px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr><td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
                          <strong style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Name</strong>
                          <p style="color:#1e293b;font-size:16px;margin:4px 0 0;">${name}</p>
                        </td></tr>
                        <tr><td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
                          <strong style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Email</strong>
                          <p style="color:#1e293b;font-size:16px;margin:4px 0 0;"><a href="mailto:${email}" style="color:#059669;text-decoration:none;">${email}</a></p>
                        </td></tr>
                        ${organisation ? `<tr><td style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
                          <strong style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Organisation</strong>
                          <p style="color:#1e293b;font-size:16px;margin:4px 0 0;">${organisation}</p>
                        </td></tr>` : ""}
                        <tr><td style="padding:12px 0;">
                          <strong style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Message</strong>
                          <p style="color:#1e293b;font-size:16px;margin:4px 0 0;line-height:1.6;">${message.replace(/\n/g, "<br>")}</p>
                        </td></tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr><td align="center">
                          <a href="mailto:${email}" style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#047857 100%);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;">
                            Reply to ${name}
                          </a>
                        </td></tr>
                      </table>
                    </td>
                  </tr>
                  <tr><td style="padding:24px 32px;text-align:center;border-top:1px solid #f1f5f9;">
                    <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Codonyx. Contact form submission.</p>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
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
    console.error("Error in send-contact-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
