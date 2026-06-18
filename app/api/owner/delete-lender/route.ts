import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();
  if (!supabaseAdmin) return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);

  const lenderId = String(form.get("lenderId") || "");
  if (!lenderId) return NextResponse.redirect(new URL("/owner?error=missing_lender_id", req.url), 303);

  await supabaseAdmin.from("leads").update({ assigned_lender_id: null, assigned_agent: null, assigned_company: null, updated_at: new Date().toISOString() }).eq("assigned_lender_id", lenderId);
  const { error } = await supabaseAdmin.from("lender_users").delete().eq("id", lenderId);

  if (error) {
    console.error("Delete lender failed:", error);
    return NextResponse.redirect(new URL(`/owner?error=delete_lender_failed&message=${encodeURIComponent(error.message)}`, req.url), 303);
  }

  return NextResponse.redirect(new URL("/owner?deleted_lender=1", req.url), 303);
}
