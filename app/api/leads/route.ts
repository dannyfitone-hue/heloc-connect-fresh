import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://cpljanwlpclyhshrsfzv.supabase.co";

function makeToken() {
  return Math.random().toString(36).slice(2, 18) + Date.now().toString(36);
}

function trackingId() {
  return "EQ-" + Math.floor(1000 + Math.random() * 9000);
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

function cleanUrl(v: any) {
  const raw = String(v || "").trim();
  return raw.replace(/\/rest\/v1\/?$/i, "") || FALLBACK_SUPABASE_URL;
}

function cleanKey(v: any) {
  return String(v || "").replace(/[\r\n\s]/g, "").trim();
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const supabaseUrl = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({
      error: "Missing Supabase URL or service key.",
      supabaseUrlPresent: Boolean(supabaseUrl),
      serviceKeyPresent: Boolean(serviceKey)
    }, { status: 500 });
  }

  if (!serviceKey.startsWith("sb_secret_")) {
    return NextResponse.json({
      error: "SUPABASE_SERVICE_ROLE_KEY must start with sb_secret_.",
      currentStartsWith: serviceKey.slice(0, 12)
    }, { status: 500 });
  }

  const clientToken = makeToken();

  const lead = {
    tracking_id: trackingId(),
    client_token: clientToken,
    first_name: clean(body.first_name, 80),
    last_name: clean(body.last_name, 80),
    phone: clean(body.phone, 40),
    email: clean(body.email, 160),
    property_address: cleanLong(body.property_address || body.street_address || ""),
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
    monthly_income: num(body.monthly_income),
    mortgage_standing: clean(body.mortgage_good_standing, 120),
    status: "Application Received",
    notes: "Submitted from HELOC CONNECT smart calculator"
  };

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await supabase
      .from("leads")
      .insert(lead)
      .select("id, client_token, tracking_id")
      .single();

    if (error) {
      return NextResponse.json({
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        sentColumns: Object.keys(lead)
      }, { status: 500 });
    }

    return NextResponse.json({
      saved: true,
      id: data?.id || null,
      token: data?.client_token || clientToken,
      client_token: data?.client_token || clientToken,
      tracking_id: data?.tracking_id || lead.tracking_id
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Supabase JS insert crashed before returning a database response.",
      message: error?.message || String(error),
      supabaseUrl
    }, { status: 500 });
  }
}
