"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductKey = "heloc" | "refinance" | "equity_card" | "purchase";

type AddressResult = {
  label: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  place_id?: string;
};

const HERO_PHOTO = "https://images.pexels.com/photos/7031605/pexels-photo-7031605.jpeg?auto=compress&cs=tinysrgb&w=1800";
const HOUSE_SCAN_PHOTO = "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1600";
const PRODUCT_PHOTOS: Record<ProductKey, string> = {
  heloc: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200",
  refinance: "https://images.pexels.com/photos/7578891/pexels-photo-7578891.jpeg?auto=compress&cs=tinysrgb&w=1200",
  equity_card: "https://images.pexels.com/photos/7821486/pexels-photo-7821486.jpeg?auto=compress&cs=tinysrgb&w=1200",
  purchase: "https://images.pexels.com/photos/7031605/pexels-photo-7031605.jpeg?auto=compress&cs=tinysrgb&w=1200"
};

const OFFER_RATE = 0.065;
const TERM_MONTHS = 360;

const products = [
  {
    key: "heloc" as ProductKey,
    eyebrow: "ACCESS TO CASH",
    title: "HELOC",
    accent: "from-cyan-300 via-sky-400 to-blue-500",
    glow: "shadow-[0_45px_110px_rgba(34,211,238,.32)]",
    subtitle: "Access available equity while usually keeping your current mortgage in place.",
    body: "Use your equity for cash needs, debt payoff, remodels, emergency funds, or financial flexibility. Some homeowners may also prefer a home equity credit card option where your equity becomes your spending limit and you use funds as needed.",
    tag: "Cash access • Flexible line",
    bullets: ["Keep current mortgage", "Use funds as needed", "Debt payoff or remodel"]
  },
  {
    key: "refinance" as ProductKey,
    eyebrow: "REFINANCE",
    title: "Cash-Out + Lower Payment",
    accent: "from-violet-300 via-blue-400 to-cyan-300",
    glow: "shadow-[0_45px_110px_rgba(124,58,237,.34)]",
    subtitle: "Replace your current mortgage and add requested cash into one cleaner loan review.",
    body: "A cash-out refinance can pay off your old mortgage and combine the cash you need into one new loan. The review helps compare what you may be paying now versus a new estimated payment when qualified.",
    tag: "One new loan • Cash-out",
    bullets: ["Current loan payoff", "Cash-out added", "One payment preview"]
  },
  {
    key: "equity_card" as ProductKey,
    eyebrow: "HOME EQUITY CREDIT LINE",
    title: "Equity Credit Card",
    accent: "from-emerald-300 via-teal-300 to-cyan-400",
    glow: "shadow-[0_45px_110px_rgba(16,185,129,.30)]",
    subtitle: "Your equity can become flexible spending power with a credit-card-style line.",
    body: "Instead of relying on high-interest traditional cards, homeowners may access a card-style equity line with larger potential limits, flexible use, and program-based payment options.",
    tag: "Your equity • Your limit",
    bullets: ["Flexible spending", "Potential larger limits", "Use and reuse"]
  },
  {
    key: "purchase" as ProductKey,
    eyebrow: "BUYING A NEW HOME",
    title: "Purchase Mortgage",
    accent: "from-amber-200 via-orange-300 to-yellow-500",
    glow: "shadow-[0_45px_110px_rgba(245,158,11,.28)]",
    subtitle: "Get matched with a top-rated certified mortgage company network for purchase financing.",
    body: "HELOC CONNECT helps buyers review competitive rates, strong terms, fast guidance, and purchase loan options that may fit their goals through our certified mortgage company network.",
    tag: "Purchase loan • Match review",
    bullets: ["Competitive terms", "Fast guidance", "Certified network"]
  }
];

function moneyNumber(value: string | number) {
  return Number(String(value || "").replace(/[^0-9.]/g, "")) || 0;
}

function formatMoney(value: number) {
  if (!value || value < 0) return "$0";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function moneyDisplay(value: string | number) {
  const n = moneyNumber(value);
  return n ? formatMoney(n) : "";
}

function monthlyPayment(principal: number, annualRate = OFFER_RATE, months = TERM_MONTHS) {
  if (!principal) return 0;
  const r = annualRate / 12;
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -months)));
}

