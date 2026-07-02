import { supabaseAdmin } from "@/lib/supabase";
import { CLIENT_STATUSES, money } from "@/lib/statuses";

async function getLead(token: string) {
  if (!supabaseAdmin) return null;

  const { data: byClientToken } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("client_token", token)
    .maybeSingle();

  if (byClientToken) return byClientToken;

  const { data: byToken } = await supabaseAdmin
    .from("leads")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  return byToken;
}

export default async function StatusPage({ params }: { params: { token: string } }) {
  const lead: any = await getLead(params.token);
  const current = lead?.status || "Application Received";
  const currentIndex = Math.max(0, CLIENT_STATUSES.indexOf(current));
  const address = lead?.property_address || lead?.address || "—";

  return (
    <main className="min-h-screen bg-[#0b0a07] text-white">
      <header className="border-b border-white/10 bg-[#0f0e0a]/95 px-5 py-5">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/heloc-connect-premium-logo-v2.png?v=2" alt="HELOC CONNECT" className="h-14 w-auto max-w-[156px] object-contain drop-shadow-[0_0_18px_rgba(212,175,55,.22)]" />
            <div>
              <div className="text-xs font-black uppercase tracking-[.35em] text-[#d4af37]">Private Client Status</div>
            </div>
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-gradient-to-br from-[#18140c] to-[#0b0a07] p-6 shadow-2xl">
          <div className="text-xs font-black uppercase tracking-[.35em] text-[#d4af37]">Application Status</div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] md:text-6xl">
            Welcome, {lead?.first_name || "Client"}
          </h1>
          <p className="mt-3 max-w-3xl text-base font-semibold text-white/70">
            Your request is being reviewed through HELOC CONNECT. This page updates as your file moves through the matching process.
          </p>

          <div className="mt-6 rounded-3xl border border-[#d4af37]/35 bg-[#d4af37]/10 p-5">
            <div className="text-sm font-black uppercase tracking-[.25em] text-[#d4af37]">Current Step</div>
            <div className="mt-2 text-3xl font-black">{current}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.75fr]">
          <div className="rounded-[34px] border border-white/10 bg-[#11100b] p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Your Progress Timeline</h2>
            <div className="mt-6 space-y-4">
              {CLIENT_STATUSES.slice(0, 6).map((s, i) => {
                const active = i <= currentIndex;
                const currentStep = s === current;
                return (
                  <div key={s} className={`rounded-3xl border p-5 ${currentStep ? "border-[#d4af37] bg-[#d4af37]/10" : active ? "border-amber-400/35 bg-amber-400/10" : "border-white/10 bg-white/[.03]"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`grid h-11 w-11 place-items-center rounded-full font-black ${active ? "bg-amber-400 text-[#0b0a07]" : "bg-white/10 text-white/50"}`}>{active ? "✓" : i + 1}</div>
                      <div>
                        <div className="text-lg font-black">{s}</div>
                        <div className="text-sm font-semibold text-white/55">{currentStep ? "Current step" : active ? "Completed" : "Pending"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[34px] border border-white/10 bg-[#11100b] p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Application Snapshot</h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-black/20 p-4"><div className="text-sm text-white/45">Requested Amount</div><b className="text-2xl">{money(lead?.requested_amount)}</b></div>
              <div className="rounded-2xl bg-black/20 p-4"><div className="text-sm text-white/45">Home Value</div><b className="text-2xl">{money(lead?.home_value)}</b></div>
              <div className="rounded-2xl bg-black/20 p-4"><div className="text-sm text-white/45">Estimated Equity Room</div><b className="text-2xl">{money(lead?.equity_room)}</b></div>
              <div className="rounded-2xl bg-black/20 p-4"><div className="text-sm text-white/45">Property</div><b>{address}</b></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
