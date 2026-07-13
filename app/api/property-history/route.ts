import { NextResponse } from "next/server";

function toNumber(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toDate(value: any): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseFullAddress(full: string) {
  const cleaned = String(full || "").replace(/,\s*USA$/i, "").trim();
  const parts = cleaned.split(",").map((x) => x.trim()).filter(Boolean);
  const street = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts.find((p) => /\b[A-Z]{2}\b/.test(p) || /\b\d{5}\b/.test(p)) || parts[2] || "";
  const state = stateZip.match(/\b[A-Z]{2}\b/)?.[0] || "";
  const zip = stateZip.match(/\b\d{5}(?:-\d{4})?\b/)?.[0] || "";
  return { street, city, state, zip, address2: [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ") };
}

type Sale = { amount: number; date: Date; source?: string };

function collectSales(obj: any, sales: Sale[] = [], path = "root") {
  if (!obj || typeof obj !== "object") return sales;

  const entries = Object.entries(obj);
  const amountKeyHints = [
    "saleamt", "saleamount", "saleprice", "salesprice", "saleamtrounded",
    "transactionamount", "consideration", "price", "amount"
  ];
  const dateKeyHints = [
    "saledate", "salesearchdate", "recordingdate", "settlementdate",
    "transactiondate", "transferdate", "documentdate", "date"
  ];

  let amount: number | null = null;
  let date: Date | null = null;

  for (const [key, value] of entries) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!amount && amountKeyHints.some((hint) => normalized === hint || normalized.includes(hint))) {
      amount = toNumber(value);
    }
    if (!date && dateKeyHints.some((hint) => normalized === hint || normalized.includes(hint))) {
      date = toDate(value);
    }
  }

  if (amount && amount >= 50000 && amount <= 100000000 && date) {
    sales.push({ amount, date, source: path });
  }

  for (const [key, value] of entries) {
    if (value && typeof value === "object") collectSales(value, sales, `${path}.${key}`);
  }
  return sales;
}

async function callAttom(endpoint: string, address1: string, address2: string, key: string) {
  const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/${endpoint}?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { apikey: key, accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return {};
    return await res.json().catch(() => ({}));
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseFullAddress(String(body.address || ""));
  const address1 = String(body.street || body.address1 || parsed.street || "").trim();
  const address2 = String(
    body.address2 ||
      [body.city || parsed.city, [body.state || parsed.state, body.zip || parsed.zip].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ") ||
      parsed.address2
  ).trim();
  const target = toDate(body.purchaseDate);
  const key = process.env.ATTOM_API_KEY;

  if (!address1 || !address2 || !target) {
    return NextResponse.json({ value: null, message: "Address and purchase date are required." });
  }

  if (key) {
    const allSales: Sale[] = [];
    // ATTOM plans expose sale data through different endpoints. Check all commonly available profiles.
    const endpoints = [
      "saleshistory/detail",
      "sale/snapshot",
      "property/expandedprofile",
      "property/detail",
      "property/basicprofile",
    ];

    for (const endpoint of endpoints) {
      try {
        collectSales(await callAttom(endpoint, address1, address2, key), allSales, endpoint);
      } catch {
        // Continue to the other endpoints.
      }
    }

    const unique = allSales.filter(
      (sale, i, arr) =>
        arr.findIndex(
          (x) =>
            x.amount === sale.amount &&
            x.date.toISOString().slice(0, 10) === sale.date.toISOString().slice(0, 10)
        ) === i
    );

    if (unique.length) {
      unique.sort(
        (a, b) => Math.abs(a.date.getTime() - target.getTime()) - Math.abs(b.date.getTime() - target.getTime())
      );
      const best = unique[0];
      const monthsAway = Math.abs(
        (best.date.getFullYear() - target.getFullYear()) * 12 + best.date.getMonth() - target.getMonth()
      );

      // Approximate dates are expected, so accept a recorded transfer within 24 months.
      if (monthsAway <= 24) {
        return NextResponse.json({
          value: best.amount,
          exactSale: true,
          saleDate: best.date.toISOString().slice(0, 10),
          source: "recorded property sale",
        });
      }
    }
  }

  // Do not manufacture a historical purchase price from today's value. Local market movement varies too much.
  return NextResponse.json({
    value: null,
    exactSale: false,
    message: "A reliable recorded sale was not found near that date. Please enter the approximate purchase price.",
  });
}
