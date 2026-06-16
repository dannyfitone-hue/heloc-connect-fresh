"use client";
/* OFFICE_HERO_FINAL_VERIFIED_UNIQUE_IMAGE_2026_06 */


import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addressResults, setAddressResults] = useState<any[]>([]);
  const [addressSearching, setAddressSearching] = useState(false);
  const [addressSelected, setAddressSelected] = useState(false);

  const [addressLookupStatus, setAddressLookupStatus] = useState("Start typing your property address");
  const [valueLookupStatus, setValueLookupStatus] = useState("");

  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");
  const [homeValueInput, setHomeValueInput] = useState("");
  const [mortgageBalanceInput, setMortgageBalanceInput] = useState("");
  const [requestedCashInput, setRequestedCashInput] = useState("");
  const [loansCount, setLoansCount] = useState("");
  const [goodStanding, setGoodStanding] = useState("");
  const [missedPayments, setMissedPayments] = useState("");

  function moneyNumber(value: string) {
    return Number(String(value || "").replace(/[^0-9.]/g, "")) || 0;
  }

  function formatMoney(value: number) {
    if (!value || value < 0) return "$0";
    return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  function formatCurrencyDisplay(value: string) {
    const n = moneyNumber(value);
    if (!n) return "";
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  const homeValue = moneyNumber(homeValueInput);
  const mortgageBalance = moneyNumber(mortgageBalanceInput);
  const requestedCash = moneyNumber(requestedCashInput);

  const possibleRoom = useMemo(() => {
    if (!homeValue || !mortgageBalance) return 0;
    return Math.max(0, Math.round(homeValue * 0.85 - mortgageBalance));
  }, [homeValue, mortgageBalance]);

  const paymentPreview = useMemo(() => {
    if (!requestedCash) return 0;
    const monthlyRate = 0.053 / 12;
    const months = 240;
    return Math.round((requestedCash * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));
  }, [requestedCash]);

  const maxCashOutPaymentPreview = useMemo(() => {
    if (!possibleRoom) return 0;
    const monthlyRate = 0.053 / 12;
    const months = 240;
    return Math.round((possibleRoom * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));
  }, [possibleRoom]);

  const smartAddressSuggestions = [
    "123 Main St, Irvine, CA 92618",
    "123 Main St, Lake Forest, CA 92630",
    "123 Main Ave, Anaheim, CA 92805",
    "123 Main Street, Los Angeles, CA 90012"
  ];
  function parseAddressParts(fullAddress: string) {
    const parts = fullAddress.split(",").map((p) => p.trim());
    const streetLine = parts[0] || fullAddress;
    const cityLine = parts[1] || "";
    const stateZip = parts[2] || "";
    const stateZipParts = stateZip.split(" ").filter(Boolean);
    return {
      streetLine,
      cityLine,
      stateLine: stateZipParts[0] || "",
      zipLine: stateZipParts[1] || ""
    };
  }

  async function searchAddresses(query: string) {
    setStreet(query);
    setAddressSelected(false);

    if (!query || query.trim().length < 3) {
      setAddressResults([]);
      setAddressLookupStatus("Type at least 3 characters to search address");
      return;
    }

    try {
      setAddressSearching(true);
      setAddressLookupStatus("Searching matching addresses...");
      const res = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setAddressResults(data?.results || []);
      setAddressLookupStatus(data?.results?.length ? "Select your address below" : (data?.message || "No address matches yet"));
    } catch (error) {
      setAddressResults([]);
      setAddressLookupStatus("Address search temporarily unavailable");
    } finally {
      setAddressSearching(false);
    }
  }

  function selectAddress(result: any) {
    const label = result?.label || "";
    const parsed = parseAddressParts(label);
    const streetLine = result?.street || parsed.streetLine;
    const cityLine = result?.city || parsed.cityLine;
    const stateLine = result?.state || parsed.stateLine;
    const zipLine = result?.zip || parsed.zipLine;

    setStreet(streetLine);
    setCity(cityLine);
    setStateName(stateLine);
    setZip(zipLine);
    setAddressResults([]);
    setAddressSelected(true);
    setAddressLookupStatus("Address selected and auto-filled");

    lookupHomeValue(label || `${streetLine}, ${cityLine}, ${stateLine} ${zipLine}`);
  }

  async function lookupHomeValue(fullAddress: string) {
    try {
      setValueLookupStatus("Looking up estimated home value...");
      const res = await fetch("/api/property-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: fullAddress })
      });

      const data = await res.json();

      if (data?.value) {
        setHomeValueInput(String(data.value));
        setValueLookupStatus(
          data.source === "assessed_fallback"
            ? `Assessed value found: ${formatMoney(Number(data.value))}. You can update to current market value.`
            : `Estimated market value found: ${formatMoney(Number(data.value))}`
        );
      } else {
        setValueLookupStatus(data?.message || "Home value lookup needs property data API activation.");
      }
    } catch (error) {
      setValueLookupStatus("Home value lookup is not connected yet.");
    }
  }

  function buildFullAddress() {
    return `${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`.replace(/\s+/g, " ").trim();
  }

  function tryManualHomeValueLookup() {
    const fullAddress = buildFullAddress();
    if (street && city && stateName && zip) {
      lookupHomeValue(fullAddress);
    }
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

      if (data?.token) {
        router.push(`/status/${data.token}`);
      } else {
        alert(data?.error ? `Application submit failed: ${data.error}` : "Something went wrong.");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong.");
      setLoading(false);
    }
  }

  const trustCards = [
    ["🔐", "SSL Secured Website", "Encrypted HTTPS connection helps protect information submitted through HELOC CONNECT."],
    ["🛡️", "Client Protection Shield", "We help homeowners avoid bad-fit companies, unwanted products, and unrealistic expectations."],
    ["💚", "100% Free To Homeowners", "No consultation fee, matching fee, or hidden HELOC CONNECT charge."],
    ["🚫", "No SSN • No Credit Check", "No Social Security Number is required and this initial request does not pull credit."],
  ];

  const securityBadges = [
    ["🔐", "SSL Secured", "Encrypted website connection"],
    ["🛡️", "Privacy Protected", "Secure homeowner intake"],
    ["🚫", "No SSN Required", "Initial review only"],
    ["📉", "No Credit Check", "No impact to credit score"],
    ["💚", "100% Free", "Homeowners pay nothing"],
    ["🏠", "Property Data Powered", "Address-based value preview"],
    ["📁", "Secure Upload Portal", "Docs appear only when requested"],
    ["🤝", "Selected Network", "Carefully reviewed companies"],
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#06111f] pb-20 text-white md:pb-0">
      <section className="relative min-h-screen overflow-hidden bg-[#07101c]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(246,190,78,.18),transparent_28%),linear-gradient(135deg,#08111f_0%,#071421_55%,#030912_100%)]" />
        <div className="absolute inset-0 opacity-70 bg-[linear-gradient(90deg,rgba(3,8,15,.98)_0%,rgba(5,16,29,.92)_42%,rgba(3,8,15,.98)_100%)]" />

        <nav className="relative z-20 border-b border-white/10 bg-[#06101d]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <a href="#home" className="flex shrink-0 items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#d9a94e]/60 bg-[#0a1727] text-[#f6c15a]">⌂</div>
              <div className="leading-none">
                <div className="text-2xl font-black tracking-[-.04em]">HELOC</div>
                <div className="text-[11px] font-black uppercase tracking-[.45em] text-[#f6c15a]">Connect</div>
              </div>
            </a>

            <div className="hidden items-center gap-5 text-sm font-black text-white/90 lg:flex xl:gap-7">
              <a href="#home" className="hover:text-[#f6c15a]">Home</a>
              <a href="#how" className="hover:text-[#f6c15a]">How It Works</a>
              <a href="#network" className="hover:text-[#f6c15a]">Our Network</a>
              <a href="#protection" className="hover:text-[#f6c15a]">Protection Shield</a>
              <a href="#trust" className="hover:text-[#f6c15a]">Trust & Security</a>
              <a href="#solutions" className="hover:text-[#f6c15a]">Solutions</a>
              <a href="#reviews" className="hover:text-[#f6c15a]">Reviews</a>
              <a href="/about" className="hover:text-[#f6c15a]">About Us</a>
              <a href="/privacy-policy" className="hover:text-[#f6c15a]">Privacy</a>
              <a href="/terms" className="hover:text-[#f6c15a]">Terms</a>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <a href="#apply" className="rounded-2xl bg-gradient-to-b from-[#ffd36d] to-[#d89425] px-4 py-3 text-sm font-black text-[#07101c] shadow-lg shadow-[#d89425]/25 sm:px-6">
                Explore My Options
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 bg-[#06101d]/98 px-4 pb-3 lg:hidden">
            <div className="mx-auto flex max-w-[1540px] gap-2 overflow-x-auto pt-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <a href="#home" className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">Home</a>
              <a href="#how" className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">How It Works</a>
              <a href="#network" className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">Our Network</a>
              <a href="#protection" className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">Protection Shield</a>
              <a href="#trust" className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">Trust</a>
              <a href="#solutions" className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">Solutions</a>
              <a href="#reviews" className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">Reviews</a>
              <a href="/about" className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">About Us</a>
              <a href="/privacy-policy" className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">Privacy</a>
              <a href="/terms" className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-4 py-2 text-xs font-black text-white/90">Terms</a>
            </div>
          </div>
        </nav>

        <div id="home" className="relative z-10 mx-auto grid max-w-[1540px] gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_minmax(430px,560px)] xl:items-start xl:gap-8">
          <section className="min-w-0 rounded-[24px] border border-white/10 bg-[#071421]/92 p-4 shadow-2xl shadow-black/30 sm:rounded-[28px] sm:p-7 lg:p-9">
            <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[.82fr_1fr] lg:items-center">
              <div className="min-w-0">
                <div className="inline-flex rounded-full border border-[#d9a94e]/70 px-4 py-2 text-xs font-black uppercase tracking-[.32em] text-[#f7c35e]">
                  The Smarter Way To Borrow
                </div>
                <h1 className="mt-4 max-w-[520px] text-[36px] sm:mt-6 font-black leading-[.94] tracking-[-.06em] text-white sm:text-6xl lg:text-6xl xl:text-7xl">
                  HELOC or Refinance?
                </h1>
                <h2 className="mt-3 max-w-[520px] text-[30px] sm:mt-5 font-black leading-[1.02] tracking-[-.04em] text-[#f6c15a] sm:text-5xl lg:text-5xl">
                  Find the smarter path.
                </h2>
                <p className="mt-4 max-w-[540px] text-sm sm:mt-5 sm:text-base font-bold leading-relaxed text-white/90 sm:text-lg">
                  We help homeowners explore whether HELOC, refinance, cash-out, or purchase options may put them in a stronger financial position through carefully selected mortgage companies in our network.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="text-2xl text-[#f6c15a]">★★★★★</div>
                  <div className="text-sm font-black text-white">4.9/5 From 2,000+ Homeowners</div>
                </div>
                <div className="mt-6 grid gap-3 text-sm font-bold text-white/90">
                  <div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full border border-[#f6c15a]/50 text-[#f6c15a]">✓</span>100% FREE to homeowners</div>
                  <div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full border border-[#f6c15a]/50 text-[#f6c15a]">✓</span>No SSN required to get started</div>
                  <div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full border border-[#f6c15a]/50 text-[#f6c15a]">✓</span>No credit check to explore options</div>
                </div>
                <div className="mt-5 grid max-w-[560px] gap-3 rounded-2xl border border-white/10 bg-[#06101d]/70 p-4 sm:grid-cols-3">
                  <div className="text-center"><div className="text-[10px] font-black uppercase tracking-[.2em] text-white/60">Featured On</div><div className="mt-1 text-xl font-black text-[#7b4dff]">Yahoo! <span className="text-white">finance</span></div></div>
                  <div className="text-center"><div className="text-xl text-[#f6c15a]">★★★★★</div><div className="text-xs font-black uppercase tracking-[.12em] text-white">Top Rated 2026</div></div>
                  <div className="text-center"><div className="text-2xl">🛡️</div><div className="text-xs font-black uppercase tracking-[.12em] text-white">Protection Shield</div></div>
                </div>
              </div>

              <div className="min-w-0">
                <div className="relative overflow-hidden rounded-[22px] sm:rounded-[26px] border border-white/10 bg-[#101827] shadow-2xl">
                  <img src="/heloc-office-consultation-realistic.png" alt="Real financial consultation meeting with an advisor reviewing documents" className="h-[220px] w-full object-cover object-center sm:h-[360px] lg:h-[520px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06101d]/35 via-transparent to-transparent" />
                </div>

                <div className="mx-auto mt-3 w-full max-w-[480px] rounded-[22px] sm:mt-4 sm:rounded-[26px] border border-[#d6c8ae]/70 bg-[#d7d0c2] p-4 text-[#0c1728] shadow-2xl sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 sm:h-14 sm:w-14 place-items-center rounded-full bg-[#0fa06f] text-3xl font-black text-white">✓</div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-black leading-tight tracking-[-.04em] sm:text-3xl">Matched With A Mortgage Company That Fits Their Goals</h3>
                      <p className="mt-2 text-sm font-black text-[#007a56] sm:text-base">Example: lower monthly payment + $100,000 cash access</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-center">
                      <div className="text-xs font-black text-slate-500 sm:text-sm">Previous Mortgage Company</div>
                      <div className="mt-2 text-xl font-black text-red-600 sm:text-3xl">$2,785<span className="text-sm">/mo</span></div>
                      <div className="mt-2 text-sm font-black text-slate-600">$0 Cash Out</div>
                    </div>
                    <div className="text-3xl font-black text-slate-500">→</div>
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-3 text-center">
                      <div className="text-xs font-black text-slate-500 sm:text-sm">Selected Network Company</div>
                      <div className="mt-2 text-xl font-black text-emerald-700 sm:text-3xl">$2,125<span className="text-sm">/mo</span></div>
                      <div className="mt-2 text-lg font-black text-emerald-700">$100,000</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-[#0fa06f] px-3 py-2.5 text-center text-sm sm:mt-4 sm:px-4 sm:py-3 sm:text-base font-black leading-snug text-white">
                    $660 lower payment monthly • $100,000 cash at closing
                  </div>
                  <p className="mt-3 text-center text-xs font-black leading-relaxed text-slate-600">
                    Illustration only. Final options vary by qualifications and participating mortgage company review.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 lg:grid-cols-4">
              {trustCards.map(([icon, title, desc]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-[#08182b] p-4">
                  <div className="text-3xl text-[#f6c15a]">{icon}</div>
                  <div className="mt-3 text-sm font-black">{title}</div>
                  <div className="mt-1 text-xs font-bold leading-relaxed text-white/70">{desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-[#f6c15a]/25 bg-[#06101d]/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="text-lg font-black text-[#f6c15a]">Ready to see your options?</div><div className="text-sm font-bold text-white/80">Scroll down and start with your property address. It only takes a minute.</div></div>
              <a href="#apply" className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#ffd36d] to-[#d89425] px-5 py-3 text-sm font-black text-[#06101d]">Start Below ↓</a>
            </div>
          </section>

          <section id="apply" className="min-w-0 rounded-[24px] border border-white/10 bg-[#071421] p-3 shadow-2xl shadow-black/35 sm:rounded-[28px] sm:p-6 lg:sticky lg:top-4">
            <form onSubmit={submitLead} className="grid min-w-0 gap-3 sm:gap-4">
              <div className="rounded-[22px] border border-white/10 bg-gradient-to-br from-white/[.09] to-white/[.03] p-4 sm:rounded-[24px] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Smart Homeowner Calculator</div>
                    <h2 className="mt-3 text-2xl font-black leading-[1.02] sm:text-3xl tracking-[-.04em] sm:text-4xl">
                      HELOC or Refinance?
                      <span className="mt-2 block bg-gradient-to-r from-[#f6c15a] via-[#ffe7a3] to-white bg-clip-text text-transparent">Find the smarter path.</span>
                    </h2>
                    <p className="mt-3 max-w-[620px] text-sm font-semibold leading-relaxed text-white/72">
                      Explore which direction may fit your goals before connecting with a carefully selected mortgage company from our network.
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <div className="rounded-full border border-emerald-300/35 bg-emerald-400/15 px-4 py-2 text-xs font-black text-emerald-200">● Powered by property data</div>
                    <div className="rounded-full border border-[#f6c15a]/35 bg-[#f6c15a]/10 px-4 py-2 text-xs font-black text-[#f6c15a]">🔐 SSL secured</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-emerald-300/30 bg-gradient-to-br from-emerald-400/15 to-[#0b2138] p-3 sm:rounded-[24px] sm:p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-emerald-300/25 bg-black/20 p-4 text-center">
                    <div className="text-2xl">💚</div>
                    <div className="mt-2 text-sm font-black uppercase tracking-[.12em] text-emerald-200">100% Free</div>
                    <div className="mt-1 text-xs font-bold leading-relaxed text-white/70">Homeowners do not pay HELOC CONNECT for matching or support.</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <div className="text-2xl">🔒</div>
                    <div className="mt-2 text-sm font-black uppercase tracking-[.12em] text-[#f6c15a]">No SSN Needed</div>
                    <div className="mt-1 text-xs font-bold leading-relaxed text-white/70">No Social Security Number is required for the initial request.</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <div className="text-2xl">✅</div>
                    <div className="mt-2 text-sm font-black uppercase tracking-[.12em] text-[#f6c15a]">No Credit Check</div>
                    <div className="mt-1 text-xs font-bold leading-relaxed text-white/70">This initial review does not affect your credit score.</div>
                  </div>
                </div>
                <p className="mt-3 text-center text-[11px] font-semibold leading-relaxed text-emerald-100/90">HELOC CONNECT receives service compensation from participating mortgage companies in our network, allowing our homeowner services to remain free for clients.</p>
              </div>


              <div className="rounded-[22px] border border-[#d9a94e]/45 bg-[#091a2f] p-3 sm:rounded-[24px] sm:p-5">
                <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Step 1 of 4</div>
                <label className="mt-4 block text-lg font-black">Property Address</label>
                <input className="mt-3 w-full rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 text-base outline-none transition placeholder:text-slate-400 focus:border-[#f6c15a]" name="street_address" placeholder="Start typing property address" value={street} onChange={(e) => searchAddresses(e.target.value)} autoComplete="off" required />
                <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                <p className="mt-2 text-xs font-black text-emerald-200">{addressSearching ? "Searching..." : addressLookupStatus}</p>
                {addressResults.length > 0 && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-emerald-400/30 bg-[#071527] p-2 shadow-2xl">
                    {addressResults.map((result, index) => (
                      <button key={`${result.label}-${index}`} type="button" onClick={() => selectAddress(result)} className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-emerald-300 hover:bg-emerald-400/10">{result.label}</button>
                    ))}
                  </div>
                )}
                {valueLookupStatus && <p className="mt-1 text-xs font-black text-[#f6c15a]">{valueLookupStatus}</p>}
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-3 sm:mt-4 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-black">Estimated Home Value</div>
                      <input className="mt-1 w-full min-w-0 bg-transparent text-2xl font-black text-white outline-none placeholder:text-white sm:mt-2 sm:text-3xl" name="home_value" placeholder="$---" value={formatCurrencyDisplay(homeValueInput)} onChange={(e) => setHomeValueInput(e.target.value)} />
                    </div>
                    <button type="button" onClick={tryManualHomeValueLookup} className="w-full rounded-xl border border-[#d9a94e]/50 px-4 py-2.5 text-sm font-black text-[#f6c15a] sm:w-auto sm:shrink-0 sm:py-3">↻ Update</button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400 focus:border-[#f6c15a]" name="first_name" placeholder="First Name" required />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400 focus:border-[#f6c15a]" name="last_name" placeholder="Last Name" required />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400 focus:border-[#f6c15a]" name="phone" placeholder="Phone Number" required />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400 focus:border-[#f6c15a]" name="email" placeholder="Email Address" type="email" required />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400 focus:border-[#f6c15a]" name="unit" placeholder="Unit / Apt (optional)" value={unit} onChange={(e) => setUnit(e.target.value)} />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400 focus:border-[#f6c15a]" name="city" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400 focus:border-[#f6c15a]" name="state" placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400 focus:border-[#f6c15a]" name="zip" placeholder="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} onBlur={() => tryManualHomeValueLookup()} />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400 focus:border-[#f6c15a]" name="mortgage_balance" placeholder="Current Mortgage Balance" value={mortgageBalanceInput} onChange={(e) => setMortgageBalanceInput(e.target.value)} />
                <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400 focus:border-[#f6c15a]" name="requested_cash" placeholder="How much funding do you want?" value={requestedCashInput} onChange={(e) => setRequestedCashInput(e.target.value)} />
              </div>

              <div className="rounded-[22px] border border-white/10 bg-[#091a2f] p-3 sm:rounded-[24px] sm:p-5">
                <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Step 2 of 4</div>
                <h3 className="mt-3 text-xl font-black">Mortgage & Payment Standing</h3>
                <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
                  <select className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none" name="loans_on_property" value={loansCount} onChange={(e) => setLoansCount(e.target.value)}><option value="">How many loans are on the property?</option><option>1 loan</option><option>2 loans</option><option>3+ loans</option><option>Not sure</option></select>
                  <select className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none" name="mortgage_good_standing" value={goodStanding} onChange={(e) => setGoodStanding(e.target.value)}><option value="">Mortgage payments in good standing?</option><option>Yes, current and on time</option><option>Mostly current</option><option>No / behind</option></select>
                  <select className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none sm:col-span-2" name="missed_payments_6_months" value={missedPayments} onChange={(e) => setMissedPayments(e.target.value)}><option value="">Any missed mortgage payments in the last 6 months?</option><option>No missed payments</option><option>1 missed payment</option><option>2+ missed payments</option><option>Not sure</option></select>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-[#091a2f] p-3 sm:rounded-[24px] sm:p-5">
                <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Step 3 of 4</div>
                <h3 className="mt-3 text-xl font-black">What Is Your Goal?</h3>
                <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
                  <select className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none sm:col-span-2" name="loan_purpose"><option>HELOC / Home Equity Line</option><option>Cash-Out Refinance</option><option>Home Equity Loan</option><option>Maximum Cash-Out Review</option><option>Pay Down High-Interest Balances</option></select>
                  <select className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none" name="credit_score"><option value="">Credit Score Range</option><option>720+</option><option>680-719</option><option>620-679</option><option>580-619</option><option>Under 580</option></select>
                  <input className="min-w-0 rounded-2xl border border-white/15 bg-[#06101d] p-3 sm:p-4 outline-none placeholder:text-slate-400" name="monthly_income" placeholder="Monthly Income" />
                </div>
              </div>

              <div className="rounded-[24px] border border-emerald-400/30 bg-gradient-to-br from-emerald-400/10 to-blue-500/10 p-4 sm:p-5">
                <div className="text-center text-xs font-black uppercase tracking-[.3em] text-emerald-300">Smart Funding Breakdown</div>
                <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-400/25 bg-black/20 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.14em] text-emerald-300">Estimated Maximum Equity Access</div><div className="mt-2 text-2xl font-black text-emerald-300">{homeValue && mortgageBalance ? formatMoney(possibleRoom) : "—"}</div></div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.14em] text-blue-200">Payment If Using Maximum Equity</div><div className="mt-2 text-2xl font-black text-white">{maxCashOutPaymentPreview ? `${formatMoney(maxCashOutPaymentPreview)}/mo` : "—"}</div></div>
                  <div className="rounded-2xl border border-blue-300/25 bg-blue-500/10 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.14em] text-blue-200">Your Requested Funding Amount</div><div className="mt-2 text-2xl font-black text-white">{requestedCash ? formatMoney(requestedCash) : "—"}</div></div>
                  <div className="rounded-2xl border border-[#d9a94e]/25 bg-[#d9a94e]/10 p-4 text-center"><div className="text-xs font-black uppercase tracking-[.14em] text-[#f6c15a]">Payment For Requested Amount</div><div className="mt-2 text-2xl font-black text-white">{requestedCash ? `${formatMoney(paymentPreview)}/mo` : "—"}</div></div>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center text-[11px] font-semibold leading-relaxed text-blue-100">Preview estimates only. Final options vary by participating mortgage company review, verified property details, equity, credit profile, documents, rates and terms.</div>
                <input type="hidden" name="possible_equity_room" value={possibleRoom} />
                <input type="hidden" name="estimated_monthly_payment" value={paymentPreview} />
                <input type="hidden" name="estimated_max_cashout_payment" value={maxCashOutPaymentPreview} />
              </div>


              <button disabled={loading} className="rounded-2xl bg-gradient-to-b from-[#ffd36d] to-[#d89425] p-4 text-lg font-black text-[#06101d] shadow-xl transition hover:-translate-y-1 sm:p-5">
                {loading ? "Submitting..." : "SEE MY OPTIONS"}
              </button>
              <p className="text-center text-xs font-bold leading-relaxed text-white/75">No Social Security Number required for this initial request • Not a credit check • 100% free for homeowners</p>
            </form>
          </section>
        </div>

        <section id="trust" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-6 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[28px] border border-[#f6c15a]/20 bg-gradient-to-br from-[#071421]/95 via-[#082033]/95 to-[#06111f]/95 p-6 shadow-2xl shadow-black/30 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">Trust & Security</div>
                <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-[-.04em] text-white sm:text-4xl">Built to help homeowners feel safe before sharing their information.</h2>
                <p className="mt-3 max-w-5xl text-sm font-bold leading-relaxed text-white/75">
                  HELOC CONNECT uses a secure HTTPS connection and a privacy-focused intake process. Homeowners do not need to provide a Social Security Number for the initial request, and this is not a credit check. Our service is 100% free to homeowners because HELOC CONNECT receives its service compensation from participating mortgage companies in our carefully selected network.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-300/35 bg-emerald-400/10 px-5 py-4 text-center shadow-xl shadow-emerald-500/10">
                <div className="text-3xl">🔐</div>
                <div className="mt-1 text-sm font-black uppercase tracking-[.18em] text-emerald-200">HTTPS / SSL Secured</div>
                <div className="mt-1 text-xs font-bold text-white/65">Browser padlock protected</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 lg:grid-cols-4">
              {securityBadges.map(([icon, title, desc]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 shadow-lg shadow-black/15">
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#f6c15a]/25 bg-[#f6c15a]/10 text-2xl">{icon}</div>
                    <div>
                      <div className="text-sm font-black text-white">{title}</div>
                      <div className="mt-1 text-xs font-bold leading-relaxed text-white/62">{desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-6 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-[#071421]/90 p-6 shadow-2xl">
            <div className="text-center text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">How It Works</div>
            <h2 className="mt-3 text-center text-3xl font-black tracking-[-.04em]">A Simple Process That Puts You First</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-5">
              {["Enter Your Information", "We Find The Right Match", "You Get Better Options", "Review & Choose", "Move Forward"].map((step, i) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f6c15a] text-lg font-black text-[#06101d]">{i + 1}</div>
                  <div className="mt-4 text-sm font-black">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="network" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-6 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-[#071421]/90 p-6 shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">Our Network</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Carefully Selected Mortgage Companies</h2>
            <p className="mt-3 max-w-4xl text-sm font-bold leading-relaxed text-white/75">HELOC CONNECT carefully hand-picks mortgage companies in our network so homeowners and homebuyers can be directed to a company that better fits their needs. Our role is to help clients avoid poor-fit lending experiences, inflated expectations, unnecessary pressure, and options they never asked for, while giving them a clearer path toward the mortgage company best suited for their goals.</p>
          </div>
        </section>

        <section id="protection" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-6 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[28px] border border-emerald-300/20 bg-gradient-to-br from-[#071421]/95 via-[#082033]/95 to-[#06111f]/95 p-6 shadow-2xl shadow-emerald-500/10 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-center">
              <div className="rounded-[30px] border border-[#f6c15a]/35 bg-black/25 p-7 text-center">
                <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border border-emerald-300/35 bg-emerald-400/15 text-6xl shadow-xl shadow-emerald-500/15">🛡️</div>
                <div className="mt-5 text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">HELOC CONNECT</div>
                <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-white">Protection Shield</h2>
                <p className="mt-3 text-sm font-bold leading-relaxed text-white/70">Designed to help clients move with more confidence before connecting with a mortgage company.</p>
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-[.35em] text-emerald-300">Client-first mortgage company matching</div>
                <h2 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-[-.04em] text-white sm:text-4xl">We help protect clients from bad-fit deals, unrealistic expectations, and loan options they never wanted.</h2>
                <p className="mt-4 max-w-5xl text-base font-bold leading-relaxed text-white/75">HELOC CONNECT reviews its mortgage company network carefully and helps direct homeowners to companies that better align with their goals, property situation, and financial needs. We are built to be an extra shield for the client—helping reduce wasted time, poor communication, unnecessary pressure, and options that do not make sense for what the client actually wants.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {["Carefully selected mortgage company network", "Helps avoid unwanted loan products", "Realistic expectations before next steps", "No pressure into options clients did not ask for", "More transparent matching process", "100% free service for homeowners"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm font-black text-white/85"><span className="mr-2 text-emerald-300">✓</span>{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-6 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-4">
            {["Home Purchase", "Refinance", "HELOC", "Cash-Out"].map((item) => (
              <div key={item} className="rounded-[24px] border border-white/10 bg-[#071421]/90 p-5 shadow-xl">
                <div className="text-lg font-black text-[#f6c15a]">{item}</div>
                <p className="mt-2 text-sm font-bold leading-relaxed text-white/70">Connect with a selected mortgage company from our network to review available lending paths.</p>
              </div>
            ))}
          </div>
        </section>

        <section id="reviews" className="relative z-10 mx-auto max-w-[1540px] px-4 pb-10 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-[#071421]/90 p-6 shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[.35em] text-[#f6c15a]">Reviews</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Trusted By Homeowners</h2>
            <p className="mt-3 text-sm font-bold leading-relaxed text-white/75">Homeowners use HELOC CONNECT to explore options and connect with mortgage companies that can review their unique situation.</p>
          </div>
        </section>
      </section>

      <a href="tel:+19498662466" aria-label="Connect with a live agent" className="group fixed bottom-6 right-6 z-50 hidden items-center gap-3 rounded-full border border-[#f6c15a]/60 bg-gradient-to-r from-[#fff0b8] via-[#f6c15a] to-[#d89425] px-6 py-4 text-sm font-black uppercase tracking-[.14em] text-[#06101d] shadow-[0_18px_55px_rgba(216,148,37,.35)] ring-1 ring-white/20 transition hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_22px_70px_rgba(246,193,90,.45)] md:inline-flex">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#06101d] text-[#f6c15a] shadow-inner">☎</span>
        <span>Connect With A Live Agent</span>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,.95)]" />
      </a>
      <a href="tel:+19498662466" aria-label="Connect with a live agent" className="fixed bottom-4 right-4 z-50 inline-flex max-w-[calc(100vw-2rem)] items-center justify-center gap-2 rounded-full border border-[#f6c15a]/60 bg-gradient-to-r from-[#fff0b8] via-[#f6c15a] to-[#d89425] px-4 py-3 text-[11px] font-black uppercase tracking-[.08em] text-[#06101d] shadow-[0_14px_42px_rgba(216,148,37,.35)] ring-1 ring-white/20 md:hidden">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#06101d] text-[#f6c15a]">☎</span>
        Live Agent
      </a>
    </main>
  );
}
