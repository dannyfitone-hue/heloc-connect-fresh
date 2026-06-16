import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const form = await req.formData();
  if (!supabaseAdmin) return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);

  const leadId = String(form.get("leadId") || "");
  if (!leadId) return NextResponse.redirect(new URL("/owner?error=missing_lead", req.url), 303);

  // Older deployments may not have these tables, so these deletes are best-effort.
  try { await supabaseAdmin.from("lead_documents").delete().eq("lead_id", leadId); } catch {}
  try { await supabaseAdmin.from("lead_notes").delete().eq("lead_id", leadId); } catch {}

  const { error } = await supabaseAdmin.from("leads").delete().eq("id", leadId);
  if (error) {
    console.error("Owner delete lead failed:", error.message);
    return NextResponse.redirect(new URL("/owner?error=delete_failed", req.url), 303);
  }

  return NextResponse.redirect(new URL("/owner?deleted=1", req.url), 303);
}
