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

function collectSales(obj: any, sales: Array<{ amount: number; date: Date }> = []) {
  if (!obj || typeof obj !== "object") return sales;
  const entries = Object.entries(obj);
  const amountKeys = ["saleamt", "saleamount", "saleprice", "price", "amount"];
  const dateKeys = ["saledate", "salesearchdate", "date", "recordingdate", "settlementdate"];
  let amount: number | null = null;
  let date: Date | null = null;
  for (const [key, value] of entries) {
    const k = key.toLowerCase();
    if (amountKeys.includes(k)) amount = amount || toNumber(value);
    if (dateKeys.includes(k)) date = date || toDate(value);
  }
  if (amount && amount >= 50000 && amount <= 100000000 && date) sales.push({ amount, date });
  for (const [, value] of entries) if (value && typeof value === "object") collectSales(value, sales);
  return sales;
}

async function callAttom(endpoint: string, address1: string, address2: string, key: string) {
  const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/${endpoint}?address1=${encodeURIComponent(address1)}&address2=${encodeURIComponent(address2)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, { headers: { apikey: key, accept: "application/json" }, cache: "no-store", signal: controller.signal });
    return await res.json().catch(() => ({}));
  } finally { clearTimeout(timeout); }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseFullAddress(String(body.address || ""));
  const address1 = String(body.street || body.address1 || parsed.street || "").trim();
  const address2 = String(body.address2 || [body.city || parsed.city, [body.state || parsed.state, body.zip || parsed.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ") || parsed.address2).trim();
  const target = toDate(body.purchaseDate);
  const key = process.env.ATTOM_API_KEY;
  const currentValue = toNumber(body.currentValue);
  if (!address1 || !address2 || !target) return NextResponse.json({ value: null, message: "Address and purchase date are required." });

  if (key) {
    const allSales: Array<{ amount: number; date: Date }> = [];
    for (const endpoint of ["property/detail", "property/basicprofile"]) {
      try { collectSales(await callAttom(endpoint, address1, address2, key), allSales); } catch {}
    }
    const unique = allSales.filter((sale, i, arr) => arr.findIndex((x) => x.amount === sale.amount && x.date.toISOString().slice(0,10) === sale.date.toISOString().slice(0,10)) === i);
    if (unique.length) {
      unique.sort((a,b) => Math.abs(a.date.getTime()-target.getTime()) - Math.abs(b.date.getTime()-target.getTime()));
      const best = unique[0];
      const monthsAway = Math.abs((best.date.getFullYear()-target.getFullYear())*12 + best.date.getMonth()-target.getMonth());
      if (monthsAway <= 18) return NextResponse.json({ value: best.amount, exactSale: true, saleDate: best.date.toISOString().slice(0,10), source: "recorded property sale" });
    }
  }

  if (currentValue) {
    const now = new Date();
    const years = Math.max(0, (now.getTime() - target.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const estimated = Math.round(currentValue / Math.pow(1.04, years));
    return NextResponse.json({ value: estimated, exactSale: false, source: "purchase-period market estimate" });
  }
  return NextResponse.json({ value: null, message: "Purchase-period value unavailable." });
}
