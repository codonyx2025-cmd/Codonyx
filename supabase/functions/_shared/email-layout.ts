// Shared email layout helpers for all Codonyx transactional emails.
// Provides a consistent premium look across every email template.

export const BRAND = {
  name: "Codonyx",
  tagline: "Connecting professionals in science and innovation",
  primary: "#059669",
  primaryDark: "#047857",
  primaryDeep: "#065f46",
  contactEmail: "info@codonyx.org",
  websiteUrl: "https://codonyx.lovable.app",
  logoUrl: "https://codonyx.lovable.app/icon.png",
};

export interface LayoutOptions {
  preheader?: string;
  headerEmoji?: string;
  headerTitle: string;
  headerSubtitle?: string;
  body: string;
  footerNote?: string;
}

/**
 * Master email wrapper — premium gradient header, soft card, brand footer.
 * Use this for ALL outgoing emails so they share one cohesive identity.
 */
export function renderEmailLayout(opts: LayoutOptions): string {
  const year = new Date().getFullYear();
  const preheader = opts.preheader || opts.headerSubtitle || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(opts.headerTitle)}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI','Helvetica Neue',Roboto,Arial,sans-serif;background-color:#f1f5f9;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08),0 2px 8px rgba(15,23,42,0.04);">

        <!-- Top gradient accent bar -->
        <tr><td style="height:6px;background:linear-gradient(90deg,#10b981 0%,#059669 50%,#065f46 100%);line-height:6px;font-size:0;">&nbsp;</td></tr>

        <!-- Header -->
        <tr><td align="center" style="background:linear-gradient(135deg,#065f46 0%,#047857 50%,#059669 100%);padding:48px 32px 44px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
            <tr><td align="center" style="padding-bottom:20px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr><td align="center" valign="middle" width="64" height="64" style="width:64px;height:64px;background-color:rgba(255,255,255,0.16);border-radius:18px;text-align:center;vertical-align:middle;">
                  <span style="font-size:32px;line-height:1;display:inline-block;">${opts.headerEmoji || "✨"}</span>
                </td></tr>
              </table>
            </td></tr>
            <tr><td align="center" style="text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.3px;line-height:1.25;text-align:center;">${escapeHtml(opts.headerTitle)}</h1>
              ${opts.headerSubtitle ? `<p style="color:rgba(255,255,255,0.88);margin:10px 0 0;font-size:15px;line-height:1.5;text-align:center;">${escapeHtml(opts.headerSubtitle)}</p>` : ""}
            </td></tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 36px 36px;">
          ${opts.body}
        </td></tr>

        ${opts.footerNote ? `<tr><td style="padding:0 36px 28px;">
          <div style="background-color:#f8fafc;border-left:3px solid #059669;border-radius:8px;padding:14px 18px;">
            <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">${opts.footerNote}</p>
          </div>
        </td></tr>` : ""}

        <!-- Divider -->
        <tr><td style="padding:0 36px;">
          <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);"></div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:32px 36px;text-align:center;background-color:#fafbfc;">
          <p style="margin:0 0 6px;color:#059669;font-size:20px;font-weight:700;letter-spacing:-0.2px;">${BRAND.name}</p>
          <p style="margin:0 0 18px;color:#64748b;font-size:13px;line-height:1.5;">${BRAND.tagline}</p>
          <p style="margin:0 0 6px;color:#64748b;font-size:13px;line-height:1.6;">
            For any contact, email us at
            <a href="mailto:${BRAND.contactEmail}" style="color:#059669;text-decoration:none;font-weight:600;">${BRAND.contactEmail}</a>
          </p>
          <p style="margin:14px 0 0;color:#94a3b8;font-size:11px;line-height:1.5;">
            © ${year} ${BRAND.name}. All rights reserved.<br/>
            If you didn't expect this email, you can safely ignore it.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Render a CTA button with consistent branding. */
export function renderCtaButton(label: string, href: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0;">
    <tr><td align="center">
      <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#059669 0%,#047857 100%);color:#ffffff !important;text-decoration:none;padding:15px 38px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.2px;box-shadow:0 4px 14px rgba(5,150,105,0.35);">
        ${escapeHtml(label)}
      </a>
    </td></tr>
  </table>`;
}

/** Render a pill/badge for highlighting role or status. */
export function renderPill(text: string, color = "#059669"): string {
  return `<span style="display:inline-block;background-color:${color}1a;color:${color};padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:0.3px;text-transform:uppercase;">${escapeHtml(text)}</span>`;
}

/** Render a styled OTP code display. */
export function renderOtpCode(code: string): string {
  return `<div style="text-align:center;margin:24px 0 20px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 100%);border:2px dashed #059669;border-radius:14px;padding:20px 36px;">
      <div style="font-family:'SF Mono','Monaco','Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#065f46;line-height:1;">${escapeHtml(code)}</div>
    </div>
  </div>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export { escapeHtml };
