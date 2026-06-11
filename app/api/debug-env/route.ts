import { NextResponse } from "next/server";

function cleanUrl(v: any) {
  return String(v || "").trim().replace(/\/rest\/v1\/?$/i, "");
}

function cleanKey(v: any) {
  return String(v || "").replace(/[\r\n\s]/g, "").trim();
}

export async function GET() {
  const url = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = cleanKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const service = cleanKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return NextResponse.json({
    supabaseUrlPresent: Boolean(url),
    supabaseUrlLooksCorrect: url === "https://cpljanwlpclyhshrsfzv.supabase.co",
    supabaseUrlStart: url.slice(0, 40),
    anonPresent: Boolean(anon),
    anonStartsWith: anon.slice(0, 15),
    anonLooksNew: anon.startsWith("sb_publishable_"),
    servicePresent: Boolean(service),
    serviceStartsWith: service.slice(0, 12),
    serviceLooksNew: service.startsWith("sb_secret_"),
    serviceHasSpacesOrLineBreaks: /[\r\n\s]/.test(String(process.env.SUPABASE_SERVICE_ROLE_KEY || "")),
    note: "This route does not reveal full secret keys."
  });
}
