import { NextResponse } from "next/server";

function pickValue(data: any) {
  const p = data?.property?.[0];

  return (
    p?.avm?.amount?.value ||
    p?.avm?.amount?.scr ||
    p?.avm?.amount?.high ||
    p?.avm?.amount?.low ||
    p?.avm?.value ||
    p?.assessment?.market?.mktttlvalue ||
    p?.assessment?.assessed?.assdttlvalue ||
    p?.sale?.amount?.saleamt ||
    null
  );
}

function splitFullAddress(full: string) {
  const parts = String(full || "").split(",").map((x) => x.trim()).filter(Boolean);
  const address1 = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts[2] || "";
  const address2 = [city, stateZip].filter(Boolean).join(", ");
  return { address1, address2 };
}

async function callAttom(endpoint: string, address1: string, address2: string, key: string) {
  const url =
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/${endpoint}` +
    `?address1=${encodeURIComponent(address1)}` +
    `&address2=${encodeURIComponent(address2)}`;

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
  const body = await req.json();
  const key = process.env.ATTOM_API_KEY;

  if (!key) {
    return NextResponse.json({
      value: null,
      message: "ATTOM_API_KEY is missing. Add it in Vercel to auto-pull estimated home values."
    });
  }

  let address1 = String(body.address1 || body.street || "").trim();
  let address2 = String(body.address2 || "").trim();

  if (!address2) {
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const zip = String(body.zip || "").trim();
    address2 = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  }

  if ((!address1 || !address2) && body.address) {
    const parsed = splitFullAddress(body.address);
    address1 = address1 || parsed.address1;
    address2 = address2 || parsed.address2;
  }

  if (!address1 || !address2) {
    return NextResponse.json({
      value: null,
      message: "Full property address is required for ATTOM lookup."
    });
  }

  const endpoints = [
    { name: "AVM Detail", endpoint: "avm/detail" },
    { name: "AVM Snapshot", endpoint: "avm/snapshot" },
    { name: "Basic Profile", endpoint: "property/basicprofile" },
    { name: "Assessment Snapshot", endpoint: "assessment/snapshot" },
    { name: "Assessment Detail", endpoint: "assessment/detail" },
    { name: "Sale Snapshot", endpoint: "sale/snapshot" }
  ];

  const attempts: any[] = [];

  for (const item of endpoints) {
    try {
      const result = await callAttom(item.endpoint, address1, address2, key);
      const value = pickValue(result.data);

      attempts.push({
        endpoint: item.name,
        status: result.status,
        foundValue: Boolean(value),
        propertyCount: result.data?.property?.length || 0
      });

      if (value) {
        return NextResponse.json({
          value,
          source: item.name,
          address1,
          address2,
          message: `Estimated value found through ${item.name}.`
        });
      }
    } catch (error: any) {
      attempts.push({
        endpoint: item.name,
        error: error?.message || "Request failed"
      });
    }
  }

  return NextResponse.json({
    value: null,
    address1,
    address2,
    message: "ATTOM responded, but no AVM/assessment/sale value was returned for this address. Enter estimated value manually.",
    attempts
  });
}
