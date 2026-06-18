import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();

  if (!supabaseAdmin) {
    return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);
  }

  const lender_name = String(form.get("lender_name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const phone = String(form.get("phone") || "").trim();
  const password = String(form.get("password") || "").trim();

  if (!lender_name || !email || !password) {
    return NextResponse.redirect(new URL("/owner?error=lender_missing_fields", req.url), 303);
  }

  // lender_users table does NOT have company_name.
  // Sending company_name makes Supabase reject lender creation.
  const lender = {
    lender_name,
    email,
    phone,
    password,
    is_active: true
  };

  const { error } = await supabaseAdmin.from("lender_users").insert(lender);

  if (error) {
    console.error("Create lender failed:", error);
    return NextResponse.redirect(
      new URL(`/owner?error=create_lender_failed&message=${encodeURIComponent(error.message)}`, req.url),
      303
    );
  }

  return NextResponse.redirect(new URL("/owner?created_lender=1", req.url), 303);
}
