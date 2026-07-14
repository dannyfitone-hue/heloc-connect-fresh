import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DEFAULT_NETWORK_RATES } from "@/lib/networkRates";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!supabaseAdmin) return NextResponse.redirect(new URL("/owner?rate_error=supabase_missing", req.url), 303);
  const form = await req.formData();
  const now = new Date().toISOString();
  const rows = DEFAULT_NETWORK_RATES.map((item, index) => ({
    rate_key: item.rate_key,
    program: String(form.get(`${item.rate_key}_program`) || item.program).trim(),
    rate: Number(form.get(`${item.rate_key}_rate`) || item.rate),
    apr: Number(form.get(`${item.rate_key}_apr`) || item.apr),
    active: form.get(`${item.rate_key}_active`) === "on",
    sort_order: index + 1,
    updated_at: now,
  }));
  const { error } = await supabaseAdmin.from("network_rates").upsert(rows, { onConflict: "rate_key" });
  if (error) return NextResponse.redirect(new URL(`/owner?rate_error=${encodeURIComponent(error.message)}`, req.url), 303);
  return NextResponse.redirect(new URL("/owner?rates_saved=1", req.url), 303);
}
