import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function token() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function num(v: any) {
  return Number(String(v || "").replace(/[^0-9.]/g, "")) || 0;
}

function clean(v: any, max = 240) {
  return String(v || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanLong(v: any) {
  return String(v || "").replace(/\s+/g, " ").trim().slice(0, 2000);
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
    first_name: clean(body.first_name, 80),
    last_name: clean(body.last_name, 80),
    phone: clean(body.phone, 40),
    email: clean(body.email, 160),
    address: cleanLong(body.property_address || body.street_address || ""),
    city: clean(body.city, 120),
    state: clean(body.state, 40),
    zip: clean(body.zip, 20),
    home_value: num(body.home_value),
    mortgage_balance: num(body.mortgage_balance),
    requested_amount: num(body.requested_cash),
    equity_room: num(body.possible_equity_room),
    estimated_payment: num(body.estimated_monthly_payment),
    loans_on_property: clean(body.loans_on_property, 120),
    credit_score: clean(body.credit_score, 120),
    income: num(body.monthly_income),
    mortgage_standing: clean(body.mortgage_good_standing, 120),
    status: "Application Received",
    notes: cleanLong("Submitted from HELOC CONNECT smart calculator")
  };

  const { data, error } = await supabaseAdmin.from("leads").insert(lead).select("id, token").single();

  if (error) {
    return NextResponse.json({
      error: error.message,
      details: error,
      fix: "Run supabase/schema.sql in Supabase SQL Editor. It changes limited varchar fields to text."
    }, { status: 500 });
  }

  return NextResponse.json({ token: data?.token || t, id: data?.id });
}
