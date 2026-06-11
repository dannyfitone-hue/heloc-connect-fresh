import { NextResponse } from "next/server";
import https from "https";

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

function postJsonWithHttps(urlString: string, headers: Record<string, string>, body: any): Promise<{ statusCode: number; data: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlString);
    const payload = JSON.stringify(body);

    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(payload).toString()
        },
        timeout: 20000
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          let data: any = raw;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch {}
          resolve({ statusCode: res.statusCode || 0, data, raw });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Supabase HTTPS request timed out"));
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
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

  const endpoint = `${supabaseUrl}/rest/v1/leads`;

  try {
    const result = await postJsonWithHttps(endpoint, {
      "apikey": serverKey,
      "Authorization": `Bearer ${serverKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    }, lead);

    if (result.statusCode < 200 || result.statusCode >= 300) {
      return NextResponse.json({
        error: "Supabase insert failed.",
        status: result.statusCode,
        response: result.data,
        sentColumns: Object.keys(lead)
      }, { status: 500 });
    }

    const row = Array.isArray(result.data) ? result.data[0] : result.data;

    return NextResponse.json({
      saved: true,
      id: row?.id || null,
      token: row?.client_token || clientToken,
      client_token: row?.client_token || clientToken,
      tracking_id: row?.tracking_id || lead.tracking_id
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "Node HTTPS request to Supabase failed.",
      message: error?.message || String(error),
      code: error?.code || "",
      hostname: "cpljanwlpclyhshrsfzv.supabase.co",
      endpoint,
      serverKeyStartsWith: serverKey.slice(0, 12),
      sentColumns: Object.keys(lead)
    }, { status: 500 });
  }
}
