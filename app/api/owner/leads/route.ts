import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: "Missing Supabase admin client" }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ error: error.message, details: error.details || null, hint: error.hint || null }, { status: 500 });

  return NextResponse.json({ leads: data || [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: "Missing Supabase admin client" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  let leadId = searchParams.get("leadId") || searchParams.get("id") || "";
  if (!leadId) {
    try {
      const body = await req.json();
      leadId = body.leadId || body.id || "";
    } catch {}
  }

  if (!leadId) return NextResponse.json({ error: "Missing leadId" }, { status: 400 });

  await supabaseAdmin.from("lead_documents").delete().eq("lead_id", leadId);
  await supabaseAdmin.from("lead_notes").delete().eq("lead_id", leadId);
  const { error } = await supabaseAdmin.from("leads").delete().eq("id", leadId);

  if (error) return NextResponse.json({ error: error.message, details: error.details || null, hint: error.hint || null }, { status: 500 });

  return NextResponse.json({ ok: true, deletedId: leadId });
}
