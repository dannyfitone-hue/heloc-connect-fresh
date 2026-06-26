import { NextResponse } from "next/server";

function parse(label: string) {
  const parts = label.split(",").map((p) => p.trim()).filter(Boolean);
  const street = parts[0] || label;
  const city = parts[1] || "";
  const stateZip = parts.find((p) => /\b[A-Z]{2}\b/.test(p) || /\d{5}/.test(p)) || "";
  const state = stateZip.match(/\b[A-Z]{2}\b/)?.[0] || "";
  const zip = stateZip.match(/\b\d{5}(?:-\d{4})?\b/)?.[0] || "";
  return { street, city, state, zip };
}

function component(components: any[], type: string, useShort = false) {
  const item = components.find((c: any) => c.types?.includes(type));
  return item ? (useShort ? item.short_name : item.long_name) : "";
}

async function getPlaceDetails(placeId: string, key: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=address_component,formatted_address&key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  const components = data?.result?.address_components || [];
  const streetNumber = component(components, "street_number");
  const route = component(components, "route");
  const city = component(components, "locality") || component(components, "postal_town") || component(components, "sublocality") || component(components, "administrative_area_level_3");
  const state = component(components, "administrative_area_level_1", true);
  const zip = component(components, "postal_code");
  const street = [streetNumber, route].filter(Boolean).join(" ") || (data?.result?.formatted_address || "").split(",")[0];
  return {
    label: data?.result?.formatted_address || [street, city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    street,
    city,
    state,
    zip,
    place_id: placeId
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!q || q.length < 3) return NextResponse.json({ results: [] });

  if (!key) {
    return NextResponse.json({
      results: [
        { label: `${q}, Mission Viejo, CA 92692`, street: q, city: "Mission Viejo", state: "CA", zip: "92692" },
        { label: `${q}, Irvine, CA 92618`, street: q, city: "Irvine", state: "CA", zip: "92618" },
        { label: `${q}, Lake Forest, CA 92630`, street: q, city: "Lake Forest", state: "CA", zip: "92630" }
      ],
      message: "Connect Google Maps API key in Vercel for live address autocomplete."
    });
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&types=address&components=country:us&key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  const predictions = data?.predictions || [];

  const results = await Promise.all(predictions.slice(0, 6).map(async (p: any) => {
    try {
      return await getPlaceDetails(p.place_id, key);
    } catch {
      const label = p.description;
      return { label, ...parse(label), place_id: p.place_id };
    }
  }));

  return NextResponse.json({ results });
}
