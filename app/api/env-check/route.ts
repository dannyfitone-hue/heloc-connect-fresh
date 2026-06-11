import { NextResponse } from "next/server";

function check(name: string) {
  const value = process.env[name] || "";
  return {
    name,
    exists: Boolean(value),
    length: value.length,
    startsWith: value ? value.slice(0, 14) : "",
    hasBullet: value.includes("•") || value.includes("●") || value.includes("…"),
    hasWhitespace: /\s/.test(value),
    last4: value ? value.slice(-4) : ""
  };
}

export async function GET() {
  const checks = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "GOOGLE_MAPS_SERVER_API_KEY",
    "ATTOM_API_KEY",
    "OWNER_DASHBOARD_PASSWORD",
    "LENDER_DASHBOARD_PASSWORD"
  ].map(check);

  const problem = checks.filter((x) => x.hasBullet || x.hasWhitespace || !x.exists);

  return NextResponse.json({
    ok: problem.length === 0,
    message: problem.length
      ? "One or more environment variables are missing or contain hidden bad characters."
      : "Environment variables are present and do not contain bullet/whitespace characters.",
    checks
  });
}
