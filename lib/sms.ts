export function normalizePhone(input:any){
  const digits=String(input||"").replace(/\D/g,"");
  if(!digits)return "";
  if(digits.length===10)return `+1${digits}`;
  if(digits.length===11&&digits.startsWith("1"))return `+${digits}`;
  if(String(input||"").trim().startsWith("+"))return String(input).trim();
  return digits;
}

export async function sendStatusSms(phone:any, trackingId:any, status:any, token:any){
  const sid=process.env.TWILIO_ACCOUNT_SID;
  const auth=process.env.TWILIO_AUTH_TOKEN;
  const from=process.env.TWILIO_FROM_NUMBER;
  const to=normalizePhone(phone);
  if(!sid||!auth||!from||!to)return {skipped:true};
  const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://www.helocconnect.com").replace(/\/$/,"");
  const body=`HELOC CONNECT update for ${trackingId||"your application"}: ${status}. Check your private status page: ${base}/status/${token}`;
  const res=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{
    method:"POST",
    headers:{"Authorization":"Basic "+Buffer.from(`${sid}:${auth}`).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({From:from,To:to,Body:body}).toString()
  });
  if(!res.ok){return {error:await res.text()};}
  return {ok:true};
}
