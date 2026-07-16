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
  return { street, city, state, zip };
}

function normalizedFullAddress(body: any) {
  const full = String(body.address || body.fullAddress || "").replace(/,\s*USA$/i, "").trim();
  const parsed = parseFullAddress(full);
  const street = String(body.street || body.address1 || parsed.street || "").trim();
  const city = String(body.city || parsed.city || "").trim();
  const state = String(body.state || parsed.state || "").trim();
  const zip = String(body.zip || parsed.zip || "").trim();
  return {
    full: [street, city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    street,
    city,
    state,
    zip,
    address2: [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")
  };
}

async function fetchJson(url: string, headers: Record<string, string>, timeoutMs = 6500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, cache: "no-store", signal: controller.signal });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

function pickAttomAvm(data: any): number | null {
  const property = Array.isArray(data?.property) ? data.property[0] : data?.property;
  const candidates = [
    property?.avm?.amount?.value,
    property?.avm?.value,
    property?.attomavm?.amount?.value,
    property?.attomavm?.value,
    property?.avm?.amount?.high,
    property?.attomavm?.amount?.high
  ].map(toNumber).filter((n): n is number => Boolean(n && n >= 50000));
  return candidates.length ? candidates[0] : null;
}

function pickActiveListing(data: any): number | null {
  const rows = Array.isArray(data) ? data : [];
  for (const row of rows) {
    const status = String(row?.status || "").toLowerCase();
    const price = toNumber(row?.price || row?.listPrice || row?.listedPrice);
    if (price && (!status || status.includes("active") || status.includes("sale"))) return price;
  }
  return null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const address = normalizedFullAddress(body);

  if (!address.street || !address.city || !address.state) {
    return NextResponse.json({ value: null, source: "none", message: "Please select a complete property address." }, { status: 400 });
  }

  const attempts: any[] = [];
  const rentCastKey = process.env.RENTCAST_API_KEY;

  if (rentCastKey) {
    try {
      const listingUrl = `https://api.rentcast.io/v1/listings/sale?address=${encodeURIComponent(address.full)}&limit=5`;
      const listing = await fetchJson(listingUrl, { Accept: "application/json", "X-Api-Key": rentCastKey });
      const listPrice = pickActiveListing(listing.data);
      attempts.push({ provider: "RentCast listing", status: listing.status, found: Boolean(listPrice) });
      if (listPrice) {
        return NextResponse.json({ value: listPrice, source: "active listing price", confidence: "high", message: "Current active listing price found.", attempts });
      }
    } catch (error: any) {
      attempts.push({ provider: "RentCast listing", error: error?.name === "AbortError" ? "timeout" : error?.message });
    }

    try {
      const avmUrl = `https://api.rentcast.io/v1/avm/value?address=${encodeURIComponent(address.full)}`;
      const avm = await fetchJson(avmUrl, { Accept: "application/json", "X-Api-Key": rentCastKey });
      const price = toNumber(avm.data?.price);
      attempts.push({ provider: "RentCast AVM", status: avm.status, found: Boolean(price) });
      if (price) {
        return NextResponse.json({
          value: price,
          low: toNumber(avm.data?.priceRangeLow),
          high: toNumber(avm.data?.priceRangeHigh),
          source: "RentCast AVM",
          confidence: "medium",
          message: "Current automated market estimate found.",
          attempts
        });
      }
    } catch (error: any) {
      attempts.push({ provider: "RentCast AVM", error: error?.name === "AbortError" ? "timeout" : error?.message });
    }
  }

  const attomKey = process.env.ATTOM_API_KEY;
  if (attomKey) {
    const endpoints = ["attomavm/detail", "attomavm/snapshot", "avm/detail", "avm/snapshot"];
    for (const endpoint of endpoints) {
      try {
        const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/${endpoint}?address1=${encodeURIComponent(address.street)}&address2=${encodeURIComponent(address.address2)}`;
        const result = await fetchJson(url, { accept: "application/json", apikey: attomKey });
        const value = pickAttomAvm(result.data);
        attempts.push({ provider: `ATTOM ${endpoint}`, status: result.status, found: Boolean(value) });
        if (value) {
          return NextResponse.json({ value, source: `ATTOM ${endpoint}`, confidence: "medium", message: "Current automated market estimate found.", attempts });
        }
      } catch (error: any) {
        attempts.push({ provider: `ATTOM ${endpoint}`, error: error?.name === "AbortError" ? "timeout" : error?.message });
      }
    }
  }

  return NextResponse.json({
    value: null,
    source: "unavailable",
    confidence: "none",
    message: "We could not confirm a reliable current market value. Please enter your estimated value manually.",
    attempts
  });
}
