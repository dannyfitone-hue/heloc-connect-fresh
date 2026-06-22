import { NextResponse } from "next/server";

function pickValue(data: any) {
  const p = data?.property?.[0];
  const amount = p?.avm?.amount;

  return (
    amount?.value ||
    amount?.scr ||
    amount?.high ||
    amount?.low ||
    (typeof amount === "number" ? amount : null) ||
    p?.avm?.value ||
    p?.assessment?.market?.mktttlvalue ||
    p?.assessment?.assessed?.assdttlvalue ||
    p?.sale?.amount?.saleamt ||
    null
  );
}

function splitFullAddress(full: string) {
  const parts = String(full || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  const address1 = parts[0] || "";
  const city = parts[1] || "";
  let stateZip = parts[2] || "";
  if (stateZip.toUpperCase() === "USA" && parts[3]) stateZip = parts[3];
  const address2 = [city, stateZip].filter(Boolean).join(", ");

  return { address1, address2 };
}

function cleanAddress2(value: string) {
  return String(value || "")
    .replace(/,?\s*USA\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueCandidates(candidates: Array<{ address1: string; address2: string; source: string }>) {
  const seen = new Set<string>();
  return candidates
    .map((c) => ({
      address1: String(c.address1 || "").trim(),
      address2: cleanAddress2(c.address2),
      source: c.source
    }))
    .filter((c) => {
      if (!c.address1 || !c.address2) return false;
      const key = `${c.address1.toLowerCase()}|${c.address2.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
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
  const body = await req.json();
  const key = process.env.ATTOM_API_KEY;

  if (!key) {
    return NextResponse.json({
      value: null,
      message: "Property value lookup is not connected yet. Please enter estimated value manually."
    });
  }

  const fullAddress = String(body.address || "").trim();
  const parsed = splitFullAddress(fullAddress);

  const providedAddress1 = String(body.address1 || body.street || "").trim();
  let providedAddress2 = String(body.address2 || "").trim();

  if (!providedAddress2) {
    const city = String(body.city || "").trim();
    const state = String(body.state || "").trim();
    const zip = String(body.zip || "").trim();
    providedAddress2 = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  }

  // Important: keep the old working behavior as a fallback.
  // Google sometimes returns city/state without ZIP, while ATTOM can be picky about address2.
  // We try the selected parsed address and the full Google label formats before giving up.
  const candidates = uniqueCandidates([
    { address1: parsed.address1, address2: parsed.address2, source: "full_google_label" },
    { address1: providedAddress1, address2: providedAddress2, source: "selected_parts" },
    { address1: providedAddress1 || parsed.address1, address2: parsed.address2 || providedAddress2, source: "mixed_full_label" }
  ]);

  if (!candidates.length) {
    return NextResponse.json({
      value: null,
      message: "Please select a complete property address before value lookup."
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
          candidate: candidate.source,
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
            message: `Estimated property value found.`
          });
        }
      } catch (error: any) {
        attempts.push({
          candidate: candidate.source,
          endpoint: item.name,
          error: error?.message || "Request failed",
          address1: candidate.address1,
          address2: candidate.address2
        });
      }
    }
  }

  return NextResponse.json({
    value: null,
    address1: candidates[0]?.address1,
    address2: candidates[0]?.address2,
    message: "Property value was not available automatically. Please enter an estimated value to continue your review.",
    attempts
  });
}
