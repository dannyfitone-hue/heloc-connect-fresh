import { NextResponse } from "next/server";
import { LENDER_COOKIE } from "@/lib/lenderAuth";
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LENDER_COOKIE, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
