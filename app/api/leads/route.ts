import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
function token(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36)}
function num(v:any){return Number(String(v||"").replace(/[^0-9.]/g,""))||0}
export async function POST(req:Request){
 const body=await req.json(); const t=token();
 if(!supabaseAdmin) return NextResponse.json({token:t, warning:"Supabase not configured"});
 const lead={token:t,first_name:body.first_name,last_name:body.last_name,phone:body.phone,email:body.email,address:body.property_address||body.street_address,city:body.city,state:body.state,zip:body.zip,home_value:num(body.home_value),mortgage_balance:num(body.mortgage_balance),requested_amount:num(body.requested_cash),equity_room:num(body.possible_equity_room),estimated_payment:num(body.estimated_monthly_payment),loans_on_property:body.loans_on_property,credit_score:body.credit_score,income:num(body.monthly_income),mortgage_standing:body.mortgage_good_standing,goal:body.loan_purpose,status:"Application Received"};
 const {error}=await supabaseAdmin.from("leads").insert(lead);
 if(error) return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({token:t});
}
