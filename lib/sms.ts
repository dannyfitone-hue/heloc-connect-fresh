export type SmsTemplateKey =
  | "welcome"
  | "status_update"
  | "documents_requested"
  | "company_matched"
  | "approved"
  | "funded"
  | "rejected";

export const DEFAULT_SMS_TEMPLATES: Record<SmsTemplateKey, string> = {
  welcome:
    "Welcome to HELOC CONNECT! Your Smart Mortgage Review has officially started. Track your application anytime: {STATUS_LINK}. We'll notify you whenever your application status changes.",
  status_update:
    "HELOC CONNECT update: Your application status is now {STATUS}. Track your application here: {STATUS_LINK}",
  documents_requested:
    "HELOC CONNECT: Additional documents are needed to continue your review. Upload or view the request securely here: {STATUS_LINK}",
  company_matched:
    "Great news from HELOC CONNECT! Your application has been matched with a mortgage company in our network. Track your next steps here: {STATUS_LINK}",
  approved:
    "Congratulations from HELOC CONNECT! Your application status is Approved. Track your progress here: {STATUS_LINK}",
  funded:
    "Congratulations from HELOC CONNECT! Your funding status has been marked Funded. Thank you for choosing HELOC CONNECT.",
  rejected:
    "HELOC CONNECT update: Your current application status is {STATUS}. You can view your status page here: {STATUS_LINK}",
};

export function normalizePhone(input: any) {
  const raw = String(input || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (raw.startsWith("+")) return raw;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function baseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://helocconnect.com").replace(/\/$/, "");
}

export function statusLink(token: any) {
  return `${baseUrl()}/status/${encodeURIComponent(String(token || ""))}`;
}

function fillTemplate(template: string, values: Record<string, any>) {
  return String(template || "")
    .replace(/\{FIRST_NAME\}/gi, String(values.firstName || values.first_name || ""))
    .replace(/\{LAST_NAME\}/gi, String(values.lastName || values.last_name || ""))
    .replace(/\{FULL_NAME\}/gi, String(values.fullName || `${values.firstName || ""} ${values.lastName || ""}`.trim()))
    .replace(/\{STATUS\}/gi, String(values.status || "Application Received"))
    .replace(/\{STATUS_LINK\}/gi, String(values.statusLink || ""))
    .replace(/\{TRACKING_ID\}/gi, String(values.trackingId || values.tracking_id || ""))
    .replace(/\{COMPANY_NAME\}/gi, String(values.companyName || values.company_name || ""));
}

export function templateKeyForStatus(status: any): SmsTemplateKey {
  const s = String(status || "").toLowerCase();
  if (s.includes("document")) return "documents_requested";
  if (s.includes("matched") || s.includes("company")) return "company_matched";
  if (s.includes("approved")) return "approved";
  if (s.includes("funded")) return "funded";
  if (s.includes("rejected") || s.includes("declined")) return "rejected";
  return "status_update";
}

async function getTemplateFromSupabase(key: SmsTemplateKey) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!url || !service) return DEFAULT_SMS_TEMPLATES[key];
    const supabase = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from("sms_templates")
      .select("message, enabled")
      .eq("template_key", key)
      .maybeSingle();
    if (error || !data || data.enabled === false || !data.message) return DEFAULT_SMS_TEMPLATES[key];
    return String(data.message);
  } catch {
    return DEFAULT_SMS_TEMPLATES[key];
  }
}

export async function sendSms(toPhone: any, message: string) {
  const apiKey = process.env.TELNYX_API_KEY || "";
  const from = normalizePhone(process.env.TELNYX_PHONE_NUMBER || "");
  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID || "";
  const to = normalizePhone(toPhone);

  if (!apiKey || !from || !to || !message) {
    return { skipped: true, reason: "Missing TELNYX_API_KEY, TELNYX_PHONE_NUMBER, recipient phone, or message." };
  }

  const payload: Record<string, any> = {
    from,
    to,
    text: message.slice(0, 1500),
  };
  if (messagingProfileId) payload.messaging_profile_id = messagingProfileId;

  const res = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }

  if (!res.ok) {
    return { ok: false, error: json || text, status: res.status };
  }
  return { ok: true, response: json || text };
}

export async function sendApplicationSms(key: SmsTemplateKey, lead: any, extra: Record<string, any> = {}) {
  const template = await getTemplateFromSupabase(key);
  const token = lead?.client_token || lead?.token || extra.token || "";
  const message = fillTemplate(template, {
    firstName: lead?.first_name,
    lastName: lead?.last_name,
    fullName: `${lead?.first_name || ""} ${lead?.last_name || ""}`.trim(),
    status: extra.status || lead?.status || "Application Received",
    statusLink: statusLink(token),
    trackingId: lead?.tracking_id,
    companyName: extra.companyName || lead?.assigned_company || lead?.assigned_lender || "",
  });
  return sendSms(lead?.phone, message);
}

export async function sendWelcomeSms(lead: any) {
  return sendApplicationSms("welcome", lead);
}

export async function sendStatusSms(phone: any, trackingId: any, status: any, token: any) {
  return sendApplicationSms(templateKeyForStatus(status), { phone, tracking_id: trackingId, status, client_token: token }, { status });
}
