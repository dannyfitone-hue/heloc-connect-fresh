import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendApplicationSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

async function readPayload(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    return {
      leadId: String(body.leadId || ""),
      documentType: String(body.documentType || ""),
      otherDoc: String(body.otherDoc || body.other_doc || ""),
      note: String(body.note || ""),
      returnTo: String(body.returnTo || "")
    };
  }

  const form = await req.formData();
  return {
    leadId: String(form.get("leadId") || ""),
    documentType: String(form.get("documentType") || ""),
    otherDoc: String(form.get("otherDoc") || form.get("other_doc") || ""),
    note: String(form.get("note") || ""),
    returnTo: String(form.get("returnTo") || "")
  };
}

export async function POST(req: NextRequest) {
  const s = supabaseAdmin();
  const payload = await readPayload(req);
  const isForm = !(req.headers.get("content-type") || "").includes("application/json");
  const returnTo = payload.returnTo || req.headers.get("referer") || "/owner";

  if (!payload.leadId) {
    if (isForm) return NextResponse.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=missing_lead_id`, req.url), 303);
    return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
  }

  const selectedType = payload.documentType || "Other Docs";
  const customType = payload.otherDoc.trim();
  const documentType = selectedType === "Other Docs" && customType ? customType : selectedType;
  const note = selectedType === "Other Docs" && customType
    ? (payload.note || `Other Docs: ${customType}`)
    : payload.note;

  const { error } = await s.from("lead_documents").insert({
    lead_id: payload.leadId,
    document_type: documentType,
    note: note || "",
    status: "Requested"
  });

  if (error) {
    if (isForm) return NextResponse.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=request_doc_failed&message=${encodeURIComponent(error.message)}`, req.url), 303);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: lead } = await s.from("leads").update({ status: "Documents Requested", updated_at: new Date().toISOString() }).eq("id", payload.leadId).select("id, phone, tracking_id, client_token, first_name, last_name, status").single();
  await s.from("lead_notes").insert({ lead_id: payload.leadId, note: `Document requested: ${documentType}${note ? " - " + note : ""}` });
  if (lead?.phone) {
    const smsResult = await sendApplicationSms("documents_requested", lead, { status: "Documents Requested" });
    try { await s.from("lead_notes").insert({ lead_id: payload.leadId, note: smsResult?.ok ? "Documents requested SMS sent automatically." : `Documents requested SMS not sent: ${JSON.stringify(smsResult).slice(0, 500)}` }); } catch {}
  }

  if (isForm) return NextResponse.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}requested_doc=1`, req.url), 303);
  return NextResponse.json({ ok: true });
}
