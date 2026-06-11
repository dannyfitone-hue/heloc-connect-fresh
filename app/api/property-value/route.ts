import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { address } = await req.json();
  const key = process.env.ATTOM_API_KEY;

  if (!address) return NextResponse.json({ value: null, message: "Address is required." });

  if (!key) {
    return NextResponse.json({
      value: null,
      message: "ATTOM_API_KEY is missing. Add it in Vercel to auto-pull estimated home values."
    });
  }

  try {
    const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?address1=${encodeURIComponent(address)}&address2=`;
    const res = await fetch(url, { headers: { apikey: key, accept: "application/json" } });
    const data = await res.json();
    const p = data?.property?.[0];
    const value =
      p?.avm?.amount?.value ||
      p?.assessment?.assessed?.assdttlvalue ||
      p?.assessment?.market?.mktttlvalue ||
      null;

    if (!value) {
      return NextResponse.json({ value: null, message: "No property value returned. Enter estimated value manually." });
    }

    return NextResponse.json({ value, source: p?.avm?.amount?.value ? "avm" : "assessed_fallback" });
  } catch (error: any) {
    return NextResponse.json({ value: null, message: error?.message || "Property value lookup failed." });
  }
}
