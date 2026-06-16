"use client";
import {useEffect,useState} from "react";
import StatusBar from "@/components/StatusBar";
import {supabaseBrowser} from "@/lib/supabaseBrowser";

export default function ClientStatus({token}:{token:string}){
  const[lead,setLead]=useState<any>(null);
  const[docs,setDocs]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const supabase=supabaseBrowser();

  async function load(){
    const res=await fetch(`/api/client/${token}?t=${Date.now()}`, { cache: "no-store" });
    const data=await res.json();
    setLead(data.lead);
    setDocs(data.documents||[]);
    setLoading(false);
  }

  useEffect(()=>{
    load();
    const interval = setInterval(load, 7000);
    return () => clearInterval(interval);
  },[]);

  async function uploadDoc(documentId:string,file:File){
    const filePath=`${token}/${documentId}-${file.name}`;
    const{error}=await supabase.storage.from("client-documents").upload(filePath,file,{upsert:true});
    if(error){alert(error.message);return}
    await fetch("/api/documents/uploaded",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({documentId,filePath,fileName:file.name})
    });
    await load();
  }

  if(loading)return <div className="p-10">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3 font-black">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-700 text-white">HC</div>
            HELOC CONNECT Funding Status
          </div>
          <div className="rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-black text-green-700">Private secure link</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <section className="rounded-3xl bg-gradient-to-br from-navy to-[#132946] p-9 text-white shadow-xl">
          <h1 className="text-4xl font-black">Your Funding Progress</h1>
          <p className="mt-3 max-w-3xl text-blue-100">
            Check your process status and upload documents only when your funding team requests them.
          </p>
        </section>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border bg-white p-7 shadow">
            <h2 className="text-2xl font-black">Application Summary</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between border-b pb-2"><span className="font-bold text-slate-500">Tracking ID</span><b>{lead?.tracking_id}</b></div>
              <div className="flex justify-between border-b pb-2"><span className="font-bold text-slate-500">Status</span><b>{lead?.status}</b></div>
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-7 shadow">
            <h2 className="text-2xl font-black">Next Step</h2>
            <p className="mt-3 text-slate-600">
              {lead?.status==="Documents Requested"
                ?"Please upload the requested documents below."
                :"Your file is being reviewed. If documents are needed, they will appear below."}
            </p>
          </section>
        </div>

        <section className="mt-5 rounded-3xl border bg-white p-7 shadow">
          <h2 className="text-2xl font-black">Funding Process Status</h2>
          <StatusBar status={lead?.status||"Application Received"}/>
        </section>

        <section className="mt-5 rounded-3xl border bg-white p-7 shadow">
          <h2 className="text-2xl font-black">Requested Documents</h2>
          <p className="mt-2 text-slate-600">If documents are needed, they will appear here with an upload button.</p>

          <div className="mt-5 space-y-4">
            {docs.length===0&&<p className="text-slate-500">No documents requested at this time.</p>}
            {docs.map(doc=>(
              <div key={doc.id} className="grid gap-3 rounded-2xl border bg-slate-50 p-4 md:grid-cols-[1fr_.4fr_1fr] md:items-center">
                <div>
                  <b>{doc.document_type}</b>
                  <p className="text-sm text-slate-500">{doc.note||""}</p>
                </div>
                <span className={"rounded-full px-3 py-2 text-center text-xs font-black "+(doc.status==="Uploaded"?"bg-green-100 text-green-700":"bg-amber-100 text-amber-700")}>
                  {doc.status}
                </span>
                <div>
                  {doc.status==="Uploaded"
                    ?<b>{doc.file_name}</b>
                    :<input type="file" className="w-full rounded-xl border bg-white p-3" onChange={e=>e.target.files?.[0]&&uploadDoc(doc.id,e.target.files[0])}/>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
