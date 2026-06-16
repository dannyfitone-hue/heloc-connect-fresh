import { NextRequest, NextResponse } from "next/server";

function parseGoogleComponents(components: any[]) {
  const get = (type: string, short = false) => {
    const c = components.find((item: any) => item.types?.includes(type));
    return short ? c?.short_name || "" : c?.long_name || "";
  };

  const street = `${get("street_number")} ${get("route")}`.trim();
  const city =
    get("locality") ||
    get("sublocality") ||
    get("postal_town") ||
    get("administrative_area_level_2");

  return {
    street,
    city,
    state: get("administrative_area_level_1", true),
    zip: get("postal_code")
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!q || q.trim().length < 3) {
    return NextResponse.json({ results: [] });
  }

  if (!key) {
    return NextResponse.json({
      results: [],
      message: "Google address API key missing in Vercel."
    });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", q);
    url.searchParams.set("components", "country:US");
    url.searchParams.set("key", key);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();

    if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json({
        results: [],
        message: data.error_message || `Google address search: ${data.status}`
      });
    }

    const results = (data.results || []).slice(0, 5).map((item: any) => {
      const parsed = parseGoogleComponents(item.address_components || []);
      return {
        label: item.formatted_address,
        ...parsed
      };
    }).filter((item: any) => item.label);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Address autocomplete error:", error);
    return NextResponse.json({
      results: [],
      message: "Address search temporarily unavailable."
    });
  }
}
