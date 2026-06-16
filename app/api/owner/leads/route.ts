import {NextRequest,NextResponse} from "next/server";
import {supabaseAdmin} from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(){
 const s=supabaseAdmin();
 const {data,error}=await s.from("leads").select("*").order("created_at",{ascending:false});
 if(error){
  console.error("Owner leads load failed:", error);
  return NextResponse.json({error:error.message, details:error.details || null, hint:error.hint || null},{status:500});
 }
 const leads=data||[];
 const ids=leads.map((l:any)=>l.id).filter(Boolean);
 let notes:any[]=[]; let documents:any[]=[];
 if(ids.length){
  const nr=await s.from("lead_notes").select("*").in("lead_id",ids).order("created_at",{ascending:false});
  if(!nr.error) notes=nr.data||[]; else console.warn("Lead notes load skipped:", nr.error.message);
  const dr=await s.from("lead_documents").select("*").in("lead_id",ids).order("created_at",{ascending:false});
  if(!dr.error) documents=dr.data||[]; else console.warn("Lead documents load skipped:", dr.error.message);
 }
 const enriched=leads.map((lead:any)=>({
  ...lead,
  notes:notes.filter((n:any)=>n.lead_id===lead.id),
  documents:documents.filter((d:any)=>d.lead_id===lead.id)
 }));
 return NextResponse.json({leads:enriched},{headers:{"Cache-Control":"no-store, no-cache, must-revalidate, proxy-revalidate"}});
}

export async function DELETE(req:NextRequest){
 const s=supabaseAdmin();
 const {searchParams}=new URL(req.url);
 let leadId=searchParams.get("leadId") || searchParams.get("id") || "";
 if(!leadId){
  try{const b=await req.json(); leadId=b.leadId || b.id || "";}catch{}
 }
 if(!leadId) return NextResponse.json({error:"Missing leadId"},{status:400});

 // Delete related records first so deletion works even if cascade was not applied in Supabase.
 const docs=await s.from("lead_documents").delete().eq("lead_id",leadId);
 if(docs.error) console.warn("Lead documents delete skipped:", docs.error.message);
 const notes=await s.from("lead_notes").delete().eq("lead_id",leadId);
 if(notes.error) console.warn("Lead notes delete skipped:", notes.error.message);

 const {error}=await s.from("leads").delete().eq("id",leadId);
 if(error){
  console.error("Owner lead delete failed:", error);
  return NextResponse.json({error:error.message, details:error.details || null, hint:error.hint || null},{status:500});
 }
 return NextResponse.json({ok:true});
}
