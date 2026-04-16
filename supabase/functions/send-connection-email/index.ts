import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderEmailLayout, renderCtaButton, renderPill, escapeHtml, BRAND } from "../_shared/email-layout.ts";

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
  senderAvatarUrl?: string;
  senderUserType?: string;
  connectionPageUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      senderAvatarUrl,
      senderUserType,
      connectionPageUrl,
    }: ConnectionEmailRequest = await req.json();

    console.log("Sending connection request email to:", recipientEmail);

    const initial = (senderName || "U").charAt(0).toUpperCase();
    const userTypeLabel = senderUserType
      ? senderUserType.charAt(0).toUpperCase() + senderUserType.slice(1)
      : "";

    // Avatar: real image if provided, otherwise gradient initial circle
    const avatarBlock = senderAvatarUrl
      ? `<img src="${escapeHtml(senderAvatarUrl)}" alt="${escapeHtml(senderName)}" width="84" height="84" style="display:block;width:84px;height:84px;border-radius:50%;object-fit:cover;border:3px solid #ffffff;box-shadow:0 4px 14px rgba(5,150,105,0.25);" />`
      : `<div style="width:84px;height:84px;background:linear-gradient(135deg,#10b981,#047857);border-radius:50%;text-align:center;line-height:84px;border:3px solid #ffffff;box-shadow:0 4px 14px rgba(5,150,105,0.25);">
           <span style="color:#ffffff;font-size:34px;font-weight:700;line-height:84px;">${escapeHtml(initial)}</span>
         </div>`;

    const body = `
      <p style="color:#0f172a;font-size:17px;font-weight:600;margin:0 0 8px;">Hi ${escapeHtml(recipientName)} 👋</p>
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 28px;">
        You have a new connection request waiting for you on ${BRAND.name}. Take a moment to review their profile and grow your professional network.
      </p>

      <!-- Sender card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(145deg,#f0fdf4 0%,#ecfdf5 100%);border-radius:14px;border:1px solid #bbf7d0;margin:0 0 28px;">
        <tr><td style="padding:24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="84" valign="top" style="padding-right:18px;">${avatarBlock}</td>
              <td valign="top">
                <p style="margin:0 0 4px;color:#065f46;font-size:18px;font-weight:700;line-height:1.3;">${escapeHtml(senderName)}</p>
                ${userTypeLabel ? `<p style="margin:0 0 8px;">${renderPill(userTypeLabel)}</p>` : ""}
                ${senderTitle ? `<p style="margin:6px 0 2px;color:#0f172a;font-size:14px;font-weight:500;line-height:1.4;">${escapeHtml(senderTitle)}</p>` : ""}
                ${senderOrganization ? `<p style="margin:0;color:#64748b;font-size:13px;line-height:1.4;">${escapeHtml(senderOrganization)}</p>` : ""}
              </td>
            </tr>
          </table>
          ${senderBio ? `<div style="border-top:1px solid #bbf7d0;margin-top:18px;padding-top:16px;">
            <p style="color:#475569;margin:0;font-size:13px;line-height:1.65;font-style:italic;">"${escapeHtml(senderBio.length > 240 ? senderBio.slice(0, 240) + "…" : senderBio)}"</p>
          </div>` : ""}
        </td></tr>
      </table>

      ${renderCtaButton("Review Connection Request", connectionPageUrl)}

      <p style="color:#94a3b8;font-size:13px;margin:18px 0 0;text-align:center;line-height:1.5;">
        Or <a href="${connectionPageUrl}" style="color:#059669;text-decoration:none;font-weight:500;">view all pending requests</a> on your connections page.
      </p>
    `;

    const html = renderEmailLayout({
      preheader: `${senderName} wants to connect with you on ${BRAND.name}`,
      headerEmoji: "🤝",
      headerTitle: "New Connection Request",
      headerSubtitle: `${senderName} wants to connect with you`,
      body,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Codonyx Notifications <notifications@codonyx.org>",
        to: [recipientEmail],
        subject: `${senderName} wants to connect with you on Codonyx`,
        html,
      }),
    });

    const emailResponse = await res.json();
    console.log("Email sent:", emailResponse);

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
