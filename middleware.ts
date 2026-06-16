import { NextRequest, NextResponse } from "next/server";

const OWNER_COOKIE = "hc_owner_auth";
const LENDER_COOKIE = "hc_lender_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const ownerPublic = pathname.startsWith("/owner-login") || pathname.startsWith("/api/owner/login") || pathname.startsWith("/api/owner/logout");
  const lenderPublic = pathname.startsWith("/lender-login") || pathname.startsWith("/api/lenders/login") || pathname.startsWith("/api/lenders/logout");
  if (ownerPublic || lenderPublic) return NextResponse.next();

  const ownerProtected = pathname.startsWith("/owner") || pathname.startsWith("/api/owner") || pathname.startsWith("/api/documents/request") || pathname.startsWith("/api/lenders/manage") || pathname.startsWith("/api/lenders/assign");
  const lenderProtectedPage = pathname.startsWith("/lender");

  if (ownerProtected) {
    const configuredPassword = process.env.OWNER_DASHBOARD_PASSWORD;
    const cookieValue = req.cookies.get(OWNER_COOKIE)?.value;
    if (!configuredPassword || cookieValue !== configuredPassword) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/owner-login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (lenderProtectedPage) {
    const lenderCookie = req.cookies.get(LENDER_COOKIE)?.value;
    const ownerCookie = req.cookies.get(OWNER_COOKIE)?.value;
    const configuredPassword = process.env.OWNER_DASHBOARD_PASSWORD;
    if (!lenderCookie && (!configuredPassword || ownerCookie !== configuredPassword)) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/lender-login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/owner/:path*",
    "/lender/:path*",
    "/api/owner/:path*",
    "/api/documents/request/:path*",
    "/api/lenders/manage/:path*",
    "/api/lenders/assign/:path*"
  ],
};
