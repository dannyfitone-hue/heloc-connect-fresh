import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "";
  if (!path) return NextResponse.json({ error: "Missing file path" }, { status: 400 });

  const s = supabaseAdmin();
  const { data, error } = await s.storage.from("client-documents").createSignedUrl(path, 60 * 10);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message || "Could not create download link" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl, 302);
}