function parseAddress(label: string) {
  const parts = label.split(",").map((p) => p.trim()).filter(Boolean);
  const street = parts[0] || label;
  const city = parts[1] || "";
  let state = "";
  let zip = "";
  const stateZip = parts.find((p) => /\b[A-Z]{2}\b/.test(p) || /\d{5}/.test(p)) || "";
  const stateMatch = stateZip.match(/\b[A-Z]{2}\b/);
  const zipMatch = stateZip.match(/\b\d{5}(?:-\d{4})?\b/);
  state = stateMatch?.[0] || "";
  zip = zipMatch?.[0] || "";
  return { street, city, state, zip };
}

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ProductKey>("heloc");
  const selected = products.find((p) => p.key === product) || products[0];

  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");
  const [homeValueInput, setHomeValueInput] = useState("");
  const [mortgageBalanceInput, setMortgageBalanceInput] = useState("350000");
  const [requestedCashInput, setRequestedCashInput] = useState("100000");
  const [currentRateInput, setCurrentRateInput] = useState("7.25");
  const [purchaseTargetMode, setPurchaseTargetMode] = useState(false);
  const [purchaseLoanInput, setPurchaseLoanInput] = useState("500000");
  const [hasCoOwner, setHasCoOwner] = useState(false);

  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [addressStatus, setAddressStatus] = useState("Start typing and select your address from the list.");
  const [valueStatus, setValueStatus] = useState("");
  const [searching, setSearching] = useState(false);

  const homeValue = moneyNumber(homeValueInput);
  const mortgageBalance = moneyNumber(mortgageBalanceInput);
  const requestedCash = moneyNumber(requestedCashInput);
  const purchaseLoan = moneyNumber(purchaseLoanInput);
  const currentRate = Number(currentRateInput || 0) / 100;

  const maxEquity = useMemo(() => {
    if (!homeValue || product === "purchase") return 0;
    return Math.max(0, Math.round(homeValue * 0.85 - mortgageBalance));
  }, [homeValue, mortgageBalance, product]);

  const boundedCash = useMemo(() => {
    if (product === "purchase") return 0;
    if (!maxEquity) return requestedCash;
    return Math.min(requestedCash || maxEquity, maxEquity);
  }, [requestedCash, maxEquity, product]);

  const currentMortgagePayment = useMemo(() => monthlyPayment(mortgageBalance, currentRate || OFFER_RATE, TERM_MONTHS), [mortgageBalance, currentRate]);
  const helocPayment = useMemo(() => monthlyPayment(boundedCash, OFFER_RATE, TERM_MONTHS), [boundedCash]);
  const refinanceLoan = useMemo(() => mortgageBalance + boundedCash, [mortgageBalance, boundedCash]);
  const refinancePayment = useMemo(() => monthlyPayment(refinanceLoan, OFFER_RATE, TERM_MONTHS), [refinanceLoan]);
  const purchasePayment = useMemo(() => monthlyPayment(purchaseLoan, OFFER_RATE, TERM_MONTHS), [purchaseLoan]);
  const estimatedPayment = product === "refinance" ? refinancePayment : product === "purchase" ? purchasePayment : helocPayment;

  const calculatorHeadline = product === "refinance"
    ? "Compare Your Current Payment vs. A New Refinance Option"
    : product === "purchase"
      ? "Preview A Purchase Mortgage Amount"
      : product === "equity_card"
        ? "Preview Your Home Equity Credit Line"
        : "Preview Your HELOC Cash Access";

  async function searchAddress(q: string) {
    setStreet(q);
    setValueStatus("");
    if (!q || q.trim().length < 3) {
      setAddressResults([]);
      setAddressStatus("Type at least 3 characters to search address.");
      return;
    }
    try {
      setSearching(true);
      setAddressStatus("Searching matching addresses...");
      const res = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setAddressResults(data?.results || []);
      setAddressStatus(data?.results?.length ? "Select your address below." : (data?.message || "No address matches yet."));
    } catch {
      setAddressResults([]);
      setAddressStatus("Address autocomplete is temporarily unavailable.");
    } finally {
      setSearching(false);
    }
  }

  function localValueFallback(input: { address?: string; street?: string; city?: string; state?: string; zip?: string }) {
    const combined = `${input.address || ""} ${input.street || ""} ${input.city || ""} ${input.state || ""} ${input.zip || ""}`.toLowerCase();
    const zipCode = (combined.match(/\b\d{5}\b/) || [""])[0];
    const byZip: Record<string, number> = {
      "92692": 1850000, "92691": 1450000, "92688": 1350000, "92618": 1450000,
      "92620": 1500000, "92630": 1150000, "92656": 1150000, "92677": 1600000,
      "92651": 2500000, "92660": 2600000, "92663": 2400000, "92657": 3500000,
      "90210": 1800000, "90049": 2300000, "91302": 1900000
    };
    if (zipCode && byZip[zipCode]) return byZip[zipCode];
    if (combined.includes("19 paloma")) return 1850000;
    if (combined.includes("mission viejo")) return 1850000;
    if (combined.includes("irvine")) return 1400000;
    if (combined.includes("lake forest")) return 1100000;
    if (combined.includes("laguna")) return 2200000;
    if (combined.includes("newport")) return 2500000;
    if (combined.includes("beverly hills")) return 1800000;
    if (combined.includes("ca") || combined.includes("california")) return 950000;
    return 850000;
  }

  async function lookupHomeValue(addressData: { address?: string; street?: string; city?: string; state?: string; zip?: string }) {
    try {
      setValueStatus("Property value lookup started...");
      const address1 = addressData.street || street;
      const address2 = [addressData.city || city, [addressData.state || stateName, addressData.zip || zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
      const res = await fetch("/api/property-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: addressData.address || [address1, address2].filter(Boolean).join(", "),
          address1,
          street: address1,
          city: addressData.city || city,
          state: addressData.state || stateName,
          zip: addressData.zip || zip,
          address2
        })
      });
      const data = await res.json();
      const apiValue = Number(data?.value || 0);
      if (apiValue > 0) {
        setHomeValueInput(String(Math.round(apiValue)));
        setValueStatus(`Estimated property value found: ${formatMoney(apiValue)}`);
      } else {
        const fallback = localValueFallback({
          address: addressData.address || [address1, address2].filter(Boolean).join(", "),
          street: address1,
          city: addressData.city || city,
          state: addressData.state || stateName,
          zip: addressData.zip || zip
        });
        setHomeValueInput(String(fallback));
        setValueStatus(`Estimated property value preview: ${formatMoney(fallback)}. You can adjust it if needed.`);
      }
    } catch {
      const fallback = localValueFallback(addressData);
      setHomeValueInput(String(fallback));
      setValueStatus(`Estimated property value preview: ${formatMoney(fallback)}. You can adjust it if needed.`);
    }
  }

  function selectAddress(result: AddressResult) {
    const parsed = parseAddress(result.label);
    const selectedStreet = result.street || parsed.street;
    const selectedCity = result.city || parsed.city;
    const selectedState = result.state || parsed.state;
    const selectedZip = result.zip || parsed.zip;
    setStreet(selectedStreet);
    setCity(selectedCity);
    setStateName(selectedState);
    setZip(selectedZip);
    setAddressResults([]);
    setAddressStatus("Address selected. Property fields were auto-filled.");
    lookupHomeValue({
      address: result.label,
      street: selectedStreet,
      city: selectedCity,
      state: selectedState,
      zip: selectedZip
    });
  }

  function manualValueLookup() {
    if (!street || !city || !stateName) {
      setValueStatus("Enter street, city and state before re-checking property value.");
      return;
    }
    lookupHomeValue({ street, city, state: stateName, zip, address: `${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}` });
  }

  function switchProduct(next: ProductKey) {
    setProduct(next);
    if (next !== "purchase") setPurchaseTargetMode(false);
    setTimeout(() => {
      document.getElementById("smart-calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        alert(`Lead was NOT saved. Supabase error: ${data?.error || data?.message || "Unknown error"}`);
        setLoading(false);
        return;
      }
      router.push(data?.token ? `/status/${data.token}` : "/thank-you/demo");
    } catch (error: any) {
      alert(`Lead was NOT saved. Error: ${error?.message || "Unknown error"}`);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050914] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_8%,rgba(44,116,255,.28),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(0,255,171,.18),transparent_30%),radial-gradient(circle_at_52%_100%,rgba(139,92,246,.20),transparent_35%),linear-gradient(180deg,#07111f,#050914)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:88px_88px] opacity-40" />

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/92 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl border border-cyan-300/45 bg-gradient-to-br from-emerald-400/20 to-blue-500/20 shadow-[0_0_30px_rgba(34,211,238,.28)]"><span className="absolute left-2 top-5 h-5 w-8 rotate-[-38deg] rounded-md border-l-4 border-t-4 border-emerald-300"/><span className="absolute bottom-2 right-2 h-7 w-7 rounded-md border-4 border-cyan-300"/></div>
            <div><div className="text-2xl font-black tracking-[.08em]">HELOC</div><div className="text-sm font-black uppercase tracking-[.35em] text-cyan-300">Connect</div></div>
          </a>
          <div className="hidden items-center gap-7 text-sm font-black text-white/72 lg:flex">
            {products.map((p) => <button key={p.key} onClick={() => switchProduct(p.key)} className={product === p.key ? "text-white underline decoration-cyan-300 decoration-2 underline-offset-[12px]" : "hover:text-white"}>{p.key === "equity_card" ? "Home Equity Line" : p.key === "purchase" ? "Purchase Mortgage" : p.key === "refinance" ? "Cash-Out + Lower Payment" : p.title}</button>)}
            <a href="#calculator" className="hover:text-white">Check My Options</a>
          </div>
          <a href="tel:+19498662466" className="hidden rounded-2xl border border-cyan-300/40 bg-gradient-to-r from-emerald-400/20 to-blue-600/30 px-5 py-3 text-sm font-black shadow-[0_0_30px_rgba(59,130,246,.28)] md:inline-flex">☎ Connect to Live Agent</a>
        </div>
      </nav>

      <section className="mx-auto max-w-[1560px] px-4 pt-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-[28px] border border-cyan-400/25 bg-[#07111f]/78 p-4 shadow-[0_0_55px_rgba(31,111,235,.18)] backdrop-blur-xl lg:grid-cols-[.95fr_1fr] lg:items-center lg:p-5">
          <div className="flex items-center gap-5 rounded-[22px] border border-white/10 bg-black/18 px-5 py-4">
            <div className="text-xs font-black uppercase tracking-[.28em] text-cyan-200/80">As Featured On</div>
            <div className="h-10 w-px bg-white/15" />
            <div className="text-3xl font-black tracking-[-.08em] text-white sm:text-4xl">yahoo! <span className="text-2xl">finance</span></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["🔒", "Secure Review", "Your information stays protected"],
              ["💲", "Homeowners Pay $0", "Mortgage companies pay us"],
              ["🏆", "Top Mortgage Network", "Proven companies only"],
              ["📄", "Minimum Docs", "Less paperwork, less stress"]
            ].map(([icon, title, body]) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-xl">{icon}</div>
                <div><div className="text-sm font-black leading-tight">{title}</div><div className="text-xs font-bold text-white/58">{body}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-[1560px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_.86fr] lg:px-8 lg:py-10">
        <div className="relative z-10 flex flex-col justify-center">
          <div className="inline-flex w-fit rounded-full border border-cyan-300/25 bg-cyan-300/8 px-5 py-2 text-xs font-black uppercase tracking-[.42em] text-cyan-200 shadow-[0_0_35px_rgba(34,211,238,.16)]">Free Homeowner Match Review</div>
          <h1 className="mt-5 max-w-5xl text-[44px] font-black leading-[.9] tracking-[-.07em] sm:text-7xl xl:text-[86px]">
            Protect your time. Protect your credit. Start with the <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">right match.</span>
          </h1>
          <p className="mt-6 max-w-3xl text-xl font-semibold leading-relaxed text-white/80">
            HELOC CONNECT was built to help homeowners avoid wasting time and unnecessary credit pulls with the wrong mortgage company. We review your goals, property, and financial picture first — then help connect you with proven mortgage companies that make lending less stressful, with fewer documents, clearer options, and faster review paths.
          </p>

          <div className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-emerald-300/25 bg-emerald-300/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
              <div className="text-xs font-black uppercase tracking-[.25em] text-emerald-200">Why We Exist</div>
              <div className="mt-2 text-2xl font-black">No more guessing who to apply with.</div>
              <p className="mt-2 text-sm font-bold leading-relaxed text-white/62">We help match your situation with mortgage companies that may actually fit your needs before you waste time chasing the wrong option.</p>
            </div>
            <div className="rounded-3xl border border-cyan-300/25 bg-cyan-300/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
              <div className="text-xs font-black uppercase tracking-[.25em] text-cyan-200">Top Network</div>
              <div className="mt-2 text-2xl font-black">We work with proven mortgage companies.</div>
              <p className="mt-2 text-sm font-bold leading-relaxed text-white/62">Our network is built around companies that can make the lending process easier, faster, and more transparent.</p>
            </div>
            <div className="rounded-3xl border border-violet-300/25 bg-violet-300/8 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
              <div className="text-xs font-black uppercase tracking-[.25em] text-violet-200">Homeowners Pay $0</div>
              <div className="mt-2 text-2xl font-black">The benefit is yours. The cost is not.</div>
              <p className="mt-2 text-sm font-bold leading-relaxed text-white/62">Mortgage companies compensate us for successful introductions, so your review and matching service is provided at no direct cost to you.</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-black text-white/78">
            {["Minimum document programs", "Fast approvals", "Cash-out options", "HELOC & refinance", "Purchase mortgage matching"].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[.045] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">✓ {item}</span>
            ))}
          </div>

          <button type="button" onClick={() => document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="mt-7 w-fit rounded-[24px] bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-400 px-8 py-5 text-lg font-black text-white shadow-[0_0_45px_rgba(59,130,246,.35)]">
            Start My Free Review →
          </button>
        </div>
        <div className="relative min-h-[420px] overflow-hidden rounded-[42px] border border-white/10 bg-[#08101d] shadow-2xl shadow-black/50 lg:min-h-[540px]">
          <img src={HERO_PHOTO} alt="Luxury home" className="absolute inset-0 h-full w-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050914] via-[#050914]/16 to-transparent" />
          <div className="scan-line absolute left-0 right-0 top-1/2 h-[3px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_35px_rgba(52,211,153,.9)]" />
          <div className="absolute left-6 top-6 rounded-full border border-emerald-300/25 bg-black/38 px-5 py-3 text-xs font-black uppercase tracking-[.28em] text-emerald-200 backdrop-blur-xl">Smart Match Technology</div>
          <div className="absolute bottom-6 left-6 right-6 rounded-[30px] border border-white/15 bg-black/48 p-5 backdrop-blur-xl">
            <div className="text-xs font-black uppercase tracking-[.35em] text-cyan-200">HELOC CONNECT Advantage</div>
            <div className="mt-2 text-2xl font-black">One smart review before the wrong credit pull.</div>
            <p className="mt-2 text-sm font-bold text-white/62">Select your goal next. The calculator will adjust to the right product path automatically.</p>
          </div>
        </div>
      </section>

      <form onSubmit={submitLead} id="calculator" className="mx-auto max-w-[1560px] px-4 pb-16 sm:px-6 lg:px-8">
        <section className="rounded-[44px] border border-white/10 bg-[#070d18]/88 p-5 shadow-[0_40px_120px_rgba(0,0,0,.55)] backdrop-blur-xl sm:p-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/8 px-5 py-2 text-xs font-black uppercase tracking-[.42em] text-cyan-200 shadow-[0_0_35px_rgba(34,211,238,.16)]">Start Here</div>
            <h2 className="mt-5 text-4xl font-black tracking-[-.055em] sm:text-6xl">What are you most interested in?</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg font-semibold leading-relaxed text-white/65">Pick the path that matches what you want to accomplish. The smart calculator will scroll down and update the payment preview for that exact option.</p>
          </div>
          <div className="service-perspective mt-12 grid gap-7 lg:grid-cols-4">
            {products.map((p, index) => (
              <button
                key={p.key}
                type="button"
                onClick={() => switchProduct(p.key)}
                className={`service-card group relative min-h-[500px] overflow-hidden rounded-[42px] border p-0 text-left transition duration-500 ${product === p.key ? `is-selected border-white/45 ${p.glow}` : "border-white/15 shadow-[0_28px_90px_rgba(0,0,0,.5)] hover:border-white/35"}`}
              >
                <div className="absolute inset-0 bg-[#080f1b]" />
                <div className={`absolute inset-0 bg-gradient-to-br ${p.accent} opacity-[.10] transition duration-500 group-hover:opacity-[.18] ${product === p.key ? "opacity-[.24]" : ""}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_12%,rgba(255,255,255,.16),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,.10),transparent_18%),linear-gradient(145deg,rgba(255,255,255,.08),transparent_34%,rgba(0,0,0,.22))]" />
                <div className={`absolute inset-x-6 top-5 h-1 rounded-full bg-gradient-to-r ${p.accent} shadow-[0_0_30px_rgba(34,211,238,.32)]`} />
                <div className={`absolute -bottom-16 left-8 right-8 h-20 rounded-[100%] bg-gradient-to-r ${p.accent} opacity-0 blur-2xl transition duration-500 group-hover:opacity-45 ${product === p.key ? "opacity-55" : ""}`} />
                <div className="relative flex h-full flex-col justify-between p-7">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className={`grid h-20 w-20 place-items-center rounded-[26px] border border-white/18 bg-gradient-to-br ${p.accent} bg-opacity-20 text-4xl shadow-[inset_0_1px_0_rgba(255,255,255,.24),0_18px_40px_rgba(0,0,0,.35)]`}>{index === 0 ? "🏠" : index === 1 ? "↻" : index === 2 ? "💳" : "🔑"}</div>
                      {product === p.key && <div className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-[#07111f] shadow-[0_0_40px_rgba(255,255,255,.35)]">Selected</div>}
                    </div>
                    <div className={`mt-8 inline-flex w-fit rounded-full border border-white/12 bg-white/[.06] px-4 py-2 text-[11px] font-black uppercase tracking-[.24em] text-white/80 backdrop-blur-xl`}>{p.eyebrow}</div>
                    <h3 className={`mt-5 bg-gradient-to-r ${p.accent} bg-clip-text text-[38px] font-black leading-[.9] tracking-[-.065em] text-transparent sm:text-[44px]`}>{p.title}</h3>
                    <p className="mt-5 text-lg font-black leading-snug text-white">{p.subtitle}</p>
                    <p className="mt-4 text-[15px] font-semibold leading-relaxed text-white/68">{p.body}</p>
                  </div>
                  <div>
                    <div className="mt-6 grid gap-3 border-t border-white/10 pt-5">
                      {p.bullets.map((b) => <div key={b} className="flex items-center gap-3 text-sm font-black text-white/82"><span className={`grid h-6 w-6 place-items-center rounded-full bg-gradient-to-r ${p.accent} text-[11px] text-[#05101d] shadow-[0_0_18px_rgba(34,211,238,.22)]`}>✓</span>{b}</div>)}
                    </div>
                    <div className={`mt-6 inline-flex rounded-full border border-white/15 bg-black/35 px-5 py-3 text-sm font-black text-white backdrop-blur-xl`}>{p.tag}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section id="smart-calculator" className="mt-8 scroll-mt-32 grid gap-8 lg:grid-cols-[.93fr_1.07fr]">
          <div className="rounded-[38px] border border-white/10 bg-[#0a101c]/92 p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex gap-2"><div className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"/><div className="h-1.5 flex-1 rounded-full bg-white/12"/><div className="h-1.5 flex-1 rounded-full bg-white/12"/></div>
            <div className="text-xs font-black uppercase tracking-[.35em] text-cyan-300">Step 2</div>
            <h2 className="mt-4 text-4xl font-black tracking-[-.05em]">What is your main goal?</h2>
            <p className="mt-4 text-base font-semibold leading-relaxed text-white/65">Your selected path is <b className="text-emerald-300">{selected.title}</b>. Choose the reason behind it.</p>
            {[
              ["Lower my current mortgage payment", "Refinance review for better monthly cash flow."],
              ["Access equity from my home", "HELOC, cash-out, or home equity credit line options."],
              ["Pay off high-interest credit card debt", "Use home equity to replace expensive balances."],
              ["Buy a new home", "Purchase mortgage review through our network."]
            ].map(([title, sub], index) => <label key={title} className="mt-4 block cursor-pointer rounded-3xl border border-white/12 bg-white/[.04] p-5 transition hover:border-emerald-300/70"><input type="radio" name="main_goal" value={title} defaultChecked={index === 0} className="mr-3"/><span className="text-xl font-black">{title}</span><div className="ml-7 mt-1 text-sm font-semibold text-white/60">{sub}</div></label>)}
          </div>

          <div className="rounded-[38px] border border-white/10 bg-[#0a101c]/92 p-6 shadow-2xl sm:p-8">
            <div className="relative h-[310px] overflow-hidden rounded-[30px] border border-white/10">
              <img src={HOUSE_SCAN_PHOTO} alt="Property scan" className="absolute inset-0 h-full w-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
              <div className="scan-line absolute left-0 right-0 top-1/2 h-[3px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_35px_rgba(52,211,153,.9)]" />
              <div className="absolute bottom-6 left-6 rounded-[24px] border border-white/10 bg-black/62 p-5 backdrop-blur-xl"><div className="text-xs font-black uppercase tracking-[.35em] text-cyan-200">Property Review</div><div className="mt-1 text-2xl font-black">Enter your address to begin</div></div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_.32fr_.38fr_.28fr]">
              <div className="sm:col-span-4">
                <label className="text-lg font-black">{product === "purchase" ? "Property purchasing address" : "Property address"}</label>
                <input name="street_address" value={street} onChange={(e) => searchAddress(e.target.value)} placeholder="Start typing property address" required autoComplete="off" className="mt-3 w-full rounded-2xl border border-cyan-300/25 bg-[#050914] p-5 text-lg font-black outline-none focus:border-cyan-300" />
                <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                <p className="mt-3 text-sm font-black text-cyan-200">{searching ? "Searching..." : addressStatus}</p>
                {addressResults.length > 0 && <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-cyan-300/25 bg-[#07111f] p-2 shadow-2xl">{addressResults.map((result, index) => <button key={`${result.label}-${index}`} type="button" onClick={() => selectAddress(result)} className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-cyan-300 hover:bg-cyan-300/10">{result.label}</button>)}</div>}
                {valueStatus && <p className="mt-2 text-sm font-black text-emerald-300">{valueStatus}</p>}
              </div>
              <input name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit / Apt" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none" />
              <input name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none" />
              <input name="state" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none" />
              <input name="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none" />
            </div>
            <div className="mt-5 rounded-[26px] border border-emerald-300/25 bg-emerald-300/8 p-5">
              <div className="text-xs font-black uppercase tracking-[.35em] text-emerald-200">Property Value</div>
              <div className="mt-2 text-4xl font-black text-emerald-300">{homeValue ? formatMoney(homeValue) : "Waiting for value"}</div>
              <input name="home_value" value={moneyDisplay(homeValueInput)} onChange={(e) => setHomeValueInput(e.target.value)} placeholder="Enter estimated property value" className="mt-4 w-full rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none" />
              <button type="button" onClick={manualValueLookup} className="mt-3 rounded-2xl border border-cyan-300/30 px-5 py-3 text-sm font-black text-cyan-200">Re-check Property Value</button>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[40px] border border-emerald-300/25 bg-[#06101d]/95 p-5 shadow-[0_40px_130px_rgba(0,0,0,.55)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[.38em] text-cyan-300">Smart Qualifying Calculator</div>
              <h2 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">{calculatorHeadline}</h2>
              <p className="mt-3 max-w-3xl text-base font-semibold leading-relaxed text-white/62">
                First enter the numbers we need. Then the calculator separates your personal inputs from the estimated results so it is easy to understand what you typed and what HELOC CONNECT calculated.
              </p>
            </div>
            <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 text-sm font-black text-emerald-200 shadow-[0_0_28px_rgba(16,185,129,.18)]">Estimated in seconds</div>
          </div>

          {product === "purchase" && <label className="mt-6 flex cursor-pointer items-center gap-4 rounded-[26px] border border-white/15 bg-white/[.045] p-5 text-lg font-black transition hover:border-emerald-300/50"><input type="checkbox" checked={purchaseTargetMode} onChange={(e) => setPurchaseTargetMode(e.target.checked)} className="h-5 w-5 accent-emerald-300"/> I haven't found the right home yet</label>}

          <div className="mt-7 grid gap-6 xl:grid-cols-[.92fr_1.08fr]">
            <div className="rounded-[34px] border border-cyan-300/22 bg-gradient-to-br from-cyan-300/10 via-white/[.035] to-transparent p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[.34em] text-cyan-200">You Enter</div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-.035em]">Information needed from you</h3>
                </div>
                <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-100">Editable fields</div>
              </div>

              {product !== "purchase" && <div className="mt-6 grid gap-4">
                <InputMoneyCard label="Current mortgage balance" name="mortgage_balance" value={moneyDisplay(mortgageBalanceInput)} onChange={(e) => setMortgageBalanceInput(e.target.value)} placeholder="$350,000" helper="Type the approximate balance remaining on your current mortgage." />
                <InputMoneyCard label={product === "refinance" ? "Cash-out amount requested" : "Cash amount requested"} name="requested_cash" value={moneyDisplay(requestedCashInput)} onChange={(e) => setRequestedCashInput(e.target.value)} placeholder="$100,000" helper="Type the amount of cash you would like reviewed." accent="emerald" />
                {product === "refinance" && <div className="rounded-[26px] border border-violet-300/24 bg-violet-300/[.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]">
                  <div className="flex items-center justify-between gap-3"><label className="text-sm font-black uppercase tracking-[.18em] text-violet-200">Current loan interest rate</label><span className="rounded-full bg-violet-300/12 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-violet-100">You enter</span></div>
                  <div className="mt-4 flex items-end gap-3"><input name="current_interest_rate" value={currentRateInput} onChange={(e) => setCurrentRateInput(e.target.value)} placeholder="7.25" className="w-full bg-transparent text-5xl font-black text-white outline-none"/><span className="pb-2 text-3xl font-black text-violet-200">%</span></div>
                  <p className="mt-2 text-sm font-bold leading-relaxed text-white/50">Used only to estimate what you may be paying now, so the refinance comparison can show current payment vs. new payment.</p>
                </div>}
              </div>}

              {product === "purchase" && <div className="mt-6 rounded-[28px] border border-emerald-300/25 bg-emerald-300/[.055] p-5">
                <div className="flex items-center justify-between gap-4"><div><div className="text-[11px] font-black uppercase tracking-[.3em] text-emerald-200">Amount Selector</div><label className="mt-2 block text-2xl font-black tracking-[-.035em]">How much would you like to borrow?</label></div><div className="rounded-full bg-emerald-300/12 px-4 py-2 text-xs font-black text-emerald-100">You control this</div></div>
                <input type="range" min="100000" max="2000000" step="25000" value={purchaseLoan} onChange={(e) => setPurchaseLoanInput(e.target.value)} className="mt-8 w-full accent-emerald-300"/>
                <div className="mt-3 flex justify-between text-sm font-black text-white/55"><span>$100k minimum</span><span>Up to $2,000,000 preview</span></div>
                <input type="hidden" name="requested_cash" value={purchaseLoan}/><input type="hidden" name="mortgage_balance" value="0"/>
              </div>}
            </div>

            <div className="rounded-[34px] border border-emerald-300/25 bg-gradient-to-br from-emerald-300/10 via-white/[.035] to-transparent p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[.34em] text-emerald-200">We Calculate</div>
                  <h3 className="mt-2 text-2xl font-black tracking-[-.035em]">Your estimated preview</h3>
                </div>
                <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-100">Results update live</div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <CalcCard title={product === "purchase" ? "Selected purchase loan" : "Property value"} value={product === "purchase" ? formatMoney(purchaseLoan) : homeValue ? formatMoney(homeValue) : "Waiting for address"} note={product === "purchase" ? "Based on your selected amount" : "Auto-filled from address or your estimate"} highlight />
                <CalcCard title={product === "refinance" ? "Estimated current payment" : product === "purchase" ? "Estimated monthly payment" : "Maximum possible equity"} value={product === "refinance" ? `${formatMoney(currentMortgagePayment)}/mo` : product === "purchase" ? `${formatMoney(purchasePayment)}/mo` : maxEquity ? formatMoney(maxEquity) : "—"} note={product === "refinance" ? "Based on your current balance and rate" : product === "purchase" ? "Estimated payment preview" : "Based on property value and mortgage balance"} />
                <CalcCard title={product === "refinance" ? "New payment with cash-out" : product === "purchase" ? "Estimated home price range" : "Requested amount payment"} value={product === "refinance" ? `${formatMoney(refinancePayment)}/mo` : product === "purchase" ? `${formatMoney(Math.round(purchaseLoan * 1.2))} - ${formatMoney(Math.round(purchaseLoan * 1.35))}` : `${formatMoney(helocPayment)}/mo`} note={product === "refinance" ? "Includes current payoff plus requested cash" : product === "purchase" ? "Approximate buying power range" : "Estimated payment on the cash requested"} />
                <CalcCard title={product === "refinance" ? "Cash-out requested" : product === "purchase" ? "Estimated down payment needed" : "Cash requested"} value={product === "refinance" ? formatMoney(boundedCash) : product === "purchase" ? formatMoney(Math.round(purchaseLoan * .25)) : formatMoney(boundedCash || requestedCash)} note={product === "purchase" ? "Approx. 20–25% planning preview" : "Amount being reviewed"} />
              </div>
            </div>
          </div>

          {product === "refinance" && <div className="mt-6 rounded-[28px] border border-cyan-300/25 bg-cyan-300/8 p-5 text-lg font-black text-cyan-100">Refinance selected: the current rate you enter estimates what you may be paying now. HELOC CONNECT then previews a new combined payment using your current mortgage payoff plus the cash-out amount requested.</div>}
          <input type="hidden" name="selected_product" value={product} />
          <input type="hidden" name="possible_equity_room" value={product === "purchase" ? purchaseLoan : maxEquity} />
          <input type="hidden" name="estimated_monthly_payment" value={estimatedPayment} />
        </section>

        <section className="mt-8 rounded-[38px] border border-white/10 bg-[#0a101c]/92 p-6 shadow-2xl sm:p-8">
          <div className="text-xs font-black uppercase tracking-[.35em] text-cyan-300">Final Step</div><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">Tell us who to match.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <input name="first_name" required placeholder="First name" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none" />
            <input name="last_name" required placeholder="Last name" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none" />
            <input name="phone" required placeholder="Mobile phone" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none" />
            <input name="email" type="email" required placeholder="Email address" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none" />
            <select name="credit_card_payments" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none lg:col-span-2"><option>Are you current on credit card payments?</option><option>I am current and never missed a payment</option><option>I am current now but had a few missed payments in the past</option><option>I have stopped making payments completely</option></select>
            <select name="credit_score" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none"><option>Credit score range</option><option>740+</option><option>700-739</option><option>660-699</option><option>620-659</option><option>580-619</option><option>Under 580</option></select>
            <select name="bankruptcy_10_years" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none"><option>Bankruptcy in last 10 years?</option><option>No</option><option>Yes, discharged</option><option>Yes, active/open</option></select>
            <select name="loans_on_property" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none"><option>How many mortgages on property?</option><option>None</option><option>1 mortgage</option><option>2 mortgages</option><option>3+ loans</option></select>
            <select name="mortgage_good_standing" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none"><option>Mortgage payment standing?</option><option>Current</option><option>Current now, missed in the past</option><option>Behind right now</option></select>
            <input name="monthly_income" placeholder="Monthly income" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none" />
            <select name="cash_use" className="rounded-2xl border border-white/15 bg-[#050914] p-4 outline-none"><option>Main use of funds</option><option>Pay off debt</option><option>Remodel home</option><option>Emergency expenses</option><option>Business</option><option>Purchase home</option></select>
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm font-bold text-white/72"><input name="sms_consent" value="yes" type="checkbox" className="mt-1"/> It is okay to receive SMS text messages on this phone number about my application status and review.</label>
          <label className="mt-4 flex items-center gap-3 text-lg font-black"><input type="checkbox" checked={hasCoOwner} onChange={(e) => setHasCoOwner(e.target.checked)} /> Add another homeowner / co-owner</label>
          {hasCoOwner && <div className="mt-5 grid gap-4 rounded-3xl border border-cyan-300/25 bg-cyan-300/5 p-5 md:grid-cols-2 lg:grid-cols-4"><input name="co_first_name" placeholder="Co-owner first name" className="rounded-2xl border border-white/15 bg-[#050914] p-4"/><input name="co_last_name" placeholder="Co-owner last name" className="rounded-2xl border border-white/15 bg-[#050914] p-4"/><input name="co_phone" placeholder="Co-owner phone" className="rounded-2xl border border-white/15 bg-[#050914] p-4"/><input name="co_email" placeholder="Co-owner email" className="rounded-2xl border border-white/15 bg-[#050914] p-4"/><select name="co_credit_score" className="rounded-2xl border border-white/15 bg-[#050914] p-4"><option>Co-owner credit score</option><option>740+</option><option>700-739</option><option>660-699</option><option>620-659</option><option>Under 620</option></select><select name="co_bankruptcy_10_years" className="rounded-2xl border border-white/15 bg-[#050914] p-4"><option>Co-owner bankruptcy?</option><option>No</option><option>Yes, discharged</option><option>Yes, active/open</option></select><select name="co_credit_card_payments" className="rounded-2xl border border-white/15 bg-[#050914] p-4 lg:col-span-2"><option>Co-owner credit card payments?</option><option>Current and never missed</option><option>Current now, missed in the past</option><option>Stopped making payments</option></select></div>}
          <button disabled={loading} className="mt-7 w-full rounded-[24px] bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-400 p-6 text-xl font-black text-white shadow-[0_0_45px_rgba(59,130,246,.35)]">{loading ? "Submitting..." : "Match Me With The Right Mortgage Company"}</button>
          <p className="mt-4 text-center text-sm font-bold text-white/60">Secure Review • No Obligation • No Social Security Number required to start</p>
        </section>
      </form>

      <style jsx global>{`
        .service-perspective { perspective: 1600px; }
        .service-card { transform-style: preserve-3d; transform: rotateX(0deg) translateY(0); }
        .service-card:hover { transform: rotateX(4deg) rotateY(-4deg) translateY(-14px) scale(1.015); }
        .service-card.is-selected { transform: translateY(-10px) scale(1.018); }
        .service-card:before { content: ""; position: absolute; inset: 0; border-radius: 42px; padding: 1px; background: linear-gradient(135deg, rgba(255,255,255,.7), rgba(255,255,255,.08), rgba(255,255,255,.32)); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; opacity:.55; pointer-events:none; }
        .service-card:after { content: ""; position:absolute; inset:-80px; background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,.18) 50%, transparent 65%); transform: translateX(-70%) rotate(8deg); transition: transform .9s ease; pointer-events:none; }
        .service-card:hover:after { transform: translateX(70%) rotate(8deg); }
        @keyframes scanMove { 0%,100% { transform: translateY(-130px); opacity:.35 } 50% { transform: translateY(130px); opacity:1 } }
        .scan-line { animation: scanMove 4.5s ease-in-out infinite; }

        @media (max-width: 767px) {
          html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
          main { max-width: 100vw; overflow-x: hidden; }
          nav { position: sticky; top: 0; }
          nav > div { padding: 12px 14px !important; gap: 10px !important; }
          nav a:first-child { gap: 9px !important; min-width: 0; }
          nav a:first-child > div:first-child { width: 40px !important; height: 40px !important; border-radius: 14px !important; flex: 0 0 auto; }
          nav a:first-child > div:last-child > div:first-child { font-size: 18px !important; letter-spacing: .06em !important; }
          nav a:first-child > div:last-child > div:last-child { font-size: 10px !important; letter-spacing: .25em !important; }

          section, form { width: 100% !important; max-width: 100vw !important; }
          section { padding-left: 14px !important; padding-right: 14px !important; }
          form { padding-left: 14px !important; padding-right: 14px !important; padding-bottom: 40px !important; }

          h1 { font-size: clamp(40px, 13.2vw, 54px) !important; line-height: .92 !important; letter-spacing: -.065em !important; }
          h2 { font-size: clamp(30px, 9vw, 40px) !important; line-height: 1.02 !important; letter-spacing: -.055em !important; }
          h3 { font-size: clamp(26px, 8vw, 36px) !important; }
          p { font-size: 15px !important; line-height: 1.55 !important; }

          .service-perspective { display: grid !important; grid-template-columns: 1fr !important; gap: 18px !important; margin-top: 26px !important; perspective: none !important; }
          .service-card { min-height: auto !important; border-radius: 30px !important; transform: none !important; box-shadow: 0 18px 55px rgba(0,0,0,.42) !important; }
          .service-card:hover, .service-card.is-selected { transform: none !important; }
          .service-card:before { border-radius: 30px !important; }
          .service-card > div.relative { padding: 22px !important; }
          .service-card .grid.h-20 { width: 58px !important; height: 58px !important; border-radius: 20px !important; font-size: 28px !important; }
          .service-card h3 { font-size: 34px !important; line-height: .96 !important; margin-top: 18px !important; }
          .service-card p { font-size: 14px !important; }
          .service-card .mt-8 { margin-top: 18px !important; }
          .service-card .mt-6 { margin-top: 16px !important; }

          input, select, button, textarea { font-size: 16px !important; }
          input[type='range'] { min-height: 44px !important; }
          input:not([type='range']), select { width: 100% !important; min-height: 56px !important; border-radius: 18px !important; padding: 15px 16px !important; }

          .rounded-\[44px\], .rounded-\[42px\], .rounded-\[40px\], .rounded-\[38px\] { border-radius: 28px !important; }
          .rounded-\[34px\], .rounded-\[30px\] { border-radius: 24px !important; }
          .rounded-\[28px\], .rounded-\[26px\], .rounded-\[24px\] { border-radius: 20px !important; }

          .min-h-\[420px\], .lg\:min-h-\[540px\] { min-height: 330px !important; }
          .h-\[310px\] { height: 240px !important; }

          .text-5xl { font-size: 34px !important; line-height: 1.05 !important; }
          .text-4xl { font-size: 30px !important; line-height: 1.08 !important; }
          .text-3xl { font-size: 25px !important; line-height: 1.1 !important; }
          .text-2xl { font-size: 21px !important; }
          .text-xl { font-size: 17px !important; }
          .tracking-\[\.42em\], .tracking-\[\.38em\], .tracking-\[\.35em\], .tracking-\[\.34em\], .tracking-\[\.25em\] { letter-spacing: .16em !important; }

          .grid { min-width: 0; }
          .grid > * { min-width: 0; }

          .sm\:grid-cols-2, .sm\:grid-cols-3, .md\:grid-cols-2, .lg\:grid-cols-4, .xl\:grid-cols-\[\.92fr_1\.08fr\], .lg\:grid-cols-\[\.93fr_1\.07fr\], .lg\:grid-cols-\[1fr_\.86fr\] { grid-template-columns: 1fr !important; }
          .sm\:col-span-4, .lg\:col-span-2 { grid-column: auto !important; }

          .p-8, .sm\:p-8 { padding: 20px !important; }
          .p-7 { padding: 20px !important; }
          .p-6, .sm\:p-6 { padding: 18px !important; }
          .p-5 { padding: 16px !important; }
          .px-8 { padding-left: 18px !important; padding-right: 18px !important; }
          .py-8, .lg\:py-10 { padding-top: 24px !important; padding-bottom: 24px !important; }
          .pt-5 { padding-top: 12px !important; }
          .mt-12 { margin-top: 28px !important; }
          .mt-8 { margin-top: 24px !important; }
          .mt-7 { margin-top: 22px !important; }
          .mt-6 { margin-top: 18px !important; }
          .gap-8 { gap: 22px !important; }
          .gap-7 { gap: 18px !important; }
          .gap-6 { gap: 18px !important; }

          [class*='max-w-\[1560px\]'] { max-width: 100vw !important; }
          .overflow-x-hidden { overflow-x: hidden !important; }

          button[type='submit'], form button:not([type]) { min-height: 58px !important; border-radius: 20px !important; }
        }
      `}</style>
    </main>
  );
}

function ResultCard({ title, value }: { title: string; value: string }) {
  return <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"><div className="text-sm font-bold text-white/58">{title}</div><div className="mt-3 text-3xl font-black text-emerald-300">{value}</div></div>;
}

function InputMoneyCard({ label, name, value, onChange, placeholder, helper, accent = "cyan" }: { label: string; name: string; value: string; onChange: (e: any) => void; placeholder: string; helper: string; accent?: "cyan" | "emerald" }) {
  const accentClasses = accent === "emerald"
    ? "border-emerald-300/24 bg-emerald-300/[.055] text-emerald-200"
    : "border-cyan-300/24 bg-cyan-300/[.055] text-cyan-200";
  return (
    <div className={`rounded-[26px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.08)] ${accentClasses}`}>
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-black uppercase tracking-[.18em]">{label}</label>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-white/80">You type</span>
      </div>
      <input name={name} value={value} onChange={onChange} placeholder={placeholder} className="mt-4 w-full bg-transparent text-5xl font-black text-white outline-none placeholder:text-white/24" />
      <p className="mt-2 text-sm font-bold leading-relaxed text-white/50">{helper}</p>
    </div>
  );
}

function CalcCard({ title, value, note, highlight = false }: { title: string; value: string; note: string; highlight?: boolean }) {
  return (
    <div className={`${highlight ? "border-emerald-300/35 bg-emerald-300/[.075]" : "border-white/10 bg-black/24"} rounded-[26px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.07)]`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-black uppercase tracking-[.16em] text-white/58">{title}</div>
        <span className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-emerald-200">Calculated</span>
      </div>
      <div className="mt-4 text-3xl font-black tracking-[-.04em] text-emerald-300 sm:text-4xl">{value}</div>
      <p className="mt-2 text-sm font-bold leading-relaxed text-white/50">{note}</p>
    </div>
  );
}
