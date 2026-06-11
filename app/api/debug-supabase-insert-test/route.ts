import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function cleanUrl(v: any) {
  return String(v || "").trim().replace(/\/rest\/v1\/?$/i, "");
}

function cleanKey(v: any) {
  return String(v || "").replace(/[\r\n\s]/g, "").trim();
}

export async function GET() {
  const supabaseUrl = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serverKey = cleanKey(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    const supabase = createClient(supabaseUrl, serverKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await supabase
      .from("leads")
      .select("id, client_token, first_name, property_address")
      .limit(1);

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        serverKeyStartsWith: serverKey.slice(0, 12)
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      canReadLeads: true,
      serverKeyStartsWith: serverKey.slice(0, 12),
      sample: data
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      crashed: true,
      message: error?.message || String(error),
      serverKeyStartsWith: serverKey.slice(0, 12),
      note: "If this says fetch failed, replace SUPABASE_SERVICE_ROLE_KEY with Legacy service_role JWT key."
    }, { status: 500 });
  }
}
