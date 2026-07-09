import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLenderSession } from "@/lib/lenderAuth";
import { clientStatuses } from "@/lib/status";
import { sendStatusSms } from "@/lib/sms";
import { sendStatusEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getLenderSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const s = supabaseAdmin();

  if (!b.leadId) return NextResponse.json({ error: "Missing lead ID." }, { status: 400 });

  const incomingStatus = String(b.status || "").trim();
  if (!clientStatuses.includes(incomingStatus)) {
    return NextResponse.json({ error: "Invalid status selected." }, { status: 400 });
  }

  const { data: lead, error: leadError } = await s
    .from("leads")
    .select("id,tracking_id,assigned_company_id,assigned_user_id,status,phone,email,first_name,last_name,client_token")
    .eq("id", b.leadId)
    .single();

  if (leadError || !lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const allowedCompany = lead.assigned_company_id === user.company_id;
  const allowedAgent = user.role !== "agent" || lead.assigned_user_id === user.id;

  if (!allowedCompany || !allowedAgent) {
    return NextResponse.json({ error: "Lead not assigned to this account." }, { status: 403 });
  }

  const update: Record<string, any> = {
    status: incomingStatus,
    updated_at: new Date().toISOString()
  };

  if (b.fundedAmount !== undefined) update.funded_amount = Number(b.fundedAmount || 0);
  if (incomingStatus === "Funded") update.funded_at = new Date().toISOString();

  const { data: updatedLead, error } = await s
    .from("leads")
    .update(update)
    .eq("id", b.leadId)
    .select("id,tracking_id,status,funded_amount,updated_at,client_token")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const noteLines = [`${user.name} (${user.role}) updated client status to: ${incomingStatus}`];
  if (b.note) noteLines.push(`Note: ${b.note}`);
  if (b.fundedAmount !== undefined && Number(b.fundedAmount || 0) > 0) noteLines.push(`Funded amount: $${Number(b.fundedAmount || 0).toLocaleString()}`);

  await s.from("lead_notes").insert({
    lead_id: b.leadId,
    note: noteLines.join("\n")
  });

  const smsResult = await sendStatusSms((lead as any).phone,(lead as any).tracking_id,incomingStatus,(lead as any).client_token);
  const emailResult = await sendStatusEmail(lead, incomingStatus);
  try {
    await s.from("lead_notes").insert([
      { lead_id: b.leadId, note: (smsResult as any)?.ok ? `Status SMS sent: ${incomingStatus}` : `Status SMS not sent: ${JSON.stringify(smsResult).slice(0, 500)}` },
      { lead_id: b.leadId, note: (emailResult as any)?.ok ? `Status email sent: ${incomingStatus}` : `Status email not sent: ${JSON.stringify(emailResult).slice(0, 500)}` }
    ]);
  } catch {}

  return NextResponse.json({ ok: true, lead: updatedLead }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
