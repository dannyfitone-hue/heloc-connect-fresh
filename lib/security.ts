import { createHash, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { getLenderSession } from "@/lib/lenderAuth";

export function ownerSessionValue() {
  const password = process.env.OWNER_DASHBOARD_PASSWORD || "";
  if (!password) return "";
  return createHash("sha256").update(`heloc-owner-session:${password}`).digest("hex");
}

export function isOwnerRequest(req: NextRequest) {
  const expected = ownerSessionValue();
  const actual = req.cookies.get("hc_owner_auth")?.value || "";
  if (!expected || expected.length !== actual.length) return false;
  try { return timingSafeEqual(Buffer.from(expected), Buffer.from(actual)); } catch { return false; }
}

export async function isStaffRequest(req: NextRequest) {
  if (isOwnerRequest(req)) return true;
  return Boolean(await getLenderSession(req));
}

const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(req: Request, key: string, limit: number, windowMs: number) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const current = buckets.get(bucketKey);
  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  if (current.count > limit) return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  return { allowed: true, retryAfter: 0 };
}
