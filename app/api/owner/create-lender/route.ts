import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function hashPassword(password: string, salt: string) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

export async function POST(req: Request) {
  const form = await req.formData();

  if (!supabaseAdmin) {
    return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);
  }

  const name = String(form.get("lender_name") || form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "").trim();
  const companyText = String(form.get("company_name") || form.get("company") || "").trim();

  if (!name || !email || !password) {
    return NextResponse.redirect(new URL("/owner?error=lender_missing_fields", req.url), 303);
  }

  // REAL lender_users schema confirmed by Supabase errors:
  // id, company_id, name, email, password_hash, password_salt
  // Do NOT send lender_name, company_name, phone, password, or is_active.

  let company_id: string | null = null;

  if (companyText) {
    const existingCompany = await supabaseAdmin
      .from("mortgage_companies")
      .select("id")
      .ilike("name", companyText)
      .limit(1);

    if (existingCompany.error) {
      console.error("Mortgage company lookup failed:", existingCompany.error);
      return NextResponse.redirect(
        new URL(`/owner?error=company_lookup_failed&message=${encodeURIComponent(existingCompany.error.message)}`, req.url),
        303
      );
    }

    if (existingCompany.data?.[0]?.id) {
      company_id = existingCompany.data[0].id;
    } else {
      const createdCompany = await supabaseAdmin
        .from("mortgage_companies")
        .insert({
          name: companyText,
          contact_name: name,
          contact_email: email
        })
        .select("id")
        .single();

      if (createdCompany.error) {
        console.error("Mortgage company create failed:", createdCompany.error);
        return NextResponse.redirect(
          new URL(`/owner?error=company_create_failed&message=${encodeURIComponent(createdCompany.error.message)}`, req.url),
          303
        );
      }

      company_id = createdCompany.data?.id || null;
    }
  }

  const password_salt = randomBytes(16).toString("hex");
  const password_hash = hashPassword(password, password_salt);

  const lender = {
    name,
    email,
    company_id,
    password_hash,
    password_salt
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
