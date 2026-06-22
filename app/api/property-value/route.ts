import { NextResponse } from "next/server";

type Candidate = { address1: string; address2: string; source: string };

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pickValue(data: any): number | null {
  const p = Array.isArray(data?.property) ? data.property[0] : data?.property;

  const directCandidates = [
    p?.avm?.amount?.value,
    p?.avm?.amount?.scr,
    p?.avm?.amount?.high,
    p?.avm?.amount?.low,
    p?.avm?.value,
    p?.avm?.estimatedValue,
    p?.avm?.estimate,
    p?.avm?.avmValue,
    p?.assessment?.market?.mktttlvalue,
    p?.assessment?.market?.mktTtlValue,
    p?.assessment?.market?.mktTotalValue,
    p?.assessment?.market?.totalValue,
    p?.assessment?.assessed?.assdttlvalue,
    p?.assessment?.assessed?.assdTtlValue,
    p?.assessment?.assessed?.totalValue,
    p?.sale?.amount?.saleamt,
    p?.sale?.amount?.saleAmt
  ];

  for (const item of directCandidates) {
    const n = toNumber(item);
    if (n && n >= 50000 && n <= 10000000) return Math.round(n);
  }

  // ATTOM responses vary by endpoint and account permissions. This second pass
  // looks through the returned object for any plausible valuation field instead
  // of only one exact path. It intentionally avoids tiny numbers like square feet.
  const scored: Array<{ value: number; score: number; path: string }> = [];
  function walk(obj: any, path: string[] = []) {
    if (!obj || typeof obj !== "object") return;
    for (const [key, val] of Object.entries(obj)) {
      const next = [...path, key];
      const keyPath = next.join(".").toLowerCase();
      const n = toNumber(val);
      if (n && n >= 50000 && n <= 10000000) {
        let score = 0;
        if (/avm|estimate|valuation|market|mkt|assess|assd|sale/.test(keyPath)) score += 6;
        if (/value|amount|amt|price/.test(keyPath)) score += 4;
        if (/total|ttl/.test(keyPath)) score += 2;
        if (/tax|year|sqft|size|area|lot|bed|bath|lat|lon|longitude|latitude/.test(keyPath)) score -= 8;
        if (score > 0) scored.push({ value: Math.round(n), score, path: keyPath });
      }
      if (typeof val === "object") walk(val, next);
    }
  }
  walk(data);
  scored.sort((a, b) => b.score - a.score || b.value - a.value);
  return scored[0]?.value || null;
}

function splitFullAddress(full: string) {
  const parts = String(full || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => x.toUpperCase() !== "USA");

  const address1 = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts[2] || "";
  const address2 = [city, stateZip].filter(Boolean).join(", ");

  return { address1, address2, city, stateZip };
}

