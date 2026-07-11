import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-z0-9]{20,80}$/i.test(token || "")) return NextResponse.json({ error: "Invalid portal link" }, { status: 400 });
  const s = supabaseAdmin();
  const { data: lead, error } = await s.from("leads")
    .select("id,tracking_id,client_token,first_name,status,created_at,updated_at")
    .eq("client_token", token).single();
  if (error || !lead) return NextResponse.json({ error: "Lead not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const { data: documents } = await s.from("lead_documents")
    .select("id,document_type,note,status,file_name,created_at,uploaded_at")
    .eq("lead_id", lead.id).order("created_at", { ascending: false });
  return NextResponse.json({ lead, documents: documents || [] }, { headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" } });
}
