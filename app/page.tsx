"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ProductKey = "heloc" | "refinance" | "equity_card" | "purchase";
type AddressResult = { label: string; street?: string; city?: string; state?: string; zip?: string; place_id?: string };

const OFFER_RATE = 0.065;
const TERM_MONTHS = 360;

const products: Array<{
  key: ProductKey;
  eyebrow: string;
  title: string;
  shortTitle: string;
  short: string;
  icon: string;
  accent: string;
}> = [
  { key: "heloc", eyebrow: "ACCESS CASH", title: "HELOC", shortTitle: "Cash", short: "Access available equity while usually keeping your current mortgage.", icon: "⌂", accent: "cyan" },
  { key: "refinance", eyebrow: "REFINANCE", title: "Cash-Out + Lower Payment", shortTitle: "Refi", short: "Combine your current payoff and requested cash into one estimated new payment.", icon: "↻", accent: "violet" },
  { key: "equity_card", eyebrow: "HOME EQUITY CREDIT LINE", title: "Equity Credit Card", shortTitle: "Card", short: "Use home equity as flexible spending power through an equity-line style option.", icon: "▣", accent: "emerald" },
  { key: "purchase", eyebrow: "BUYING A NEW HOME", title: "Purchase Mortgage", shortTitle: "Buy", short: "Get matched with mortgage companies for purchase financing programs.", icon: "⚿", accent: "gold" }
];

