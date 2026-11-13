
// Shared email layout helpers for all Codonyx transactional emails.
// Responsive, email-client-compatible layout.
// Brand palette: Navy #0B2D5B + Red #E10611 on white.

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
 * Master responsive email wrapper.
 * Uses table-based layout for better Gmail, Outlook and mobile compatibility.
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
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(opts.headerTitle)}</title>

  <style>
    body, table, td, p, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    @media only screen and (max-width: 620px) {
      .email-outer {
        padding: 16px 8px !important;
      }

      .email-card {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 14px !important;
      }

      .email-header {
        padding: 32px 18px 30px !important;
      }

      .email-logo {
        width: 44px !important;
        height: 44px !important;
      }

      .email-title {
        font-size: 23px !important;
        line-height: 1.3 !important;
      }

      .email-subtitle {
        font-size: 15px !important;
        line-height: 1.6 !important;
        text-align: center !important;
        color: #FFFFFF !important;
      }

      .email-body {
        padding: 28px 20px 26px !important;
      }

      .email-footer-note {
        padding: 0 20px 24px !important;
      }

      .email-divider {
        padding: 0 20px !important;
      }

      .email-footer {
        padding: 26px 20px !important;
      }

      .email-footer p {
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
      }

      .email-content,
      .email-content table {
        max-width: 100% !important;
      }
    }

    @media only screen and (max-width: 380px) {
      .email-header {
        padding: 26px 14px 26px !important;
      }

      .email-title {
        font-size: 21px !important;
      }

      .email-body {
        padding: 24px 16px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;width:100%;background-color:#f1f5f9;font-family:'Segoe UI','Helvetica Neue',Roboto,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">

  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    bgcolor="#f1f5f9"
    style="width:100%;background-color:#f1f5f9;border-collapse:collapse;">
    <tr>
      <td align="center" class="email-outer" style="padding:36px 16px;">

        <!-- Main email card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          align="center"
          class="email-card"
          bgcolor="#ffffff"
          style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;border-collapse:separate;">

          <!-- Header -->
          <tr>
            <td align="center"
              bgcolor="#0B2D5B"
              class="email-header"
              style="background-color:#0B2D5B;background-image:linear-gradient(135deg,#081F3F 0%,#0B2D5B 50%,#123E7C 100%);padding:44px 32px 38px;text-align:center;">

              <!-- Logo -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                <tr>
                  <td align="center" valign="middle"
                    bgcolor="#ffffff"
                    style="background-color:#ffffff;border-radius:16px;padding:12px;">
                    <img
                      src="${BRAND.logoUrl}"
                      alt="Codonyx"
                      width="44"
                      height="44"
                      class="email-logo"
                      style="display:block;width:44px;height:44px;border:0;border-radius:8px;"
                    />
                  </td>
                </tr>
              </table>

              <!-- Header title and subtitle -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="width:100%;margin-top:22px;">
                <tr>
                  <td align="center" style="text-align:center;">

                    <h1 class="email-title"
                      style="margin:0;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF;font-size:26px;font-weight:700;letter-spacing:-0.3px;line-height:1.3;text-align:center;">
                      ${escapeHtml(opts.headerTitle)}
                    </h1>

                    ${opts.headerSubtitle ? `
                    <p class="email-subtitle"
                      align="center"
                      style="margin:12px auto 0;padding:0;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF;font-size:15px;font-weight:400;line-height:1.6;text-align:center;">
                      ${escapeHtml(opts.headerSubtitle)}
                    </p>
                    ` : ""}

                  </td>
                </tr>
              </table>

              <!-- Red accent divider -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"
                align="center" style="margin:22px auto 0;">
                <tr>
                  <td width="56" height="3"
                    bgcolor="#E10611"
                    style="width:56px;height:3px;background-color:#E10611;border-radius:2px;font-size:0;line-height:0;">
                    &nbsp;
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Email body -->
          <tr>
            <td class="email-body email-content"
              bgcolor="#ffffff"
              style="padding:40px 36px 36px;background-color:#ffffff;color:#0f172a;">
              ${opts.body}
            </td>
          </tr>

          <!-- Optional footer note -->
          ${opts.footerNote ? `
          <tr>
            <td class="email-footer-note" style="padding:0 36px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                bgcolor="#f8fafc"
                style="width:100%;background-color:#f8fafc;border-radius:8px;">
                <tr>
                  <td style="padding:14px 18px;border-left:3px solid #E10611;">
                    <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
                      ${opts.footerNote}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ""}

          <!-- Divider -->
          <tr>
            <td class="email-divider" style="padding:0 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="1" bgcolor="#e2e8f0"
                    style="height:1px;background-color:#e2e8f0;font-size:0;line-height:0;">
                    &nbsp;
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer"
              align="center"
              bgcolor="#fafbfc"
              style="padding:32px 36px;text-align:center;background-color:#fafbfc;">

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
                style="margin:0 auto 6px;">
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <img
                      src="${BRAND.logoUrl}"
                      alt="Codonyx"
                      width="28"
                      height="28"
                      style="display:block;width:28px;height:28px;border-radius:6px;margin:0 auto;"
                    />
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0;color:#0B2D5B;font-size:20px;font-weight:700;letter-spacing:-0.2px;">
                      ${BRAND.name}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px;color:#64748b;font-size:13px;line-height:1.5;text-align:center;">
                ${BRAND.tagline}
              </p>

              <p style="margin:0 0 6px;color:#64748b;font-size:13px;line-height:1.6;text-align:center;">
                For any contact, email us at
                <a href="mailto:${BRAND.contactEmail}"
                  style="color:#E10611;text-decoration:none;font-weight:600;">
                  ${BRAND.contactEmail}
                </a>
              </p>

              <p style="margin:14px 0 0;color:#94a3b8;font-size:11px;line-height:1.5;text-align:center;">
                &copy; ${year} ${BRAND.name}. All rights reserved.<br/>
                If you didn't expect this email, you can safely ignore it.
              </p>

            </td>
          </tr>

        </table>
        <!-- End main email card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Render a CTA button with consistent branding. */
export function renderCtaButton(label: string, href: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="width:100%;margin:8px 0;border-collapse:collapse;">
    <tr>
      <td align="center" style="text-align:center;">
        <a href="${escapeHtml(href)}"
          style="display:inline-block;background-color:#0B2D5B;background-image:linear-gradient(135deg,#0B2D5B 0%,#123E7C 100%);color:#ffffff !important;text-decoration:none;padding:15px 30px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Render a pill/badge for highlighting role or status. */
export function renderPill(text: string, color = "#E10611"): string {
  return `<span style="display:inline-block;background-color:${color}1a;color:${color};padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:0.3px;text-transform:uppercase;">${escapeHtml(text)}</span>`;
}

/** Render a styled OTP code display. */
export function renderOtpCode(code: string): string {
  return `<div style="text-align:center;margin:24px 0 20px;">
    <div style="display:inline-block;background-color:#EFF4FB;background-image:linear-gradient(135deg,#F4F8FD 0%,#EFF4FB 100%);border:2px dashed #0B2D5B;border-radius:14px;padding:20px 24px;">
      <div style="font-family:'SF Mono','Monaco','Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:#0B2D5B;line-height:1;">
        ${escapeHtml(code)}
      </div>
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
