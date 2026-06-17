import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const form = await req.formData();
  if (!supabaseAdmin) return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);

  const leadId = String(form.get("leadId") || "");
  if (!leadId) return NextResponse.redirect(new URL("/owner?error=missing_lead_id", req.url), 303);

  // Delete related records first so deletion still works if foreign-key cascade is not enabled.
  await supabaseAdmin.from("lead_documents").delete().eq("lead_id", leadId);
  await supabaseAdmin.from("lead_notes").delete().eq("lead_id", leadId);
  await supabaseAdmin.from("leads").delete().eq("id", leadId);

  return NextResponse.redirect(new URL("/owner?deleted=1", req.url), 303);
}
