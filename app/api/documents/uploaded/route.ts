import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const b = await req.json();
  const documentId = String(b.documentId || "");
  const clientToken = String(b.clientToken || "");
  const filePath = String(b.filePath || "");
  const fileName = String(b.fileName || "").replace(/[\\/\r\n]/g, "_").slice(0, 180);
  if (!documentId || !clientToken || !filePath || !fileName) return NextResponse.json({ error: "Missing upload information" }, { status: 400 });
  if (!filePath.startsWith(`${clientToken}/`)) return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
  const s = supabaseAdmin();
  const { data: doc } = await s.from("lead_documents").select("id,lead_id,document_type").eq("id", documentId).single();
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  const { data: lead } = await s.from("leads").select("id").eq("id", doc.lead_id).eq("client_token", clientToken).single();
  if (!lead) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { error } = await s.from("lead_documents").update({ status: "Uploaded", file_path: filePath, file_name: fileName, uploaded_at: new Date().toISOString() }).eq("id", documentId).eq("lead_id", lead.id);
  if (error) return NextResponse.json({ error: "Upload update failed" }, { status: 500 });
  await s.from("lead_notes").insert({ lead_id: lead.id, note: `Client uploaded: ${doc.document_type}` });
  return NextResponse.json({ ok: true });
}
