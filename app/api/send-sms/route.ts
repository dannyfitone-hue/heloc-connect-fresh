import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";
import { isOwnerRequest, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isOwnerRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rl = rateLimit(req, "manual-sms", 20, 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ error: "SMS rate limit reached" }, { status: 429 });
  let body: any = {}; try { body = await req.json(); } catch {}
  const to = String(body.to || body.phone || "");
  const message = String(body.message || "").slice(0, 1000);
  if (!to || !message) return NextResponse.json({ error: "Phone and message are required" }, { status: 400 });
  const result = await sendSms(to, message);
  return NextResponse.json(result, { status: (result as any)?.ok ? 200 : 500 });
}
