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

    // Upsert by email so creating/updating the same lender does not fail silently.
    const { error } = await supabaseAdmin
      .from("lender_users")
      .upsert(payload, { onConflict: "email" });

    if (error) {
      console.error("Create lender failed:", error);
      return NextResponse.redirect(
        new URL(`/owner?error=create_lender_failed&message=${encodeURIComponent(error.message)}`, req.url),
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
