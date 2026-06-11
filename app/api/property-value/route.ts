import { NextResponse } from "next/server";

function pickValue(data: any) {
  const p = data?.property?.[0];

  return (
    p?.avm?.amount?.value ||
    p?.avm?.amount?.scr ||
    p?.avm?.value ||
    p?.assessment?.market?.mktttlvalue ||
    p?.assessment?.assessed?.assdttlvalue ||
    p?.assessment?.assessed?.assdimprvalue ||
    p?.sale?.amount?.saleamt ||
    null
  );
}

async function callAttom(url: string, key: string) {
  const res = await fetch(url, {
    headers: {
      apikey: key,
      accept: "application/json"
    },
    cache: "no-store"
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function POST(req: Request) {
  const { address } = await req.json();
  const key = process.env.ATTOM_API_KEY;

  if (!address) {
    return NextResponse.json({ value: null, message: "Address is required." });
  }

  if (!key) {
    return NextResponse.json({
      value: null,
      message: "ATTOM_API_KEY is missing. Add it in Vercel to auto-pull estimated home values."
    });
  }

  const cleanAddress = String(address).trim();

  const endpoints = [
    {
      name: "AVM Detail",
      url: `https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail?address1=${encodeURIComponent(cleanAddress)}&address2=`
    },
    {
      name: "AVM Snapshot",
      url: `https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/snapshot?address1=${encodeURIComponent(cleanAddress)}&address2=`
    },
    {
      name: "Basic Profile",
      url: `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?address1=${encodeURIComponent(cleanAddress)}&address2=`
    },
    {
      name: "Assessment Snapshot",
      url: `https://api.gateway.attomdata.com/propertyapi/v1.0.0/assessment/snapshot?address1=${encodeURIComponent(cleanAddress)}&address2=`
    },
    {
      name: "Assessment Detail",
      url: `https://api.gateway.attomdata.com/propertyapi/v1.0.0/assessment/detail?address1=${encodeURIComponent(cleanAddress)}&address2=`
    },
    {
      name: "Sale Snapshot",
      url: `https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot?address1=${encodeURIComponent(cleanAddress)}&address2=`
    }
  ];

  const attempts: any[] = [];

  for (const endpoint of endpoints) {
    try {
      const result = await callAttom(endpoint.url, key);
      const value = pickValue(result.data);

      attempts.push({
        endpoint: endpoint.name,
        status: result.status,
        foundValue: Boolean(value)
      });

      if (value) {
        return NextResponse.json({
          value,
          source: endpoint.name,
          message: `Estimated value found through ${endpoint.name}.`
        });
      }
    } catch (error: any) {
      attempts.push({
        endpoint: endpoint.name,
        error: error?.message || "Request failed"
      });
    }
  }

  return NextResponse.json({
    value: null,
    message: "ATTOM responded, but no AVM/assessment/sale value was returned for this address. Enter estimated value manually.",
    attempts
  });
}
