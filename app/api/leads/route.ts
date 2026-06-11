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
  const serverKey = cleanKey(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY
  );

  if (!supabaseUrl || !serverKey) {
    return NextResponse.json({
      error: "Missing Supabase URL or server key.",
      supabaseUrlPresent: Boolean(supabaseUrl),
      serverKeyPresent: Boolean(serverKey)
    }, { status: 500 });
  }

  const clientToken = makeToken();

  // Matches the REAL live Supabase columns shown in your table:
  // requested_cash, not requested_amount.
  // assigned_lender, not assigned_lender_id.
  // Avoids inserting columns that may not exist.
  const lead = {
    tracking_id: trackingId(),
    client_token: clientToken,
    first_name: clean(body.first_name, 80),
    last_name: clean(body.last_name, 80),
    phone: clean(body.phone, 40),
    email: clean(body.email, 160),
    property_address: cleanLong(body.property_address || body.street_address || ""),
    home_value: num(body.home_value),
    credit_score: clean(body.credit_score, 120),
    monthly_income: num(body.monthly_income),
    requested_cash: num(body.requested_cash || body.requested_amount),
    loan_purpose: clean(body.loan_purpose || body.purpose || "HELOC / Refinance Options", 240),
    lead_source: "website",
    status: "Application Received",
    funded_amount: 0
  };

  try {
    const supabase = createClient(supabaseUrl, serverKey, {
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
      error: "Lead insert crashed.",
      message: error?.message || String(error),
      supabaseUrl,
      serverKeyStartsWith: serverKey.slice(0, 12),
      sentColumns: Object.keys(lead)
    }, { status: 500 });
  }
}
