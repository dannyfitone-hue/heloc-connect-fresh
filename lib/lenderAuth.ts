import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const LENDER_COOKIE = "hc_lender_session";

export function hashPassword(password: string, salt: string) {
  return createHash("sha256").update(`${salt}:${password}`).digest("hex");
}

export function newSalt() {
  return randomBytes(16).toString("hex");
}

export function newSessionToken() {
  return randomBytes(32).toString("hex");
}

export async function getLenderSession(req: NextRequest) {
  const token = req.cookies.get(LENDER_COOKIE)?.value;
  if (!token) return null;
  const s = supabaseAdmin();
  const { data, error } = await s
    .from("lender_users")
    .select("*, mortgage_companies(*)")
    .eq("session_token", token)
    .eq("is_active", true)
    .single();
  if (error || !data) return null;
  return data;
}
