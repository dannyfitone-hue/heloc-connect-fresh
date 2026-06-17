import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ ok: true, skipped: true, reason: "SMS disabled until a new provider is integrated" });
}

export async function GET() {
  return NextResponse.json({ ok: true, skipped: true, reason: "SMS disabled until a new provider is integrated" });
}
