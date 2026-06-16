import { NextRequest, NextResponse } from "next/server";

function toMoney(value: any): number | null {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return null;

  // Safety guard: avoid wrong ATTOM fields like IDs, geo codes, oversized unrelated values.
  if (n < 100000 || n > 5000000) return null;

  return Math.round(n);
}

function get(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => {
    if (acc == null) return undefined;
    if (Array.isArray(acc)) return acc[0]?.[key];
    return acc[key];
  }, obj);
}

function pickAttomValue(payload: any) {
  const property = payload?.property?.[0] || payload?.property || payload?.data?.[0] || payload?.data || payload;

  // Explicit known market/AVM fields only. Do NOT deep-search random fields.
  const marketPaths = [
    "avm.amount.value",
    "avm.amount.estimatedValue",
    "avm.amount.estimate",
    "avm.value",
    "avm.estimatedValue",
    "avm.estimate",
    "assessment.market.mktttlvalue",
    "assessment.market.mktTtlValue",
    "assessment.market.marketTotalValue",
    "assessment.market.totalValue"
  ];

  for (const path of marketPaths) {
    const value = toMoney(get(property, path));
    if (value) {
      return { value, source: path };
    }
  }

  const assessedPaths = [
    "assessment.assessed.assdttlvalue",
    "assessment.assessed.assdTtlValue",
    "assessment.assessed.totalValue"
  ];

  for (const path of assessedPaths) {
    const value = toMoney(get(property, path));
    if (value) {
      return { value, source: "assessed_fallback" };
    }
  }

  return { value: null, source: "not_found" };
}

export async function POST(req: NextRequest) {
  const { address } = await req.json();

  if (!address) {
    return NextResponse.json({ value: null, message: "Address is required." }, { status: 400 });
  }

  const attomKey = process.env.ATTOM_API_KEY;

  if (!attomKey) {
    return NextResponse.json({
      value: null,
      message: "Home value lookup needs ATTOM_API_KEY in Vercel."
    });
  }

  try {
    const parts = String(address).split(",");
    const address1 = parts[0]?.trim() || String(address);
    const address2 = parts.slice(1).join(",").trim();

    const endpoints = [
      "https://api.gateway.attomdata.com/propertyapi/v1.0.0/avm/detail",
      "https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile",
      "https://api.gateway.attomdata.com/propertyapi/v1.0.0/assessment/detail"
    ];

    let fallback: any = null;

    for (const endpoint of endpoints) {
      const url = new URL(endpoint);
      url.searchParams.set("address1", address1);
      if (address2) url.searchParams.set("address2", address2);

      const res = await fetch(url.toString(), {
        headers: {
          apikey: attomKey,
          accept: "application/json"
        },
        cache: "no-store"
      });

      if (!res.ok) continue;

      const payload = await res.json();
      const picked = pickAttomValue(payload);

      if (picked.value && picked.source !== "assessed_fallback") {
        return NextResponse.json({
          value: picked.value,
          source: picked.source,
          message: "Estimated market value found."
        });
      }

      if (picked.value && !fallback) fallback = picked;
    }

    if (fallback?.value) {
      return NextResponse.json({
        value: fallback.value,
        source: "assessed_fallback",
        message: "Only assessed/tax value found. Please adjust to current market estimate if needed."
      });
    }

    return NextResponse.json({
      value: null,
      message: "Market value could not be confidently verified. Please enter estimated value manually."
    });
  } catch (error) {
    console.error("Property value lookup error:", error);
    return NextResponse.json({
      value: null,
      message: "Property value lookup is temporarily unavailable."
    });
  }
}
