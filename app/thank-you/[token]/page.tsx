import Link from "next/link";

export default function Page({ params }: { params: { token: string } }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b0a07] px-6 text-white">
      <div className="max-w-xl rounded-[28px] border border-white/10 bg-[#11100b] p-8 text-center">
        <h1 className="text-4xl font-black">Your request was received.</h1>
        <Link className="mt-6 inline-flex rounded-2xl bg-[#d4af37] px-6 py-4 font-black text-[#0b0a07]" href={`/status/${params.token}`}>View My Status</Link>
      </div>
    </main>
  );
}
