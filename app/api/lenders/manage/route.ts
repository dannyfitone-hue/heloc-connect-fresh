import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPassword, newSalt } from "@/lib/lenderAuth";

export async function GET() {
  const s = supabaseAdmin();
  const { data: companies, error: ce } = await s.from("mortgage_companies").select("*").order("created_at", { ascending: false });
  if (ce) return NextResponse.json({ error: ce.message }, { status: 500 });
  const { data: users, error: ue } = await s.from("lender_users").select("id,company_id,name,email,role,is_active,last_login_at,created_at").order("created_at", { ascending: false });
  if (ue) return NextResponse.json({ error: ue.message }, { status: 500 });
  return NextResponse.json({ companies: companies || [], users: users || [] });
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  const s = supabaseAdmin();
  if (b.type === "company") {
    const { data, error } = await s.from("mortgage_companies").insert({
      name: b.name || "",
      contact_name: b.contact_name || "",
      contact_email: b.contact_email || "",
      phone: b.phone || "",
      notes: b.notes || "",
      is_active: true
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ company: data });
  }
  if (b.type === "user") {
    if (!b.company_id || !b.email || !b.password || !b.name) return NextResponse.json({ error: "Company, name, email and password are required." }, { status: 400 });
    const salt = newSalt();
    const { data, error } = await s.from("lender_users").insert({
      company_id: b.company_id,
      name: b.name,
      email: String(b.email).toLowerCase(),
      role: b.role || "lender",
      password_salt: salt,
      password_hash: hashPassword(b.password, salt),
      is_active: true
    }).select("id,company_id,name,email,role,is_active,created_at").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ user: data });
  }
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}
