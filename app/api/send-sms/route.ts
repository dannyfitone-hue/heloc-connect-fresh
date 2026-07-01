import { NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const to = body.to || body.phone;
  const message = body.message || "HELOC CONNECT test SMS. Your Telnyx integration is connected.";
  const result = await sendSms(to, message);
  console.log("HELOC_MANUAL_SMS_TEST_RESULT", JSON.stringify(result));
  return NextResponse.json(result, { status: (result as any)?.ok ? 200 : 500 });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: "telnyx",
    configured: Boolean(process.env.TELNYX_API_KEY && process.env.TELNYX_PHONE_NUMBER),
    apiKeyPresent: Boolean(process.env.TELNYX_API_KEY),
    from: process.env.TELNYX_PHONE_NUMBER || null,
    profile: process.env.TELNYX_MESSAGING_PROFILE_ID ? "set" : "missing",
  });
}
