import { NextRequest, NextResponse } from "next/server";
import { ownerSessionValue, rateLimit } from "@/lib/security";

const COOKIE_NAME = "hc_owner_auth";

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, "owner-login", 8, 15 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  const { password } = await req.json();
  const configuredPassword = process.env.OWNER_DASHBOARD_PASSWORD;

  if (!configuredPassword) {
    return NextResponse.json(
      { error: "Owner dashboard password is not configured." },
      { status: 500 }
    );
  }

  if (password !== configuredPassword) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, ownerSessionValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
