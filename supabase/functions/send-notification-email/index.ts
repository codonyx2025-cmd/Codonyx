import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderEmailLayout, renderCtaButton, renderPill, escapeHtml, BRAND } from "../_shared/email-layout.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType = "connection_accepted" | "registration_approved" | "registration_rejected" | "registration_submitted";

const ADMIN_ONLY_TYPES: NotificationType[] = ["registration_approved", "registration_rejected"];

interface NotificationRequest {
  type: NotificationType;
  recipientEmail: string;
  recipientName: string;
  senderName?: string;
  senderHeadline?: string;
  senderOrganisation?: string;
  senderUserType?: string;
  senderAvatarUrl?: string;
  userType?: string;
  loginUrl?: string;
}

function roleLabel(t?: string) {
  if (t === "advisor") return "Advisor";
  if (t === "laboratory") return "Laboratory";
  if (t === "distributor") return "Distribution Partner";
  return "Member";
}

function getEmailContent(data: NotificationRequest): { subject: string; html: string } {
  const baseUrl = data.loginUrl || `${BRAND.websiteUrl}/auth`;

  switch (data.type) {
    case "connection_accepted": {
      const initial = (data.senderName || "U").charAt(0).toUpperCase();
      const avatarBlock = data.senderAvatarUrl
        ? `<img src="${escapeHtml(data.senderAvatarUrl)}" alt="${escapeHtml(data.senderName || "")}" width="72" height="72" style="display:block;width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(5,150,105,0.2);" />`
        : `<div style="width:72px;height:72px;background:linear-gradient(135deg,#10b981,#047857);border-radius:50%;text-align:center;line-height:72px;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(5,150,105,0.2);">
             <span style="color:#ffffff;font-size:28px;font-weight:700;line-height:72px;">${escapeHtml(initial)}</span>
           </div>`;

      const body = `
        <p style="color:#0f172a;font-size:17px;font-weight:600;margin:0 0 8px;">Great news, ${escapeHtml(data.recipientName)}! 🎉</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 26px;">
          <strong style="color:#059669;">${escapeHtml(data.senderName || "")}</strong> accepted your connection request. You're now part of each other's professional network on ${BRAND.name}.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(145deg,#f0fdf4 0%,#ecfdf5 100%);border-radius:14px;border:1px solid #bbf7d0;margin:0 0 28px;">
          <tr><td style="padding:22px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="72" valign="top" style="padding-right:16px;">${avatarBlock}</td>
                <td valign="top">
                  <p style="margin:0 0 4px;color:#065f46;font-size:17px;font-weight:700;">${escapeHtml(data.senderName || "")}</p>
                  ${data.senderUserType ? `<p style="margin:0 0 6px;">${renderPill(roleLabel(data.senderUserType))}</p>` : ""}
                  ${data.senderHeadline ? `<p style="margin:4px 0 2px;color:#0f172a;font-size:13px;font-weight:500;">${escapeHtml(data.senderHeadline)}</p>` : ""}
                  ${data.senderOrganisation ? `<p style="margin:0;color:#64748b;font-size:13px;">${escapeHtml(data.senderOrganisation)}</p>` : ""}
                </td>
              </tr>
            </table>
          </td></tr>
        </table>

        ${renderCtaButton("View Your Connections", baseUrl.replace("/auth", "/connections"))}
      `;

      return {
        subject: `${data.senderName} accepted your connection request | Codonyx`,
        html: renderEmailLayout({
          preheader: `${data.senderName} is now connected with you`,
          headerEmoji: "✅",
          headerTitle: "Connection Accepted!",
          headerSubtitle: "Your network just grew",
          body,
        }),
      };
    }

    case "registration_approved": {
      const body = `
        <p style="color:#0f172a;font-size:17px;font-weight:600;margin:0 0 8px;">Welcome aboard, ${escapeHtml(data.recipientName)}! 🎊</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 22px;">
          Your account has been <strong style="color:#059669;">verified successfully</strong>. You can now sign in using the credentials you set during registration.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;margin:0 0 28px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Your Role</p>
            <p style="margin:0;">${renderPill(roleLabel(data.userType))}</p>
          </td></tr>
        </table>

        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
          Start connecting with professionals, share your expertise, and explore opportunities tailored to your role.
        </p>

        ${renderCtaButton("Sign In to Codonyx", baseUrl)}
      `;
      return {
        subject: `Welcome to Codonyx — Your account is verified ✅`,
        html: renderEmailLayout({
          preheader: "Your Codonyx account is now active",
          headerEmoji: "🎉",
          headerTitle: "Account Verified!",
          headerSubtitle: `Welcome to the ${BRAND.name} network`,
          body,
        }),
      };
    }

    case "registration_rejected": {
      const body = `
        <p style="color:#0f172a;font-size:17px;font-weight:600;margin:0 0 8px;">Hello ${escapeHtml(data.recipientName)},</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
          Thank you for your interest in joining ${BRAND.name} as a <strong>${roleLabel(data.userType)}</strong>.
        </p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
          After careful review, we are unable to approve your registration at this time. This may be due to incomplete information or specific verification requirements.
        </p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
          If you believe this was made in error, or you'd like to provide additional details and reapply, please reach out to our team.
        </p>
        ${renderCtaButton("Contact Support", `mailto:${BRAND.contactEmail}`)}
      `;
      return {
        subject: `Update on your Codonyx registration`,
        html: renderEmailLayout({
          preheader: "An update on your Codonyx registration",
          headerEmoji: "📋",
          headerTitle: "Registration Update",
          headerSubtitle: "Regarding your application",
          body,
        }),
      };
    }

    case "registration_submitted": {
      const body = `
        <p style="color:#0f172a;font-size:17px;font-weight:600;margin:0 0 8px;">Thanks for joining us, ${escapeHtml(data.recipientName)}!</p>
        <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 22px;">
          We've received your registration as a <strong style="color:#059669;">${roleLabel(data.userType)}</strong>. Our team is currently reviewing your application.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border-radius:12px;border:1px solid #fde68a;margin:0 0 24px;">
          <tr><td style="padding:18px 22px;">
            <p style="margin:0 0 6px;color:#92400e;font-size:14px;font-weight:600;">⏳ Status: Under Review</p>
            <p style="margin:0;color:#78350f;font-size:13px;line-height:1.5;">You'll receive an email once a decision has been made — typically within 1-2 business days.</p>
          </td></tr>
        </table>

        <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
          💡 Please do not attempt to sign in until your account has been approved.
        </p>
      `;
      return {
        subject: `Registration Received — Codonyx`,
        html: renderEmailLayout({
          preheader: "Your Codonyx registration is under review",
          headerEmoji: "📝",
          headerTitle: "Registration Received",
          headerSubtitle: `Welcome to ${BRAND.name}`,
          body,
        }),
      };
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();

    if (!data.recipientEmail || !data.recipientName || !data.type) {
      return new Response(
        JSON.stringify({ error: "recipientEmail, recipientName, and type are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let userId: string | null = null;

    if (data.type !== "registration_submitted") {
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

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      userId = user.id;
    }

    if (ADMIN_ONLY_TYPES.includes(data.type)) {
      if (!userId) {
        return new Response(JSON.stringify({ error: "Forbidden: Admin role required" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Forbidden: Admin role required" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    const { subject, html } = getEmailContent(data);

    console.log(`Sending ${data.type} notification to:`, data.recipientEmail);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Codonyx Notifications <notifications@codonyx.org>",
        to: [data.recipientEmail],
        subject,
        html,
      }),
    });

    const emailResponse = await res.json();
    console.log("Notification email response:", emailResponse);

    if (!res.ok) {
      throw new Error(emailResponse.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-notification-email] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
