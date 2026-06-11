import { NextResponse } from "next/server";

function parse(label: string) {
  const parts = label.split(",").map((p) => p.trim());
  const street = parts[0] || label;
  const city = parts[1] || "";
  const stateZip = parts[2] || "";
  const [state, zip] = stateZip.split(" ").filter(Boolean);
  return { street, city, state: state || "", zip: zip || "" };
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
        { label: `${q}, Los Angeles, CA 90012`, street: q, city: "Los Angeles", state: "CA", zip: "90012" }
      ],
      message: "Connect Google Maps API key in Vercel for live address autocomplete."
    });
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&types=address&components=country:us&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();

  const predictions = data?.predictions || [];
  const results = predictions.map((p: any) => {
    const label = p.description;
    return { label, ...parse(label), place_id: p.place_id };
  });

  return NextResponse.json({ results });
}
