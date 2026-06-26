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
    glow: "shadow-[0_30px_80px_rgba(34,211,238,.22)]",
    subtitle: "Access the equity you have already built while usually keeping your current mortgage in place.",
    body: "A Home Equity Line of Credit can help with cash needs, debt payoff, remodels, emergency funds, or financial flexibility. Some homeowners may also prefer a home equity credit card option where your equity becomes your spending limit and you use funds as needed.",
    tag: "Cash access • Flexible line",
    bullets: ["Keep current mortgage", "Use funds as needed", "Great for debt or remodel"]
  },
  {
    key: "refinance" as ProductKey,
    eyebrow: "REFINANCE",
    title: "Cash-Out + Lower Payment",
    accent: "from-violet-300 via-blue-400 to-cyan-300",
    glow: "shadow-[0_30px_80px_rgba(99,102,241,.24)]",
    subtitle: "Replace your current mortgage and add the cash you need into one cleaner loan review.",
    body: "A refinance can pay off your existing mortgage and combine requested cash-out into one new loan. The goal is simple: review whether a better available term, easier payment, and cash-out option may fit your situation when qualified.",
    tag: "One new loan • Cash-out",
    bullets: ["Current loan payoff", "Cash-out added", "One payment preview"]
  },
  {
    key: "equity_card" as ProductKey,
    eyebrow: "HOME EQUITY CREDIT LINE",
    title: "Equity Credit Card",
    accent: "from-emerald-300 via-teal-300 to-cyan-400",
    glow: "shadow-[0_30px_80px_rgba(16,185,129,.22)]",
    subtitle: "Your equity can become flexible spending power with a card-style credit line option.",
    body: "Instead of relying on high-interest traditional cards, homeowners may access a credit-card-style equity line with larger potential limits, flexible use, and program-based payment options.",
    tag: "Your equity • Your limit",
    bullets: ["Flexible spending", "Potentially larger limits", "Use as needed"]
  },
  {
    key: "purchase" as ProductKey,
    eyebrow: "BUYING A NEW HOME",
    title: "Purchase Mortgage",
    accent: "from-amber-200 via-orange-300 to-violet-300",
    glow: "shadow-[0_30px_80px_rgba(245,158,11,.20)]",
    subtitle: "Buying a home? Get connected with a top-rated certified mortgage company network.",
    body: "HELOC CONNECT helps buyers review competitive purchase loan options, strong terms, fast guidance, and mortgage companies that may fit their goals through our certified network.",
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
      if (data?.value) {
        setHomeValueInput(String(Math.round(Number(data.value))));
        setValueStatus(`Estimated property value found: ${formatMoney(Number(data.value))}`);
      } else {
        setValueStatus("Property value was not available automatically. Please enter an estimated value to continue your review.");
      }
    } catch {
      setValueStatus("Property value lookup is temporarily unavailable. Please enter an estimated value to continue.");
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

      <section className="mx-auto max-w-[1560px] px-4 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-[26px] border border-cyan-400/30 bg-[#07111f]/80 p-4 shadow-[0_0_50px_rgba(31,111,235,.18)] backdrop-blur-xl lg:flex lg:items-center lg:justify-between lg:gap-7">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4 lg:min-w-[360px] lg:border-b-0 lg:border-r lg:pb-0 lg:pr-7">
            <div className="text-xs font-black uppercase tracking-[.25em] text-white/65">As Featured On</div>
            <div className="text-3xl font-black tracking-[-.08em] text-white sm:text-4xl">yahoo! <span className="text-2xl">finance</span></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:flex lg:flex-1 lg:justify-between">
            {[
              ["🛡", "Secure Review", "Your information is always protected"],
              ["📄", "No Obligation", "Completely free to review"],
              ["👥", "Top Mortgage Network", "Matched with mortgage companies"],
              ["⚡", "Fast & Easy", "Get matched quickly"]
            ].map(([icon, title, body]) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl bg-white/[.035] px-4 py-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl">{icon}</div>
                <div><div className="font-black">{title}</div><div className="text-xs font-semibold text-white/65">{body}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1560px] items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl border border-cyan-300/40 bg-gradient-to-br from-emerald-400/20 to-blue-500/20 shadow-[0_0_30px_rgba(34,211,238,.28)]"><span className="absolute left-2 top-5 h-5 w-8 rotate-[-38deg] rounded-md border-l-4 border-t-4 border-emerald-300"/><span className="absolute bottom-2 right-2 h-7 w-7 rounded-md border-4 border-cyan-300"/></div>
            <div><div className="text-2xl font-black tracking-[.08em]">HELOC</div><div className="text-sm font-black uppercase tracking-[.35em] text-cyan-300">Connect</div></div>
          </a>
          <div className="hidden items-center gap-7 text-sm font-black text-white/75 lg:flex">
            {products.map((p) => <button key={p.key} onClick={() => switchProduct(p.key)} className={product === p.key ? "text-white underline decoration-cyan-300 decoration-2 underline-offset-[12px]" : "hover:text-white"}>{p.key === "equity_card" ? "Home Equity Line" : p.key === "purchase" ? "Purchase Mortgage" : p.title}</button>)}
            <a href="#calculator" className="hover:text-white">Check My Options</a>
          </div>
          <a href="tel:+19498662466" className="hidden rounded-2xl border border-cyan-300/40 bg-gradient-to-r from-emerald-400/20 to-blue-600/30 px-5 py-3 text-sm font-black shadow-[0_0_30px_rgba(59,130,246,.28)] md:inline-flex">☎ Connect to Live Agent</a>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-[1560px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[.95fr_1.05fr] lg:px-8 lg:py-16">
        <div className="relative z-10">
          <div className="text-xs font-black uppercase tracking-[.45em] text-cyan-300">Homeowner Advantage</div>
          <h1 className="mt-5 text-[48px] font-black leading-[.9] tracking-[-.07em] sm:text-7xl xl:text-[92px]">
            Unlock the cash already sitting in your <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">home.</span>
          </h1>
          <p className="mt-7 max-w-3xl text-xl font-semibold leading-relaxed text-white/78">
            Use your home equity to pay off high-interest debt, remodel your home, cover emergencies, lower payments, or increase financial flexibility with less paperwork and faster review through our mortgage company network.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3 text-lg font-black"><span className="text-emerald-300">✓</span> Fast approvals <span className="text-cyan-300">•</span> Low rates <span className="text-cyan-300">•</span> 97% happy approvals</div>
          <div className="mt-8 grid max-w-[770px] gap-3 sm:grid-cols-4">
            {[
              ["⏱", "Approvals", "as quick as 1 hour"],
              ["📄", "Only 3 months", "bank statements"],
              ["⚡", "Funding", "as fast as 7 days"],
              ["💳", "Lower rates", "than most cards"]
            ].map(([icon, title, desc]) => <div key={title} className="rounded-2xl border border-cyan-300/25 bg-[#0b1a2c]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]"><div className="text-2xl">{icon}</div><div className="mt-3 font-black">{title}</div><div className="text-sm font-bold text-white/70">{desc}</div></div>)}
          </div>
        </div>
        <div className="relative min-h-[520px] overflow-hidden rounded-[42px] border border-white/10 bg-[#08101d] shadow-2xl shadow-black/50">
          <img src={HERO_PHOTO} alt="Luxury home" className="absolute inset-0 h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050914] via-[#050914]/15 to-transparent" />
          <div className="scan-line absolute left-0 right-0 top-1/2 h-[3px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_35px_rgba(52,211,153,.9)]" />
          <div className="absolute bottom-6 left-6 right-6 rounded-[30px] border border-white/15 bg-black/45 p-5 backdrop-blur-xl">
            <div className="text-xs font-black uppercase tracking-[.35em] text-cyan-200">Property Intelligence</div>
            <div className="mt-2 text-2xl font-black">Smart review starts with your goal and property.</div>
          </div>
        </div>
      </section>

      <form onSubmit={submitLead} id="calculator" className="mx-auto max-w-[1560px] px-4 pb-16 sm:px-6 lg:px-8">
        <section className="rounded-[44px] border border-white/10 bg-[#070d18]/88 p-5 shadow-[0_40px_120px_rgba(0,0,0,.55)] backdrop-blur-xl sm:p-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/8 px-5 py-2 text-xs font-black uppercase tracking-[.42em] text-cyan-200 shadow-[0_0_35px_rgba(34,211,238,.16)]">Start Here</div>
            <h2 className="mt-5 text-4xl font-black tracking-[-.055em] sm:text-6xl">What brings you in today?</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg font-semibold leading-relaxed text-white/65">Choose the goal that fits you best. The smart calculator will instantly move to the right review path and update the numbers for that option.</p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {products.map((p, index) => (
              <button key={p.key} type="button" onClick={() => switchProduct(p.key)} className={`group relative min-h-[430px] overflow-hidden rounded-[36px] border p-0 text-left transition duration-500 [transform-style:preserve-3d] hover:-translate-y-3 hover:rotate-x-[3deg] hover:rotate-y-[-3deg] ${product === p.key ? `border-white/40 ${p.glow}` : "border-white/12 shadow-2xl hover:border-white/30"}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${p.accent} opacity-0 blur-2xl transition duration-500 group-hover:opacity-25 ${product === p.key ? "opacity-25" : ""}`} />
                <img src={PRODUCT_PHOTOS[p.key]} alt={p.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/64 to-black/10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(255,255,255,.22),transparent_28%),linear-gradient(120deg,transparent,rgba(255,255,255,.12),transparent)] opacity-45" />
                <div className={`absolute inset-x-5 top-5 h-1 rounded-full bg-gradient-to-r ${p.accent} shadow-[0_0_26px_rgba(34,211,238,.35)]`} />
                <div className="relative flex h-full flex-col justify-between p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/15 text-2xl backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,.18)]">{index === 0 ? "🏠" : index === 1 ? "↻" : index === 2 ? "💳" : "🔑"}</div>
                    {product === p.key && <div className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-[#07111f] shadow-[0_0_35px_rgba(255,255,255,.35)]">Selected</div>}
                  </div>
                  <div>
                    <div className={`mb-4 inline-flex w-fit rounded-2xl border border-white/15 bg-white/12 px-3 py-2 text-[11px] font-black uppercase tracking-[.23em] text-cyan-100 backdrop-blur-xl`}>{p.eyebrow}</div>
                    <h3 className={`bg-gradient-to-r ${p.accent} bg-clip-text text-4xl font-black leading-[.95] tracking-[-.055em] text-transparent`}>{p.title}</h3>
                    <p className="mt-4 text-base font-black leading-snug text-white">{p.subtitle}</p>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-white/72">{p.body}</p>
                    <div className="mt-4 grid gap-2">
                      {p.bullets.map((b) => <div key={b} className="flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-white/76"><span className={`h-2 w-2 rounded-full bg-gradient-to-r ${p.accent}`} />{b}</div>)}
                    </div>
                    <div className={`mt-5 inline-flex rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm font-black text-emerald-300 backdrop-blur-xl`}>{p.tag}</div>
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

        <section className="mt-8 rounded-[38px] border border-emerald-300/25 bg-[#07111f]/92 p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-xs font-black uppercase tracking-[.35em] text-cyan-300">Smart Qualifying Calculator</div><h2 className="mt-3 text-4xl font-black tracking-[-.05em]">{calculatorHeadline}</h2></div><div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-5 py-3 text-sm font-black text-emerald-200">Estimated in seconds</div></div>

          {product === "purchase" && <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-3xl border border-white/15 bg-white/[.04] p-5 text-lg font-black"><input type="checkbox" checked={purchaseTargetMode} onChange={(e) => setPurchaseTargetMode(e.target.checked)} className="h-5 w-5"/> I haven't found the right home yet</label>}

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {product !== "purchase" && <><div className="rounded-3xl border border-white/10 bg-black/20 p-5"><label className="text-white/60">Current mortgage balance</label><input name="mortgage_balance" value={moneyDisplay(mortgageBalanceInput)} onChange={(e) => setMortgageBalanceInput(e.target.value)} placeholder="$350,000" className="mt-3 w-full bg-transparent text-4xl font-black outline-none"/></div><div className="rounded-3xl border border-white/10 bg-black/20 p-5"><label className="text-white/60">Cash amount requested</label><input name="requested_cash" value={moneyDisplay(requestedCashInput)} onChange={(e) => setRequestedCashInput(e.target.value)} placeholder="$100,000" className="mt-3 w-full bg-transparent text-4xl font-black text-emerald-300 outline-none"/></div></>}
            {product === "refinance" && <div className="rounded-3xl border border-white/10 bg-black/20 p-5"><label className="text-white/60">Current loan interest rate</label><input name="current_interest_rate" value={currentRateInput} onChange={(e) => setCurrentRateInput(e.target.value)} placeholder="7.25" className="mt-3 w-full bg-transparent text-4xl font-black outline-none"/><p className="text-xs font-bold text-white/45">Used only to estimate what you may be paying now.</p></div>}
            {product === "purchase" && <div className="rounded-3xl border border-white/10 bg-black/20 p-5 lg:col-span-3"><label className="text-2xl font-black">How much would you like to borrow for the purchase?</label><input type="range" min="100000" max="2000000" step="25000" value={purchaseLoan} onChange={(e) => setPurchaseLoanInput(e.target.value)} className="mt-8 w-full accent-emerald-300"/><input type="hidden" name="requested_cash" value={purchaseLoan}/><input type="hidden" name="mortgage_balance" value="0"/></div>}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-4">
            <ResultCard title={product === "purchase" ? "Selected Purchase Loan Amount" : "Property Value"} value={product === "purchase" ? formatMoney(purchaseLoan) : homeValue ? formatMoney(homeValue) : "—"} />
            <ResultCard title={product === "refinance" ? "Estimated Current Payment" : product === "purchase" ? "Estimated Monthly Payment" : "Maximum Possible Equity"} value={product === "refinance" ? `${formatMoney(currentMortgagePayment)}/mo` : product === "purchase" ? `${formatMoney(purchasePayment)}/mo` : maxEquity ? formatMoney(maxEquity) : "—"} />
            <ResultCard title={product === "refinance" ? "New Payment With Cash-Out" : product === "purchase" ? "Estimated Home Price Range" : "Requested Amount Payment"} value={product === "refinance" ? `${formatMoney(refinancePayment)}/mo` : product === "purchase" ? `${formatMoney(Math.round(purchaseLoan * 1.2))} - ${formatMoney(Math.round(purchaseLoan * 1.35))}` : `${formatMoney(helocPayment)}/mo`} />
            <ResultCard title={product === "refinance" ? "Cash-Out Requested" : product === "purchase" ? "Estimated Down Payment Needed" : "Cash Requested"} value={product === "refinance" ? formatMoney(boundedCash) : product === "purchase" ? formatMoney(Math.round(purchaseLoan * .25)) : formatMoney(boundedCash || requestedCash)} />
          </div>
          {product === "refinance" && <div className="mt-5 rounded-3xl border border-cyan-300/25 bg-cyan-300/8 p-5 text-lg font-black text-cyan-100">Refinance selected: compare what you may be paying now with a new estimated payment that includes your current mortgage payoff plus requested cash-out.</div>}
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
        @keyframes scanMove { 0%,100% { transform: translateY(-130px); opacity:.35 } 50% { transform: translateY(130px); opacity:1 } }
        .scan-line { animation: scanMove 4.5s ease-in-out infinite; }
      `}</style>
    </main>
  );
}

function ResultCard({ title, value }: { title: string; value: string }) {
  return <div className="rounded-3xl border border-white/10 bg-black/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"><div className="text-sm font-bold text-white/58">{title}</div><div className="mt-3 text-3xl font-black text-emerald-300">{value}</div></div>;
}
