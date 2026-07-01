import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DEFAULT_SMS_TEMPLATES } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!supabaseAdmin) return NextResponse.redirect(new URL("/owner?error=supabase_missing", req.url), 303);
  const form = await req.formData();
  const rows = Object.keys(DEFAULT_SMS_TEMPLATES).map((key) => ({
    template_key: key,
    message: String(form.get(key) || DEFAULT_SMS_TEMPLATES[key as keyof typeof DEFAULT_SMS_TEMPLATES]),
    enabled: form.get(`${key}_enabled`) !== "off",
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin.from("sms_templates").upsert(rows, { onConflict: "template_key" });
  if (error) {
    return NextResponse.redirect(new URL(`/owner?error=sms_templates_save_failed&message=${encodeURIComponent(error.message)}`, req.url), 303);
  }
  return NextResponse.redirect(new URL("/owner?sms_templates_saved=1", req.url), 303);
}
