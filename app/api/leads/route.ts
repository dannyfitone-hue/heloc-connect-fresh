import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function token() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function num(v: any) {
  return Number(String(v || "").replace(/[^0-9.]/g, "")) || 0;
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({
      error: "Supabase is not connected. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel."
    }, { status: 500 });
  }

  const t = token();

  const lead = {
    token: t,
    first_name: String(body.first_name || ""),
    last_name: String(body.last_name || ""),
    phone: String(body.phone || ""),
    email: String(body.email || ""),
    address: String(body.property_address || body.street_address || ""),
    city: String(body.city || ""),
    state: String(body.state || ""),
    zip: String(body.zip || ""),
    home_value: num(body.home_value),
    mortgage_balance: num(body.mortgage_balance),
    requested_amount: num(body.requested_cash),
    equity_room: num(body.possible_equity_room),
    estimated_payment: num(body.estimated_monthly_payment),
    loans_on_property: String(body.loans_on_property || ""),
    credit_score: String(body.credit_score || ""),
    income: num(body.monthly_income),
    mortgage_standing: String(body.mortgage_good_standing || ""),
    status: "Application Received",
    notes: "Submitted from HELOC CONNECT smart calculator"
  };

  const { data, error } = await supabaseAdmin.from("leads").insert(lead).select("id, token").single();

  if (error) {
    return NextResponse.json({
      error: error.message,
      details: error,
      fix: "Make sure the Supabase leads table exists. Run supabase/schema.sql in Supabase SQL Editor."
    }, { status: 500 });
  }

  return NextResponse.json({ token: data?.token || t, id: data?.id });
}
