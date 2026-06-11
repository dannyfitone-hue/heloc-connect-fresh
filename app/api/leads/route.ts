import { NextResponse } from "next/server";

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

async function insertLead(endpoint: string, serviceKey: string, lead: any) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(lead),
    cache: "no-store"
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  return { res, data };
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

  if (!serviceKey || !serviceKey.startsWith("sb_secret_")) {
    return NextResponse.json({
      error: "SUPABASE_SERVICE_ROLE_KEY is missing or wrong.",
      currentStartsWith: serviceKey ? serviceKey.slice(0, 12) : "missing"
    }, { status: 500 });
  }

  const clientToken = makeToken();
  const address = cleanLong(body.property_address || body.street_address || "");

  // This object matches the EXISTING live Supabase table shown in your screenshot.
  const liveLead = {
    tracking_id: trackingId(),
    client_token: clientToken,
    first_name: clean(body.first_name, 80),
    last_name: clean(body.last_name, 80),
    phone: clean(body.phone, 40),
    email: clean(body.email, 160),
    property_address: address,
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

  const endpoint = `${supabaseUrl}/rest/v1/leads`;

  try {
    const first = await insertLead(endpoint, serviceKey, liveLead);

    if (first.res.ok) {
      const row = Array.isArray(first.data) ? first.data[0] : first.data;
      return NextResponse.json({
        token: row?.client_token || clientToken,
        client_token: row?.client_token || clientToken,
        id: row?.id || null,
        saved: true
      });
    }

    return NextResponse.json({
      error: "Supabase insert failed.",
      status: first.res.status,
      response: first.data,
      endpoint,
      sentColumns: Object.keys(liveLead)
    }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({
      error: "Server could not reach Supabase REST endpoint.",
      message: error?.message || "fetch failed",
      endpoint,
      urlUsed: supabaseUrl,
      serviceKeyStartsWith: serviceKey.slice(0, 12)
    }, { status: 500 });
  }
}
