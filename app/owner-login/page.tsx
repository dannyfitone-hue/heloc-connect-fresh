export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <main className="min-h-screen bg-[#0b0a07] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
        <form method="post" action="/api/auth/owner-login" className="w-full rounded-[34px] border border-white/10 bg-[#11100b] p-8 shadow-2xl">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d9a94e]/70 bg-[#14110a] text-[#d4af37]">⌂</div>
            <div>
              <img src="/heloc-connect-logo-full.png" alt="HELOC CONNECT" className="h-16 w-auto object-contain" />
              <div className="text-xs font-black uppercase tracking-[.35em] text-[#d4af37]">Owner Command Center</div>
            </div>
          </a>

          <h1 className="mt-8 text-4xl font-black tracking-[-.05em]">Secure Portal Login</h1>
          <p className="mt-3 text-sm font-semibold text-white/65">This private area is not linked from the public website.</p>

          {searchParams?.error && (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-200">
              Incorrect password. Please try again.
            </div>
          )}

          <label className="mt-6 block text-sm font-black uppercase tracking-[.2em] text-[#d4af37]">Password</label>
          <input name="password" type="password" required className="mt-3 w-full rounded-2xl border border-white/15 bg-[#0f0e0a] p-4 text-white outline-none focus:border-[#d4af37]" />

          <button className="mt-5 w-full rounded-2xl bg-gradient-to-b from-[#d4af37] to-[#b88920] p-4 font-black text-[#0b0a07]">
            Enter Portal
          </button>
        </form>
      </div>
    </main>
  );
}
