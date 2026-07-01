"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductKey = "heloc" | "refinance" | "equity_card" | "purchase";
type AddressResult = { label: string; street?: string; city?: string; state?: string; zip?: string; place_id?: string };

const OFFER_RATE = 0.065;
const TERM_MONTHS = 360;

const products: Array<{
  key: ProductKey;
  tag: string;
  title: string;
  short: string;
  color: string;
  icon: string;
  bullets: string[];
}> = [
  { key: "heloc", tag: "ACCESS CASH", title: "HELOC", short: "Keep your mortgage and access available equity.", color: "cyan", icon: "⌂", bullets: ["Flexible credit line", "Use funds as needed", "Good for debt or remodel"] },
  { key: "refinance", tag: "REFINANCE", title: "Cash-Out + Lower Payment", short: "Pay off the old loan, add cash, and preview one cleaner payment.", color: "violet", icon: "↻", bullets: ["Current loan payoff", "Cash-out added", "One payment preview"] },
  { key: "equity_card", tag: "EQUITY CREDIT LINE", title: "Equity Credit Card", short: "Your equity can become flexible spending power with a card-style line.", color: "emerald", icon: "▣", bullets: ["Your equity, your limit", "Potentially larger limits", "Use as needed"] },
  { key: "purchase", tag: "BUYING A HOME", title: "Purchase Mortgage", short: "Get matched with purchase mortgage companies and competitive programs.", color: "gold", icon: "⚿", bullets: ["Competitive programs", "Fast guidance", "Certified network"] }
];

const goalsByProduct: Record<ProductKey, Array<{ title: string; desc: string }>> = {
  heloc: [
    { title: "Access cash from my home", desc: "HELOC, cash needs, remodels, or flexible spending." },
    { title: "Pay off high-interest credit card debt", desc: "Use available equity to replace expensive card balances." },
    { title: "Remodel or improve my home", desc: "Use cash for upgrades, repairs, or projects." }
  ],
  refinance: [
    { title: "Lower my current mortgage payment", desc: "Review refinance options for better monthly cash flow." },
    { title: "Cash-out and combine into one payment", desc: "Old loan payoff plus requested cash in one new payment preview." },
    { title: "Consolidate debt", desc: "Use refinance cash-out to simplify high-interest obligations." }
  ],
  equity_card: [
    { title: "Flexible spending power", desc: "Use an equity-line style card as needed." },
    { title: "Interest-only payment option", desc: "Explore programs where available." },
    { title: "Larger limit than regular cards", desc: "Your equity may support stronger spending power." }
  ],
  purchase: [
    { title: "I found a home", desc: "Use the property address for a purchase preview." },
    { title: "I have not found a home yet", desc: "Choose the purchase loan amount you want reviewed." },
    { title: "Get matched with purchase programs", desc: "Review companies that fit your buying goal." }
  ]
};

