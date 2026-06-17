import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    if (!supabaseAdmin) {
      return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);
    }

    const lender_name = clean(form.get("lender_name") || form.get("name") || form.get("agent_name"));
    const company_name = clean(form.get("company_name") || form.get("company"));
    const email = clean(form.get("email") || form.get("login_email")).toLowerCase();
    const phone = clean(form.get("phone"));
    const password = clean(form.get("password") || form.get("login_password") || form.get("create_password"));

    if (!lender_name || !email || !password) {
      return NextResponse.redirect(new URL("/owner?error=lender_missing_fields", req.url), 303);
    }

    const payload: any = {
      lender_name,
      company_name,
      email,
      phone,
      password,
      is_active: true,
    };

    // First check if this email already exists. Use limit(1) to avoid maybeSingle errors if duplicates exist.
    const existing = await supabaseAdmin
      .from("lender_users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (existing.error) {
      console.error("Create lender lookup failed:", existing.error);
      return NextResponse.redirect(
        new URL(`/owner?error=create_lender_lookup_failed&message=${encodeURIComponent(existing.error.message)}`, req.url),
        303
      );
    }

    const existingId = existing.data?.[0]?.id;
    const result = existingId
      ? await supabaseAdmin.from("lender_users").update(payload).eq("id", existingId).select("id,email,lender_name,company_name").single()
      : await supabaseAdmin.from("lender_users").insert(payload).select("id,email,lender_name,company_name").single();

    if (result.error) {
      console.error("Create lender failed:", result.error);

      // If is_active column is missing in an older schema, retry without it.
      const fallbackPayload = { lender_name, company_name, email, phone, password };
      const retry = existingId
        ? await supabaseAdmin.from("lender_users").update(fallbackPayload).eq("id", existingId).select("id,email,lender_name,company_name").single()
        : await supabaseAdmin.from("lender_users").insert(fallbackPayload).select("id,email,lender_name,company_name").single();

      if (retry.error) {
        console.error("Create lender retry failed:", retry.error);
        return NextResponse.redirect(
          new URL(`/owner?error=create_lender_failed&message=${encodeURIComponent(retry.error.message)}`, req.url),
          303
        );
      }

      return NextResponse.redirect(new URL(`/owner?created_lender=1&lender_email=${encodeURIComponent(email)}`, req.url), 303);
    }

    return NextResponse.redirect(new URL(`/owner?created_lender=1&lender_email=${encodeURIComponent(email)}`, req.url), 303);
  } catch (err: any) {
    console.error("Create lender crashed:", err);
    return NextResponse.redirect(
      new URL(`/owner?error=create_lender_crashed&message=${encodeURIComponent(err?.message || "Unknown error")}`, req.url),
      303
    );
  }
}
