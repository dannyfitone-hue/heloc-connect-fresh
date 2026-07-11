import { statusLink } from "@/lib/sms";

type EmailResult = { ok?: boolean; skipped?: boolean; reason?: string; status?: number; response?: any; error?: any };

function cleanEnv(value: any) {
  return String(value || "").trim();
}

function money(v: any) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n <= 0) return "Not provided";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function esc(v: any) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function emailFrom() {
  return cleanEnv(process.env.EMAIL_FROM) || "HELOC CONNECT <clientservices@helocconnect.com>";
}

function publicSiteUrl() {
  return (cleanEnv(process.env.NEXT_PUBLIC_SITE_URL) || "https://helocconnect.com").replace(/\/$/, "");
}

function emailLogoUrl() {
  return `${publicSiteUrl()}/hc-logo-premium-visible-v52.png`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  const from = emailFrom();
  const recipient = cleanEnv(to);

  if (!apiKey || !recipient) {
    return { skipped: true, reason: "Missing RESEND_API_KEY or recipient email." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: recipient, subject, html }),
    });

    const text = await res.text();
    let response: any = text;
    try { response = text ? JSON.parse(text) : null; } catch {}

    if (!res.ok) return { ok: false, status: res.status, error: response };
    return { ok: true, status: res.status, response };
  } catch (error: any) {
    return { ok: false, error: error?.message || String(error) };
  }
}

