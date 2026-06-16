import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLenderSession } from "@/lib/lenderAuth";
export async function GET(req: NextRequest) {
  const user = await getLenderSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = supabaseAdmin();
  let query = s.from("leads").select("*").eq("assigned_company_id", user.company_id).order("created_at", { ascending: false });
  if (user.role === "agent") query = query.eq("assigned_user_id", user.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const leads=data||[]; const ids=leads.map((l:any)=>l.id);
  let notes:any[]=[]; let documents:any[]=[];
  if(ids.length){
   const nr=await s.from("lead_notes").select("*").in("lead_id",ids).order("created_at",{ascending:false});
   if(!nr.error) notes=nr.data||[];
   const dr=await s.from("lead_documents").select("*").in("lead_id",ids).order("created_at",{ascending:false});
   if(!dr.error) documents=dr.data||[];
  }
  const enriched=leads.map((lead:any)=>({...lead,notes:notes.filter((n:any)=>n.lead_id===lead.id),documents:documents.filter((d:any)=>d.lead_id===lead.id)}));
  return NextResponse.json({ leads: enriched, user });
}
