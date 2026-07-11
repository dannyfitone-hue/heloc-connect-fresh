import { NextRequest, NextResponse } from "next/server";
import { hashPassword, LENDER_COOKIE, newSessionToken } from "@/lib/lenderAuth";
import { rateLimit } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, "lender-login", 8, 15 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  const s = supabaseAdmin();
  const { data: user, error } = await s.from("lender_users").select("*").eq("email", String(email).toLowerCase()).eq("is_active", true).single();
  if (error || !user) return NextResponse.json({ error: "Invalid login." }, { status: 401 });
  if (hashPassword(password, user.password_salt) !== user.password_hash) return NextResponse.json({ error: "Invalid login." }, { status: 401 });
  const token = newSessionToken();
  await s.from("lender_users").update({ session_token: token, last_login_at: new Date().toISOString() }).eq("id", user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LENDER_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return res;
}
