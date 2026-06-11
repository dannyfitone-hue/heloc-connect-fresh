import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  if (!supabaseAdmin) {
    return NextResponse.redirect(new URL("/lender-login?error=supabase", req.url), 303);
  }

  const { data: user } = await supabaseAdmin
    .from("lender_users")
    .select("*")
    .eq("email", email)
    .eq("is_active", true)
    .single();

  const ownerPass = process.env.OWNER_DASHBOARD_PASSWORD || "";
  const globalLenderPass = process.env.LENDER_DASHBOARD_PASSWORD || "";

  if (user && user.password === password) {
    const res = NextResponse.redirect(new URL("/lender", req.url), 303);
    res.cookies.set("hc_lender_user_id", user.id, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
    res.cookies.set("hc_lender_name", user.lender_name || user.email, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
    res.cookies.set("hc_lender_auth", "database_user", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
    return res;
  }

  if (password && ((ownerPass && password === ownerPass) || (globalLenderPass && password === globalLenderPass))) {
    const res = NextResponse.redirect(new URL("/lender", req.url), 303);
    res.cookies.set("hc_lender_auth", password, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
    return res;
  }

  return NextResponse.redirect(new URL("/lender-login?error=1", req.url), 303);
}
