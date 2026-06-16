import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const s = supabaseAdmin();

  const { data: lead, error } = await s
    .from("leads")
    .select("*")
    .eq("client_token", token)
    .single();

  if (error || !lead) {
    return NextResponse.json(
      { error: "Lead not found" },
      { status: 404, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const { data: documents } = await s
    .from("lead_documents")
    .select("*")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false });

  const { data: notes } = await s
    .from("lead_notes")
    .select("*")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(
    { lead, documents: documents || [], notes: notes || [] },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
