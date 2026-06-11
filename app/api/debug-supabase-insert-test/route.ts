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
  const serviceKey = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
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
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      canReadLeads: true,
      sample: data
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      crashed: true,
      message: error?.message || String(error)
    }, { status: 500 });
  }
}
