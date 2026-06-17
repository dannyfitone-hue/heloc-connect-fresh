import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: "Missing Supabase admin client" }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from("lender_users")
    .select("id,lender_name,company_name,email,phone,is_active,created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message, details: error.details || null, hint: error.hint || null }, { status: 500 });

  return NextResponse.json({ lender_users: data || [] }, { headers: { "Cache-Control": "no-store" } });
}
