import { NextResponse } from "next/server";

function clean(value: any) {
  return String(value || "")
    .replace(/,?\s*USA\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function pickRentCastValue(data: any): number | null {
  const directCandidates = [
    data?.price,
    data?.value,
    data?.estimatedValue,
    data?.estimate,
    data?.avm,
    data?.priceEstimate,
    data?.priceRangeLow && data?.priceRangeHigh
      ? (toNumber(data.priceRangeLow)! + toNumber(data.priceRangeHigh)!) / 2
      : null,
  ];

  for (const item of directCandidates) {
    const n = toNumber(item);
    if (n && n >= 50000 && n <= 10000000) return Math.round(n);
  }

  const scored: Array<{ value: number; score: number; path: string }> = [];
  function walk(obj: any, path: string[] = []) {
    if (!obj || typeof obj !== "object") return;
    for (const [key, val] of Object.entries(obj)) {
      const next = [...path, key];
      const keyPath = next.join(".").toLowerCase();
      const n = toNumber(val);
      if (n && n >= 50000 && n <= 10000000) {
        let score = 0;
        if (/price|value|estimate|avm|valuation/.test(keyPath)) score += 8;
        if (/range|low|high/.test(keyPath)) score += 2;
        if (/rent|tax|year|sqft|size|area|lot|bed|bath|lat|lon|longitude|latitude/.test(keyPath)) score -= 10;
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
  const parts = clean(full)
    .split(",")
    .map((x) => clean(x))
    .filter(Boolean)
    .filter((x) => x.toUpperCase() !== "USA");

  const street = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts[2] || "";
  const stateZipParts = stateZip.split(" ").filter(Boolean);
  const state = stateZipParts[0] || "";
  const zip = stateZipParts.find((p) => /^\d{5}/.test(p)) || "";

  return { street, city, state, zip };
}

function formatAddress(street: string, city: string, state: string, zip: string, fallback: string) {
  const line = [clean(street), clean(city), [clean(state), clean(zip)].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return clean(line || fallback);
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
    city: get("locality") || get("postal_town") || get("sublocality") || get("administrative_area_level_3") || get("administrative_area_level_2"),
    state: get("administrative_area_level_1", true),
    zip: get("postal_code"),
    formatted: clean(result.formatted_address || ""),
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
  return {
    street: [get("street_number"), get("route")].filter(Boolean).join(" ").trim(),
    city: get("locality") || get("postal_town") || get("sublocality") || get("administrative_area_level_3") || get("administrative_area_level_2"),
    state: get("administrative_area_level_1", true),
    zip: get("postal_code"),
    formatted: clean(result.formatted_address || ""),
  };
}

async function callRentCast(address: string, key: string) {
  const url =
    "https://api.rentcast.io/v1/avm/value" +
    `?address=${encodeURIComponent(address)}` +
    "&compCount=5" +
    "&lookupSubjectAttributes=true";

  const res = await fetch(url, {
    headers: { "X-Api-Key": key, accept: "application/json" },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rentCastKey = process.env.RENTCAST_API_KEY;
    const googleKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!rentCastKey) {
      return NextResponse.json({
        value: null,
        message: "Property value lookup is not connected yet. Please enter estimated value manually.",
      });
    }

    const fullAddress = clean(body.address || body.label || "");
    const parsed = splitFullAddress(fullAddress);

    let street = clean(body.address1 || body.street || parsed.street);
    let city = clean(body.city || parsed.city);
    let state = clean(body.state || parsed.state);
    let zip = clean(body.zip || parsed.zip);

    if (body.place_id && (!street || !city || !state || !zip)) {
      const detail = await placeDetails(String(body.place_id), googleKey);
      if (detail) {
        street = street || clean(detail.street);
        city = city || clean(detail.city);
        state = state || clean(detail.state);
        zip = zip || clean(detail.zip);
      }
    }

    if ((!street || !city || !state || !zip) && fullAddress) {
      const geo = await geocodeAddress(fullAddress, googleKey);
      if (geo) {
        street = street || clean(geo.street);
        city = city || clean(geo.city);
        state = state || clean(geo.state);
        zip = zip || clean(geo.zip);
      }
    }

    const candidates = Array.from(
      new Set(
        [
          formatAddress(street, city, state, zip, fullAddress),
          fullAddress,
          formatAddress(street, city, state, "", fullAddress),
        ]
          .map(clean)
          .filter(Boolean)
      )
    );

    if (!candidates.length) {
      return NextResponse.json({
        value: null,
        message: "Please select a complete property address before value lookup.",
      });
    }

    const attempts: any[] = [];
    for (const address of candidates) {
      try {
        const result = await callRentCast(address, rentCastKey);
        const value = pickRentCastValue(result.data);
        attempts.push({
          provider: "RentCast",
          endpoint: "Value Estimate",
          status: result.status,
          foundValue: Boolean(value),
          address,
          accuracy: result.data?.accuracy || null,
          error: result.data?.error || null,
        });

        if (value) {
          return NextResponse.json({
            value,
            source: "RentCast Value Estimate",
            address,
            accuracy: result.data?.accuracy || null,
            priceRangeLow: result.data?.priceRangeLow || null,
            priceRangeHigh: result.data?.priceRangeHigh || null,
            message: "Estimated property value found.",
          });
        }
      } catch (error: any) {
        attempts.push({
          provider: "RentCast",
          endpoint: "Value Estimate",
          address,
          error: error?.message || "Request failed",
        });
      }
    }

    return NextResponse.json({
      value: null,
      address: candidates[0],
      message: "Property value was not available automatically. Please enter an estimated value to continue your review.",
      attempts,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        value: null,
        message: "Value lookup is unavailable right now. You can enter the value manually.",
        error: error?.message || "Unknown error",
      },
      { status: 200 }
    );
  }
}
