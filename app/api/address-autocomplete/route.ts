import { NextResponse } from "next/server";

function parse(label: string) {
  const parts = label.split(",").map((p) => p.trim());
  const street = parts[0] || label;
  const city = parts[1] || "";
  const stateZipRaw = (parts[2] || "").replace(/\bUSA\b/i, "").trim();
  const [state, zip] = stateZipRaw.split(" ").filter(Boolean);
  return { street, city, state: state || "", zip: zip || "" };
}

function clean(v: string) {
  return String(v || "").replace(/,?\s*USA\s*$/i, "").replace(/\s+/g, " ").trim();
}

async function getPlaceDetails(placeId: string, key: string) {
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

  const street = clean([get("street_number"), get("route")].filter(Boolean).join(" "));
  const city = clean(get("locality") || get("postal_town") || get("sublocality") || get("administrative_area_level_3") || get("administrative_area_level_2"));
  const state = clean(get("administrative_area_level_1", true));
  const zip = clean(get("postal_code"));
  const formatted = clean(result.formatted_address || "");

  return { label: formatted || [street, city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", "), street, city, state, zip, place_id: placeId };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!q || q.length < 3) return NextResponse.json({ results: [] });

  if (!key) {
    return NextResponse.json({
      results: [
        { label: `${q}, Irvine, CA 92618`, street: q, city: "Irvine", state: "CA", zip: "92618" },
        { label: `${q}, Lake Forest, CA 92630`, street: q, city: "Lake Forest", state: "CA", zip: "92630" },
        { label: `${q}, Mission Viejo, CA 92692`, street: q, city: "Mission Viejo", state: "CA", zip: "92692" }
      ],
      message: "Connect Google Maps API key in Vercel for live address autocomplete."
    });
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&types=address&components=country:us&key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));

  const predictions = (data?.predictions || []).slice(0, 6);
  const results = await Promise.all(
    predictions.map(async (p: any) => {
      const label = clean(p.description || "");
      const detailed = p.place_id ? await getPlaceDetails(p.place_id, key).catch(() => null) : null;
      return detailed || { label, ...parse(label), place_id: p.place_id };
    })
  );

  return NextResponse.json({ results: results.filter(Boolean) });
}
