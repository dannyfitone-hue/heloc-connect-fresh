import { NextResponse } from "next/server";
import https from "https";

function cleanUrl(v: any) {
  return String(v || "").trim().replace(/\/rest\/v1\/?$/i, "");
}
function cleanKey(v: any) {
  return String(v || "").replace(/[\r\n\s]/g, "").trim();
}

function getWithHttps(urlString: string, headers: Record<string, string>): Promise<{ statusCode: number; raw: string; data: any }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlString);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers,
      timeout: 20000
    }, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => raw += chunk);
      res.on("end", () => {
        let data: any = raw;
        try { data = raw ? JSON.parse(raw) : null; } catch {}
        resolve({ statusCode: res.statusCode || 0, raw, data });
      });
    });
    req.on("timeout", () => req.destroy(new Error("Supabase HTTPS request timed out")));
    req.on("error", reject);
    req.end();
  });
}

export async function GET() {
  const supabaseUrl = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serverKey = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY);
  const endpoint = `${supabaseUrl}/rest/v1/leads?select=id,tracking_id,client_token,first_name,property_address,requested_cash,status&limit=1`;

  try {
    const result = await getWithHttps(endpoint, {
      "apikey": serverKey,
      "Authorization": `Bearer ${serverKey}`,
      "Content-Type": "application/json"
    });

    return NextResponse.json({
      ok: result.statusCode >= 200 && result.statusCode < 300,
      status: result.statusCode,
      serverKeyStartsWith: serverKey.slice(0, 12),
      data: result.data
    }, { status: result.statusCode >= 200 && result.statusCode < 300 ? 200 : 500 });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || String(error),
      code: error?.code || "",
      endpoint,
      serverKeyStartsWith: serverKey.slice(0, 12)
    }, { status: 500 });
  }
}