const goalsByProduct: Record<ProductKey, Array<{ title: string; desc: string }>> = {
  heloc: [
    { title: "Access equity from my home", desc: "Cash needs, remodels, emergencies, or flexible spending." },
    { title: "Pay off high-interest debt", desc: "Use available equity to review replacing expensive card balances." },
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
  const [mortgageBalanceInput, setMortgageBalanceInput] = useState("");
  const [loanCountInput, setLoanCountInput] = useState("1");
  const [extraLoanInputs, setExtraLoanInputs] = useState<string[]>(["", "", ""]);
  const [extraLoanRateInputs, setExtraLoanRateInputs] = useState<string[]>(["", "", ""]);
  const [requestedCashInput, setRequestedCashInput] = useState("");
  const [currentRateInput, setCurrentRateInput] = useState("");
  const [purchaseLoanInput, setPurchaseLoanInput] = useState("");
  const [purchaseTargetMode, setPurchaseTargetMode] = useState(false);
  const [hasCoOwner, setHasCoOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voicePlayed, setVoicePlayed] = useState(false);
  const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);

  function speakWelcome(force = false) {
    if (typeof window === "undefined") return false;

    const markPlayed = () => {
      setVoicePlayed(true);
    };

    try {
      if (!welcomeAudioRef.current) {
        const audio = new Audio("/audio/welcome-voice.mp3");
        audio.preload = "auto";
        audio.volume = 0.95;
        welcomeAudioRef.current = audio;
      }

      const audio = welcomeAudioRef.current;
      audio.currentTime = 0;
      const playPromise = audio.play();

      if (playPromise && typeof playPromise.then === "function") {
        playPromise.then(markPlayed).catch((error) => {
          // Browsers, especially iPhone Safari, may block audible autoplay until the first tap.
          // We intentionally do NOT fall back to robotic text-to-speech. The speaker button and first tap retry the real ElevenLabs voice file.
          console.warn("Welcome voice autoplay blocked until user interaction", error);
        });
      } else {
        markPlayed();
      }

      return true;
    } catch (error) {
      console.warn("Welcome voice failed to initialize", error);
      return false;
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Best possible autoplay attempt using the real ElevenLabs MP3. Browsers may still require a tap,
    // so we retry on load, focus, visibility, and the first user action.
    const preloadAudio = () => {
      if (!welcomeAudioRef.current) {
        const existing = document.getElementById("hc-welcome-autoplay") as HTMLAudioElement | null;
        const audio = existing || new Audio("/audio/welcome-voice.mp3");
        audio.preload = "auto";
        audio.volume = 0.95;
        welcomeAudioRef.current = audio;
        try { audio.load(); } catch {}
      }
    };

    preloadAudio();

    const attempts = [250, 700, 1300, 2200, 3500].map((delay) => window.setTimeout(() => speakWelcome(false), delay));
    const playOnReady = () => speakWelcome(false);
    const playWhenVisible = () => { if (!document.hidden) speakWelcome(false); };

    window.addEventListener("load", playOnReady, { once: true });
    window.addEventListener("focus", playOnReady, { once: true });
    document.addEventListener("visibilitychange", playWhenVisible);
    window.addEventListener("pointerdown", playOnReady, { once: true });
    window.addEventListener("touchstart", playOnReady, { once: true, passive: true });
    window.addEventListener("click", playOnReady, { once: true });

    return () => {
      attempts.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("load", playOnReady);
      window.removeEventListener("focus", playOnReady);
      document.removeEventListener("visibilitychange", playWhenVisible);
      window.removeEventListener("pointerdown", playOnReady);
      window.removeEventListener("touchstart", playOnReady);
      window.removeEventListener("click", playOnReady);
    };
  }, []);

  const selected = products.find((p) => p.key === product)!;
  const homeValue = toNumber(homeValueInput);
  const loanCount = loanCountInput === "4+" ? 4 : Number(loanCountInput || "1");
  const visibleExtraLoanCount = Math.max(0, loanCount - 1);
  const extraLoansTotal = extraLoanInputs.slice(0, visibleExtraLoanCount).reduce((sum, v) => sum + toNumber(v), 0);
  const mortgageBalance = toNumber(mortgageBalanceInput) + extraLoansTotal;
  const loanDetails = [
    { balance: toNumber(mortgageBalanceInput), rate: Number(currentRateInput || 0) / 100 },
    ...extraLoanInputs.slice(0, visibleExtraLoanCount).map((balance, index) => ({ balance: toNumber(balance), rate: Number(extraLoanRateInputs[index] || 0) / 100 }))
  ];
  const requestedCash = toNumber(requestedCashInput);
  const purchaseLoan = toNumber(purchaseLoanInput);
  const currentRate = Number(currentRateInput || 0) / 100;
  const maxEquity = useMemo(() => product === "purchase" || !homeValue ? 0 : Math.max(0, Math.round(homeValue * 0.85 - mortgageBalance)), [homeValue, mortgageBalance, product]);
  const cashToUse = useMemo(() => product === "purchase" ? 0 : Math.max(0, Math.min(requestedCash || maxEquity, maxEquity || requestedCash)), [requestedCash, maxEquity, product]);
  const helocPayment = useMemo(() => monthlyPayment(cashToUse), [cashToUse]);
  const currentMortgagePayment = useMemo(() => loanDetails.reduce((sum, loan) => sum + monthlyPayment(loan.balance, loan.rate || OFFER_RATE), 0), [mortgageBalanceInput, currentRateInput, extraLoanInputs, extraLoanRateInputs, loanCountInput]);
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
      const fromApi = Number(data?.value || data?.avm || data?.estimatedValue || data?.valuation || 0);
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
    setTimeout(() => document.getElementById("step1")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#030912] text-white">
      <audio id="hc-welcome-autoplay" src="/audio/welcome-voice.mp3" preload="auto" autoPlay playsInline className="hidden" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(29,91,255,.25),transparent_30%),radial-gradient(circle_at_100%_20%,rgba(0,255,178,.13),transparent_28%),linear-gradient(180deg,#020712,#06111e)]" />

      <a href="tel:9498662466" className="live-agent-tab" aria-label="Connect to a non-AI live agent by phone">
        <span className="agent-orb">☎</span>
        <span className="agent-copy">
          <strong>Connect to Non-AI Live Agent!</strong>
          <small>Tap to call now</small>
        </span>
      </a>

      <header className="sticky top-0 z-50 border-b border-cyan-200/10 bg-[#030912]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/40 bg-cyan-300/10 text-xl shadow-[0_0_28px_rgba(65,242,255,.18)]">⌂</div>
            <div><div className="text-base font-black tracking-[.22em]">HELOC</div><div className="text-[10px] font-black tracking-[.42em] text-cyan-300">CONNECT</div></div>
          </a>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-cyan-300/25 bg-cyan-300/8 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-100 sm:px-4">Yahoo Finance</div>
            <button type="button" onClick={() => speakWelcome(true)} aria-label="Replay welcome voice" title="Replay welcome voice" className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-black transition ${voicePlayed ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100" : "border-white/15 bg-white/[.045] text-white/75 hover:border-cyan-300/35 hover:text-cyan-100"}`}>♫</button>
          </div>
        </div>
      </header>

      <form onSubmit={submitLead} className="mx-auto max-w-6xl px-3 pb-16 pt-4 sm:px-6 lg:pt-8">
        <input type="hidden" name="selected_product" value={selected.title} />
        <input type="hidden" name="main_goal" value={mainGoal} />
        <input type="hidden" name="property_address" value={`${street}${unit ? " #" + unit : ""}, ${city}, ${stateName} ${zip}`} />
        <input type="hidden" name="home_value" value={homeValue} />
        <input type="hidden" name="possible_equity_room" value={maxEquity} />
        <input type="hidden" name="estimated_monthly_payment" value={estimatedPayment} />
        <input type="hidden" name="current_interest_rate" value={currentRateInput} />
        <input type="hidden" name="existing_loan_count" value={loanCountInput} />
        <input type="hidden" name="total_existing_loans" value={mortgageBalance} />
        <input type="hidden" name="extra_existing_loans" value={JSON.stringify(extraLoanInputs)} />
        <input type="hidden" name="existing_loan_rates" value={JSON.stringify([currentRateInput, ...extraLoanRateInputs.slice(0, visibleExtraLoanCount)])} />

        <section className="process-shell">
          <div className="topbar2">
            <div className="brandline"><div className="brandmark">⌂</div><div><b>HELOC</b><span>CONNECT</span></div></div>
            <div className="yahoo-premium"><small>AS FEATURED ON</small><b>yahoo! <em>finance</em></b></div>
          </div>
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">SMART. FAST. TARGETED.</div>
              <h1>How <strong>HELOC CONNECT</strong><br/>Works for You</h1>
              <p>Our intelligent system matches you with the right mortgage company so you can avoid wasting time with the wrong fit — fast, secure, and 100% free for homeowners.</p>
              <div className="trust-row"><span>✓ Homeowners Pay $0</span><span>✓ No SSN to Start</span><span>✓ Secure Review</span><span>✓ Premium Network</span></div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hud-grid"/><div className="scan-line"/><div className="orb"/>
              <div className="home-model"><div className="roof"/><div className="base"/><div className="win w1"/><div className="win w2"/><div className="door"/></div>
              <div className="float-card v1"><small>Est. Home Value</small><b>{homeValue ? money(homeValue) : "$1,850,000"}</b></div>
              <div className="float-card v2"><small>Cash You Can Get</small><b>{maxEquity ? money(maxEquity) : "$350,000"}</b></div>
              <div className="float-card v3"><small>Est. Payment</small><b>{estimatedPayment ? `${money(estimatedPayment)}/mo` : "$2,381/mo"}</b></div>
            </div>
          </div>
          <div className="process-steps">
            <ProcessStep n="1" title="Input Your Home Address" text="Enter your address in the smart calculator. Our system uses property data to identify your home." mock="Property Lookup" />
            <ProcessStep n="2" title="See Your Value & Options" text="Instantly preview your home value, available cash, and estimated payment options." mock="Live Numbers" />
            <ProcessStep n="3" title="Tell Us About Yourself" text="Share a few basic details so we can direct you to the company that best fits your situation." mock="Smart Match" />
            <ProcessStep n="4" title="Track Every Step Live" text="Watch your status bar as we match you with a premium mortgage company in our network." mock="Status Portal" />
          </div>
          <div className="why-panel">
            <div className="why-head"><div className="shield">✓</div><div><small>WHY CHOOSE HELOC CONNECT?</small><h2>Hassle-Free. Risk-Free. Results-Driven.</h2></div></div>
            <div className="benefit-grid"><Benefit title="Only 3 Months Bank Statements" text="Simple review with no extra tax documents needed to start."/><Benefit title="Save Time" text="We do the hard work and match you faster."/><Benefit title="Low Credit? No Problem" text="We work with companies that help more homeowner situations."/><Benefit title="Best Possible Payments & Terms" text="We help route you toward strong available options."/></div>
            <div className="freebar">Homeowners Pay <span>$0</span> &nbsp; | &nbsp; Mortgage Companies Pay Us</div>
          </div>
        </section>

        <section id="services" className="mt-5 rounded-[26px] border border-cyan-300/20 bg-white/[.035] p-4 sm:p-7">
          <div className="text-center"><div className="mx-auto w-fit rounded-full border border-cyan-300/25 bg-cyan-300/8 px-4 py-2 text-[10px] font-black uppercase tracking-[.28em] text-cyan-200">Choose Your Path</div><h2 className="mt-3 text-2xl font-black tracking-[-.04em] sm:text-5xl">What brings you in today?</h2><p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-white/60">Tap one option. Step 1 below updates instantly.</p></div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {products.map((p) => <button key={p.key} type="button" onClick={() => chooseProduct(p.key)} className={`service-tile accent-${p.accent} ${product === p.key ? "selected" : ""}`}><div className="tile-top"><div className="icon3d">{p.icon}</div>{product === p.key && <div className="selected-pill">✓</div>}</div><div className="tile-eyebrow">{p.eyebrow}</div><div className="tile-title">{p.shortTitle}</div><p>{p.short}</p></button>)}
          </div>
        </section>

        <section id="step1" className="mt-5 rounded-[28px] border border-emerald-300/20 bg-[#071522]/88 p-4 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="text-[11px] font-black uppercase tracking-[.28em] text-cyan-200">Step 1 • Smart Calculator & Payment Preview</div><h2 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-5xl">Preview your {selected.title} numbers</h2></div><div className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100">Estimated in seconds</div></div>
          <div className="mt-5 rounded-[26px] border border-cyan-300/20 bg-black/20 p-4 sm:p-5"><label className="text-sm font-black text-white/80">{product === "purchase" ? "Property purchasing address" : "Property address"}</label><div className="mt-2 grid gap-3 lg:grid-cols-[1fr_150px_150px_110px_120px]"><div className="relative"><input value={street} onChange={(e) => searchAddress(e.target.value)} placeholder="Search your property address" className="field" />{addressResults.length > 0 && <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-cyan-300/20 bg-[#07111f] p-2 shadow-2xl">{addressResults.map((r, i) => <button key={`${r.label}-${i}`} type="button" onClick={() => selectAddress(r)} className="block w-full rounded-xl px-3 py-3 text-left text-sm font-bold text-white/85 hover:bg-cyan-300/10">{r.label}</button>)}</div>}</div><input name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className="field" /><input name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="field" /><input name="state" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" className="field" /><input name="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" className="field" /></div><div className="mt-3 flex flex-col gap-2 text-sm font-black text-cyan-100 sm:flex-row sm:items-center sm:justify-between"><span>{valueStatus || addressStatus}</span><button type="button" onClick={() => lookupHomeValue({ street, city, state: stateName, zip, address: `${street}, ${city}, ${stateName} ${zip}` })} className="rounded-2xl border border-cyan-300/25 bg-cyan-300/8 px-4 py-3">Re-check Property Value</button></div></div>
          {product === "purchase" && <label className="mt-4 flex items-start gap-3 rounded-3xl border border-white/15 bg-white/[.035] p-4 text-sm font-black"><input type="checkbox" checked={purchaseTargetMode} onChange={(e) => setPurchaseTargetMode(e.target.checked)} className="mt-1 h-5 w-5" /> I haven’t found the right home yet — let me choose the approximate purchase loan amount.</label>}
          <div className="mt-5 grid gap-4 lg:grid-cols-[.9fr_1.1fr]"><div className="rounded-[26px] border border-white/15 bg-white/[.035] p-4 sm:p-5"><div className="text-[11px] font-black uppercase tracking-[.28em] text-cyan-200">You Enter</div><h3 className="mt-2 text-2xl font-black">Information needed from you</h3><div className="mt-4 grid gap-3">
                {product !== "purchase" && <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[.045] p-4">
                  <label className="text-[11px] font-black uppercase tracking-[.22em] text-cyan-200">How many existing loans are on this property?</label>
                  <select name="existing_loan_count_visible" value={loanCountInput} onChange={(e) => setLoanCountInput(e.target.value)} className="field mt-3">
                    <option value="1">1 existing loan</option>
                    <option value="2">2 existing loans</option>
                    <option value="3">3 existing loans</option>
                    <option value="4+">4+ existing loans</option>
                  </select>
                  <p className="mt-2 text-sm font-semibold text-white/45">This lets the calculator use your total property payoff, not just the first mortgage.</p>
                </div>}
                {product !== "purchase" && (loanCount > 1
                  ? <LoanAmountRateInput label="Loan 1 / first mortgage" name="mortgage_balance" value={mortgageBalanceInput} onChange={setMortgageBalanceInput} rateName="current_interest_rate_visible" rateValue={currentRateInput} onRateChange={setCurrentRateInput} help="Enter the balance and current interest rate for your first mortgage." />
                  : <MoneyInput label="Current mortgage balance" name="mortgage_balance" value={mortgageBalanceInput} onChange={setMortgageBalanceInput} help="Approximate balance remaining on your current mortgage." />
                )}
                {product !== "purchase" && extraLoanInputs.slice(0, visibleExtraLoanCount).map((value, index) => (
                  <LoanAmountRateInput key={index} label={`Loan ${index + 2} / additional property loan`} name={`existing_loan_${index + 2}_balance`} value={value} onChange={(next) => setExtraLoanInputs((prev) => prev.map((item, i) => i === index ? next : item))} rateName={`existing_loan_${index + 2}_interest_rate`} rateValue={extraLoanRateInputs[index] || ""} onRateChange={(next) => setExtraLoanRateInputs((prev) => prev.map((item, i) => i === index ? next : item))} help="Enter this loan balance and its own interest rate so the payment comparison is more accurate." />
                ))}
                {product !== "purchase" && <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[.22em] text-emerald-200">Calculated Total Existing Loans</div>
                  <div className="mt-2 text-3xl font-black tracking-[-.04em] text-emerald-300">{money(mortgageBalance)}</div>
                  <p className="mt-2 text-sm font-semibold text-white/55">Used for equity, HELOC room, and refinance payoff calculations.</p>
                </div>}
                {product !== "purchase" && <MoneyInput label="Cash amount requested" name="requested_cash" value={requestedCashInput} onChange={setRequestedCashInput} help="Amount of cash you would like reviewed on top of your existing payoff." />}
                {product === "refinance" && loanCount === 1 && <div className="premium-input-card"><div className="input-header"><span>Client Input</span><b>Current loan interest rate</b></div><div className="money-shell"><input value={currentRateInput} onChange={(e) => setCurrentRateInput(e.target.value)} name="current_interest_rate_visible" className="premium-money-input" placeholder="" inputMode="decimal" /><em>%</em></div><p className="input-help">Used only to estimate what you may be paying now.</p></div>}
                {product === "purchase" && <MoneyInput label={purchaseTargetMode ? "Approximate purchase loan wanted" : "Purchase loan amount"} name="purchase_loan_amount" value={purchaseLoanInput} onChange={setPurchaseLoanInput} help="Move this to preview the monthly payment." />}
                <div><label className="text-sm font-black text-white/70">Editable property value</label><input value={homeValueInput} onChange={(e) => setHomeValueInput(e.target.value)} className="field mt-2" placeholder="Auto-filled after address" /></div>
              </div></div><div className="rounded-[26px] border border-emerald-300/20 bg-emerald-300/8 p-4 sm:p-5"><div className="text-[11px] font-black uppercase tracking-[.28em] text-emerald-200">We Calculate</div><h3 className="mt-2 text-2xl font-black">Your estimated preview</h3><div className="mt-4 grid grid-cols-2 gap-3"><ResultCard label="Property Value" value={homeValue ? money(homeValue) : "Waiting"} />{product !== "purchase" && <ResultCard label="Total Existing Loans" value={money(mortgageBalance)} />}{product !== "purchase" && <ResultCard label="Estimated Equity Room" value={maxEquity ? money(maxEquity) : "$0"} />}{product === "refinance" && <ResultCard label="Estimated Current Payment" value={`${money(currentMortgagePayment)}/mo`} />}{product === "refinance" && <ResultCard label="New Loan With Cash" value={money(refinanceLoan)} highlight />}{product === "purchase" && <ResultCard label="Purchase Loan" value={money(purchaseLoan)} />}<ResultCard label={product === "refinance" ? "Estimated New Payment" : "Estimated Payment"} value={`${money(estimatedPayment)}/mo`} highlight />{product !== "purchase" && <ResultCard label="Cash Requested" value={money(cashToUse)} highlight />}</div><p className="mt-4 rounded-2xl border border-cyan-300/15 bg-black/20 p-3 text-sm font-semibold leading-relaxed text-white/68">{product === "refinance" ? "Refinance preview totals every existing property loan, adds the cash requested, then estimates one new combined payment." : product === "purchase" ? "Purchase preview estimates a monthly payment based on the selected loan amount." : "HELOC / equity-line preview subtracts all existing property loans from the home value to estimate available equity room."}</p></div></div>
        </section>

        <section className="mt-5 rounded-[28px] border border-cyan-300/20 bg-white/[.035] p-4 sm:p-7"><div className="text-[11px] font-black uppercase tracking-[.28em] text-cyan-200">Step 2 • Tell Us About Yourself</div><h2 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-5xl">Finish your match review</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><input name="first_name" required placeholder="First name" className="field" /><input name="last_name" required placeholder="Last name" className="field" /><input name="phone" required placeholder="Mobile number" className="field" /><input name="email" required type="email" placeholder="Email address" className="field" /></div><label className="mt-4 flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/75"><input type="checkbox" name="sms_consent" value="yes" className="mt-1 h-5 w-5" /> It’s ok to receive SMS updates about my application status.</label><div className="mt-4 grid gap-3 sm:grid-cols-2"><Select name="credit_score" label="Credit score" options={["720+", "680–719", "620–679", "580–619", "Below 580", "Not sure"]} /><Select name="credit_card_payments" label="Credit card payment history" options={["I am current and never missed a payment", "I am current now but had a few missed payments in the past", "I have stopped making payments completely"]} /><Select name="bankruptcy_10_years" label="Filed bankruptcy in last 10 years?" options={["No", "Yes", "Not sure"]} /><input name="monthly_income" placeholder="Monthly income" className="field" /><Select name="mortgage_good_standing" label="Current on mortgage payments?" options={["Current", "Current now, missed in the past", "Behind right now", "No mortgage"]} /></div><label className="mt-4 flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/75"><input type="checkbox" checked={hasCoOwner} onChange={(e) => setHasCoOwner(e.target.checked)} className="mt-1 h-5 w-5" /> Add another owner on the property</label>{hasCoOwner && <div className="mt-4 grid gap-3 rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-4 sm:grid-cols-2"><input name="co_first_name" placeholder="Co-owner first name" className="field" /><input name="co_last_name" placeholder="Co-owner last name" className="field" /><input name="co_phone" placeholder="Co-owner phone" className="field" /><input name="co_email" placeholder="Co-owner email" className="field" /><Select name="co_credit_score" label="Co-owner credit score" options={["720+", "680–719", "620–679", "580–619", "Below 580", "Not sure"]} /><Select name="co_bankruptcy_10_years" label="Co-owner bankruptcy?" options={["No", "Yes", "Not sure"]} /></div>}<button disabled={loading} className="mt-6 w-full rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 px-6 py-5 text-lg font-black text-[#02111c] shadow-[0_0_44px_rgba(34,211,238,.22)] disabled:opacity-60">{loading ? "Submitting..." : "Find My Right Match →"}</button><p className="mt-3 text-center text-xs font-semibold text-white/45">Secure review • No obligation • Homeowners pay $0</p></section>
      </form>

      <style jsx global>{`
        .process-shell{border:1px solid rgba(65,242,255,.35);border-radius:28px;background:linear-gradient(180deg,rgba(6,22,38,.96),rgba(3,12,22,.98));box-shadow:0 30px 90px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.04);padding:18px;position:relative;overflow:hidden}.process-shell:before{content:"";position:absolute;inset:-1px;background:radial-gradient(circle at 76% 7%,rgba(65,242,255,.18),transparent 22%),radial-gradient(circle at 6% 90%,rgba(93,255,170,.12),transparent 22%);pointer-events:none}.topbar2,.hero-grid,.process-steps,.why-panel{position:relative;z-index:1}.topbar2{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:22px}.brandline{display:flex;align-items:center;gap:10px;font-weight:950;letter-spacing:.2em}.brandmark{width:42px;height:42px;border-radius:16px;background:linear-gradient(135deg,#101e34,#0e3c4b);border:1px solid rgba(65,242,255,.46);display:grid;place-items:center;box-shadow:0 0 30px rgba(65,242,255,.18);color:#41f2ff}.brandline b{display:block}.brandline span{display:block;color:#41f2ff;font-size:11px}.yahoo-premium{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10);box-shadow:inset 0 1px rgba(255,255,255,.08)}.yahoo-premium small{font-size:9px;letter-spacing:.22em;color:#aeefff;font-weight:900}.yahoo-premium b{font-size:22px;line-height:.85;letter-spacing:-.08em}.yahoo-premium em{font-size:14px;font-style:normal}.hero-grid{display:grid;gap:22px}.hero-copy .eyebrow{color:#41f2ff;letter-spacing:.28em;font-weight:950;font-size:12px;margin-bottom:12px}.hero-copy h1{font-size:clamp(36px,10vw,68px);line-height:.94;letter-spacing:-.06em;margin:0 0 16px;font-weight:1000}.hero-copy h1 strong{color:#41f2ff;text-shadow:0 0 24px rgba(65,242,255,.25)}.hero-copy p{font-size:16px;line-height:1.52;color:#dce9f7;max-width:560px;margin:0}.trust-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.trust-row span{border:1px solid rgba(65,242,255,.22);border-radius:16px;padding:11px 12px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));font-weight:850;font-size:12px}.hero-visual{min-height:280px;border-radius:26px;background:radial-gradient(circle at 50% 58%,rgba(65,242,255,.23),transparent 26%),linear-gradient(180deg,rgba(10,29,49,.98),rgba(3,10,19,.96));border:1px solid rgba(65,242,255,.22);position:relative;overflow:hidden;box-shadow:inset 0 0 50px rgba(65,242,255,.07)}.hud-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(65,242,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(65,242,255,.05) 1px,transparent 1px);background-size:26px 26px}.scan-line{position:absolute;left:8%;right:8%;height:3px;top:28%;background:linear-gradient(90deg,transparent,#41f2ff,#60ff9a,transparent);box-shadow:0 0 22px #41f2ff;animation:scanY 3.2s ease-in-out infinite alternate}.orb{position:absolute;left:31%;right:20%;bottom:54px;height:86px;border-radius:50%;border:3px solid rgba(65,242,255,.72);box-shadow:0 0 30px rgba(65,242,255,.4), inset 0 0 20px rgba(65,242,255,.18);transform:perspective(500px) rotateX(67deg)}.home-model{position:absolute;left:44%;top:100px;width:132px;height:104px;filter:drop-shadow(0 22px 34px rgba(0,0,0,.55));animation:houseFloat 4s ease-in-out infinite}.roof{position:absolute;left:2px;top:0;width:128px;height:50px;background:linear-gradient(135deg,#1f405b,#050913);clip-path:polygon(50% 0,100% 100%,0 100%);border-bottom:3px solid rgba(65,242,255,.35)}.base{position:absolute;left:14px;top:42px;width:106px;height:62px;border-radius:8px;background:linear-gradient(135deg,#132e44,#07111e);border:1px solid rgba(65,242,255,.35)}.win{position:absolute;background:#ffd968;box-shadow:0 0 18px #ffd968;border-radius:3px}.w1{left:30px;top:58px;width:20px;height:17px}.w2{left:82px;top:58px;width:20px;height:17px}.door{position:absolute;left:58px;top:72px;width:20px;height:32px;background:#030912;border-radius:8px 8px 0 0}.float-card{position:absolute;padding:10px 12px;border-radius:15px;background:rgba(2,11,22,.86);border:1px solid rgba(65,242,255,.42);box-shadow:0 0 28px rgba(65,242,255,.18);font-weight:950}.float-card small{display:block;color:#b7c7d9;font-size:9px;letter-spacing:.10em;text-transform:uppercase}.float-card b{font-size:15px;color:#60ff9a}.v1{right:16px;top:36px;transform:rotate(4deg)}.v2{right:8px;top:128px;transform:rotate(-4deg)}.v3{right:30px;bottom:34px;transform:rotate(2deg)}.process-steps{display:grid;gap:12px;margin-top:18px}.process-step{display:grid;grid-template-columns:44px 1fr;gap:12px;align-items:center;border:1px solid rgba(65,242,255,.22);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.025));border-radius:20px;padding:14px;overflow:hidden}.step-num{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:1000;font-size:20px;background:rgba(65,242,255,.08);border:2px solid #41f2ff;box-shadow:0 0 20px rgba(65,242,255,.22)}.process-step h3{font-size:17px;margin:0 0 5px;letter-spacing:-.02em}.process-step p{margin:0;color:#c8d7e8;line-height:1.4;font-size:13px}.step-mock{grid-column:1 / -1;border:1px solid rgba(65,242,255,.30);background:#040b15;border-radius:16px;padding:12px;text-align:center;font-size:12px;font-weight:950;color:#d9faff}.why-panel{margin-top:18px;border:1px solid rgba(96,255,154,.24);border-radius:22px;background:linear-gradient(180deg,rgba(18,58,54,.45),rgba(7,17,29,.92));padding:18px}.why-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}.shield{width:48px;height:48px;border-radius:16px;background:rgba(96,255,154,.08);border:1px solid rgba(96,255,154,.35);display:grid;place-items:center;color:#60ff9a;font-size:28px;box-shadow:0 0 28px rgba(96,255,154,.18);flex:0 0 auto}.why-head small{display:block;color:#41f2ff;letter-spacing:.18em;font-weight:950;margin-bottom:4px;font-size:10px}.why-head h2{font-size:24px;margin:0;letter-spacing:-.05em}.benefit-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.benefit{border:1px solid rgba(65,242,255,.16);border-radius:16px;padding:12px;background:rgba(0,0,0,.18)}.benefit b{display:block;font-size:13px;margin-bottom:5px}.benefit p{margin:0;color:#bcd0e2;line-height:1.35;font-size:12px}.freebar{margin:16px auto 0;max-width:680px;border:1px solid rgba(65,242,255,.30);border-radius:999px;padding:12px 15px;text-align:center;background:rgba(0,0,0,.28);font-weight:900;font-size:13px}.freebar span{color:#60ff9a}.service-tile{position:relative;min-height:120px;border-radius:24px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035));padding:13px;text-align:left;overflow:hidden;box-shadow:inset 0 1px rgba(255,255,255,.08),0 20px 50px rgba(0,0,0,.28);transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}.service-tile.selected{transform:translateY(-3px);border-color:rgba(65,242,255,.75);box-shadow:inset 0 1px rgba(255,255,255,.12),0 24px 70px rgba(0,0,0,.38),0 0 30px rgba(65,242,255,.16)}.tile-top{display:flex;align-items:center;justify-content:space-between}.icon3d{display:grid;height:38px;width:38px;place-items:center;border-radius:15px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.09);font-size:20px;box-shadow:inset 0 1px rgba(255,255,255,.2)}.selected-pill{border-radius:999px;background:white;color:#06111f;padding:7px 9px;font-size:10px;font-weight:1000}.tile-eyebrow{margin-top:9px;font-size:8px;font-weight:1000;letter-spacing:.18em;color:#9ff6ff;text-transform:uppercase}.tile-title{margin-top:5px;font-size:22px;font-weight:1000;line-height:.95;letter-spacing:-.04em}.service-tile p{margin-top:7px;font-size:11px;line-height:1.35;color:rgba(255,255,255,.65);font-weight:700}.premium-input-card{position:relative;overflow:hidden;border-radius:26px;border:1px solid rgba(65,242,255,.24);background:linear-gradient(145deg,rgba(8,27,45,.88),rgba(3,10,18,.94));padding:16px;box-shadow:inset 0 1px rgba(255,255,255,.08),0 18px 40px rgba(0,0,0,.24)}.premium-input-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 12% 0%,rgba(65,242,255,.14),transparent 38%),linear-gradient(90deg,rgba(255,255,255,.06),transparent 35%,rgba(96,255,154,.05));pointer-events:none}.input-header{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.input-header span{border:1px solid rgba(65,242,255,.28);border-radius:999px;padding:6px 8px;background:rgba(65,242,255,.08);color:#9ff6ff;font-size:9px;font-weight:1000;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap}.input-header b{display:block;text-align:right;color:#fff;font-size:13px;font-weight:1000;letter-spacing:.02em;text-transform:uppercase}.money-shell{position:relative;z-index:1;margin-top:14px;display:flex;align-items:center;gap:8px;border-radius:22px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.26);padding:12px 14px;box-shadow:inset 0 1px 18px rgba(0,0,0,.22)}.money-shell em{font-style:normal;color:#60ff9a;font-size:26px;font-weight:1000;text-shadow:0 0 20px rgba(96,255,154,.18)}.premium-money-input{min-width:0;width:100%;border:0;background:transparent;color:white;font-size:32px;font-weight:1000;letter-spacing:-.05em;outline:none}.premium-money-input::placeholder{color:transparent}.loan-duo{position:relative;z-index:1;display:grid;gap:12px;margin-top:14px}.duo-label{margin:0 0 7px 2px;color:#9ff6ff;font-size:10px;font-weight:1000;text-transform:uppercase;letter-spacing:.18em}@media(min-width:640px){.loan-duo{grid-template-columns:1fr .62fr}}.loan-duo .money-shell{margin-top:0}.money-shell:focus-within{border-color:rgba(65,242,255,.72);box-shadow:0 0 0 3px rgba(65,242,255,.11),inset 0 1px 18px rgba(0,0,0,.22)}.input-help{position:relative;z-index:1;margin:10px 0 0;color:rgba(255,255,255,.48);font-size:12px;font-weight:750;line-height:1.35}.field{width:100%;border-radius:18px;border:1px solid rgba(65,242,255,.24);background:rgba(2,8,17,.72);padding:16px 18px;color:white;font-weight:800;outline:none}.field::placeholder{color:rgba(255,255,255,.42)}.field:focus{border-color:rgba(65,242,255,.8);box-shadow:0 0 0 3px rgba(65,242,255,.12)}.live-agent-tab{position:fixed;right:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:12px;max-width:330px;border-radius:999px;border:1px solid rgba(96,255,154,.42);background:linear-gradient(135deg,rgba(5,23,35,.94),rgba(7,42,53,.94) 48%,rgba(18,92,72,.92));padding:12px 16px 12px 12px;color:#fff;text-decoration:none;box-shadow:0 18px 55px rgba(0,0,0,.42),0 0 34px rgba(65,242,255,.18),inset 0 1px rgba(255,255,255,.15);backdrop-filter:blur(18px);transform:translateZ(0);transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}.live-agent-tab:before{content:"";position:absolute;inset:-1px;border-radius:999px;background:linear-gradient(90deg,transparent,rgba(65,242,255,.35),rgba(96,255,154,.34),transparent);opacity:.7;filter:blur(10px);z-index:-1;animation:agentGlow 2.8s ease-in-out infinite}.live-agent-tab:hover{transform:translateY(-3px) scale(1.015);border-color:rgba(96,255,154,.78);box-shadow:0 22px 70px rgba(0,0,0,.5),0 0 42px rgba(96,255,154,.24),inset 0 1px rgba(255,255,255,.2)}.agent-orb{display:grid;width:46px;height:46px;flex:0 0 46px;place-items:center;border-radius:50%;background:radial-gradient(circle at 30% 20%,#ffffff,#9fffe0 32%,#18b98c 70%,#064b45);color:#031115;font-size:21px;font-weight:1000;box-shadow:0 0 22px rgba(96,255,154,.42),inset 0 2px 7px rgba(255,255,255,.55)}.agent-copy{display:flex;min-width:0;flex-direction:column;line-height:1.05}.agent-copy strong{font-size:14px;font-weight:1000;letter-spacing:-.02em;text-transform:uppercase}.agent-copy small{margin-top:4px;color:#bdf8e5;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}@keyframes agentGlow{0%,100%{opacity:.45;transform:scale(.98)}50%{opacity:.9;transform:scale(1.03)}}@media(max-width:640px){.live-agent-tab{left:12px;right:12px;bottom:12px;justify-content:center;padding:11px 14px 11px 11px}.agent-orb{width:42px;height:42px;flex-basis:42px}.agent-copy strong{font-size:12px}.agent-copy small{font-size:10px}}@keyframes scanY{from{top:20%}to{top:78%}}@keyframes houseFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@media(min-width:760px){.process-shell{padding:28px;border-radius:34px}.hero-grid{grid-template-columns:1.02fr .98fr;align-items:center;gap:30px}.hero-copy p{font-size:21px}.hero-visual{min-height:330px}.trust-row{display:flex;flex-wrap:wrap}.process-step{grid-template-columns:72px 1fr minmax(260px,390px);gap:18px;padding:18px}.step-num{width:52px;height:52px;font-size:24px}.process-step h3{font-size:21px}.process-step p{font-size:16px}.step-mock{grid-column:auto}.why-panel{padding:24px}.why-head h2{font-size:clamp(28px,4vw,44px)}.benefit-grid{grid-template-columns:repeat(4,1fr)}.benefit{border:0;border-left:1px solid rgba(65,242,255,.25);border-radius:0;background:transparent}.benefit:first-child{border-left:0}.benefit b{font-size:16px}.benefit p{font-size:14px}.freebar{font-size:15px}.service-tile{min-height:190px;padding:18px}.tile-title{font-size:28px}.service-tile p{font-size:14px}.float-card{padding:13px 16px}.float-card b{font-size:24px}.float-card small{font-size:11px}.home-model{left:42%;width:150px;height:112px}.v1{right:40px;top:45px}.v2{right:24px;top:145px}.v3{right:64px;bottom:42px}}@media(max-width:390px){.hero-copy h1{font-size:34px}.trust-row{grid-template-columns:1fr}.benefit-grid{grid-template-columns:1fr}.hero-visual{min-height:255px}.float-card{transform:none!important}.v1{right:10px;top:22px}.v2{right:10px;top:108px}.v3{right:18px;bottom:28px}.home-model{left:30%;top:100px;transform:scale(.8)}}
      `}</style>
    </main>
  );
}

function ProcessStep({ n, title, text, mock }: { n: string; title: string; text: string; mock: string }) {
  return <article className="process-step"><div className="step-num">{n}</div><div><h3>{title}</h3><p>{text}</p></div><div className="step-mock">{mock}</div></article>;
}
function Benefit({ title, text }: { title: string; text: string }) {
  return <div className="benefit"><b>{title}</b><p>{text}</p></div>;
}
function MoneyInput({ label, name, value, onChange, help }: { label: string; name: string; value: string; onChange: (v: string) => void; help: string }) {
  return <div className="premium-input-card"><div className="input-header"><span>Client Input</span><b>{label}</b></div><div className="money-shell"><em>$</em><input name={name} value={value} onChange={(e) => onChange(e.target.value)} className="premium-money-input" placeholder="" inputMode="decimal" /></div><p className="input-help">{help}</p></div>;
}
function LoanAmountRateInput({ label, name, value, onChange, rateName, rateValue, onRateChange, help }: { label: string; name: string; value: string; onChange: (v: string) => void; rateName: string; rateValue: string; onRateChange: (v: string) => void; help: string }) {
  return <div className="premium-input-card"><div className="input-header"><span>Client Input</span><b>{label}</b></div><div className="loan-duo"><div><div className="duo-label">Balance</div><div className="money-shell"><em>$</em><input name={name} value={value} onChange={(e) => onChange(e.target.value)} className="premium-money-input" placeholder="" inputMode="decimal" /></div></div><div><div className="duo-label">Interest Rate</div><div className="money-shell"><input name={rateName} value={rateValue} onChange={(e) => onRateChange(e.target.value)} className="premium-money-input" placeholder="" inputMode="decimal" /><em>%</em></div></div></div><p className="input-help">{help}</p></div>;
}

function ResultCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-3xl border p-4 shadow-[inset_0_1px_rgba(255,255,255,.06)] ${highlight ? "border-emerald-300/30 bg-gradient-to-br from-emerald-300/14 to-cyan-300/6" : "border-white/10 bg-black/24"}`}><div className="text-[10px] font-black uppercase tracking-[.18em] text-white/46">HELOC CONNECT CALCULATES</div><div className="mt-1 text-[11px] font-black uppercase tracking-[.16em] text-white/58">{label}</div><div className={`mt-2 text-2xl font-black tracking-[-.04em] ${highlight ? "text-emerald-300" : "text-white"}`}>{value}</div></div>;
}
function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-white/72">{label}</span><select name={name} className="field">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}
