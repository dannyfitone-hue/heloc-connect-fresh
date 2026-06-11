import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

  await supabaseAdmin
    .from("leads")
    .update({
      assigned_lender_id: lenderId || null,
      assigned_company,
      assigned_agent,
      status: lenderId ? "Company Matched" : "Application Received",
      updated_at: new Date().toISOString()
    })
    .eq("id", leadId);

  return NextResponse.redirect(new URL("/owner?assigned=1", req.url), 303);
}
