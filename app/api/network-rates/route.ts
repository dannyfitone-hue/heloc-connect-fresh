import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DEFAULT_NETWORK_RATES } from "@/lib/networkRates";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ rates: DEFAULT_NETWORK_RATES });
  try {
    const { data, error } = await supabaseAdmin
      .from("network_rates")
      .select("rate_key, program, rate, apr, active, sort_order, updated_at")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error || !data?.length) return NextResponse.json({ rates: DEFAULT_NETWORK_RATES });
    return NextResponse.json({ rates: data }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ rates: DEFAULT_NETWORK_RATES });
  }
}
