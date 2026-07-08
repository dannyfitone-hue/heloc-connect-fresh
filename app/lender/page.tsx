import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { CLIENT_STATUSES, DOCUMENT_TYPES, money } from "@/lib/statuses";

function getGreeting(name?: string) {
  const hour = new Date().getHours();
  let greeting = "Good evening";

  if (hour >= 5 && hour < 12) greeting = "Good morning";
  else if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17 && hour < 22) greeting = "Good evening";
  else greeting = "Good night";

  const firstName = String(name || "").trim().split(" ")[0];
  return firstName ? `${greeting}, ${firstName}` : greeting;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
async function getLenderUser(id: string) {
  if (!supabaseAdmin || !id) return null;
  const { data } = await supabaseAdmin.from("lender_users").select("*").eq("id", id).single();
  return data;
}

async function getLeads(lenderId: string) {
  if (!supabaseAdmin || !lenderId) return [];

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("assigned_lender_id", lenderId)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("Lender assigned leads load failed:", error);
    return [];
  }

  const leads = data || [];
  const ids = leads.map((l: any) => l.id).filter(Boolean);
  let documents: any[] = [];

  if (ids.length) {
    const docs = await supabaseAdmin
      .from("lead_documents")
      .select("*")
      .in("lead_id", ids)
      .order("created_at", { ascending: false });
    if (!docs.error) documents = docs.data || [];
  }

  return leads.map((lead: any) => ({
    ...lead,
    documents: documents.filter((d: any) => d.lead_id === lead.id)
  }));
}

