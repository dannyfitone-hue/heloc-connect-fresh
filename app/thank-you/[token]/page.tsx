import Link from "next/link";
import StatusBar from "@/components/StatusBar";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function ThankYouPage({params}:{params:Promise<{token:string}>}){
  const { token } = await params;
  const supabase=supabaseAdmin();

  const{data:lead}=await supabase
    .from("leads")
    .select("*")
    .eq("client_token",token)
    .single();

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50">
      <div className="mx-auto w-full max-w-5xl px-5 py-5 sm:py-6 md:py-8">
        <section className="rounded-[1.4rem] sm:rounded-3xl bg-gradient-to-br from-navy to-[#132946] p-9 text-white shadow-xl">
          <h1 className="text-2xl sm:text-2xl sm:text-3xl md:text-4xl font-black">Thank You — Your Request Has Been Submitted</h1>
          <p className="mt-3 max-w-3xl text-blue-100">
            Your home equity funding request has been received. A funding specialist will review your information and contact you with the next step.
          </p>
        </section>

        <section className="mt-5 rounded-[1.4rem] sm:rounded-3xl border bg-white p-7 shadow">
          <h2 className="text-2xl font-black">Current Process Status</h2>
          <StatusBar status={lead?.status||"Application Received"}/>
          <Link href={`/status/${token}`} className="mt-5 inline-flex rounded-2xl bg-blue-700 px-5 py-4 font-black text-white">
            View My Private Status Page
          </Link>
        </section>
      </div>
    </main>
  );
}
