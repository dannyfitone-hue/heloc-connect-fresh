import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeLead(lead: any, lenders: any[] = []) {
  const lender = lenders.find((u: any) => String(u.id) === String(lead.assigned_lender_id));
  return {
    ...lead,
    address: lead.address || lead.property_address || "",
    token: lead.token || lead.client_token || "",
    income: lead.income ?? lead.monthly_income ?? 0,
    lender_users: lender || null,
  };
}

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const { data: lendersData, error: lendersError } = await supabaseAdmin
    .from("lender_users")
    .select("*")
    .order("created_at", { ascending: false });

  const lenders = lendersError ? [] : (lendersData || []);

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    return NextResponse.json(
      { error: error.message, details: error.details || null, hint: error.hint || null },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { leads: (data || []).map((lead: any) => normalizeLead(lead, lenders)) },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
  );
}

export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  let leadId = searchParams.get("leadId") || searchParams.get("id") || "";

  if (!leadId) {
    try {
      const body = await req.json();
      leadId = body.leadId || body.id || "";
    } catch {}
  }

  if (!leadId) {
    return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  }

  // Ignore these failures because older Supabase projects may not have these tables.
  try { await supabaseAdmin.from("lead_documents").delete().eq("lead_id", leadId); } catch {}
  try { await supabaseAdmin.from("lead_notes").delete().eq("lead_id", leadId); } catch {}

  const { error } = await supabaseAdmin.from("leads").delete().eq("id", leadId);

  if (error) {
    return NextResponse.json(
      { error: error.message, details: error.details || null, hint: error.hint || null },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, deletedId: leadId });
}
