import { supabaseAdmin } from "@/lib/supabase";
import { CLIENT_STATUSES, DOCUMENT_TYPES, money } from "@/lib/statuses";

async function getLeads() {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("leads")
    .select("*, lender_users(*)")
    .order("created_at", { ascending: false })
    .limit(300);
  return data || [];
}

async function getLenders() {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin
    .from("lender_users")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

function statCount(leads: any[], status: string) {
  return leads.filter((l) => String(l.status || "").toLowerCase().includes(status.toLowerCase())).length;
}

export default async function OwnerPage() {
  const leads: any[] = await getLeads();
  const lenders: any[] = await getLenders();
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
                  <b>{u.lender_name}</b>
                  <div className="text-sm text-white/60">{u.company_name || "No company"} • {u.email}</div>
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
                        <p className="mt-2 text-sm font-semibold text-white/65">{l.address || "No address"} {l.city ? `• ${l.city}, ${l.state || ""} ${l.zip || ""}` : ""}</p>
                        <p className="mt-2 text-xs font-black text-emerald-300">Assigned: {l.lender_users?.lender_name || l.assigned_agent || "Unassigned"}</p>
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
                        <div className="rounded-2xl bg-black/20 p-4"><div className="text-white/45">Income</div><b>{money(l.income)}</b></div>
                      </div>

                      <div className="grid gap-3">
                        <form action="/api/owner/assign-lead" method="post" className="rounded-2xl border border-white/10 bg-[#06101d] p-4">
                          <input type="hidden" name="leadId" value={l.id} />
                          <label className="text-xs font-black uppercase tracking-[.2em] text-white/50">Assign To Lender</label>
                          <select name="lenderId" defaultValue={l.assigned_lender_id || ""} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#091a2f] p-3 font-bold text-white">
                            <option value="">Unassigned</option>
                            {lenders.map((u) => <option key={u.id} value={u.id}>{u.lender_name} — {u.company_name || u.email}</option>)}
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

                        <form action="/api/owner/delete-lead" method="post">
                          <input type="hidden" name="leadId" value={l.id} />
                          <button className="w-full rounded-2xl border border-red-400/35 bg-red-500/10 p-3 font-black text-red-200">Delete Lead</button>
                        </form>
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
