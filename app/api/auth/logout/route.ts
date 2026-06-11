import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  res.cookies.delete("hc_owner_auth");
  res.cookies.delete("hc_lender_auth");
  res.cookies.delete("hc_lender_user_id");
  res.cookies.delete("hc_lender_name");
  return res;
}
