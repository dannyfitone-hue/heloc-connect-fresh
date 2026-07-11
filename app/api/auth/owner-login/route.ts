import { NextResponse } from "next/server";
import { ownerSessionValue, rateLimit } from "@/lib/security";

export async function POST(req: Request) {
  const rl = rateLimit(req, "owner-login", 8, 15 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  const form = await req.formData();
  const password = String(form.get("password") || "");
  const configured = process.env.OWNER_DASHBOARD_PASSWORD || "";

  if (!configured || password !== configured) {
    return NextResponse.redirect(new URL("/owner-login?error=1", req.url), 303);
  }

  const res = NextResponse.redirect(new URL("/owner", req.url), 303);
  res.cookies.set("hc_owner_auth", ownerSessionValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return res;
}