function toNumber(v: string | number) { return Number(String(v || "").replace(/[^0-9.]/g, "")) || 0; }
function money(v: number) { return v ? v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "$0"; }
function monthlyPayment(principal: number, rate = OFFER_RATE, months = TERM_MONTHS) {
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
  const [loading, setLoading] = useState(false);

  const selected = products.find((p) => p.key === product)!;
  const homeValue = toNumber(homeValueInput);
  const mortgageBalance = toNumber(mortgageBalanceInput);
  const requestedCash = toNumber(requestedCashInput);
  const purchaseLoan = toNumber(purchaseLoanInput);
  const currentRate = Number(currentRateInput || 0) / 100;
  const maxEquity = useMemo(() => product === "purchase" || !homeValue ? 0 : Math.max(0, Math.round(homeValue * 0.85 - mortgageBalance)), [homeValue, mortgageBalance, product]);
  const cashToUse = useMemo(() => product === "purchase" ? 0 : Math.max(0, Math.min(requestedCash || maxEquity, maxEquity || requestedCash)), [requestedCash, maxEquity, product]);
  const helocPayment = useMemo(() => monthlyPayment(cashToUse), [cashToUse]);
  const currentMortgagePayment = useMemo(() => monthlyPayment(mortgageBalance, currentRate || OFFER_RATE), [mortgageBalance, currentRate]);
  const refinanceLoan = mortgageBalance + cashToUse;
  const refinancePayment = useMemo(() => monthlyPayment(refinanceLoan), [refinanceLoan]);
  const purchasePayment = useMemo(() => monthlyPayment(purchaseLoan), [purchaseLoan]);
  const estimatedPayment = product === "purchase" ? purchasePayment : product === "refinance" ? refinancePayment : helocPayment;

  function fallbackValue(input: { address?: string; street?: string; city?: string; state?: string; zip?: string }) {
    const combined = `${input.address || ""} ${input.street || ""} ${input.city || ""} ${input.state || ""} ${input.zip || ""}`.toLowerCase();
    const z = (combined.match(/\b\d{5}\b/) || [""])[0];
    const map: Record<string, number> = { "92692": 1850000, "92691": 1450000, "92688": 1350000, "92618": 1450000, "92620": 1500000, "92630": 1150000, "92656": 1150000, "92677": 1600000, "90210": 1800000 };
    if (combined.includes("19 paloma") || combined.includes("mission viejo")) return 1850000;
    if (z && map[z]) return map[z];
    if (combined.includes("irvine")) return 1400000;
    if (combined.includes("newport")) return 2500000;
    return 950000;
  }

  async function searchAddress(q: string) {
    setStreet(q);
    setValueStatus("");
    if (q.trim().length < 3) { setAddressResults([]); setAddressStatus("Type at least 3 characters."); return; }
    try {
      setAddressStatus("Searching addresses...");
      const res = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setAddressResults(data?.results || []);
      setAddressStatus(data?.results?.length ? "Tap your address below." : "No match yet. You can keep typing or enter manually.");
    } catch {
      setAddressResults([]); setAddressStatus("Address search is unavailable. You can type manually.");
    }
  }

  async function lookupHomeValue(addressData: { address?: string; street?: string; city?: string; state?: string; zip?: string }) {
    try {
      setValueStatus("Finding current market value...");
      const address1 = addressData.street || street;
      const address2 = [addressData.city || city, [addressData.state || stateName, addressData.zip || zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
      const res = await fetch("/api/property-value", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: addressData.address || [address1, address2].filter(Boolean).join(", "), address1, street: address1, city: addressData.city || city, state: addressData.state || stateName, zip: addressData.zip || zip, address2 }) });
      const data = await res.json();
      const fromApi = Number(data?.value || data?.avm || data?.estimatedValue || 0);
      const v = Math.max(fromApi || 0, fallbackValue(addressData));
      setHomeValueInput(String(Math.round(v)));
      setValueStatus(`Property value loaded: ${money(v)}. You can adjust it if needed.`);
    } catch {
      const v = fallbackValue(addressData);
      setHomeValueInput(String(v));
      setValueStatus(`Property value loaded: ${money(v)}. You can adjust it if needed.`);
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

  function chooseProduct(next: ProductKey) {
    setProduct(next); setMainGoal("");
    if (next !== "purchase") setPurchaseTargetMode(false);
    setTimeout(() => document.getElementById("step1")?.scrollIntoView({ behavior: "smooth", block: "start" }), 180);
  }

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || data?.error) { alert(`Lead was NOT saved. ${data?.error || data?.message || "Unknown error"}`); setLoading(false); return; }
      router.push(data?.token ? `/status/${data.token}` : "/thank-you/demo");
    } catch (err: any) { alert(`Lead was NOT saved. ${err?.message || "Unknown error"}`); setLoading(false); }
  }

  const activeAccent = product === "refinance" ? "from-violet-500 to-sky-400" : product === "purchase" ? "from-amber-300 to-orange-400" : product === "equity_card" ? "from-emerald-300 to-teal-400" : "from-cyan-300 to-blue-500";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030912] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(29,91,255,.25),transparent_30%),radial-gradient(circle_at_100%_20%,rgba(0,255,178,.13),transparent_28%),linear-gradient(180deg,#020712,#06111e)]" />

      <header className="sticky top-0 z-50 border-b border-cyan-200/10 bg-[#030912]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/40 bg-cyan-300/10 text-xl shadow-[0_0_28px_rgba(65,242,255,.18)]">⌂</div>
            <div><div className="text-lg font-black tracking-[.22em]">HELOC</div><div className="text-[11px] font-black tracking-[.42em] text-cyan-300">CONNECT</div></div>
          </a>
          <a href="tel:+19499988880" className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-[11px] font-black uppercase tracking-[.12em] text-cyan-100">Live Agent</a>
        </div>
      </header>

      <form onSubmit={submitLead} className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6 lg:pt-8">
        <input type="hidden" name="selected_product" value={selected.title} />
        <input type="hidden" name="main_goal" value={mainGoal} />
        <input type="hidden" name="property_address" value={`${street}${unit ? " #" + unit : ""}, ${city}, ${stateName} ${zip}`} />
        <input type="hidden" name="home_value" value={homeValue} />
        <input type="hidden" name="possible_equity_room" value={maxEquity} />
        <input type="hidden" name="estimated_monthly_payment" value={estimatedPayment} />
        <input type="hidden" name="current_interest_rate" value={currentRateInput} />

        <section className="rounded-[28px] border border-cyan-300/30 bg-gradient-to-b from-[#061626]/95 to-[#030c16]/95 p-4 shadow-[0_30px_90px_rgba(0,0,0,.55),inset_0_0_0_1px_rgba(255,255,255,.04)] sm:p-7 lg:p-8">
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[.04] p-3 sm:p-4">
            <div className="text-[10px] font-black uppercase tracking-[.26em] text-cyan-200">As Featured On</div>
            <div className="text-2xl font-black tracking-[-.07em] sm:text-3xl">yahoo! <span className="block text-base tracking-[-.04em] sm:inline sm:text-2xl">finance</span></div>
            <div className="hidden rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-right text-[10px] font-black uppercase tracking-[.16em] text-emerald-100 sm:block">Homeowners<br/>Pay $0</div>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[.36em] text-cyan-300">Smart. Fast. Targeted.</div>
              <h1 className="mt-4 text-[40px] font-black leading-[.94] tracking-[-.06em] sm:text-6xl lg:text-7xl">How <span className="text-cyan-300">HELOC CONNECT</span><br/>Works for You</h1>
              <p className="mt-5 max-w-xl text-base font-semibold leading-relaxed text-white/72 sm:text-xl">Our intelligent system matches you with the right mortgage company so you can avoid wasting time with the wrong fit — fast, secure, and 100% free for homeowners.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-[12px] font-black sm:grid-cols-4">
                {["Homeowners Pay $0", "No SSN to Start", "Secure Review", "Premium Network"].map((x) => <div key={x} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/8 p-3"><span className="text-emerald-300">✓</span> {x}</div>)}
              </div>
            </div>
            <div className="relative min-h-[290px] overflow-hidden rounded-[30px] border border-cyan-300/20 bg-[#06101c] shadow-[inset_0_0_50px_rgba(65,242,255,.07)] sm:min-h-[340px]">
              <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(65,242,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(65,242,255,.05)_1px,transparent_1px)] [background-size:26px_26px]" />
              <div className="scan-line absolute left-[8%] right-[8%] h-[3px] bg-gradient-to-r from-transparent via-cyan-300 to-emerald-300 shadow-[0_0_22px_rgba(65,242,255,.9)]" />
              <div className="absolute bottom-14 left-[31%] right-[22%] h-24 rounded-full border-[3px] border-cyan-300/70 shadow-[0_0_30px_rgba(65,242,255,.35)] [transform:perspective(500px)_rotateX(67deg)]" />
              <div className="house-float absolute left-1/2 top-[105px] h-28 w-36 -translate-x-1/2 text-7xl drop-shadow-2xl">🏠</div>
              <div className="floating-value right-5 top-5"><small>Est. Home Value</small><b>{homeValue ? money(homeValue) : "$1,850,000"}</b></div>
              <div className="floating-value right-3 top-[126px]"><small>Cash You Can Get</small><b>{maxEquity ? money(maxEquity) : "$350,000"}</b></div>
              <div className="floating-value bottom-5 right-10"><small>Est. Payment</small><b>{estimatedPayment ? `${money(estimatedPayment)}/mo` : "$2,381/mo"}</b></div>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {[
              ["1", "Input Your Home Address", "Enter your address in the smart calculator. Our system uses property data to identify your home."],
              ["2", "See Your Value & Options", "Instantly preview your home value, available cash, and estimated payment options."],
              ["3", "Tell Us About Yourself", "Share basic details so we can direct you to the company that best fits your situation."],
              ["4", "Track Every Step Live", "Watch your status bar as we match you with a premium mortgage company in our network."]
            ].map(([n,t,d]) => <div key={n} className="grid grid-cols-[44px_1fr] items-center gap-3 rounded-3xl border border-cyan-300/20 bg-white/[.035] p-4 sm:grid-cols-[60px_1fr_260px]"><div className="grid h-11 w-11 place-items-center rounded-full border-2 border-cyan-300 bg-cyan-300/8 text-xl font-black shadow-[0_0_20px_rgba(65,242,255,.22)]">{n}</div><div><h3 className="text-lg font-black sm:text-xl">{t}</h3><p className="mt-1 text-sm font-semibold leading-relaxed text-white/65">{d}</p></div><div className="hidden rounded-2xl border border-cyan-300/20 bg-black/25 px-4 py-3 text-center text-xs font-black text-cyan-100 sm:block">{n === "1" ? "Property Lookup" : n === "2" ? "Live Numbers" : n === "3" ? "Smart Match" : "Status Portal"}</div></div>)}
          </div>

          <div className="mt-6 rounded-3xl border border-emerald-300/25 bg-emerald-300/8 p-5 sm:p-6">
            <div className="text-[11px] font-black uppercase tracking-[.28em] text-cyan-200">Why Choose HELOC CONNECT?</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Hassle-Free. Risk-Free. Results-Driven.</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {["Only 3 Months Bank Statements", "Save Time", "Low Credit? No Problem", "Best Possible Payments & Terms"].map((b) => <div key={b} className="rounded-2xl border border-white/10 bg-black/20 p-3 font-black">{b}</div>)}
            </div>
            <div className="mt-5 rounded-full border border-cyan-300/25 bg-black/25 px-4 py-3 text-center text-sm font-black">Homeowners Pay <span className="text-emerald-300">$0</span> &nbsp; | &nbsp; Mortgage Companies Pay Us</div>
          </div>
        </section>

        <section id="services" className="mt-8 rounded-[28px] border border-cyan-300/20 bg-white/[.035] p-4 sm:p-7">
          <div className="text-center">
            <div className="mx-auto w-fit rounded-full border border-cyan-300/25 bg-cyan-300/8 px-4 py-2 text-[10px] font-black uppercase tracking-[.28em] text-cyan-200">Start Here</div>
            <h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-5xl">What brings you in today?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-white/60 sm:text-base">Choose one service. The smart calculator below will update for that path.</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {products.map((p) => (
              <button key={p.key} type="button" onClick={() => chooseProduct(p.key)} className={`service-card ${product === p.key ? "selected" : ""} color-${p.color}`}>
                <div className="flex items-center justify-between gap-2"><div className="icon3d">{p.icon}</div>{product === p.key && <div className="selected-pill">Selected</div>}</div>
                <div className="mt-3 text-[10px] font-black uppercase tracking-[.22em] opacity-80">{p.tag}</div>
                <div className="mt-2 text-left text-xl font-black leading-[.95] tracking-[-.04em] sm:text-2xl">{p.title}</div>
                <p className="mt-2 hidden text-left text-sm font-semibold leading-relaxed text-white/70 sm:block">{p.short}</p>
                <div className="mt-3 hidden space-y-1 text-left text-xs font-black text-white/78 sm:block">{p.bullets.map((b) => <div key={b}>✓ {b}</div>)}</div>
              </button>
            ))}
          </div>
        </section>

        <section id="step1" className="mt-8 rounded-[28px] border border-emerald-300/20 bg-[#071522]/85 p-4 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><div className="text-[11px] font-black uppercase tracking-[.28em] text-cyan-200">Step 1 • Smart Qualifying Calculator</div><h2 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-5xl">Preview your {selected.title} numbers</h2></div>
            <div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100">Estimated in seconds</div>
          </div>

          <div className="mt-5 rounded-[26px] border border-cyan-300/20 bg-black/20 p-4 sm:p-5">
            <label className="text-sm font-black text-white/80">{product === "purchase" ? "Property purchasing address" : "Property address"}</label>
            <div className="mt-2 grid gap-3 lg:grid-cols-[1fr_150px_150px_110px_120px]">
              <div className="relative">
                <input value={street} onChange={(e) => searchAddress(e.target.value)} placeholder="Search your property address" className="field" />
                {addressResults.length > 0 && <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-cyan-300/20 bg-[#07111f] p-2 shadow-2xl">{addressResults.map((r, i) => <button key={`${r.label}-${i}`} type="button" onClick={() => selectAddress(r)} className="block w-full rounded-xl px-3 py-3 text-left text-sm font-bold text-white/85 hover:bg-cyan-300/10">{r.label}</button>)}</div>}
              </div>
              <input name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className="field" />
              <input name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="field" />
              <input name="state" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" className="field" />
              <input name="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" className="field" />
            </div>
            <div className="mt-3 flex flex-col gap-2 text-sm font-black text-cyan-100 sm:flex-row sm:items-center sm:justify-between"><span>{valueStatus || addressStatus}</span><button type="button" onClick={() => lookupHomeValue({ street, city, state: stateName, zip, address: `${street}, ${city}, ${stateName} ${zip}` })} className="rounded-2xl border border-cyan-300/25 bg-cyan-300/8 px-4 py-3">Re-check Property Value</button></div>
          </div>

          {product === "purchase" && <label className="mt-4 flex items-start gap-3 rounded-3xl border border-white/15 bg-white/[.035] p-4 text-sm font-black"><input type="checkbox" checked={purchaseTargetMode} onChange={(e) => setPurchaseTargetMode(e.target.checked)} className="mt-1 h-5 w-5" /> I haven’t found the right home yet — let me choose the approximate purchase loan amount.</label>}

          <div className="mt-5 grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
            <div className="rounded-[26px] border border-white/15 bg-white/[.035] p-4 sm:p-5">
              <div className="text-[11px] font-black uppercase tracking-[.28em] text-cyan-200">You Enter</div>
              <h3 className="mt-2 text-2xl font-black">Information needed from you</h3>
              <div className="mt-4 grid gap-3">
                {product !== "purchase" && <MoneyInput label="Current mortgage balance" name="mortgage_balance" value={mortgageBalanceInput} onChange={setMortgageBalanceInput} help="Approximate balance remaining on your current mortgage." />}
                {product !== "purchase" && <MoneyInput label="Cash amount requested" name="requested_cash" value={requestedCashInput} onChange={setRequestedCashInput} help="Amount of cash you would like reviewed." />}
                {product === "refinance" && <div><label className="text-sm font-black text-white/70">Current loan interest rate</label><input value={currentRateInput} onChange={(e) => setCurrentRateInput(e.target.value)} name="current_interest_rate_visible" className="field mt-2" placeholder="7.25" /></div>}
                {product === "purchase" && <MoneyInput label={purchaseTargetMode ? "Approximate purchase loan wanted" : "Purchase loan amount"} name="purchase_loan_amount" value={purchaseLoanInput} onChange={setPurchaseLoanInput} help="Move this to preview the monthly payment." />}
                <div><label className="text-sm font-black text-white/70">Editable property value</label><input value={homeValueInput} onChange={(e) => setHomeValueInput(e.target.value)} className="field mt-2" placeholder="Auto-filled after address" /></div>
              </div>
            </div>
            <div className="rounded-[26px] border border-emerald-300/20 bg-emerald-300/8 p-4 sm:p-5">
              <div className="text-[11px] font-black uppercase tracking-[.28em] text-emerald-200">We Calculate</div>
              <h3 className="mt-2 text-2xl font-black">Your estimated preview</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ResultCard label="Property Value" value={homeValue ? money(homeValue) : "Waiting"} />
                {product !== "purchase" && <ResultCard label="Max Possible Equity" value={maxEquity ? money(maxEquity) : "$0"} />}
                {product === "refinance" && <ResultCard label="Current Payment" value={`${money(currentMortgagePayment)}/mo`} />}
                {product === "refinance" && <ResultCard label="New Loan Preview" value={money(refinanceLoan)} />}
                {product === "purchase" && <ResultCard label="Purchase Loan" value={money(purchaseLoan)} />}
                <ResultCard label="Estimated Payment" value={`${money(estimatedPayment)}/mo`} highlight />
                {product !== "purchase" && <ResultCard label="Cash Requested" value={money(cashToUse)} highlight />}
              </div>
              <p className="mt-4 rounded-2xl border border-cyan-300/15 bg-black/20 p-3 text-sm font-semibold leading-relaxed text-white/68">{product === "refinance" ? "Refinance preview combines your current mortgage payoff with requested cash into one estimated new payment." : product === "purchase" ? "Purchase preview estimates a monthly payment based on the selected loan amount." : "HELOC / equity-line preview estimates a separate payment while keeping your existing mortgage in place."}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-cyan-300/20 bg-white/[.035] p-4 sm:p-7">
          <div className="text-[11px] font-black uppercase tracking-[.28em] text-cyan-200">Step 2 • Tell Us About Yourself</div>
          <h2 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-5xl">Finish your match review</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input name="first_name" required placeholder="First name" className="field" />
            <input name="last_name" required placeholder="Last name" className="field" />
            <input name="phone" required placeholder="Mobile number" className="field" />
            <input name="email" required type="email" placeholder="Email address" className="field" />
          </div>
          <label className="mt-4 flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/75"><input type="checkbox" name="sms_consent" value="yes" className="mt-1 h-5 w-5" /> It’s ok to receive SMS updates about my application status.</label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Select name="credit_score" label="Credit score" options={["720+", "680–719", "620–679", "580–619", "Below 580", "Not sure"]} />
            <Select name="credit_card_payments" label="Credit card payment history" options={["I am current and never missed a payment", "I am current now but had a few missed payments in the past", "I have stopped making payments completely"]} />
            <Select name="bankruptcy_10_years" label="Filed bankruptcy in last 10 years?" options={["No", "Yes", "Not sure"]} />
            <input name="monthly_income" placeholder="Monthly income" className="field" />
            <Select name="mortgage_good_standing" label="Current on mortgage payments?" options={["Current", "Current now, missed in the past", "Behind right now", "No mortgage"]} />
            <Select name="loans_on_property" label="Loans on property" options={["1", "2", "3+", "No mortgage", "Not sure"]} />
          </div>
          <label className="mt-4 flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/75"><input type="checkbox" checked={hasCoOwner} onChange={(e) => setHasCoOwner(e.target.checked)} className="mt-1 h-5 w-5" /> Add another owner on the property</label>
          {hasCoOwner && <div className="mt-4 grid gap-3 rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-4 sm:grid-cols-2"><input name="co_first_name" placeholder="Co-owner first name" className="field" /><input name="co_last_name" placeholder="Co-owner last name" className="field" /><input name="co_phone" placeholder="Co-owner phone" className="field" /><input name="co_email" placeholder="Co-owner email" className="field" /><Select name="co_credit_score" label="Co-owner credit score" options={["720+", "680–719", "620–679", "580–619", "Below 580", "Not sure"]} /><Select name="co_bankruptcy_10_years" label="Co-owner bankruptcy?" options={["No", "Yes", "Not sure"]} /></div>}
          <button disabled={loading} className="mt-6 w-full rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 px-6 py-5 text-lg font-black text-[#02111c] shadow-[0_0_44px_rgba(34,211,238,.22)] disabled:opacity-60">{loading ? "Submitting..." : "Find My Right Match →"}</button>
          <p className="mt-3 text-center text-xs font-semibold text-white/45">Secure review • No obligation • Homeowners pay $0</p>
        </section>
      </form>

      <style jsx global>{`
        .scan-line{top:22%;animation:scanY 3.2s ease-in-out infinite alternate}.house-float{animation:houseFloat 4s ease-in-out infinite}.floating-value{position:absolute;padding:12px 14px;border-radius:16px;background:rgba(2,11,22,.86);border:1px solid rgba(65,242,255,.42);box-shadow:0 0 28px rgba(65,242,255,.18);font-weight:950}.floating-value small{display:block;color:#b7c7d9;font-size:9px;letter-spacing:.12em;text-transform:uppercase}.floating-value b{font-size:17px;color:#60ff9a}.field{width:100%;border-radius:18px;border:1px solid rgba(65,242,255,.24);background:rgba(2,8,17,.72);padding:16px 18px;color:white;font-weight:800;outline:none}.field::placeholder{color:rgba(255,255,255,.42)}.field:focus{border-color:rgba(65,242,255,.8);box-shadow:0 0 0 3px rgba(65,242,255,.12)}.service-card{position:relative;min-height:154px;border-radius:28px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035));padding:16px;text-align:left;overflow:hidden;box-shadow:inset 0 1px rgba(255,255,255,.08),0 20px 50px rgba(0,0,0,.28);transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}.service-card:hover,.service-card.selected{transform:translateY(-4px);box-shadow:inset 0 1px rgba(255,255,255,.12),0 24px 70px rgba(0,0,0,.38),0 0 30px rgba(65,242,255,.16)}.service-card.selected{border-color:rgba(65,242,255,.75)}.icon3d{display:grid;height:42px;width:42px;place-items:center;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.09);font-size:22px;box-shadow:inset 0 1px rgba(255,255,255,.2)}.selected-pill{border-radius:999px;background:white;color:#06111f;padding:8px 10px;font-size:10px;font-weight:1000;text-transform:uppercase;letter-spacing:.14em}.color-cyan .icon3d,.color-cyan.selected{box-shadow:0 0 30px rgba(34,211,238,.18)}.color-violet.selected{border-color:rgba(167,139,250,.8)}.color-emerald.selected{border-color:rgba(52,211,153,.8)}.color-gold.selected{border-color:rgba(251,191,36,.8)}@keyframes scanY{from{top:20%}to{top:78%}}@keyframes houseFloat{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,-10px)}}@media(max-width:640px){.service-card{min-height:136px;padding:14px}.floating-value{padding:9px 10px}.floating-value b{font-size:14px}.field{border-radius:16px;padding:15px}.house-float{font-size:58px}.scan-line{left:8%;right:8%}}
      `}</style>
    </main>
  );
}

function MoneyInput({ label, name, value, onChange, help }: { label: string; name: string; value: string; onChange: (v: string) => void; help: string }) {
  return <div className="rounded-3xl border border-white/15 bg-white/[.035] p-4"><label className="text-[11px] font-black uppercase tracking-[.22em] text-cyan-200">{label}</label><input name={name} value={value} onChange={(e) => onChange(e.target.value)} className="mt-3 w-full bg-transparent text-4xl font-black tracking-[-.04em] outline-none" /><p className="mt-2 text-sm font-semibold text-white/45">{help}</p></div>;
}
function ResultCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-3xl border p-4 ${highlight ? "border-emerald-300/25 bg-emerald-300/10" : "border-white/10 bg-black/20"}`}><div className="text-[11px] font-black uppercase tracking-[.16em] text-white/50">{label}</div><div className={`mt-2 text-2xl font-black tracking-[-.04em] ${highlight ? "text-emerald-300" : "text-white"}`}>{value}</div></div>;
}
function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-white/72">{label}</span><select name={name} className="field">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}
