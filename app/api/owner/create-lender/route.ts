import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const form = await req.formData();
  if (!supabaseAdmin) return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);

  const lender = {
    lender_name: String(form.get("lender_name") || "").trim(),
    company_name: String(form.get("company_name") || "").trim(),
    email: String(form.get("email") || "").trim().toLowerCase(),
    phone: String(form.get("phone") || "").trim(),
    password: String(form.get("password") || "").trim(),
    is_active: true
  };

  if (!lender.lender_name || !lender.email || !lender.password) {
    return NextResponse.redirect(new URL("/owner?error=lender_missing_fields", req.url), 303);
  }

  await supabaseAdmin.from("lender_users").insert(lender);
  return NextResponse.redirect(new URL("/owner?created_lender=1", req.url), 303);
}
