import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    error: "Server API route intentionally bypassed. Homepage now submits directly to Supabase from the browser to avoid Vercel server fetch failure.",
    use: "client-direct-supabase"
  }, { status: 409 });
}