function clean(value: string) {
  return String(value || "")
    .replace(/,?\s*USA\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function streetVariants(street: string) {
  const s = clean(street);
  const variants = new Set<string>([s]);
  const pairs: Array<[RegExp, string]> = [
    [/\bDrive\b/i, "Dr"],
    [/\bDr\.?\b/i, "Drive"],
    [/\bStreet\b/i, "St"],
    [/\bSt\.?\b/i, "Street"],
    [/\bAvenue\b/i, "Ave"],
    [/\bAve\.?\b/i, "Avenue"],
    [/\bRoad\b/i, "Rd"],
    [/\bRd\.?\b/i, "Road"],
    [/\bLane\b/i, "Ln"],
    [/\bLn\.?\b/i, "Lane"],
    [/\bCourt\b/i, "Ct"],
    [/\bCt\.?\b/i, "Court"],
    [/\bCircle\b/i, "Cir"],
    [/\bCir\.?\b/i, "Circle"],
    [/\bPlace\b/i, "Pl"],
    [/\bPl\.?\b/i, "Place"],
    [/\bBoulevard\b/i, "Blvd"],
    [/\bBlvd\.?\b/i, "Boulevard"]
  ];
  for (const [regex, replacement] of pairs) {
    if (regex.test(s)) variants.add(s.replace(regex, replacement));
  }
  return Array.from(variants).filter(Boolean);
}

function uniqueCandidates(candidates: Candidate[]) {
  const seen = new Set<string>();
  return candidates
    .map((c) => ({ address1: clean(c.address1), address2: clean(c.address2), source: c.source }))
    .filter((c) => {
      if (!c.address1 || !c.address2) return false;
      const key = `${c.address1.toLowerCase()}|${c.address2.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}


async function placeDetails(placeId: string, key?: string | null) {
  if (!key || !placeId) return null;
  const url =
    "https://maps.googleapis.com/maps/api/place/details/json" +
    `?place_id=${encodeURIComponent(placeId)}` +
    "&fields=formatted_address,address_component" +
    `&key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  const result = data?.result;
  if (!result) return null;
  const comps = result.address_components || [];
  const get = (type: string, short = false) => {
    const c = comps.find((x: any) => Array.isArray(x.types) && x.types.includes(type));
    return c ? (short ? c.short_name : c.long_name) : "";
  };
  return {
    street: [get("street_number"), get("route")].filter(Boolean).join(" ").trim(),
    city: get("locality") || get("postal_town") || get("sublocality") || get("administrative_area_level_3"),
    state: get("administrative_area_level_1", true),
    zip: get("postal_code"),
    formatted: result.formatted_address
  };
}

async function geocodeAddress(fullAddress: string, key?: string | null) {
  if (!key || !fullAddress) return null;
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json" +
    `?address=${encodeURIComponent(fullAddress)}` +
    `&components=country:US` +
    `&key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  const result = data?.results?.[0];
  if (!result) return null;
  const comps = result.address_components || [];
  const get = (type: string, short = false) => {
    const c = comps.find((x: any) => Array.isArray(x.types) && x.types.includes(type));
    return c ? (short ? c.short_name : c.long_name) : "";
  };
  const street = [get("street_number"), get("route")].filter(Boolean).join(" ").trim();
  const city = get("locality") || get("postal_town") || get("sublocality") || get("administrative_area_level_3");
  const state = get("administrative_area_level_1", true);
  const zip = get("postal_code");
  return { street, city, state, zip, formatted: result.formatted_address };
}

async function callAttom(endpoint: string, address1: string, address2: string, key: string) {
  const url =
    `https://api.gateway.attomdata.com/propertyapi/v1.0.0/${endpoint}` +
    `?address1=${encodeURIComponent(address1)}` +
    `&address2=${encodeURIComponent(address2)}`;

  const res = await fetch(url, {
    headers: { apikey: key, accept: "application/json" },
    cache: "no-store"
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const attomKey = process.env.ATTOM_API_KEY;
  const googleKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!attomKey) {
    return NextResponse.json({ value: null, message: "Property value lookup is not connected yet. Please enter estimated value manually." });
  }

  const fullAddress = clean(body.address || body.label || "");
  const parsed = splitFullAddress(fullAddress);

  let street = clean(body.address1 || body.street || parsed.address1);
  let city = clean(body.city || parsed.city);
  let state = clean(body.state || "");
  let zip = clean(body.zip || "");

  if (body.place_id && (!street || !city || !state || !zip)) {
    const detail = await placeDetails(String(body.place_id), googleKey);
    if (detail) {
      street = street || detail.street;
      city = city || detail.city;
      state = state || detail.state;
      zip = zip || detail.zip;
    }
  }

  if ((!street || !city || !state || !zip) && fullAddress) {
    const geo = await geocodeAddress(fullAddress, googleKey);
    if (geo) {
      street = street || geo.street;
      city = city || geo.city;
      state = state || geo.state;
      zip = zip || geo.zip;
    }
  }

  const address2Full = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const address2NoZip = [city, state].filter(Boolean).join(", ");
  const parsedAddress2 = parsed.address2;

  const candidates: Candidate[] = [];
  for (const s of streetVariants(street || parsed.address1)) {
    candidates.push({ address1: s, address2: address2Full, source: "google_components_full" });
    candidates.push({ address1: s, address2: address2NoZip, source: "google_components_no_zip" });
    candidates.push({ address1: s, address2: parsedAddress2, source: "google_label" });
  }

  const finalCandidates = uniqueCandidates(candidates);
  if (!finalCandidates.length) {
    return NextResponse.json({ value: null, message: "Please select a complete property address before value lookup." });
  }

  const endpoints = [
    { name: "AVM Detail", endpoint: "avm/detail" },
    { name: "AVM Snapshot", endpoint: "avm/snapshot" },
    { name: "Basic Profile", endpoint: "property/basicprofile" },
    { name: "Expanded Profile", endpoint: "property/expandedprofile" },
    { name: "Property Detail", endpoint: "property/detail" },
    { name: "Assessment Snapshot", endpoint: "assessment/snapshot" },
    { name: "Assessment Detail", endpoint: "assessment/detail" },
    { name: "Sale Snapshot", endpoint: "sale/snapshot" }
  ];

  const attempts: any[] = [];
  for (const candidate of finalCandidates) {
    for (const item of endpoints) {
      try {
        const result = await callAttom(item.endpoint, candidate.address1, candidate.address2, attomKey);
        const value = pickValue(result.data);
        attempts.push({
          source: candidate.source,
          endpoint: item.name,
          status: result.status,
          foundValue: Boolean(value),
          propertyCount: result.data?.property?.length || 0,
          address1: candidate.address1,
          address2: candidate.address2
        });
        if (value) {
          return NextResponse.json({
            value,
            source: `${item.name} / ${candidate.source}`,
            address1: candidate.address1,
            address2: candidate.address2,
            message: "Estimated property value found."
          });
        }
      } catch (error: any) {
        attempts.push({ source: candidate.source, endpoint: item.name, error: error?.message || "Request failed", address1: candidate.address1, address2: candidate.address2 });
      }
    }
  }

  return NextResponse.json({
    value: null,
    address1: finalCandidates[0]?.address1,
    address2: finalCandidates[0]?.address2,
    message: "Property value was not available automatically. Please enter an estimated value to continue your review.",
    attempts
  });
}
