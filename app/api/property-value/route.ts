import { NextResponse } from "next/server";

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseFullAddress(full: string) {
  const cleaned = String(full || "").replace(/,\s*USA$/i, "").trim();
  const parts = cleaned.split(",").map((x) => x.trim()).filter(Boolean);
  const street = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts.find((p) => /\b[A-Z]{2}\b/.test(p) || /\b\d{5}\b/.test(p)) || parts[2] || "";
  const state = stateZip.match(/\b[A-Z]{2}\b/)?.[0] || "";
  const zip = stateZip.match(/\b\d{5}(?:-\d{4})?\b/)?.[0] || "";
  const address2 = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return { street, city, state, zip, address2 };
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

function deepFindValue(obj: any): number | null {
  if (!obj || typeof obj !== "object") return null;

  const preferredKeys = [
    "avmValue",
    "estimatedValue",
    "marketValue",
    "mktttlvalue",
    "assdttlvalue",
    "saleamt",
    "value",
    "amount",
    "high",
    "low",
    "price"
  ];

  for (const key of preferredKeys) {
    const actual = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase());
    if (actual) {
      const n = toNumber(obj[actual]);
      if (n && n >= 50000 && n <= 100000000) return n;
    }
  }

  for (const value of Object.values(obj)) {
    const nested = deepFindValue(value);
    if (nested) return nested;
  }

  return null;
}

function pickValue(data: any): number | null {
  const property = Array.isArray(data?.property) ? data.property[0] : data?.property || data;
  return (
    toNumber(property?.avm?.amount?.value) ||
    toNumber(property?.avm?.amount?.scr) ||
    toNumber(property?.avm?.amount?.high) ||
    toNumber(property?.avm?.amount?.low) ||
    toNumber(property?.avm?.value) ||
    toNumber(property?.assessment?.market?.mktttlvalue) ||
    toNumber(property?.assessment?.assessed?.assdttlvalue) ||
    toNumber(property?.sale?.amount?.saleamt) ||
    deepFindValue(property) ||
    null
  );
}

function fallbackValue(input: { address?: string; street?: string; city?: string; state?: string; zip?: string; address2?: string }): number {
  const combined = `${input.address || ""} ${input.street || ""} ${input.city || ""} ${input.state || ""} ${input.zip || ""} ${input.address2 || ""}`.toLowerCase();
  const zip = (combined.match(/\b\d{5}\b/) || [""])[0];

  const zipMap: Record<string, number> = {
    "92692": 1250000,
    "92691": 1100000,
    "92688": 1050000,
    "92618": 1350000,
    "92620": 1500000,
    "92630": 1150000,
    "92656": 1150000,
    "92677": 1600000,
    "92651": 2500000,
    "92660": 2600000,
    "92663": 2400000,
    "92657": 3500000,
    "90210": 1800000,
    "90049": 2300000,
    "91302": 1900000
  };

  if (zip && zipMap[zip]) return zipMap[zip];
  if (combined.includes("mission viejo")) return 1250000;
  if (combined.includes("irvine")) return 1400000;
  if (combined.includes("lake forest")) return 1100000;
  if (combined.includes("laguna")) return 2200000;
  if (combined.includes("newport")) return 2500000;
  if (combined.includes("beverly hills")) return 1800000;
  if (combined.includes("california") || combined.includes(" ca ") || combined.endsWith(" ca")) return 950000;
  return 850000;
}

function uniqueCandidates(candidates: { address1: string; address2: string; note: string }[]) {
  const seen = new Set<string>();
  return candidates.filter((item) => {
    const address1 = String(item.address1 || "").trim();
    const address2 = String(item.address2 || "").trim();
    if (!address1 || !address2) return false;
    const key = `${address1.toLowerCase()}|${address2.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    item.address1 = address1;
    item.address2 = address2;
    return true;
  });
}

async function callAttom(endpoint: string, address1: string, address2: string, key: string) {
  const url =
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/${endpoint}` +
    `?address1=${encodeURIComponent(address1)}` +
    `&address2=${encodeURIComponent(address2)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch(url, {
      headers: { apikey: key, accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const key = process.env.ATTOM_API_KEY;

  const full = String(body.address || body.fullAddress || "").trim();
  const parsed = parseFullAddress(full);

  const street = String(body.street || body.address1 || parsed.street || "").trim();
  const city = String(body.city || parsed.city || "").trim();
  const state = String(body.state || parsed.state || "").trim();
  const zip = String(body.zip || parsed.zip || "").trim();
  const address2FromFields = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const address2 = String(body.address2 || parsed.address2 || address2FromFields || "").trim();

  if (!street && !full) {
    return NextResponse.json({ value: null, message: "Full property address is required for value lookup." });
  }

  const candidates = uniqueCandidates([
    { address1: parsed.street, address2: parsed.address2, note: "google_full_label" },
    { address1: street, address2: address2FromFields || address2, note: "structured_fields" },
    { address1: normalizeStreet(street || parsed.street), address2: address2FromFields || address2, note: "abbreviated_street" },
    { address1: expandStreet(street || parsed.street), address2: address2FromFields || address2, note: "expanded_street" },
    { address1: street || parsed.street, address2: [city, state, zip].filter(Boolean).join(" "), note: "no_comma_address2" },
    { address1: street || parsed.street, address2: [city, zip].filter(Boolean).join(" "), note: "city_zip" }
  ]);

  const attempts: any[] = [];

  if (key && candidates.length) {
    const endpoints = [
      { name: "AVM Detail", endpoint: "avm/detail" },
      { name: "AVM Snapshot", endpoint: "avm/snapshot" },
      { name: "Basic Profile", endpoint: "property/basicprofile" },
      { name: "Assessment Snapshot", endpoint: "assessment/snapshot" },
      { name: "Assessment Detail", endpoint: "assessment/detail" },
      { name: "Sale Snapshot", endpoint: "sale/snapshot" }
    ];

    for (const candidate of candidates) {
      for (const item of endpoints) {
        try {
          const result = await callAttom(item.endpoint, candidate.address1, candidate.address2, key);
          const value = pickValue(result.data);
          attempts.push({ candidate: candidate.note, endpoint: item.name, status: result.status, foundValue: Boolean(value) });
          if (value) {
            return NextResponse.json({ value, source: `${item.name} / ${candidate.note}`, address1: candidate.address1, address2: candidate.address2, message: "Estimated property value found." });
          }
        } catch (error: any) {
          attempts.push({ candidate: candidate.note, endpoint: item.name, error: error?.name === "AbortError" ? "ATTOM timeout" : (error?.message || "Request failed") });
        }
      }
    }
  }

  const fallback = fallbackValue({ address: full, street, city, state, zip, address2 });
  return NextResponse.json({
    value: fallback,
    source: "market preview fallback",
    address1: street || parsed.street,
    address2: address2 || address2FromFields || parsed.address2,
    message: "Estimated property value preview generated. Client may adjust value if needed.",
    fallback: true,
    attempts: attempts.slice(0, 25)
  });
}
