import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "").trim();

    if (!supabaseAdmin) {
      return NextResponse.redirect(new URL("/lender-login?error=supabase", req.url), 303);
    }

    if (!email || !password) {
      return NextResponse.redirect(new URL("/lender-login?error=missing", req.url), 303);
    }

    const { data: users, error } = await supabaseAdmin
      .from("lender_users")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) {
      console.error("Lender login lookup failed:", error);
      return NextResponse.redirect(new URL("/lender-login?error=db", req.url), 303);
    }

    const user: any = users?.[0];

    if (user && String((user.password_hash || user.password) || "").trim() === password && user.is_active !== false) {
      const res = NextResponse.redirect(new URL("/lender", req.url), 303);
      res.cookies.set("hc_lender_user_id", user.id, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
      res.cookies.set("hc_lender_name", (user.name || user.lender_name) || user.email, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
      res.cookies.set("hc_lender_auth", "database_user", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
      return res;
    }

    return NextResponse.redirect(new URL("/lender-login?error=1", req.url), 303);
  } catch (err: any) {
    console.error("Lender login crashed:", err);
    return NextResponse.redirect(new URL("/lender-login?error=crashed", req.url), 303);
  }
}
