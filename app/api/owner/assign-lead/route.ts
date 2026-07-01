import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendApplicationSms } from "@/lib/sms";

export async function POST(req: Request) {
  const form = await req.formData();
  if (!supabaseAdmin) return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);

  const leadId = String(form.get("leadId") || "");
  const lenderId = String(form.get("lenderId") || "");

  let assigned_company = "";
  let assigned_agent = "";

  if (lenderId) {
    const { data: lender } = await supabaseAdmin.from("lender_users").select("*").eq("id", lenderId).single();
    assigned_company = lender?.company_name || "";
    assigned_agent = lender?.lender_name || "";
  }

  const { data: updatedLead } = await supabaseAdmin
    .from("leads")
    .update({
      assigned_lender_id: lenderId || null,
      assigned_company,
      assigned_agent,
      status: lenderId ? "Company Matched" : "Application Received",
      updated_at: new Date().toISOString()
    })
    .eq("id", leadId)
    .select("id, phone, tracking_id, client_token, first_name, last_name, status, assigned_company")
    .single();

  if (lenderId && updatedLead?.phone) {
    const smsResult = await sendApplicationSms("company_matched", updatedLead, { status: "Company Matched", companyName: assigned_company });
    try { await supabaseAdmin.from("lead_notes").insert({ lead_id: leadId, note: smsResult?.ok ? "Company matched SMS sent automatically." : `Company matched SMS not sent: ${JSON.stringify(smsResult).slice(0, 500)}` }); } catch {}
  }

  return NextResponse.redirect(new URL("/owner?assigned=1", req.url), 303);
}
