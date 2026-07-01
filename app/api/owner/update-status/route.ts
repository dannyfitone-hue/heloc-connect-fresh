import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendStatusSms } from "@/lib/sms";

export async function POST(req: Request) {
  const form = await req.formData();
  const leadId = String(form.get("leadId") || "");
  const status = String(form.get("status") || "");
  const notes = String(form.get("notes") || "");

  if (!supabaseAdmin) {
    return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);
  }

  const update: any = { updated_at: new Date().toISOString() };
  if (status) update.status = status;
  if (notes) update.notes = notes;

  const { data: lead } = await supabaseAdmin.from("leads").select("id, phone, tracking_id, client_token, status").eq("id", leadId).single();
  await supabaseAdmin.from("leads").update(update).eq("id", leadId);
  if (status && lead?.phone) {
    const smsResult = await sendStatusSms(lead.phone, lead.tracking_id, status, lead.client_token);
    try {
      await supabaseAdmin.from("lead_notes").insert({ lead_id: leadId, note: smsResult?.ok ? `Status SMS sent: ${status}` : `Status SMS not sent: ${JSON.stringify(smsResult).slice(0, 500)}` });
    } catch {}
  }
  return NextResponse.redirect(new URL(req.headers.get("referer") || "/owner", req.url), 303);
}
