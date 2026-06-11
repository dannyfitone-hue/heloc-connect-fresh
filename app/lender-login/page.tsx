export default function LenderLoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <main className="min-h-screen bg-[#06111f] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
        <form method="post" action="/api/auth/lender-login" className="w-full rounded-[34px] border border-white/10 bg-[#071421] p-8 shadow-2xl">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d9a94e]/70 bg-[#091827] text-[#f6c15a]">⌂</div>
            <div>
              <div className="text-2xl font-black tracking-[-.04em]">HELOC CONNECT</div>
              <div className="text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">Mortgage Company Portal</div>
            </div>
          </a>

          <h1 className="mt-8 text-4xl font-black tracking-[-.05em]">Lender Login</h1>
          <p className="mt-3 text-sm font-semibold text-white/65">Use the email and password assigned by HELOC CONNECT admin.</p>

          {searchParams?.error && (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-200">
              Login failed. Check email and password.
            </div>
          )}

          <label className="mt-6 block text-sm font-black uppercase tracking-[.2em] text-[#f6c15a]">Email</label>
          <input name="email" type="email" required className="mt-3 w-full rounded-2xl border border-white/15 bg-[#06101d] p-4 text-white outline-none focus:border-[#f6c15a]" />

          <label className="mt-4 block text-sm font-black uppercase tracking-[.2em] text-[#f6c15a]">Password</label>
          <input name="password" type="password" required className="mt-3 w-full rounded-2xl border border-white/15 bg-[#06101d] p-4 text-white outline-none focus:border-[#f6c15a]" />

          <button className="mt-5 w-full rounded-2xl bg-gradient-to-b from-[#ffd36d] to-[#d89425] p-4 font-black text-[#06111f]">
            Enter Lender Portal
          </button>
        </form>
      </div>
    </main>
  );
}
