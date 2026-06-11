import { supabaseAdmin } from "@/lib/supabase";
import { money } from "@/lib/statuses";

async function getLeads() {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from("leads").select("*").order("created_at", { ascending: false }).limit(200);
  return data || [];
}

export default async function Page() {
  const leads: any[] = await getLeads();
  return (
    <main className="min-h-screen bg-[#06111f] px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <a href="/" className="font-black text-[#f6c15a]">← HELOC CONNECT</a>
        <h1 className="mt-5 text-4xl font-black">Owner Master Portal</h1>
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#071421] p-5">
          {leads.length ? leads.map((l) => (
            <div key={l.id} className="border-b border-white/10 py-4">
              <b>{l.first_name} {l.last_name}</b> — {money(l.requested_amount)} — {l.status}
            </div>
          )) : "No leads yet. Connect Supabase and submit a test lead."}
        </div>
      </div>
    </main>
  );
}
