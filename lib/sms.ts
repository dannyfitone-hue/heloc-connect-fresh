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
    "Hi! Thanks for contacting HC. We received your request successfully. A team member will review your information and reach out if anything else is needed. Reply STOP to opt out.",
  status_update:
    "HC update: Your request has a new update. A team member will contact you if anything else is needed. Reply STOP to opt out.",
  documents_requested:
    "HC update: Additional information may be needed. Our team will contact you with the next step. Reply STOP to opt out.",
  company_matched:
    "HC update: Your request has moved to the next review step. A team member will follow up shortly. Reply STOP to opt out.",
  approved:
    "HC update: Your request has been updated. A team member will contact you shortly with next steps. Reply STOP to opt out.",
  funded:
    "HC update: Your request has been completed. Thank you for choosing HC. Reply STOP to opt out.",
  rejected:
    "HC update: Your request has a new update. A team member will contact you if anything else is needed. Reply STOP to opt out.",
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

function cleanEnv(value: any) {
  // Vercel copy/paste can sometimes introduce spaces/newlines. Telnyx keys must be exact.
  return String(value || "").replace(/[\r\n\t ]/g, "").trim();
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

function neutralizeForCarrierTest(message: string) {
  // Temporary carrier-filter test: keep SMS wording neutral and avoid finance/loan terms.
  return String(message || "")
    .replace(/HELOC CONNECT/gi, "HC")
    .replace(/HELOC/gi, "HC")
    .replace(/mortgage/gi, "review")
    .replace(/loan/gi, "request")
    .replace(/loans/gi, "requests")
    .replace(/cash/gi, "funds")
    .replace(/equity/gi, "property")
    .replace(/refinance/gi, "review")
    .replace(/credit/gi, "profile")
    .replace(/application/gi, "request")
    .replace(/approved/gi, "updated")
    .replace(/approval/gi, "review")
    .replace(/funding/gi, "next step")
    .replace(/funded/gi, "completed")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function sendSms(toPhone: any, message: string) {
  const apiKey = cleanEnv(process.env.TELNYX_API_KEY);
  const from = normalizePhone(cleanEnv(process.env.TELNYX_PHONE_NUMBER));
  const messagingProfileId = cleanEnv(process.env.TELNYX_MESSAGING_PROFILE_ID);
  const to = normalizePhone(toPhone);
  const finalMessage = neutralizeForCarrierTest(String(message || "").trim());

  const configStatus = {
    apiKeyPresent: Boolean(apiKey),
    apiKeyPrefix: apiKey ? apiKey.slice(0, 6) : "missing",
    from,
    to,
    messagingProfileIdPresent: Boolean(messagingProfileId),
  };

  if (!apiKey || !from || !to || !finalMessage) {
    const result = { skipped: true, reason: "Missing TELNYX_API_KEY, TELNYX_PHONE_NUMBER, recipient phone, or message.", configStatus };
    console.error("HELOC_SMS_SKIPPED", JSON.stringify(result));
    return result;
  }

  // V38 carrier-delivery isolation test:
  // Default to sending with the purchased sender number only. The number is already
  // assigned to the HELOC CONNECT SMS profile inside Telnyx, and sending both
  // `from` and `messaging_profile_id` can make troubleshooting harder.
  // Optional Vercel env TELNYX_SEND_MODE can be set to:
  //   from_only   -> { from, to, text }  (default)
  //   profile_only -> { messaging_profile_id, to, text }
  //   both        -> { from, messaging_profile_id, to, text }
  const sendMode = cleanEnv(process.env.TELNYX_SEND_MODE || "from_only").toLowerCase();
  const payload: Record<string, any> = {
    to,
    text: finalMessage.slice(0, 1500),
  };

  if (sendMode === "profile_only" && messagingProfileId) {
    payload.messaging_profile_id = messagingProfileId;
  } else if (sendMode === "both" && messagingProfileId) {
    payload.from = from;
    payload.messaging_profile_id = messagingProfileId;
  } else {
    payload.from = from;
  }

  console.log("HELOC_SMS_ATTEMPT", JSON.stringify({ ...configStatus, sendMode, payloadKeys: Object.keys(payload), textPreview: payload.text.slice(0, 120) }));

  try {
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
      const result = { ok: false, error: json || text, status: res.status, configStatus };
      console.error("HELOC_SMS_TELNYX_ERROR", JSON.stringify(result));
      return result;
    }

    const result = { ok: true, response: json || text, configStatus };
    console.log("HELOC_SMS_SENT", JSON.stringify({ status: res.status, to, from, messageId: json?.data?.id || null }));
    return result;
  } catch (error: any) {
    const result = { ok: false, error: error?.message || String(error), status: "fetch_failed", configStatus };
    console.error("HELOC_SMS_FETCH_ERROR", JSON.stringify(result));
    return result;
  }
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