function shell(inner: string) {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#07111f;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#07111f;padding:32px 12px;">
    <tr><td align="center">
      <table width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#0c1728;border:1px solid #223653;border-radius:24px;overflow:hidden;">
        <tr><td align="center" style="padding:22px 30px 24px;background:linear-gradient(135deg,#081326,#152744);text-align:center;">
          <a href="${esc(publicSiteUrl())}" style="display:inline-block;text-decoration:none;" target="_blank">
            <img src="${esc(emailLogoUrl())}" width="150" alt="HELOC CONNECT" style="display:block;width:150px;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
          </a>
          <div style="margin-top:8px;font-size:14px;color:#cbd5e1;">Your Personal Mortgage Connection Platform™</div>
        </td></tr>
        ${inner}
        <tr><td style="padding:22px 30px;background:#081326;border-top:1px solid #223653;">
          <p style="margin:0 0 8px;color:#dbe7f5;font-size:14px;">Need help? Contact us anytime:</p>
          <p style="margin:0;color:#f5c76b;font-size:15px;font-weight:800;">clientservices@helocconnect.com</p>
          <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">HELOC CONNECT is not a lender or mortgage company. We connect homeowners with mortgage companies. Loan approvals, rates, terms, and funding decisions are made by participating mortgage companies.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildWelcomeEmail(lead: any) {
  const firstName = esc(lead?.first_name || "there");
  const portalUrl = statusLink(lead?.client_token || lead?.token || "");
  return shell(`
    <tr><td style="padding:34px 30px 18px;">
      <div style="background:radial-gradient(circle at top,#1f3b62,#101b2e 65%);border:1px solid #2d456a;border-radius:22px;padding:30px;text-align:center;">
        <div style="font-size:58px;line-height:1;">🏠✨</div>
        <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.2;color:#ffffff;">Your Application Has Been Received</h1>
        <p style="margin:0;color:#d5deea;font-size:16px;line-height:1.65;">Your application is safely submitted and entering the HELOC CONNECT matching process.</p>
      </div>
    </td></tr>
    <tr><td style="padding:16px 30px 0;">
      <p style="font-size:16px;line-height:1.7;color:#dbe7f5;margin:0;">Hi ${firstName},</p>
      <p style="font-size:16px;line-height:1.7;color:#dbe7f5;">Thank you for choosing <strong>HELOC CONNECT</strong>. We know financing can feel stressful, confusing, and time-consuming. Our goal is to make the process feel simpler, clearer, and more comfortable by helping connect you with the right mortgage company based on your unique situation.</p>
      <p style="font-size:16px;line-height:1.7;color:#dbe7f5;">You can always use your personal client portal to check your application status, upload requested documents, and follow your progress.</p>
    </td></tr>
    <tr><td style="padding:12px 30px 8px;">
      <table width="100%" cellspacing="0" cellpadding="0" style="background:#101f35;border:1px solid #2b4165;border-radius:18px;"><tr><td style="padding:26px;text-align:center;">
        <div style="font-size:20px;font-weight:900;color:#f5c76b;margin-bottom:10px;">Your Personal Client Portal</div>
        <p style="margin:0 0 18px;color:#dbe7f5;font-size:15px;line-height:1.6;">Click below anytime to securely access your client portal, check your application status, upload requested documents, and stay updated as your application moves forward.</p>
        <a href="${esc(portalUrl)}" style="display:inline-block;background:#f5c76b;color:#07111f;text-decoration:none;font-weight:900;padding:15px 28px;border-radius:999px;font-size:16px;">View My Application Status</a>
        <p style="margin:18px 0 0;color:#94a3b8;font-size:13px;line-height:1.5;">We recommend saving or bookmarking this link so you can check your progress anytime.</p>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:24px 30px 8px;">
      <h2 style="margin:0 0 14px;font-size:21px;color:#ffffff;">What Happens Next</h2>
      <div style="padding:14px;background:#0f1d31;border-radius:14px;color:#dbe7f5;font-size:15px;line-height:1.55;margin-bottom:10px;"><strong style="color:#f5c76b;">1. Application Review</strong><br>Your information is reviewed so the right next step can be determined.</div>
      <div style="padding:14px;background:#0f1d31;border-radius:14px;color:#dbe7f5;font-size:15px;line-height:1.55;margin-bottom:10px;"><strong style="color:#f5c76b;">2. Smart Matching</strong><br>HELOC CONNECT works to match your request with a mortgage company in our network.</div>
      <div style="padding:14px;background:#0f1d31;border-radius:14px;color:#dbe7f5;font-size:15px;line-height:1.55;"><strong style="color:#f5c76b;">3. Status Updates</strong><br>Your portal updates as your application moves forward.</div>
    </td></tr>
    <tr><td style="padding:22px 30px;">
      <table width="100%" cellspacing="0" cellpadding="0"><tr>
        <td style="width:50%;padding:8px;"><div style="background:#101f35;border-radius:16px;padding:18px;text-align:center;color:#dbe7f5;">🔒<br><strong>Secure Process</strong></div></td>
        <td style="width:50%;padding:8px;"><div style="background:#101f35;border-radius:16px;padding:18px;text-align:center;color:#dbe7f5;">⚡<br><strong>Fast Updates</strong></div></td>
      </tr><tr>
        <td style="width:50%;padding:8px;"><div style="background:#101f35;border-radius:16px;padding:18px;text-align:center;color:#dbe7f5;">🏦<br><strong>Lender Network</strong></div></td>
        <td style="width:50%;padding:8px;"><div style="background:#101f35;border-radius:16px;padding:18px;text-align:center;color:#dbe7f5;">📲<br><strong>Portal Access</strong></div></td>
      </tr></table>
    </td></tr>
  `);
}

export async function sendWelcomeEmail(lead: any) {
  return sendEmail(
    lead?.email,
    "Welcome to HELOC CONNECT — Your Application Has Been Received",
    buildWelcomeEmail(lead)
  );
}

