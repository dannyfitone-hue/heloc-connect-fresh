import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSms, normalizePhone } from "@/lib/sms";

export const dynamic = "force-dynamic";

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function shortJson(value: any) {
  try { return JSON.stringify(value).slice(0, 700); } catch { return String(value).slice(0, 700); }
}

async function logSms(params: { leadId?: string; to: string; message: string; result: any; triggeredBy?: string }) {
  const { leadId, to, message, result, triggeredBy = "Owner" } = params;
  const status = result?.ok ? "sent" : result?.skipped ? "skipped" : "failed";
  const providerMessageId = result?.response?.data?.id || result?.messageId || null;

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("sms_logs").insert({
        lead_id: leadId || null,
        to_phone: to,
        message_body: message,
        message_type: "manual_owner_sms",
        delivery_status: status,
        provider_message_id: providerMessageId,
        triggered_by: triggeredBy,
        provider_response: result || null,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // sms_logs is optional until the SQL patch is applied.
    }

    if (leadId) {
      try {
        const note = result?.ok
          ? `Manual SMS sent by ${triggeredBy} to ${to}: ${message}`
          : `Manual SMS failed by ${triggeredBy} to ${to}: ${shortJson(result)}`;
        await supabaseAdmin.from("lead_notes").insert({ lead_id: leadId, note });
      } catch (error) {}
    }
  }
}

export async function POST(req: Request) {
  const form = await req.formData();
  const phone = normalizePhone(clean(form.get("phone")));
  const message = clean(form.get("message"));
  const leadId = clean(form.get("leadId"));
  const returnTo = clean(form.get("returnTo")) || "/owner";

  const url = new URL(returnTo, req.url);

  if (!phone || !message) {
    url.searchParams.set("instant_sms", "missing");
    return NextResponse.redirect(url, 303);
  }

  const result = await sendSms(phone, message);
  await logSms({ leadId: leadId || undefined, to: phone, message, result, triggeredBy: "Owner" });

  const sent = Boolean((result as any)?.ok);
  url.searchParams.set("instant_sms", sent ? "sent" : "failed");
  if (!sent) url.searchParams.set("sms_error", encodeURIComponent(shortJson(result)));
  return NextResponse.redirect(url, 303);
}
