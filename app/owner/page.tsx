import { supabaseAdmin } from "@/lib/supabase";
import { CLIENT_STATUSES, DOCUMENT_TYPES, money } from "@/lib/statuses";
import { DEFAULT_SMS_TEMPLATES } from "@/lib/sms";
import DeleteLeadForm from "./DeleteLeadForm";
import DeleteLenderForm from "./DeleteLenderForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
async function getLeads() {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Owner dashboard leads load failed:", error);
    return [];
  }

  const leads = data || [];
  const ids = leads.map((l: any) => l.id).filter(Boolean);
  let documents: any[] = [];
  let notes: any[] = [];
  let smsLogs: any[] = [];

  if (ids.length) {
    const docs = await supabaseAdmin
      .from("lead_documents")
      .select("*")
      .in("lead_id", ids)
      .order("created_at", { ascending: false });

    if (!docs.error) documents = docs.data || [];

    const leadNotes = await supabaseAdmin
      .from("lead_notes")
      .select("*")
      .in("lead_id", ids)
      .order("created_at", { ascending: false });

    if (!leadNotes.error) notes = leadNotes.data || [];

    try {
      const logs = await supabaseAdmin
        .from("sms_logs")
        .select("*")
        .in("lead_id", ids)
        .order("created_at", { ascending: false });
      if (!logs.error) smsLogs = logs.data || [];
    } catch {}
  }

  return leads.map((lead: any) => ({
    ...lead,
    documents: documents.filter((d: any) => d.lead_id === lead.id),
    notes: notes.filter((n: any) => n.lead_id === lead.id),
    smsLogs: smsLogs.filter((n: any) => n.lead_id === lead.id),
  }));
}

async function getLenders() {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("lender_users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Owner dashboard lenders load failed:", error);
    return [];
  }

  return data || [];
}

async function getSmsTemplates() {
  const defaults = Object.entries(DEFAULT_SMS_TEMPLATES).map(([template_key, message]) => ({ template_key, message, enabled: true }));
  if (!supabaseAdmin) return defaults;
  try {
    const { data, error } = await supabaseAdmin.from("sms_templates").select("template_key,message,enabled");
    if (error || !data) return defaults;
    return defaults.map((d) => {
      const saved = (data as any[]).find((r) => r.template_key === d.template_key);
      return saved ? { ...d, message: saved.message || d.message, enabled: saved.enabled !== false } : d;
    });
  } catch {
    return defaults;
  }
}

function statCount(leads: any[], status: string) {
  return leads.filter((l) => String(l.status || "").toLowerCase().includes(status.toLowerCase())).length;
}

