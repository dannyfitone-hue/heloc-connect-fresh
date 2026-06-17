"use client";

import { useState } from "react";

type LenderUser = {
  id?: string;
  lender_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
};

export default function CreateLenderForm({ initialLenders }: { initialLenders: LenderUser[] }) {
  const [lenders, setLenders] = useState<LenderUser[]>(initialLenders || []);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);

    const form = e.currentTarget;
    const fd = new FormData(form);

    try {
      const res = await fetch("/api/owner/create-lender", {
        method: "POST",
        body: fd,
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setIsError(true);
        setMessage(json.error || "Lender user was not created.");
        return;
      }

      setMessage("Lender user created successfully.");
      form.reset();

      if (json.lender) {
        setLenders((prev) => {
          const email = String(json.lender.email || "").toLowerCase();
          const withoutDuplicate = prev.filter((u) => String(u.email || "").toLowerCase() !== email);
          return [json.lender, ...withoutDuplicate];
        });
      }
    } catch (err: any) {
      setIsError(true);
      setMessage(err?.message || "Lender user was not created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="mt-5 grid gap-3">
        <input name="lender_name" required placeholder="Lender / Agent Name" className="rounded-2xl border border-white/10 bg-[#06101d] p-4" />
        <input name="company_name" placeholder="Mortgage Company Name" className="rounded-2xl border border-white/10 bg-[#06101d] p-4" />
        <input name="email" type="email" required placeholder="Login Email" className="rounded-2xl border border-white/10 bg-[#06101d] p-4" />
        <input name="phone" placeholder="Phone" className="rounded-2xl border border-white/10 bg-[#06101d] p-4" />
        <input name="password" required placeholder="Create Password" className="rounded-2xl border border-white/10 bg-[#06101d] p-4" />
        <button disabled={busy} className="rounded-2xl bg-[#f6c15a] p-4 font-black text-[#06111f] disabled:opacity-60">
          {busy ? "Creating..." : "Create Lender User"}
        </button>
      </form>

      {message && (
        <div className={`mt-4 rounded-2xl border p-4 text-sm font-black ${isError ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>
          {message}
        </div>
      )}

      <h3 className="mt-8 text-xl font-black">Existing Network Lenders</h3>
      <div className="mt-4 grid gap-3">
        {lenders.length ? lenders.map((u, index) => (
          <div key={u.id || u.email || index} className="rounded-2xl border border-white/10 bg-[#091a2f] p-4">
            <b>{u.lender_name || "No name"}</b>
            <div className="text-sm text-white/60">{u.company_name || "No company"} • {u.email}</div>
          </div>
        )) : <div className="rounded-2xl border border-dashed border-white/15 p-5 text-white/60">No lender users yet.</div>}
      </div>
    </>
  );
}
