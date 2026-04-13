import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConnectionEmailRequest {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderTitle: string;
  senderOrganization: string;
  senderBio: string;
  connectionPageUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const {
      recipientEmail,
      recipientName,
      senderName,
      senderTitle,
      senderOrganization,
      senderBio,
      connectionPageUrl,
    }: ConnectionEmailRequest = await req.json();

    console.log("Sending connection request email to:", recipientEmail);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Codonyx Notifications <notifications@codonyx.org>",
        to: [recipientEmail],
        subject: `New Connection Request from ${senderName} | Codonyx`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 48px 20px;">
              <tr><td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  <tr><td style="background: linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%); padding: 40px 32px; text-align: center;">
                    <div style="width: 56px; height: 56px; background-color: rgba(255,255,255,0.15); border-radius: 12px; display: inline-block; text-align: center; line-height: 56px; margin-bottom: 16px;">
                      <span style="font-size: 28px;">🔗</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">New Connection Request</h1>
                    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">Someone wants to connect with you on Codonyx</p>
                  </td></tr>
                  <tr><td style="padding: 40px 32px 32px;">
                    <p style="color: #475569; font-size: 16px; margin: 0 0 28px; line-height: 1.6;">
                      Hello <strong style="color: #1e293b;">${recipientName}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 16px; margin: 0 0 32px; line-height: 1.7;">
                      You have received a connection request from a professional who would like to join your network.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(145deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; border: 1px solid #bbf7d0; margin-bottom: 32px;">
                      <tr><td style="padding: 28px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="64" valign="top" style="padding-right: 20px;">
                              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #059669, #047857); border-radius: 50%; text-align: center; line-height: 64px;">
                                <span style="color: #ffffff; font-size: 24px; font-weight: 600;">${senderName.charAt(0).toUpperCase()}</span>
                              </div>
                            </td>
                            <td valign="top">
                              <h3 style="color: #065f46; margin: 0 0 6px; font-size: 20px; font-weight: 700;">${senderName}</h3>
                              ${senderTitle ? `<p style="color: #059669; margin: 0 0 4px; font-size: 14px; font-weight: 500;">${senderTitle}</p>` : ''}
                              ${senderOrganization ? `<p style="color: #64748b; margin: 0; font-size: 14px;">at ${senderOrganization}</p>` : ''}
                            </td>
                          </tr>
                        </table>
                        ${senderBio ? `<div style="border-top: 1px solid #bbf7d0; margin-top: 20px; padding-top: 20px;"><p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.6; font-style: italic;">"${senderBio.substring(0, 250)}${senderBio.length > 250 ? '...' : ''}"</p></div>` : ''}
                      </td></tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td align="center" style="padding-bottom: 24px;">
                        <a href="${connectionPageUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669, #047857); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600;">
                          ✓ Accept Connection
                        </a>
                      </td></tr>
                    </table>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0; text-align: center;">
                      You can also <a href="${connectionPageUrl}" style="color: #059669; text-decoration: none; font-weight: 500;">view all pending requests</a> on your connections page.
                    </p>
                  </td></tr>
                  <tr><td style="padding: 0 32px;"><div style="height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent);"></div></td></tr>
                  <tr><td style="padding: 28px 32px; text-align: center;">
                    <span style="color: #059669; font-size: 18px; font-weight: 700;">Codonyx</span>
                    <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0;">Connecting professionals in science and innovation.</p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 4px 0 0;">© ${new Date().getFullYear()} Codonyx. All rights reserved.</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0;">For any contact, email us at <a href="mailto:info@codonyx.org" style="color:#059669;text-decoration:none;">info@codonyx.org</a></p>
                    <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0;">If you didn't expect this email, you can safely ignore it.</p>
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
    console.log("Email sent successfully:", emailResponse);

    if (!res.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-connection-email] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
