import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const form = await req.formData();
  if (!supabaseAdmin) return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);

  const leadId = String(form.get("leadId") || "");
  if (leadId) await supabaseAdmin.from("leads").delete().eq("id", leadId);

  return NextResponse.redirect(new URL("/owner?deleted=1", req.url), 303);
}
