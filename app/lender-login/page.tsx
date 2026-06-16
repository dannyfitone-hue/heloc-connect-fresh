"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LenderLoginInner(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const params=useSearchParams();
  const next=params.get("next")||"/lender";
  async function submit(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError("");
    const res=await fetch("/api/lenders/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    const data=await res.json().catch(()=>({}));
    setLoading(false);
    if(!res.ok){setError(data.error||"Login failed.");return;}
    window.location.href=next;
  }
  return <main className="min-h-screen bg-[#071321] text-white flex items-center justify-center px-5">
    <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] border border-amber-300/25 bg-white/5 p-8 shadow-2xl backdrop-blur">
      <div className="mb-6"><div className="text-sm font-black tracking-[.35em] text-amber-300">HELOC CONNECT</div><h1 className="mt-3 text-3xl font-black">Lender Login</h1><p className="mt-2 text-sm text-slate-300">Access leads assigned to your mortgage company.</p></div>
      <label className="text-xs font-black text-slate-300">Email</label><input value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 mb-4 w-full rounded-xl border border-white/15 bg-[#0a1728] p-4 outline-none" type="email" />
      <label className="text-xs font-black text-slate-300">Password</label><input value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0a1728] p-4 outline-none" type="password" />
      {error&&<p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{error}</p>}
      <button disabled={loading} className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#f1bd58] to-[#ffe19a] p-4 font-black text-slate-950">{loading?"Logging in...":"Login"}</button>
      <a className="mt-4 block text-center text-sm text-slate-300" href="/">Back to website</a>
    </form>
  </main>
}

export default function LenderLogin(){return <Suspense fallback={<main className="min-h-screen bg-[#071321]"/>}><LenderLoginInner/></Suspense>}
