"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductKey = "heloc" | "refinance" | "equity_card" | "purchase";
type AddressResult = { label: string; street?: string; city?: string; state?: string; zip?: string; place_id?: string };

const OFFER_RATE = 0.065;
const TERM_MONTHS = 360;

const services: Array<{
  key: ProductKey;
  short: string;
  title: string;
  label: string;
  icon: string;
  color: string;
  accent: string;
  shortBody: string;
}> = [
  { key: "heloc", short: "CASH", title: "HELOC", label: "Access Cash", icon: "💵", color: "text-cyan-200", accent: "from-cyan-300 to-blue-500", shortBody: "Keep your mortgage and access available equity." },
  { key: "refinance", short: "REFI", title: "Refinance", label: "Cash-Out + Lower Payment", icon: "🔁", color: "text-violet-200", accent: "from-violet-300 to-sky-400", shortBody: "Pay off the old loan, add cash, preview one payment." },
  { key: "equity_card", short: "CARD", title: "Equity Card", label: "Flexible Spending", icon: "💳", color: "text-emerald-200", accent: "from-emerald-300 to-teal-400", shortBody: "Your equity can become a credit-line style limit." },
  { key: "purchase", short: "BUY", title: "Purchase", label: "Buy A New Home", icon: "🔑", color: "text-amber-200", accent: "from-amber-200 to-orange-400", shortBody: "Get matched for purchase mortgage programs." }
];

const goalsByProduct: Record<ProductKey, Array<{ title: string; desc: string }>> = {
  heloc: [
    { title: "Access equity from my home", desc: "HELOC, cash needs, remodels, or flexible spending." },
    { title: "Pay off high-interest credit card debt", desc: "Use available home equity to replace expensive card balances." },
    { title: "Remodel or improve my home", desc: "Use cash for upgrades, repairs, or new projects." }
  ],
  refinance: [
    { title: "Lower my current mortgage payment", desc: "Review refinance options for better monthly cash flow." },
    { title: "Cash-out and combine into one payment", desc: "Old loan payoff plus requested cash in one new payment preview." },
    { title: "Consolidate debt", desc: "Use refinance cash-out to simplify high-interest obligations." }
  ],
  equity_card: [
    { title: "Flexible spending power", desc: "Use an equity-line style card as needed." },
    { title: "Interest-only payment option", desc: "Explore programs where available." },
    { title: "Larger limit than regular credit cards", desc: "Your equity may support a stronger spending limit." }
  ],
  purchase: [
    { title: "I found a home", desc: "Use the property address for a purchase mortgage preview." },
    { title: "I have not found a home yet", desc: "Choose the approximate purchase loan amount you want reviewed." },
    { title: "Get matched with purchase programs", desc: "Review mortgage companies that fit your buying goal." }
  ]
};

function num(v: string | number) { return Number(String(v || "").replace(/[^0-9.]/g, "")) || 0; }
function fmt(v: number) { return v ? v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "$0"; }
function payment(principal: number, rate = OFFER_RATE, months = TERM_MONTHS) {
  if (!principal) return 0;
  const r = rate / 12;
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -months)));
}
function parseAddress(label: string) {
  const parts = label.replace(/,\s*USA$/i, "").split(",").map((p) => p.trim()).filter(Boolean);
  const street = parts[0] || label;
  const city = parts[1] || "";
  const stateZip = parts.find((p) => /\b[A-Z]{2}\b/.test(p) || /\d{5}/.test(p)) || parts[2] || "";
  const state = stateZip.match(/\b[A-Z]{2}\b/)?.[0] || "";
  const zip = stateZip.match(/\b\d{5}(?:-\d{4})?\b/)?.[0] || "";
  return { street, city, state, zip };
}

