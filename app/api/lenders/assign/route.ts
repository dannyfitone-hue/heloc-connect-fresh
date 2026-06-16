import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export async function POST(req: NextRequest) {
  const b = await req.json();
  const s = supabaseAdmin();
  const { error } = await s.from("leads").update({
    assigned_company_id: b.companyId || null,
    assigned_user_id: b.userId || null,
    assigned_lender: b.companyName || "",
    assigned_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq("id", b.leadId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await s.from("lead_notes").insert({ lead_id: b.leadId, note: `Assigned to ${b.companyName || "mortgage company"}${b.userName ? " / " + b.userName : ""}` });
  return NextResponse.json({ ok: true });
}
