import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/owner") && !pathname.startsWith("/owner-login")) {
    const configured = process.env.OWNER_DASHBOARD_PASSWORD || "";
    const cookie = req.cookies.get("hc_owner_auth")?.value || "";
    if (!configured || cookie !== configured) {
      const url = req.nextUrl.clone();
      url.pathname = "/owner-login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/lender") && !pathname.startsWith("/lender-login")) {
    const ownerPass = process.env.OWNER_DASHBOARD_PASSWORD || "";
    const lenderPass = process.env.LENDER_DASHBOARD_PASSWORD || "";
    const ownerCookie = req.cookies.get("hc_owner_auth")?.value || "";
    const lenderCookie = req.cookies.get("hc_lender_auth")?.value || "";
    const lenderUserId = req.cookies.get("hc_lender_user_id")?.value || "";

    if (!(ownerPass && ownerCookie === ownerPass) && !(lenderPass && lenderCookie === lenderPass) && !lenderUserId) {
      const url = req.nextUrl.clone();
      url.pathname = "/lender-login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/lender/:path*"]
};
