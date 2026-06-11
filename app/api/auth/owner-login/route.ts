import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") || "");
  const configured = process.env.OWNER_DASHBOARD_PASSWORD || "";

  if (!configured || password !== configured) {
    return NextResponse.redirect(new URL("/owner-login?error=1", req.url), 303);
  }

  const res = NextResponse.redirect(new URL("/owner", req.url), 303);
  res.cookies.set("hc_owner_auth", configured, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return res;
}