export async function sendAdminLeadEmail(lead: any) {
  const admin = cleanEnv(process.env.ADMIN_EMAIL) || "clientservices@helocconnect.com";
  const portalUrl = statusLink(lead?.client_token || "");
  const html = shell(`
    <tr><td style="padding:30px;">
      <h1 style="margin:0 0 8px;font-size:28px;color:#ffffff;">New HELOC CONNECT Lead</h1>
      <p style="color:#cbd5e1;line-height:1.6;">A new application was submitted from the website.</p>
      <table width="100%" cellspacing="0" cellpadding="0" style="background:#101f35;border:1px solid #2b4165;border-radius:18px;padding:18px;color:#dbe7f5;font-size:15px;line-height:1.8;">
        <tr><td><strong style="color:#f5c76b;">Name:</strong> ${esc(lead?.first_name)} ${esc(lead?.last_name)}</td></tr>
        <tr><td><strong style="color:#f5c76b;">Phone:</strong> ${esc(lead?.phone)}</td></tr>
        <tr><td><strong style="color:#f5c76b;">Email:</strong> ${esc(lead?.email)}</td></tr>
        <tr><td><strong style="color:#f5c76b;">Property:</strong> ${esc(lead?.property_address)}</td></tr>
        <tr><td><strong style="color:#f5c76b;">Requested Amount:</strong> ${esc(money(lead?.requested_amount))}</td></tr>
        <tr><td><strong style="color:#f5c76b;">Tracking ID:</strong> ${esc(lead?.tracking_id)}</td></tr>
      </table>
      <p style="margin-top:20px;"><a href="${esc(portalUrl)}" style="display:inline-block;background:#f5c76b;color:#07111f;text-decoration:none;font-weight:900;padding:14px 24px;border-radius:999px;">Open Client Portal</a></p>
    </td></tr>
  `);
  return sendEmail(admin, `New HELOC CONNECT Lead — ${lead?.first_name || "Client"} ${lead?.last_name || ""}`.trim(), html);
}

export async function sendStatusEmail(lead: any, status: string) {
  const portalUrl = statusLink(lead?.client_token || "");
  const html = shell(`
    <tr><td style="padding:30px;">
      <h1 style="margin:0 0 8px;font-size:28px;color:#ffffff;">Application Status Updated</h1>
      <p style="color:#dbe7f5;line-height:1.7;">Hi ${esc(lead?.first_name || "there")}, your HELOC CONNECT application status has been updated.</p>
      <div style="background:#101f35;border:1px solid #2b4165;border-radius:18px;padding:22px;text-align:center;">
        <div style="color:#94a3b8;font-size:13px;">Current Status</div>
        <div style="margin-top:8px;color:#f5c76b;font-size:24px;font-weight:900;">${esc(status)}</div>
      </div>
      <p style="color:#dbe7f5;line-height:1.7;">You can always open your client portal to check your progress and see any requested documents.</p>
      <p><a href="${esc(portalUrl)}" style="display:inline-block;background:#f5c76b;color:#07111f;text-decoration:none;font-weight:900;padding:14px 24px;border-radius:999px;">View My Application Status</a></p>
    </td></tr>
  `);
  return sendEmail(lead?.email, `HELOC CONNECT Status Update — ${status}`, html);
}

export async function sendDocumentsRequestedEmail(lead: any, documentType?: string) {
  const portalUrl = statusLink(lead?.client_token || "");
  const html = shell(`
    <tr><td style="padding:30px;">
      <h1 style="margin:0 0 8px;font-size:28px;color:#ffffff;">Documents Requested</h1>
      <p style="color:#dbe7f5;line-height:1.7;">Hi ${esc(lead?.first_name || "there")}, an update was added to your HELOC CONNECT application.</p>
      <div style="background:#101f35;border:1px solid #2b4165;border-radius:18px;padding:22px;">
        <div style="color:#94a3b8;font-size:13px;">Requested Document</div>
        <div style="margin-top:8px;color:#f5c76b;font-size:22px;font-weight:900;">${esc(documentType || "Additional documents")}</div>
      </div>
      <p style="color:#dbe7f5;line-height:1.7;">Please open your client portal to review the request and upload documents securely.</p>
      <p><a href="${esc(portalUrl)}" style="display:inline-block;background:#f5c76b;color:#07111f;text-decoration:none;font-weight:900;padding:14px 24px;border-radius:999px;">Open My Client Portal</a></p>
    </td></tr>
  `);
  return sendEmail(lead?.email, "HELOC CONNECT — Documents Requested", html);
}