export default async function LenderPage() {
  const cookieStore = cookies();
  const lenderId = cookieStore.get("hc_lender_user_id")?.value || "";
  if (!lenderId) redirect("/lender-login");

  const lenderUser: any = await getLenderUser(lenderId);
  if (!lenderUser) redirect("/lender-login");

  const leads: any[] = lenderId ? await getLeads(lenderId) : [];

  return (
    <main className="min-h-screen bg-[#0b0a07] text-white">
      <header className="border-b border-white/10 bg-[#0f0e0a]/95 px-5 py-5">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d9a94e]/70 bg-[#14110a] text-[#d4af37]">⌂</div>
            <div>
              <img src="/heloc-connect-logo-full.png" alt="HELOC CONNECT" className="h-16 w-auto object-contain" />
              <div className="text-xs font-black uppercase tracking-[.35em] text-[#d4af37]">Mortgage Company Portal</div>
            </div>
          </a>
          <a href="/api/auth/logout" className="rounded-2xl bg-[#d4af37] px-5 py-3 text-sm font-black text-[#0b0a07]">Logout</a>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-gradient-to-br from-[#18140c] to-[#0b0a07] p-6 shadow-2xl">
          <div className="text-xs font-black uppercase tracking-[.35em] text-[#d4af37]">
            {getGreeting((lenderUser?.name || lenderUser?.lender_name) || lenderUser?.email)}
          </div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-6xl">Assigned Lead Pipeline</h1>
          <p className="mt-3 max-w-3xl text-base font-semibold text-white/70">
            {(lenderUser?.company_name || lenderUser?.mortgage_companies?.name) || "Network lender"} can review assigned homeowner requests and update statuses.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#15120b] p-5"><div className="text-sm font-black text-white/50">Assigned Leads</div><div className="mt-2 text-4xl font-black">{leads.length}</div></div>
            <div className="rounded-3xl border border-white/10 bg-[#15120b] p-5"><div className="text-sm font-black text-white/50">Active Reviews</div><div className="mt-2 text-4xl font-black text-[#d4af37]">{leads.filter((l) => !String(l.status || "").includes("Funded")).length}</div></div>
            <div className="rounded-3xl border border-white/10 bg-[#15120b] p-5"><div className="text-sm font-black text-white/50">Potential Volume</div><div className="mt-2 text-3xl font-black">{money(leads.reduce((s,l)=>s+Number(l.requested_amount||0),0))}</div></div>
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          {leads.length === 0 ? (
            <div className="rounded-[34px] border border-white/10 bg-[#11100b] p-10 text-center">
              <div className="text-4xl">📋</div>
              <h2 className="mt-3 text-2xl font-black">No assigned leads yet</h2>
              <p className="mt-2 text-white/60">When HELOC CONNECT admin assigns leads to you, they will appear here.</p>
            </div>
          ) : leads.map((l) => (
            <div key={l.id} className="rounded-[30px] border border-white/10 bg-[#11100b] p-5 shadow-2xl">
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr_.75fr]">
                <div>
                  <span className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-3 py-1 text-xs font-black text-[#d4af37]">{l.status || "Application Received"}</span>
                  <h3 className="mt-4 text-2xl font-black">{l.first_name || "Client"} {l.last_name || ""}</h3>
                  <p className="mt-2 text-sm font-semibold text-white/65">{l.phone || "No phone"} • {l.email || "No email"}</p>
                  <p className="mt-2 text-sm font-semibold text-white/65">{l.address || ""}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Home Value</div><b>{money(l.home_value)}</b></div>
                  <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Requested</div><b>{money(l.requested_amount)}</b></div>
                  <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Credit</div><b>{l.credit_score || "—"}</b></div>
                  <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Mortgage</div><b>{l.mortgage_standing || "—"}</b></div>
                </div>
                <form action="/api/owner/update-status" method="post" className="rounded-2xl border border-white/10 bg-[#0f0e0a] p-4">
                  <input type="hidden" name="leadId" value={l.id} />
                  <label className="text-xs font-black uppercase tracking-[.2em] text-white/50">Update Client</label>
                  <select name="status" defaultValue={l.status || "Application Received"} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#13100a] p-3 font-bold text-white">
                    {CLIENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <button className="mt-3 w-full rounded-2xl bg-[#d4af37] p-3 font-black text-[#0b0a07]">Save Status</button>
                </form>

                <div className="rounded-2xl border border-white/10 bg-[#0f0e0a] p-4">
                  <label className="text-xs font-black uppercase tracking-[.2em] text-white/50">Request Documents</label>
                  <form action="/api/documents/request" method="post" className="mt-3 grid gap-3">
                    <input type="hidden" name="leadId" value={l.id} />
                    <input type="hidden" name="returnTo" value="/lender" />
                    <select name="documentType" defaultValue="Driving License" className="w-full rounded-2xl border border-white/10 bg-[#13100a] p-3 font-bold text-white">
                      {DOCUMENT_TYPES.map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <input name="otherDoc" placeholder="If Other Docs, type exactly what is needed" className="w-full rounded-2xl border border-white/10 bg-[#13100a] p-3 font-semibold text-white" />
                    <textarea name="note" placeholder="Optional note for client" className="h-16 w-full rounded-2xl border border-white/10 bg-[#13100a] p-3 font-semibold text-white" />
                    <button className="w-full rounded-2xl bg-amber-400 p-3 font-black text-[#0b0a07]">Request Docs</button>
                  </form>

                  <div className="mt-4 grid gap-2">
                    {(l.documents || []).length === 0 ? (
                      <p className="text-xs font-bold text-white/45">No documents requested yet.</p>
                    ) : (l.documents || []).map((doc: any) => (
                      <div key={doc.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
                        <div className="font-black text-white">{doc.document_type}</div>
                        <div className={doc.status === "Uploaded" ? "font-black text-amber-300" : "font-black text-amber-300"}>{doc.status}</div>
                        {doc.note ? <div className="mt-1 text-white/50">{doc.note}</div> : null}
                        {doc.file_name ? <div className="mt-1 text-white/70">Uploaded: {doc.file_name}</div> : null}
                        {doc.file_path ? <a className="mt-2 inline-flex rounded-lg border border-amber-300/30 px-3 py-1 font-black text-amber-300" href={`/api/documents/download?path=${encodeURIComponent(doc.file_path)}`} target="_blank">Download</a> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
