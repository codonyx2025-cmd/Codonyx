// Shared email layout helpers for all Codonyx transactional emails.
// Provides a consistent premium look across every email template.
// Brand palette: Navy #0B2D5B (RGB 11,45,91) + Red #E10611 (RGB 225,6,17) on white.

export const BRAND = {
  name: "Codonyx",
  tagline: "Connecting professionals in science and innovation",
  navy: "#0B2D5B",
  navyDark: "#081F3F",
  navyMid: "#123E7C",
  red: "#E10611",
  navyTintBg: "#EFF4FB",
  navyTintBorder: "#D7E3F4",
  contactEmail: "info@codonyx.org",
  websiteUrl: "https://codonyx.org",
  // 192px square PNG hosted on the site — renders reliably in email clients.
  logoUrl: "https://codonyx.org/favicon-192x192.png",
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
 * Master email wrapper — premium navy header with the Codonyx logo,
 * soft white card, brand footer. Use this for ALL outgoing emails.
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
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(11,45,91,0.08),0 2px 8px rgba(11,45,91,0.04);">

        <!-- Header (navy brand gradient with logo) -->
        <tr><td align="center" style="background:linear-gradient(135deg,#081F3F 0%,#0B2D5B 50%,#123E7C 100%);padding:44px 32px 40px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
            <tr><td align="center" style="padding-bottom:18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr><td align="center" valign="middle" style="background-color:#ffffff;border-radius:16px;padding:12px;">
                  <img src="${BRAND.logoUrl}" alt="Codonyx" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:8px;" />
                </td></tr>
              </table>
            </td></tr>
            <tr><td align="center" style="text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;letter-spacing:-0.3px;line-height:1.25;text-align:center;">${escapeHtml(opts.headerTitle)}</h1>
              ${opts.headerSubtitle ? `<p style="color:rgba(255,255,255,0.85);margin:10px 0 0;font-size:15px;line-height:1.5;text-align:center;">${escapeHtml(opts.headerSubtitle)}</p>` : ""}
            </td></tr>
          </table>
          <!-- Red accent divider -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto 0;">
            <tr><td width="56" height="3" style="width:56px;height:3px;background-color:#E10611;border-radius:2px;font-size:0;line-height:0;">&nbsp;</td></tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 36px 36px;">
          ${opts.body}
        </td></tr>

        ${opts.footerNote ? `<tr><td style="padding:0 36px 28px;">
          <div style="background-color:#f8fafc;border-left:3px solid #E10611;border-radius:8px;padding:14px 18px;">
            <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">${opts.footerNote}</p>
          </div>
        </td></tr>` : ""}

        <!-- Divider -->
        <tr><td style="padding:0 36px;">
          <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0,transparent);"></div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:32px 36px;text-align:center;background-color:#fafbfc;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 6px;">
            <tr><td align="center" style="padding-bottom:8px;">
              <img src="${BRAND.logoUrl}" alt="Codonyx" width="28" height="28" style="display:block;width:28px;height:28px;border-radius:6px;margin:0 auto;" />
            </td></tr>
            <tr><td align="center">
              <p style="margin:0;color:#0B2D5B;font-size:20px;font-weight:700;letter-spacing:-0.2px;">${BRAND.name}</p>
            </td></tr>
          </table>
          <p style="margin:0 0 18px;color:#64748b;font-size:13px;line-height:1.5;">${BRAND.tagline}</p>
          <p style="margin:0 0 6px;color:#64748b;font-size:13px;line-height:1.6;">
            For any contact, email us at
            <a href="mailto:${BRAND.contactEmail}" style="color:#E10611;text-decoration:none;font-weight:600;">${BRAND.contactEmail}</a>
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
      <a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#0B2D5B 0%,#123E7C 100%);color:#ffffff !important;text-decoration:none;padding:15px 38px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.2px;box-shadow:0 4px 14px rgba(11,45,91,0.35);">
        ${escapeHtml(label)}
      </a>
    </td></tr>
  </table>`;
}

/** Render a pill/badge for highlighting role or status. */
export function renderPill(text: string, color = "#E10611"): string {
  return `<span style="display:inline-block;background-color:${color}1a;color:${color};padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:0.3px;text-transform:uppercase;">${escapeHtml(text)}</span>`;
}

/** Render a styled OTP code display. */
export function renderOtpCode(code: string): string {
  return `<div style="text-align:center;margin:24px 0 20px;">
    <div style="display:inline-block;background:linear-gradient(135deg,#F4F8FD 0%,#EFF4FB 100%);border:2px dashed #0B2D5B;border-radius:14px;padding:20px 36px;">
      <div style="font-family:'SF Mono','Monaco','Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#0B2D5B;line-height:1;">${escapeHtml(code)}</div>
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
