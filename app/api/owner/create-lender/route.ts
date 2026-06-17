import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    if (!supabaseAdmin) {
      return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);
    }

    const lender_name = String(form.get("lender_name") || "").trim();
    const company_name = String(form.get("company_name") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const phone = String(form.get("phone") || "").trim();
    const password = String(form.get("password") || "").trim();

    if (!lender_name || !email || !password) {
      return NextResponse.redirect(new URL("/owner?error=lender_missing_fields", req.url), 303);
    }

    const payload = {
      lender_name,
      company_name,
      email,
      phone,
      password,
      is_active: true,
    };

    // Do not use upsert because Supabase may not have email set as a unique constraint.
    // Safer: if this email already exists, update it. If not, insert a new lender user.
    const existing = await supabaseAdmin
      .from("lender_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing.error) {
      console.error("Create lender lookup failed:", existing.error);
      return NextResponse.redirect(
        new URL(`/owner?error=create_lender_lookup_failed&message=${encodeURIComponent(existing.error.message)}`, req.url),
        303
      );
    }

    let result;
    if (existing.data?.id) {
      result = await supabaseAdmin
        .from("lender_users")
        .update(payload)
        .eq("id", existing.data.id);
    } else {
      result = await supabaseAdmin
        .from("lender_users")
        .insert(payload);
    }

    if (result.error) {
      console.error("Create lender failed:", result.error);
      return NextResponse.redirect(
        new URL(`/owner?error=create_lender_failed&message=${encodeURIComponent(result.error.message)}`, req.url),
        303
      );
    }

    return NextResponse.redirect(new URL("/owner?created_lender=1", req.url), 303);
  } catch (err: any) {
    console.error("Create lender crashed:", err);
    return NextResponse.redirect(
      new URL(`/owner?error=create_lender_crashed&message=${encodeURIComponent(err?.message || "Unknown error")}`, req.url),
      303
    );
  }
}
