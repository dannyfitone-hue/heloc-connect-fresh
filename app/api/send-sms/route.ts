import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  const { to, name, link } = await req.json();
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !auth || !from) {
    return NextResponse.json({ ok: false, message: "Twilio not configured; SMS skipped." });
  }

  const client = twilio(sid, auth);
  const sent = await client.messages.create({
    to,
    from,
    body: `Hi ${name || "there"}, your HELOC CONNECT request was received. Track status: ${link}`
  });

  return NextResponse.json({ ok: true, sid: sent.sid });
}
