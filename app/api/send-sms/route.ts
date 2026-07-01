import { NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const to = body.to || body.phone;
  const message = body.message || "HELOC CONNECT test SMS. Your Telnyx integration is connected.";
  const result = await sendSms(to, message);
  return NextResponse.json(result, { status: result?.ok ? 200 : 500 });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: "telnyx",
    configured: Boolean(process.env.TELNYX_API_KEY && process.env.TELNYX_PHONE_NUMBER),
    from: process.env.TELNYX_PHONE_NUMBER || null,
    profile: process.env.TELNYX_MESSAGING_PROFILE_ID ? "set" : "missing",
  });
}