export default async function OwnerPage({ searchParams }: { searchParams?: Record<string, string | undefined> }) {
  const leads: any[] = await getLeads();
  const lenders: any[] = await getLenders();
  const smsTemplates: any[] = await getSmsTemplates();
  const totalRequested = leads.reduce((sum, l) => sum + Number(l.requested_amount || 0), 0);
  const funded = leads.reduce((sum, l) => sum + Number(l.funded_amount || 0), 0);

  return (
    <main className="min-h-screen bg-[#06111f] text-white">
      <header className="border-b border-white/10 bg-[#06101d]/95 px-5 py-5">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d9a94e]/70 bg-[#091827] text-[#f6c15a]">⌂</div>
            <div>
              <div className="text-2xl font-black tracking-[-.04em]">HELOC CONNECT</div>
              <div className="text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">Owner Command Center</div>
            </div>
          </a>
          <div className="flex flex-wrap gap-3 text-sm font-black">
            <a href="/lender" className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3">Lender View</a>
            <a href="/api/auth/logout" className="rounded-2xl bg-[#f6c15a] px-5 py-3 text-[#06111f]">Logout</a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">

        {searchParams?.sms_templates_saved && (
          <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">
            SMS automation templates saved. Future automatic texts will use the updated wording.
          </div>
        )}

        {searchParams?.instant_sms && (
          <div className={`mb-5 rounded-2xl border p-4 text-sm font-black ${searchParams.instant_sms === "sent" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-500/10 text-red-200"}`}>
            {searchParams.instant_sms === "sent" ? "Instant SMS sent." : "Instant SMS failed or is pending carrier delivery. Check Telnyx message reports for final delivery status."}
          </div>
        )}

        {searchParams?.created_lender && (
          <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">
            Lender user saved{searchParams?.lender_email ? `: ${searchParams.lender_email}` : ""}.
          </div>
        )}


        {searchParams?.deleted_lender && (
          <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">
            Lender user deleted and assigned leads were unassigned.
          </div>
        )}

        {searchParams?.requested_doc && (
          <div className="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm font-black text-emerald-200">
            Document request sent to the client status page.
          </div>
        )}

        {searchParams?.error && (
          <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-200">
            Lender action error: {searchParams.error}{searchParams?.message ? ` — ${searchParams.message}` : ""}
          </div>
        )}

        <div className="rounded-[34px] border border-white/10 bg-gradient-to-br from-[#0b1b2e] to-[#06111f] p-6 shadow-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">Live Funding Platform</div>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-6xl">Admin Dashboard</h1>
              <p className="mt-3 max-w-3xl text-base font-semibold text-white/70">
                Create lender users, assign leads, update client status pages, delete old leads, and control the network pipeline.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 font-black text-emerald-200">
              ● Supabase Connected
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-5">
            <div className="rounded-3xl border border-white/10 bg-[#08182b] p-5"><div className="text-sm font-black text-white/50">Total Leads</div><div className="mt-2 text-4xl font-black">{leads.length}</div></div>
            <div className="rounded-3xl border border-white/10 bg-[#08182b] p-5"><div className="text-sm font-black text-white/50">Network Lenders</div><div className="mt-2 text-4xl font-black text-[#f6c15a]">{lenders.length}</div></div>
            <div className="rounded-3xl border border-white/10 bg-[#08182b] p-5"><div className="text-sm font-black text-white/50">Assigned Leads</div><div className="mt-2 text-4xl font-black">{leads.filter(l=>l.assigned_lender_id).length}</div></div>
            <div className="rounded-3xl border border-white/10 bg-[#08182b] p-5"><div className="text-sm font-black text-white/50">Requested Funding</div><div className="mt-2 text-3xl font-black">{money(totalRequested)}</div></div>
            <div className="rounded-3xl border border-white/10 bg-[#08182b] p-5"><div className="text-sm font-black text-white/50">Funded Volume</div><div className="mt-2 text-3xl font-black text-emerald-300">{money(funded)}</div></div>
          </div>
        </div>



        <div className="mt-6 rounded-[34px] border border-cyan-300/15 bg-[#071421] p-5 shadow-2xl sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[.35em] text-cyan-200">Automation Center</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">SMS Automation</h2>
              <p className="mt-2 max-w-3xl text-sm font-semibold text-white/60">
                Edit the automatic text messages HELOC CONNECT sends after form submission, status changes, document requests, approvals, and funding. Telnyx only delivers the message — this dashboard controls the wording.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-200">
              Telnyx Ready: {process.env.TELNYX_API_KEY && process.env.TELNYX_PHONE_NUMBER ? "Connected" : "Env Needed"}
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[.85fr_1.15fr]">
            <div className="rounded-3xl border border-[#f6c15a]/25 bg-gradient-to-br from-[#10243b] to-[#071421] p-5 shadow-xl">
              <div className="text-xs font-black uppercase tracking-[.3em] text-[#f6c15a]">Instant SMS</div>
              <h3 className="mt-2 text-2xl font-black tracking-[-.03em]">Send a Manual Text</h3>
              <p className="mt-2 text-sm font-semibold text-white/55">Type any approved number and message, then send directly from the Owner Dashboard. This uses the same Telnyx number as the automated texts.</p>
              <form action="/api/owner/instant-sms" method="post" className="mt-5 grid gap-3">
                <input name="phone" placeholder="Client phone number" className="rounded-2xl border border-white/10 bg-[#06101d] p-4 font-bold text-white outline-none focus:border-[#f6c15a]/60" />
                <textarea name="message" rows={5} maxLength={1500} placeholder="Type SMS message here" className="rounded-2xl border border-white/10 bg-[#06101d] p-4 font-semibold leading-relaxed text-white outline-none focus:border-[#f6c15a]/60" />
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs font-bold text-white/45">Recommended while registration is pending: keep wording neutral and include Reply STOP to opt out.</div>
                <button className="rounded-2xl bg-[#f6c15a] p-4 font-black text-[#06111f]">Send Instant SMS</button>
              </form>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#091a2f] p-5">
              <div className="text-xs font-black uppercase tracking-[.3em] text-cyan-200">SMS Visibility</div>
              <h3 className="mt-2 text-2xl font-black tracking-[-.03em]">Client SMS Timeline</h3>
              <p className="mt-2 text-sm font-semibold text-white/55">Each lead card now includes a timeline showing automatic texts, manual texts, failed attempts, and future reminder placeholders so you can see what the client has received from HC.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4"><b className="text-emerald-200">Received</b><p className="mt-1 text-xs text-white/50">Logged after system/manual send attempt.</p></div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4"><b className="text-amber-200">Pending</b><p className="mt-1 text-xs text-white/50">Scheduled reminders can appear here later.</p></div>
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4"><b className="text-red-200">Failed</b><p className="mt-1 text-xs text-white/50">Failed Telnyx attempts stay visible.</p></div>
              </div>
            </div>
          </div>

          <form action="/api/owner/sms-templates" method="post" className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs font-bold text-white/55">
              Available placeholders: <span className="text-cyan-200">{"{FIRST_NAME}"}</span>, <span className="text-cyan-200">{"{STATUS_LINK}"}</span>, <span className="text-cyan-200">{"{STATUS}"}</span>, <span className="text-cyan-200">{"{TRACKING_ID}"}</span>, <span className="text-cyan-200">{"{COMPANY_NAME}"}</span>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {smsTemplates.map((tpl) => (
                <div key={tpl.template_key} className="rounded-3xl border border-white/10 bg-[#091a2f] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="text-sm font-black uppercase tracking-[.18em] text-[#f6c15a]">{String(tpl.template_key).replace(/_/g, " ")}</label>
                    <label className="flex items-center gap-2 text-xs font-black text-white/60">
                      <input type="checkbox" name={`${tpl.template_key}_enabled`} defaultChecked={tpl.enabled !== false} value="on" /> Enabled
                    </label>
                  </div>
                  <textarea name={tpl.template_key} defaultValue={tpl.message} rows={5} className="w-full rounded-2xl border border-white/10 bg-[#06101d] p-4 text-sm font-semibold leading-relaxed text-white outline-none focus:border-cyan-300/60" />
                </div>
              ))}
            </div>
            <button className="rounded-2xl bg-cyan-300 p-4 font-black text-[#06111f]">Save SMS Automation Templates</button>
          </form>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
          <div className="rounded-[34px] border border-white/10 bg-[#071421] p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Create Network Lender User</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">The lender logs in with the email/password you create here.</p>
            <form action="/api/owner/create-lender" method="post" className="mt-5 grid gap-3">
              <input name="lender_name" required placeholder="Lender / Agent Name" className="rounded-2xl border border-white/10 bg-[#06101d] p-4" />
              <input name="company_name" placeholder="Mortgage Company Name" className="rounded-2xl border border-white/10 bg-[#06101d] p-4" />
              <input name="email" type="email" required placeholder="Login Email" className="rounded-2xl border border-white/10 bg-[#06101d] p-4" />
              <input name="phone" placeholder="Phone" className="rounded-2xl border border-white/10 bg-[#06101d] p-4" />
              <input name="password" required placeholder="Create Password" className="rounded-2xl border border-white/10 bg-[#06101d] p-4" />
              <button className="rounded-2xl bg-[#f6c15a] p-4 font-black text-[#06111f]">Create Lender User</button>
            </form>

            <h3 className="mt-8 text-xl font-black">Existing Network Lenders</h3>
            <div className="mt-4 grid gap-3">
              {lenders.length ? lenders.map((u) => (
                <div key={u.id} className="rounded-2xl border border-white/10 bg-[#091a2f] p-4">
                  <b>{(u.name || u.lender_name)}</b>
                  <div className="text-sm text-white/60">{(u.company_name || u.mortgage_companies?.name) || "No company"} • {u.email}</div>
                  <DeleteLenderForm lenderId={u.id} lenderEmail={u.email} />
                </div>
              )) : <div className="rounded-2xl border border-dashed border-white/15 p-5 text-white/60">No lender users yet.</div>}
            </div>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-[#071421] p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black">Leads, Assignment & Status Control</h2>
                <p className="mt-1 text-sm font-semibold text-white/55">Assign leads to existing network lenders. The lender will see only assigned leads.</p>
              </div>
              <div className="rounded-full border border-[#f6c15a]/40 bg-[#f6c15a]/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-[#f6c15a]">
                Live Lead Flow
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/[.03] p-10 text-center">
                <div className="text-4xl">📭</div>
                <h3 className="mt-3 text-2xl font-black">No leads yet</h3>
                <p className="mt-2 text-white/60">Submit a test lead from the homepage calculator to verify the full flow.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {leads.map((l) => (
                  <div key={l.id} className="rounded-3xl border border-white/10 bg-[#091a2f] p-5">
                    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr_.95fr]">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-black">{l.first_name || "Client"} {l.last_name || ""}</h3>
                          <span className="rounded-full border border-[#f6c15a]/40 bg-[#f6c15a]/10 px-3 py-1 text-xs font-black text-[#f6c15a]">{l.status || "Application Received"}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-white/65">{l.email || "No email"} • {l.phone || "No phone"}</p>
                        <p className="mt-2 text-sm font-semibold text-white/65">{l.property_address || l.address || "No address"} {l.city ? `• ${l.city}, ${l.state || ""} ${l.zip || ""}` : ""}</p>
                        <p className="mt-2 text-xs font-black text-emerald-300">Assigned: {l.assigned_agent || (l.assigned_lender_id ? "Assigned" : "Unassigned")}</p>
                        <a className="mt-4 inline-flex rounded-2xl border border-white/10 px-4 py-2 text-sm font-black text-[#f6c15a]" href={`/status/${l.token}`} target="_blank">
                          Open Client Status Page →
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Home Value</div><b>{money(l.home_value)}</b></div>
                        <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Mortgage Bal.</div><b>{money(l.mortgage_balance)}</b></div>
                        <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Requested</div><b>{money(l.requested_amount)}</b></div>
                        <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Equity Room</div><b>{money(l.equity_room)}</b></div>
                        <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Credit</div><b>{l.credit_score || "—"}</b></div>
                        <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Income</div><b>{money(l.monthly_income || l.income)}</b></div>
                      </div>

                      <div className="grid gap-3">
                        <form action="/api/owner/assign-lead" method="post" className="rounded-2xl border border-white/10 bg-[#06101d] p-4">
                          <input type="hidden" name="leadId" value={l.id} />
                          <label className="text-xs font-black uppercase tracking-[.2em] text-white/50">Assign To Lender</label>
                          <select name="lenderId" defaultValue={l.assigned_lender_id || ""} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#091a2f] p-3 font-bold text-white">
                            <option value="">Unassigned</option>
                            {lenders.map((u) => <option key={u.id} value={u.id}>{(u.name || u.lender_name)} — {(u.company_name || u.mortgage_companies?.name) || u.email}</option>)}
                          </select>
                          <button className="mt-3 w-full rounded-2xl bg-emerald-400 p-3 font-black text-[#06111f]">Assign Lead</button>
                        </form>

                        <form action="/api/owner/update-status" method="post" className="rounded-2xl border border-white/10 bg-[#06101d] p-4">
                          <input type="hidden" name="leadId" value={l.id} />
                          <label className="text-xs font-black uppercase tracking-[.2em] text-white/50">Update Status</label>
                          <select name="status" defaultValue={l.status || "Application Received"} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#091a2f] p-3 font-bold text-white">
                            {CLIENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                          <textarea name="notes" placeholder="Internal notes / lender notes" defaultValue={l.notes || ""} className="mt-3 h-20 w-full rounded-2xl border border-white/10 bg-[#091a2f] p-3 font-semibold text-white" />
                          <button className="mt-3 w-full rounded-2xl bg-gradient-to-b from-[#ffd36d] to-[#d89425] p-3 font-black text-[#06111f]">Save Update</button>
                        </form>

                        <div className="rounded-2xl border border-white/10 bg-[#06101d] p-4">
                          <label className="text-xs font-black uppercase tracking-[.2em] text-white/50">Request Documents</label>
                          <form action="/api/documents/request" method="post" className="mt-3 grid gap-3">
                            <input type="hidden" name="leadId" value={l.id} />
                            <input type="hidden" name="returnTo" value="/owner" />
                            <select name="documentType" defaultValue="Driving License" className="w-full rounded-2xl border border-white/10 bg-[#091a2f] p-3 font-bold text-white">
                              {DOCUMENT_TYPES.map((d) => <option key={d}>{d}</option>)}
                            </select>
                            <input name="otherDoc" placeholder="If Other Docs, type exactly what is needed" className="w-full rounded-2xl border border-white/10 bg-[#091a2f] p-3 font-semibold text-white" />
                            <textarea name="note" placeholder="Optional note for client" className="h-16 w-full rounded-2xl border border-white/10 bg-[#091a2f] p-3 font-semibold text-white" />
                            <button className="w-full rounded-2xl bg-[#f6c15a] p-3 font-black text-[#06111f]">Request Docs</button>
                          </form>

                          <div className="mt-4 grid gap-2">
                            {(l.documents || []).length === 0 ? (
                              <p className="text-xs font-bold text-white/45">No documents requested yet.</p>
                            ) : (l.documents || []).map((doc: any) => (
                              <div key={doc.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                                <div className="font-black text-white">{doc.document_type}</div>
                                <div className={doc.status === "Uploaded" ? "font-black text-emerald-300" : "font-black text-amber-300"}>{doc.status}</div>
                                {doc.note ? <div className="mt-1 text-white/50">{doc.note}</div> : null}
                                {doc.file_name ? <div className="mt-1 text-white/70">Uploaded: {doc.file_name}</div> : null}
                                {doc.file_path ? <a className="mt-2 inline-flex rounded-lg border border-emerald-300/30 px-3 py-1 font-black text-emerald-300" href={`/api/documents/download?path=${encodeURIComponent(doc.file_path)}`} target="_blank">Download</a> : null}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-cyan-300/15 bg-[#06101d] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <label className="text-xs font-black uppercase tracking-[.2em] text-cyan-200">SMS Timeline</label>
                              <p className="mt-1 text-xs font-bold text-white/45">What this client has received, failed attempts, and manual texts.</p>
                            </div>
                            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-cyan-100">Live Log</span>
                          </div>

                          <form action="/api/owner/instant-sms" method="post" className="mt-4 grid gap-2">
                            <input type="hidden" name="leadId" value={l.id} />
                            <input type="hidden" name="phone" value={l.phone || ""} />
                            <input type="hidden" name="returnTo" value="/owner" />
                            <textarea name="message" rows={3} maxLength={1500} placeholder={`Send manual SMS to ${l.phone || "this client"}`} className="w-full rounded-2xl border border-white/10 bg-[#091a2f] p-3 text-sm font-semibold text-white outline-none focus:border-cyan-300/60" />
                            <button className="rounded-2xl bg-cyan-300 p-3 text-sm font-black text-[#06111f]">Send Manual SMS To This Lead</button>
                          </form>

                          <div className="mt-4 grid gap-2">
                            {((l.smsLogs || []).length || (l.notes || []).filter((n: any) => String(n.note || "").toLowerCase().includes("sms")).length) ? (
                              <>
                                {(l.smsLogs || []).slice(0, 4).map((log: any) => (
                                  <div key={`sms-${log.id}`} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <b className={String(log.delivery_status || "").toLowerCase().includes("fail") ? "text-red-300" : "text-emerald-300"}>{log.delivery_status || "sent"}</b>
                                      <span className="text-white/40">{log.created_at ? new Date(log.created_at).toLocaleString() : ""}</span>
                                    </div>
                                    <div className="mt-1 text-white/50">{log.message_type || "SMS"} • {log.triggered_by || "System"}</div>
                                    <div className="mt-2 whitespace-pre-wrap text-white/75">{log.message_body || "—"}</div>
                                  </div>
                                ))}
                                {(l.notes || []).filter((n: any) => String(n.note || "").toLowerCase().includes("sms")).slice(0, 5).map((note: any) => (
                                  <div key={`note-${note.id}`} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <b className={String(note.note || "").toLowerCase().includes("not sent") || String(note.note || "").toLowerCase().includes("failed") ? "text-red-300" : "text-emerald-300"}>SMS Event</b>
                                      <span className="text-white/40">{note.created_at ? new Date(note.created_at).toLocaleString() : ""}</span>
                                    </div>
                                    <div className="mt-2 text-white/75">{note.note}</div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="rounded-xl border border-dashed border-white/15 p-3 text-xs font-bold text-white/45">No SMS events logged yet for this lead.</div>
                            )}
                            <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs font-bold text-amber-100">Future scheduled reminders: none active yet.</div>
                          </div>
                        </div>

                        <DeleteLeadForm leadId={l.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
