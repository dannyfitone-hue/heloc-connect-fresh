import { NextResponse } from "next/server";

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function deepFindValue(obj: any): number | null {
  if (!obj || typeof obj !== "object") return null;

  const directKeys = [
    "value",
    "amount",
    "estimatedValue",
    "estimated_value",
    "avmValue",
    "avmvalue",
    "marketValue",
    "market_value",
    "mktttlvalue",
    "assdttlvalue",
    "saleamt",
    "price",
    "high",
    "low"
  ];

  for (const key of directKeys) {
    const foundKey = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase());
    if (foundKey) {
      const n = toNumber(obj[foundKey]);
      if (n && n > 25000) return n;
    }
  }

  for (const value of Object.values(obj)) {
    if (value && typeof value === "object") {
      const nested = deepFindValue(value);
      if (nested) return nested;
    }
  }

  return null;
}

function pickValue(data: any) {
  const p = data?.property?.[0] || data?.property || data;

  return (
    toNumber(p?.avm?.amount?.value) ||
    toNumber(p?.avm?.amount?.scr) ||
    toNumber(p?.avm?.amount?.high) ||
    toNumber(p?.avm?.amount?.low) ||
    toNumber(p?.avm?.value) ||
    toNumber(p?.assessment?.market?.mktttlvalue) ||
    toNumber(p?.assessment?.assessed?.assdttlvalue) ||
    toNumber(p?.sale?.amount?.saleamt) ||
    deepFindValue(p) ||
    null
  );
}

function splitFullAddress(full: string) {
  const cleaned = String(full || "").replace(/,\s*USA$/i, "").trim();
  const parts = cleaned.split(",").map((x) => x.trim()).filter(Boolean);
  const address1 = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts.find((p) => /\b[A-Z]{2}\b/.test(p) || /\d{5}/.test(p)) || parts[2] || "";
  const address2 = [city, stateZip].filter(Boolean).join(", ");
  return { address1, address2, city, stateZip };
}

function normalizeStreet(street: string) {
  return String(street || "")
    .replace(/\bDrive\b/gi, "Dr")
    .replace(/\bStreet\b/gi, "St")
    .replace(/\bAvenue\b/gi, "Ave")
    .replace(/\bRoad\b/gi, "Rd")
    .replace(/\bBoulevard\b/gi, "Blvd")
    .replace(/\bCourt\b/gi, "Ct")
    .replace(/\bPlace\b/gi, "Pl")
    .replace(/\bLane\b/gi, "Ln")
    .replace(/\s+/g, " ")
    .trim();
}

function expandStreet(street: string) {
  return String(street || "")
    .replace(/\bDr\b/gi, "Drive")
    .replace(/\bSt\b/gi, "Street")
    .replace(/\bAve\b/gi, "Avenue")
    .replace(/\bRd\b/gi, "Road")
    .replace(/\bBlvd\b/gi, "Boulevard")
    .replace(/\bCt\b/gi, "Court")
    .replace(/\bPl\b/gi, "Place")
    .replace(/\bLn\b/gi, "Lane")
    .replace(/\s+/g, " ")
    .trim();
}

function uniquePairs(pairs: { address1: string; address2: string; note: string }[]) {
  const seen = new Set<string>();
  return pairs.filter((p) => {
    const key = `${p.address1.toLowerCase()}|${p.address2.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(p.address1 && p.address2);
  });
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
  const body = await req.json().catch(() => ({}));
  const key = process.env.ATTOM_API_KEY;

  if (!key) {
    return NextResponse.json({
      value: null,
      message: "ATTOM_API_KEY is missing. Add it in Vercel to auto-pull estimated home values."
    });
  }

  const fullFromBody = String(body.address || body.fullAddress || "").trim();
  const parsed = splitFullAddress(fullFromBody);

  // Use the complete selected Google label first. The old working version relied on this.
  // The separate fields are only fallback candidates.
  const street = String(body.street || body.address1 || parsed.address1 || "").trim();
  const city = String(body.city || parsed.city || "").trim();
  const state = String(body.state || "").trim();
  const zip = String(body.zip || "").trim();
  const address2FromFields = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const address2 = String(body.address2 || parsed.address2 || address2FromFields || "").trim();

  const candidates = uniquePairs([
    { address1: parsed.address1, address2: parsed.address2, note: "full_google_label" },
    { address1: street, address2: address2FromFields || address2, note: "structured_fields" },
    { address1: normalizeStreet(parsed.address1 || street), address2: parsed.address2 || address2, note: "street_abbreviated" },
    { address1: expandStreet(parsed.address1 || street), address2: parsed.address2 || address2, note: "street_expanded" },
    { address1: parsed.address1 || street, address2: [city, state, zip].filter(Boolean).join(" "), note: "no_comma_address2" },
    { address1: parsed.address1 || street, address2: [city, zip].filter(Boolean).join(" "), note: "city_zip_only" }
  ]);

  if (!candidates.length) {
    return NextResponse.json({
      value: null,
      message: "Full property address is required for property value lookup."
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

  for (const candidate of candidates) {
    for (const item of endpoints) {
      try {
        const result = await callAttom(item.endpoint, candidate.address1, candidate.address2, key);
        const value = pickValue(result.data);

        attempts.push({
          candidate: candidate.note,
          address1: candidate.address1,
          address2: candidate.address2,
          endpoint: item.name,
          status: result.status,
          foundValue: Boolean(value),
          propertyCount: Array.isArray(result.data?.property) ? result.data.property.length : (result.data?.property ? 1 : 0)
        });

        if (value) {
          return NextResponse.json({
            value,
            source: `${item.name} / ${candidate.note}`,
            address1: candidate.address1,
            address2: candidate.address2,
            message: `Estimated value found through ${item.name}.`
          });
        }
      } catch (error: any) {
        attempts.push({
          candidate: candidate.note,
          address1: candidate.address1,
          address2: candidate.address2,
          endpoint: item.name,
          error: error?.message || "Request failed"
        });
      }
    }
  }

  return NextResponse.json({
    value: null,
    message: "Property value was not available automatically. Please enter an estimated value to continue your review.",
    attempts: attempts.slice(0, 30)
  });
}
