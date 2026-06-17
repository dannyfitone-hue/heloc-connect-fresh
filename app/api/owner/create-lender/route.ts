import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function clean(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: "Missing Supabase admin client." }, { status: 500 });
    }

    const form = await req.formData();

    const lender_name = clean(form.get("lender_name") || form.get("name") || form.get("agent_name"));
    const company_name = clean(form.get("company_name") || form.get("company"));
    const email = clean(form.get("email") || form.get("login_email")).toLowerCase();
    const phone = clean(form.get("phone"));
    const password = clean(form.get("password") || form.get("login_password") || form.get("create_password"));

    if (!lender_name || !email || !password) {
      return NextResponse.json({ ok: false, error: "Missing lender name, login email, or password." }, { status: 400 });
    }

    const existing = await supabaseAdmin.from("lender_users").select("id").eq("email", email).limit(1);
    if (existing.error) {
      return NextResponse.json({ ok: false, error: existing.error.message, details: existing.error.details || null, hint: existing.error.hint || null }, { status: 500 });
    }

    const existingId = existing.data?.[0]?.id;
    const fullPayload: any = { lender_name, company_name, email, phone, password, is_active: true };
    const minimalPayload: any = { lender_name, company_name, email, phone, password };

    let result = existingId
      ? await supabaseAdmin.from("lender_users").update(fullPayload).eq("id", existingId).select("*").single()
      : await supabaseAdmin.from("lender_users").insert(fullPayload).select("*").single();

    if (result.error && String(result.error.message || "").toLowerCase().includes("is_active")) {
      result = existingId
        ? await supabaseAdmin.from("lender_users").update(minimalPayload).eq("id", existingId).select("*").single()
        : await supabaseAdmin.from("lender_users").insert(minimalPayload).select("*").single();
    }

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error.message, details: result.error.details || null, hint: result.error.hint || null }, { status: 500 });
    }

    const lender: any = result.data || { lender_name, company_name, email, phone };
    delete lender.password;

    return NextResponse.json({ ok: true, lender }, { headers: { "Cache-Control": "no-store" } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Create lender crashed." }, { status: 500 });
  }
}
