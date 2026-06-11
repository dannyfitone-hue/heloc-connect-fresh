import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const form = await req.formData();
  const leadId = String(form.get("leadId") || "");
  const status = String(form.get("status") || "");
  const notes = String(form.get("notes") || "");

  if (!supabaseAdmin) {
    return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);
  }

  const update: any = { updated_at: new Date().toISOString() };
  if (status) update.status = status;
  if (notes) update.notes = notes;

  await supabaseAdmin.from("leads").update(update).eq("id", leadId);
  return NextResponse.redirect(new URL(req.headers.get("referer") || "/owner", req.url), 303);
}
