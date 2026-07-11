import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeSms } from "@/lib/sms";
import { sendWelcomeEmail, sendAdminLeadEmail } from "@/lib/email";
import { rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  const rl = rateLimit(req, "lead-submit", 12, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }


  const requiredPhone = clean(body.phone, 40);
  const requiredEmail = clean(body.email, 160).toLowerCase();
  const phoneDigits = requiredPhone.replace(/\D/g, "");
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requiredEmail);
  if (phoneDigits.length < 10 || !emailValid) {
    return NextResponse.json({ error: "A valid phone number and email address are required." }, { status: 400 });
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
      currentStartsWith: "invalid"
    }, { status: 500 });
  }

  const clientToken = makeToken();

  const extraNotes = [
    `Selected product: ${clean(body.selected_product, 80)}`,
    `Main goal: ${clean(body.main_goal, 160)}`,
    `Use of funds: ${clean(body.cash_use, 160)}`,
    `Credit card payment history: ${clean(body.credit_card_payments, 240)}`,
    `Bankruptcy last 10 years: ${clean(body.bankruptcy_10_years, 120)}`,
    `SMS consent: ${clean(body.sms_consent, 40) || "not selected"}`,
    `Current interest rate: ${clean(body.current_interest_rate, 40)}`,
    body.co_first_name || body.co_last_name ? `Co-owner: ${clean(body.co_first_name, 80)} ${clean(body.co_last_name, 80)} | ${clean(body.co_phone, 80)} | ${clean(body.co_email, 160)} | credit: ${clean(body.co_credit_score, 80)} | bankruptcy: ${clean(body.co_bankruptcy_10_years, 120)} | card payments: ${clean(body.co_credit_card_payments, 180)}` : "Co-owner: not added"
  ].join("\n");

  const lead = {
    tracking_id: trackingId(),
    client_token: clientToken,
    first_name: clean(body.first_name, 80),
    last_name: clean(body.last_name, 80),
    phone: requiredPhone,
    email: requiredEmail,
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
    notes: cleanLong(`Submitted from HELOC CONNECT smart calculator\n${extraNotes}`)
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

    console.log("HELOC_LEAD_SAVED_BEFORE_SMS", JSON.stringify({ id: data?.id, phone: lead.phone, tracking_id: data?.tracking_id || lead.tracking_id }));
    const fullLead = { ...lead, id: data?.id, client_token: data?.client_token || clientToken, tracking_id: data?.tracking_id || lead.tracking_id };

    const smsResult = await sendWelcomeSms(fullLead);
    console.log("HELOC_WELCOME_SMS_RESULT", JSON.stringify(smsResult));

    const welcomeEmailResult = await sendWelcomeEmail(fullLead);
    console.log("HELOC_WELCOME_EMAIL_RESULT", JSON.stringify(welcomeEmailResult));

    const adminEmailResult = await sendAdminLeadEmail(fullLead);
    console.log("HELOC_ADMIN_LEAD_EMAIL_RESULT", JSON.stringify(adminEmailResult));

    try {
      await supabase.from("lead_notes").insert([
        {
          lead_id: data?.id,
          note: (smsResult as any)?.ok ? "Welcome SMS sent automatically." : `Welcome SMS not sent: ${JSON.stringify(smsResult).slice(0, 500)}`
        },
        {
          lead_id: data?.id,
          note: (welcomeEmailResult as any)?.ok ? "Welcome email sent automatically with client portal link." : `Welcome email not sent: ${JSON.stringify(welcomeEmailResult).slice(0, 500)}`
        },
        {
          lead_id: data?.id,
          note: (adminEmailResult as any)?.ok ? "Admin new-lead email sent automatically." : `Admin new-lead email not sent: ${JSON.stringify(adminEmailResult).slice(0, 500)}`
        }
      ]);
    } catch {}

    return NextResponse.json({
      saved: true,
      id: data?.id || null,
      token: data?.client_token || clientToken,
      client_token: data?.client_token || clientToken,
      tracking_id: data?.tracking_id || lead.tracking_id,
      sms: smsResult,
      welcome_email: welcomeEmailResult,
      admin_email: adminEmailResult
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Supabase JS insert crashed before returning a database response.",
      message: error?.message || String(error),
      supabaseUrl
    }, { status: 500 });
  }
}
