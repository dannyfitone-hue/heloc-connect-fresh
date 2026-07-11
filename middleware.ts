import { NextRequest, NextResponse } from "next/server";

async function ownerToken() {
  const password = process.env.OWNER_DASHBOARD_PASSWORD || "";
  if (!password) return "";
  const data = new TextEncoder().encode(`heloc-owner-session:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const expectedOwner = await ownerToken();
  const ownerCookie = req.cookies.get("hc_owner_auth")?.value || "";
  const ownerOk = Boolean(expectedOwner && ownerCookie === expectedOwner);
  const lenderCookie = req.cookies.get("hc_lender_session")?.value || "";

  const ownerPage = pathname.startsWith("/owner") && !pathname.startsWith("/owner-login");
  const lenderPage = pathname.startsWith("/lender") && !pathname.startsWith("/lender-login");
  const ownerApi = pathname.startsWith("/api/owner/") && !pathname.endsWith("/login") && !pathname.endsWith("/logout");
  const ownerOnlyLenderApi = pathname === "/api/lenders/manage" || pathname === "/api/lenders/assign";
  const lenderApi = pathname.startsWith("/api/lenders/") && !pathname.endsWith("/login") && !pathname.endsWith("/logout") && !ownerOnlyLenderApi;
  const staffApi = pathname === "/api/documents/request" || pathname === "/api/documents/download" || pathname === "/api/send-sms";

  if (ownerPage && !ownerOk) {
    const url = req.nextUrl.clone(); url.pathname = "/owner-login"; url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (lenderPage && !ownerOk && !lenderCookie) {
    const url = req.nextUrl.clone(); url.pathname = "/lender-login"; url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if ((ownerApi || ownerOnlyLenderApi) && !ownerOk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((lenderApi || staffApi) && !ownerOk && !lenderCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/lender/:path*", "/api/owner/:path*", "/api/lenders/:path*", "/api/documents/request", "/api/documents/download", "/api/send-sms"]
};
