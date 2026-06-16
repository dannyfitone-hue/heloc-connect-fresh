"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OwnerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/owner";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(next);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full rounded-[2rem] border border-white/10 bg-white/[.06] p-6 shadow-2xl backdrop-blur md:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d6ae5f] font-black text-[#06111f]">
          HC
        </div>
        <div>
          <h1 className="text-2xl font-black">Owner Login</h1>
          <p className="text-sm text-slate-300">HELOC CONNECT admin access</p>
        </div>
      </div>

      <label className="text-sm font-bold text-slate-200">Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none placeholder:text-slate-400 focus:border-[#d6ae5f]"
        placeholder="Enter dashboard password"
        autoFocus
      />
      {error && <p className="mt-3 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}
      <button
        disabled={loading}
        className="mt-5 w-full rounded-2xl bg-[#d6ae5f] px-5 py-4 font-black text-[#06111f] disabled:opacity-60"
      >
        {loading ? "Checking..." : "Enter Dashboard"}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-slate-400">
        This area is restricted. Set OWNER_DASHBOARD_PASSWORD in Vercel environment variables.
      </p>
    </form>
  );
}

export default function OwnerLoginPage() {
  return (
    <main className="min-h-screen bg-[#06111f] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <Suspense
          fallback={
            <div className="w-full rounded-[2rem] border border-white/10 bg-white/[.06] p-8 text-center text-slate-300 shadow-2xl backdrop-blur">
              Loading secure login...
            </div>
          }
        >
          <OwnerLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