export default function LandingPage() {
  const router = useRouter();
  const [product, setProduct] = useState<ProductKey>("heloc");
  const [mainGoal, setMainGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [addressStatus, setAddressStatus] = useState("Start typing and choose your address.");
  const [valueStatus, setValueStatus] = useState("");
  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");
  const [homeValueInput, setHomeValueInput] = useState("");
  const [mortgageBalanceInput, setMortgageBalanceInput] = useState("350000");
  const [requestedCashInput, setRequestedCashInput] = useState("100000");
  const [currentRateInput, setCurrentRateInput] = useState("7.25");
  const [purchaseLoanInput, setPurchaseLoanInput] = useState("500000");
  const [purchaseTargetMode, setPurchaseTargetMode] = useState(false);
  const [hasCoOwner, setHasCoOwner] = useState(false);

  const selected = services.find((s) => s.key === product) || services[0];
  const homeValue = num(homeValueInput);
  const mortgageBalance = num(mortgageBalanceInput);
  const requestedCash = num(requestedCashInput);
  const purchaseLoan = num(purchaseLoanInput);
  const currentRate = Number(currentRateInput || 0) / 100;
  const maxEquity = useMemo(() => product === "purchase" || !homeValue ? 0 : Math.max(0, Math.round(homeValue * 0.85 - mortgageBalance)), [homeValue, mortgageBalance, product]);
  const boundedCash = useMemo(() => product === "purchase" ? 0 : Math.min(requestedCash || maxEquity, maxEquity || requestedCash), [requestedCash, maxEquity, product]);
  const helocPayment = useMemo(() => payment(boundedCash), [boundedCash]);
  const currentMortgagePayment = useMemo(() => payment(mortgageBalance, currentRate || OFFER_RATE), [mortgageBalance, currentRate]);
  const refinanceLoan = mortgageBalance + boundedCash;
  const refinancePayment = useMemo(() => payment(refinanceLoan), [refinanceLoan]);
  const purchasePayment = useMemo(() => payment(purchaseLoan), [purchaseLoan]);
  const estimatePayment = product === "purchase" ? purchasePayment : product === "refinance" ? refinancePayment : helocPayment;

  function chooseProduct(next: ProductKey) {
    setProduct(next);
    setMainGoal("");
    if (next !== "purchase") setPurchaseTargetMode(false);
    setTimeout(() => document.getElementById("property-step")?.scrollIntoView({ behavior: "smooth", block: "start" }), 160);
  }

  async function searchAddress(q: string) {
    setStreet(q); setValueStatus("");
    if (q.trim().length < 3) { setAddressResults([]); setAddressStatus("Type at least 3 characters."); return; }
    try {
      setSearching(true); setAddressStatus("Searching addresses...");
      const res = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setAddressResults(data?.results || []);
      setAddressStatus(data?.results?.length ? "Tap your address below." : (data?.message || "No matches yet."));
    } catch {
      setAddressResults([]); setAddressStatus("Address search is unavailable. You can type manually.");
    } finally { setSearching(false); }
  }

  function fallbackValue(input: { address?: string; street?: string; city?: string; state?: string; zip?: string }) {
    const combined = `${input.address || ""} ${input.street || ""} ${input.city || ""} ${input.state || ""} ${input.zip || ""}`.toLowerCase();
    const z = (combined.match(/\b\d{5}\b/) || [""])[0];
    const map: Record<string, number> = { "92692": 1850000, "92691": 1450000, "92688": 1350000, "92618": 1450000, "92620": 1500000, "92630": 1150000, "92656": 1150000, "92677": 1600000, "90210": 1800000 };
    if (z && map[z]) return map[z];
    if (combined.includes("19 paloma") || combined.includes("mission viejo")) return 1850000;
    if (combined.includes("irvine")) return 1400000;
    if (combined.includes("newport")) return 2500000;
    return 950000;
  }

  async function lookupHomeValue(addressData: { address?: string; street?: string; city?: string; state?: string; zip?: string }) {
    try {
      setValueStatus("Finding current market value...");
      const address1 = addressData.street || street;
      const address2 = [addressData.city || city, [addressData.state || stateName, addressData.zip || zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
      const res = await fetch("/api/property-value", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: addressData.address || [address1, address2].filter(Boolean).join(", "), address1, street: address1, city: addressData.city || city, state: addressData.state || stateName, zip: addressData.zip || zip, address2 }) });
      const data = await res.json();
      const v = Number(data?.value || 0) || fallbackValue(addressData);
      setHomeValueInput(String(Math.round(v)));
      setValueStatus(`Estimated property value: ${fmt(v)}. You can adjust it if needed.`);
    } catch {
      const v = fallbackValue(addressData);
      setHomeValueInput(String(v));
      setValueStatus(`Estimated property value: ${fmt(v)}. You can adjust it if needed.`);
    }
  }

  function selectAddress(result: AddressResult) {
    const parsed = parseAddress(result.label);
    const selectedStreet = result.street || parsed.street;
    const selectedCity = result.city || parsed.city;
    const selectedState = result.state || parsed.state;
    const selectedZip = result.zip || parsed.zip;
    setStreet(selectedStreet); setCity(selectedCity); setStateName(selectedState); setZip(selectedZip); setAddressResults([]);
    setAddressStatus("Address selected.");
    lookupHomeValue({ address: result.label, street: selectedStreet, city: selectedCity, state: selectedState, zip: selectedZip });
  }

  function manualValueLookup() {
    lookupHomeValue({ street, city, state: stateName, zip, address: `${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}` });
  }

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true);
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || data?.error) { alert(`Lead was NOT saved. ${data?.error || data?.message || "Unknown error"}`); setLoading(false); return; }
      router.push(data?.token ? `/status/${data.token}` : "/thank-you/demo");
    } catch (err: any) { alert(`Lead was NOT saved. ${err?.message || "Unknown error"}`); setLoading(false); }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050914] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_5%,rgba(0,229,255,.18),transparent_26%),radial-gradient(circle_at_100%_20%,rgba(94,234,212,.12),transparent_30%),linear-gradient(180deg,#071120,#050914)]" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050914]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/35 bg-cyan-300/10 text-xl shadow-[0_0_30px_rgba(34,211,238,.25)]">⌂</div>
            <div><div className="text-lg font-black tracking-[.14em]">HELOC</div><div className="text-[11px] font-black uppercase tracking-[.38em] text-cyan-300">Connect</div></div>
          </a>
          <div className="rounded-full border border-cyan-300/25 bg-cyan-300/8 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-100 sm:text-xs">Yahoo Finance</div>
        </div>
      </header>

      <form onSubmit={submitLead} className="mx-auto max-w-6xl px-4 pb-14 pt-4 sm:px-6 lg:pt-8">
        <section className="min-h-[calc(100svh-76px)] rounded-[28px] border border-cyan-300/20 bg-white/[.035] p-5 shadow-[0_0_55px_rgba(34,211,238,.08)] sm:p-8 lg:grid lg:min-h-0 lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:p-10">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-cyan-300/30 bg-cyan-300/8 px-4 py-2 text-[10px] font-black uppercase tracking-[.32em] text-cyan-200">Free Homeowner Match Review</div>
            <h1 className="mt-5 text-[42px] font-black leading-[.92] tracking-[-.055em] sm:text-6xl lg:text-7xl">Protect your time. Protect your credit. Start with the <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">right match.</span></h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-white/72 sm:text-lg">HELOC CONNECT helps homeowners avoid wasting time with the wrong mortgage company. We review your goal, property, and financial picture first — then help match you with proven mortgage companies that make lending less stressful, with fewer documents and clearer options.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-[12px] font-black sm:grid-cols-4">
              {[["$0", "Homeowners pay"], ["Yahoo", "Featured"], ["3 Mo", "Bank statements"], ["Fast", "Review path"]].map(([a,b]) => <div key={a} className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-xl text-cyan-200">{a}</div><div className="text-white/58">{b}</div></div>)}
            </div>
            <button type="button" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 px-6 py-4 text-base font-black shadow-[0_0_40px_rgba(34,211,238,.25)] sm:w-fit">Start My Free Review →</button>
          </div>
          <div className="mt-6 overflow-hidden rounded-[26px] border border-white/10 bg-[#07111f] p-3 shadow-2xl lg:mt-0">
            <div className="relative min-h-[300px] overflow-hidden rounded-[22px] bg-gradient-to-br from-[#0e2236] via-[#0c1725] to-[#080b12] sm:min-h-[420px]">
              <div className="absolute inset-0 opacity-70 [background:linear-gradient(135deg,rgba(34,211,238,.24),transparent_36%),radial-gradient(circle_at_80%_15%,rgba(16,185,129,.18),transparent_32%)]" />
              <div className="scan-line absolute left-0 right-0 top-1/2 h-[3px] bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_35px_rgba(110,231,183,.95)]" />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-black/45 p-4 backdrop-blur-xl"><div className="text-[10px] font-black uppercase tracking-[.35em] text-cyan-200">Property Intelligence</div><div className="mt-1 text-2xl font-black">Smart review starts with your goal and property.</div></div>
            </div>
          </div>
        </section>

        <section id="services" className="pt-7 sm:pt-10">
          <div className="text-center">
            <div className="mx-auto inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/8 px-4 py-2 text-[10px] font-black uppercase tracking-[.34em] text-cyan-200">Start Here</div>
            <h2 className="mt-4 text-3xl font-black tracking-[-.045em] sm:text-5xl">What brings you in today?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-bold text-white/58 sm:text-base">Choose one path. The calculator will update to the right review.</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {services.map((s) => <button type="button" key={s.key} onClick={() => chooseProduct(s.key)} className={`group relative min-h-[138px] rounded-[24px] border p-4 text-left transition active:scale-[.98] sm:min-h-[220px] sm:p-5 ${product === s.key ? "border-cyan-200 bg-white/[.09] shadow-[0_0_50px_rgba(34,211,238,.18)]" : "border-white/10 bg-white/[.045] hover:border-cyan-300/35"}`}>
              <div className={`absolute inset-x-4 top-0 h-1 rounded-full bg-gradient-to-r ${s.accent}`} />
              <div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/30 text-xl sm:h-12 sm:w-12">{s.icon}</div>{product === s.key && <div className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-[#050914]">Selected</div>}</div>
              <div className={`mt-4 text-[10px] font-black uppercase tracking-[.2em] ${s.color}`}>{s.short}</div>
              <div className={`mt-1 bg-gradient-to-r ${s.accent} bg-clip-text text-xl font-black leading-[.95] text-transparent sm:text-3xl`}>{s.title}</div>
              <div className="mt-2 hidden text-sm font-bold leading-relaxed text-white/70 sm:block">{s.shortBody}</div>
              <div className="mt-3 text-[11px] font-black text-white/48 sm:text-sm">{s.label}</div>
            </button>)}
          </div>
        </section>

        <section className="mt-7 rounded-[28px] border border-white/10 bg-white/[.035] p-5 sm:p-7">
          <div className="text-[11px] font-black uppercase tracking-[.34em] text-cyan-200">Step 2</div>
          <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-5xl">What is your main goal?</h2>
          <p className="mt-2 text-sm font-bold text-white/58">Your selected path is <span className={selected.color}>{selected.title}</span>.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {goalsByProduct[product].map((g) => <button type="button" key={g.title} onClick={() => setMainGoal(g.title)} className={`rounded-2xl border p-4 text-left ${mainGoal === g.title ? "border-cyan-200 bg-cyan-300/10" : "border-white/10 bg-black/20"}`}><div className="text-base font-black">{g.title}</div><div className="mt-1 text-sm font-semibold text-white/55">{g.desc}</div></button>)}
          </div>
        </section>

        <section id="property-step" className="mt-7 grid gap-5 rounded-[28px] border border-white/10 bg-white/[.035] p-5 sm:p-7 lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[.34em] text-cyan-200">Step 3</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.045em]">Find your property.</h2>
            <p className="mt-2 text-sm font-bold text-white/58">Start typing. Choose the address so value can auto-fill.</p>
            <div className="relative mt-5">
              <input name="property_address" value={street} onChange={(e) => searchAddress(e.target.value)} placeholder={product === "purchase" ? "Property purchasing address" : "Property address"} className="w-full rounded-2xl border border-cyan-300/30 bg-[#050914] p-4 text-lg font-black outline-none" />
              {addressResults.length > 0 && <div className="absolute z-40 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-cyan-300/30 bg-[#07111f] p-2 shadow-2xl">{addressResults.map((r, i) => <button type="button" key={`${r.label}-${i}`} onClick={() => selectAddress(r)} className="block w-full rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-cyan-300/10">{r.label}</button>)}</div>}
            </div>
            <div className="mt-3 text-sm font-black text-cyan-200">{searching ? "Searching..." : addressStatus}</div>
            <div className="mt-4 grid grid-cols-3 gap-3"><input name="city" value={city} onChange={(e)=>setCity(e.target.value)} placeholder="City" className="rounded-xl border border-white/10 bg-[#050914] p-3 text-sm font-bold"/><input name="state" value={stateName} onChange={(e)=>setStateName(e.target.value)} placeholder="State" className="rounded-xl border border-white/10 bg-[#050914] p-3 text-sm font-bold"/><input name="zip" value={zip} onChange={(e)=>setZip(e.target.value)} placeholder="ZIP" className="rounded-xl border border-white/10 bg-[#050914] p-3 text-sm font-bold"/></div>
            <input name="unit" value={unit} onChange={(e)=>setUnit(e.target.value)} placeholder="Unit / Apt optional" className="mt-3 w-full rounded-xl border border-white/10 bg-[#050914] p-3 text-sm font-bold"/>
            <button type="button" onClick={manualValueLookup} className="mt-4 w-full rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-sm font-black text-cyan-100">Re-check Property Value</button>
          </div>
          <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/[.06] p-5">
            <div className="text-[11px] font-black uppercase tracking-[.34em] text-emerald-200">Property Value</div>
            <div className="mt-3 text-4xl font-black text-emerald-300">{homeValue ? fmt(homeValue) : "Waiting"}</div>
            <p className="mt-2 text-sm font-bold text-white/58">{valueStatus || "Auto-fills after selecting an address. You can also type a value."}</p>
            <input name="home_value" value={homeValueInput} onChange={(e)=>setHomeValueInput(e.target.value)} placeholder="Enter estimated property value" className="mt-5 w-full rounded-2xl border border-white/10 bg-[#050914] p-4 text-lg font-black outline-none"/>
            {product === "purchase" && <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-black"><input type="checkbox" checked={purchaseTargetMode} onChange={(e)=>setPurchaseTargetMode(e.target.checked)} /> I have not found the right home yet</label>}
          </div>
        </section>

        <section id="smart-calculator" className="mt-7 rounded-[28px] border border-emerald-300/20 bg-gradient-to-br from-emerald-300/[.07] to-cyan-300/[.035] p-5 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[11px] font-black uppercase tracking-[.34em] text-cyan-200">Smart Qualifying Calculator</div><h2 className="mt-3 text-3xl font-black tracking-[-.045em]">{product === "refinance" ? "Refinance payment comparison" : product === "purchase" ? "Purchase mortgage preview" : product === "equity_card" ? "Equity credit line preview" : "HELOC cash access preview"}</h2></div><div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-black text-emerald-100">Estimated in seconds</div></div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
            <div className="rounded-[24px] border border-white/15 bg-[#08111d] p-5"><div className="text-[11px] font-black uppercase tracking-[.32em] text-cyan-200">You enter</div><div className="mt-4 grid gap-3">
              {product !== "purchase" && <InputCard label="Current mortgage balance" name="mortgage_balance" value={mortgageBalanceInput} onChange={setMortgageBalanceInput} help="Approximate balance remaining." />}
              {product !== "purchase" && <InputCard label={product === "equity_card" ? "Credit line amount requested" : "Cash amount requested"} name="requested_cash" value={requestedCashInput} onChange={setRequestedCashInput} help="Amount you want reviewed." />}
              {product === "refinance" && <InputCard label="Current loan interest rate" name="current_interest_rate" value={currentRateInput} onChange={setCurrentRateInput} help="Used only to estimate your current payment." suffix="%" />}
              {product === "purchase" && <InputCard label="Purchase loan amount" name="requested_cash" value={purchaseLoanInput} onChange={setPurchaseLoanInput} help="Approximate loan amount you want reviewed." />}
            </div></div>
            <div className="rounded-[24px] border border-emerald-300/20 bg-black/20 p-5"><div className="text-[11px] font-black uppercase tracking-[.32em] text-emerald-200">We calculate</div><div className="mt-4 grid grid-cols-2 gap-3">
              <ResultCard title={product === "purchase" ? "Selected Loan" : "Property Value"} value={product === "purchase" ? fmt(purchaseLoan) : homeValue ? fmt(homeValue) : "—"}/>
              <ResultCard title={product === "refinance" ? "Current Payment" : product === "purchase" ? "Monthly Payment" : "Max Equity Preview"} value={product === "refinance" ? `${fmt(currentMortgagePayment)}/mo` : product === "purchase" ? `${fmt(purchasePayment)}/mo` : maxEquity ? fmt(maxEquity) : "—"}/>
              <ResultCard title={product === "refinance" ? "New Payment" : "Estimated Payment"} value={`${fmt(estimatePayment)}/mo`}/>
              <ResultCard title={product === "refinance" ? "Cash-Out" : product === "purchase" ? "Down Payment Est." : "Cash Requested"} value={product === "purchase" ? fmt(Math.round(purchaseLoan * .25)) : fmt(boundedCash || requestedCash)}/>
            </div></div>
          </div>
          <input type="hidden" name="selected_product" value={product}/><input type="hidden" name="main_goal" value={mainGoal}/><input type="hidden" name="possible_equity_room" value={product === "purchase" ? purchaseLoan : maxEquity}/><input type="hidden" name="estimated_monthly_payment" value={estimatePayment}/>
        </section>

        <section className="mt-7 rounded-[28px] border border-white/10 bg-white/[.035] p-5 sm:p-7">
          <div className="text-[11px] font-black uppercase tracking-[.34em] text-cyan-200">Final Step</div><h2 className="mt-3 text-3xl font-black tracking-[-.045em]">Where should we send your review?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input name="first_name" required placeholder="First name" className="field"/><input name="last_name" required placeholder="Last name" className="field"/><input name="phone" required placeholder="Mobile phone" className="field"/><input name="email" type="email" required placeholder="Email address" className="field"/>
          <select name="credit_card_payments" className="field lg:col-span-2"><option>Credit card payment history</option><option>I am current and never missed a payment</option><option>I am current now but had a few missed payments in the past</option><option>I have stopped making payments completely</option></select><select name="credit_score" className="field"><option>Credit score range</option><option>740+</option><option>700-739</option><option>660-699</option><option>620-659</option><option>580-619</option><option>Under 580</option></select><select name="bankruptcy_10_years" className="field"><option>Bankruptcy in last 10 years?</option><option>No</option><option>Yes, discharged</option><option>Yes, active/open</option></select><select name="loans_on_property" className="field"><option>How many mortgages?</option><option>None</option><option>1 mortgage</option><option>2 mortgages</option><option>3+ loans</option></select><select name="mortgage_good_standing" className="field"><option>Mortgage payment standing</option><option>Current</option><option>Current now, missed in the past</option><option>Behind right now</option></select><input name="monthly_income" placeholder="Monthly income" className="field"/><select name="cash_use" className="field"><option>Main use of funds</option><option>Pay off debt</option><option>Remodel home</option><option>Emergency expenses</option><option>Business</option><option>Purchase home</option></select></div>
          <label className="mt-4 flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/72"><input name="sms_consent" value="yes" type="checkbox" className="mt-1"/> It is okay to receive SMS text messages on this phone number about my application status.</label>
          <label className="mt-4 flex items-center gap-3 text-base font-black"><input type="checkbox" checked={hasCoOwner} onChange={(e)=>setHasCoOwner(e.target.checked)}/> Add another homeowner / co-owner</label>
          {hasCoOwner && <div className="mt-4 grid gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4 sm:grid-cols-2"><input name="co_first_name" placeholder="Co-owner first name" className="field"/><input name="co_last_name" placeholder="Co-owner last name" className="field"/><input name="co_phone" placeholder="Co-owner phone" className="field"/><input name="co_email" placeholder="Co-owner email" className="field"/></div>}
          <button disabled={loading} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-400 p-5 text-lg font-black shadow-[0_0_40px_rgba(59,130,246,.28)]">{loading ? "Submitting..." : "Match Me With The Right Mortgage Company"}</button>
        </section>
      </form>
      <style jsx global>{`.field{border-radius:16px;border:1px solid rgba(255,255,255,.12);background:#050914;padding:16px;font-weight:800;outline:none;width:100%}@keyframes scan{0%,100%{transform:translateY(-120px);opacity:.35}50%{transform:translateY(120px);opacity:1}}.scan-line{animation:scan 4s ease-in-out infinite}html{scroll-behavior:smooth}`}</style>
    </main>
  );
}

function InputCard({ label, name, value, onChange, help, suffix }: { label: string; name: string; value: string; onChange: (v: string)=>void; help: string; suffix?: string }) {
  return <label className="block rounded-2xl border border-white/12 bg-white/[.035] p-4"><div className="flex items-center justify-between"><span className="text-[11px] font-black uppercase tracking-[.24em] text-cyan-200">{label}</span><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em]">You Type</span></div><div className="mt-3 flex items-end gap-2"><input name={name} value={value} onChange={(e)=>onChange(e.target.value)} className="w-full bg-transparent text-3xl font-black outline-none"/><span className="pb-1 text-xl font-black text-white/60">{suffix}</span></div><div className="mt-1 text-sm font-bold text-white/45">{help}</div></label>;
}
function ResultCard({ title, value }: { title: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><div className="text-[11px] font-black uppercase tracking-[.18em] text-white/45">{title}</div><div className="mt-2 text-2xl font-black text-emerald-300 sm:text-3xl">{value}</div></div>; }
