"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductKey = "heloc" | "refinance" | "purchase";
type AddressResult = { label: string; street?: string; city?: string; state?: string; zip?: string; place_id?: string };

const DEFAULT_OFFER_RATE = 0.055;
const LOWER_CREDIT_OFFER_RATE = 0.065;
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
  { key: "heloc", eyebrow: "QUICK ACCESS TO CASH", title: "HELOC", shortTitle: "HELOC", short: "Access available equity while usually keeping your current mortgage.", icon: "⌂", accent: "cyan" },
  { key: "refinance", eyebrow: "", title: "REFINANCE", shortTitle: "REFINANCE", short: "Combine your current payoff and requested cash into one estimated new payment.", icon: "↻", accent: "violet" },
  { key: "purchase", eyebrow: "", title: "BUYING A NEW HOME", shortTitle: "BUYING A NEW HOME", short: "Let us shop the best approval for you tailored to your budget and desired monthly payment and easier down payment.", icon: "⌘", accent: "gold" }
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
  purchase: [
    { title: "I found a home", desc: "Use the property address for a purchase preview." },
    { title: "I have not found a home yet", desc: "Choose the purchase loan amount you want reviewed." },
    { title: "Get matched with purchase programs", desc: "Review companies that fit your buying goal." }
  ]
};

function toNumber(v: string | number) { return Number(String(v || "").replace(/[^0-9.]/g, "")) || 0; }
function money(v: number) { return v ? v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "$0"; }
function monthlyPayment(principal: number, rate = DEFAULT_OFFER_RATE, months = TERM_MONTHS) {
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
  const [currentPaymentInput, setCurrentPaymentInput] = useState("");
  const [calculatorCreditRange, setCalculatorCreditRange] = useState("620_679");
  const [purchaseLoanInput, setPurchaseLoanInput] = useState("");
  const [purchaseTargetMode, setPurchaseTargetMode] = useState(false);
  const [hasCoOwner, setHasCoOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quickCompareNotice, setQuickCompareNotice] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [paymentCompareOpen, setPaymentCompareOpen] = useState(false);

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
  const currentMonthlyPaymentEntered = toNumber(currentPaymentInput);
  const requestedCash = toNumber(requestedCashInput);
  const purchaseLoan = toNumber(purchaseLoanInput);
  const currentRate = Number(currentRateInput || 0) / 100;
  const offerRate = calculatorCreditRange === "below_550" ? LOWER_CREDIT_OFFER_RATE : DEFAULT_OFFER_RATE;
  const maxEquity = useMemo(() => product === "purchase" || !homeValue ? 0 : Math.max(0, Math.round(homeValue * 0.85 - mortgageBalance)), [homeValue, mortgageBalance, product]);
  const cashToUse = useMemo(() => product === "purchase" ? 0 : Math.max(0, Math.min(requestedCash || maxEquity, maxEquity || requestedCash)), [requestedCash, maxEquity, product]);
  const helocPayment = useMemo(() => monthlyPayment(cashToUse, offerRate), [cashToUse, offerRate]);
  const estimatedExistingMortgagePayment = useMemo(() => loanDetails.reduce((sum, loan) => {
    if (loan.rate && loan.rate > 0 && loan.balance > 0) return sum + monthlyPayment(loan.balance, loan.rate);
    return sum;
  }, 0), [mortgageBalanceInput, currentRateInput, extraLoanInputs, extraLoanRateInputs, loanCountInput]);
  const currentMortgagePayment = currentMonthlyPaymentEntered > 0 ? currentMonthlyPaymentEntered : estimatedExistingMortgagePayment;
  const refinanceLoan = mortgageBalance + cashToUse;
  const refinancePayment = useMemo(() => monthlyPayment(refinanceLoan, offerRate), [refinanceLoan, offerRate]);
  const purchasePayment = useMemo(() => monthlyPayment(purchaseLoan, offerRate), [purchaseLoan, offerRate]);
  const estimatedPayment = product === "purchase" ? purchasePayment : product === "refinance" ? refinancePayment : helocPayment;
  const helocTotalMonthlyPayment = currentMortgagePayment + helocPayment;
  const quickCompareTargetLabel = product === "heloc" ? "Refinance" : "HELOC";

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


  function isMissingField(id: string) {
    return missingFields.includes(id);
  }

  function wrapperClass(id: string, extra = "") {
    return `${extra} ${isMissingField(id) ? "missing-input-zone" : ""}`.trim();
  }

  function requiredFieldsFor(nextProduct: ProductKey) {
    const fields: Array<{ id: string; ok: boolean; label: string }> = [];

    if (nextProduct !== "purchase") {
      fields.push({ id: "address", ok: Boolean(street.trim()) || homeValue > 0, label: "property address" });
      fields.push({ id: "homeValue", ok: homeValue > 0, label: "property value" });
      fields.push({ id: "mortgageBalance", ok: toNumber(mortgageBalanceInput) > 0, label: "first mortgage balance" });
      fields.push({ id: "requestedCash", ok: requestedCash > 0, label: "cash amount requested" });

      if (nextProduct === "refinance") {
        fields.push({ id: loanCount > 1 ? "mortgageBalance" : "currentRate", ok: toNumber(currentRateInput) > 0, label: "current loan interest rate" });
        extraLoanInputs.slice(0, visibleExtraLoanCount).forEach((loan, index) => {
          fields.push({ id: `extraLoan${index}`, ok: toNumber(loan) > 0, label: `loan ${index + 2} balance` });
          fields.push({ id: `extraLoanRate${index}`, ok: toNumber(extraLoanRateInputs[index] || "") > 0, label: `loan ${index + 2} interest rate` });
        });
      }
    }

    return fields.filter((field) => !field.ok);
  }

  function revealMissingFor(nextProduct: ProductKey, context: "switch" | "compare" = "switch") {
    const missing = requiredFieldsFor(nextProduct);
    const ids = missing.map((field) => field.id);
    setMissingFields(ids);

    if (missing.length) {
      setQuickCompareNotice(context === "compare"
        ? "Complete the highlighted fields to compare monthly payments."
        : `Complete the highlighted fields to preview ${nextProduct === "refinance" ? "refinance" : "HELOC"} numbers.`);
      setTimeout(() => {
        const firstId = ids[0]?.startsWith("extraLoanRate") ? ids[0].replace("extraLoanRate", "extraLoan") : ids[0];
        const first = document.getElementById(`calc-${firstId}`) || document.getElementById("step1");
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
      return false;
    }

    setQuickCompareNotice("");
    return true;
  }

  function switchCalculatorPreview() {
    if (product !== "heloc" && product !== "refinance") return;
    const nextProduct: ProductKey = product === "heloc" ? "refinance" : "heloc";
    setProduct(nextProduct);
    setPaymentCompareOpen(false);
    setTimeout(() => revealMissingFor(nextProduct, "switch"), 80);
  }

  function togglePaymentCompare() {
    const helocReady = revealMissingFor("heloc", "compare");
    const paymentReady = currentMonthlyPaymentEntered > 0;
    const refinanceReady = requiredFieldsFor("refinance");
    if (!paymentReady) {
      setMissingFields((prev) => Array.from(new Set([...prev, "currentPayment"])));
      setQuickCompareNotice("Enter your actual current monthly mortgage payment so we can compare total monthly payments correctly.");
      setTimeout(() => {
        const first = document.getElementById("calc-currentPayment") || document.getElementById("step1");
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
      return;
    }
    if (currentMonthlyPaymentEntered > 15000) {
      setMissingFields((prev) => Array.from(new Set([...prev, "currentPayment"])));
      setQuickCompareNotice("Please enter your MONTHLY mortgage payment, not your loan balance. Example: enter 3500, not 350000.");
      setTimeout(() => {
        const first = document.getElementById("calc-currentPayment") || document.getElementById("step1");
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
      return;
    }
    if (!helocReady || refinanceReady.length) {
      if (refinanceReady.length) {
        const ids = refinanceReady.map((field) => field.id);
        setMissingFields((prev) => Array.from(new Set([...prev, ...ids])));
        setQuickCompareNotice("Complete the highlighted fields to compare HELOC and refinance monthly payments.");
        setTimeout(() => {
          const firstId = ids[0]?.startsWith("extraLoanRate") ? ids[0].replace("extraLoanRate", "extraLoan") : ids[0];
        const first = document.getElementById(`calc-${firstId}`) || document.getElementById("step1");
          first?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      }
      return;
    }
    setMissingFields([]);
    setQuickCompareNotice("");
    setPaymentCompareOpen((open) => !open);
  }

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const phone = String(formData.get("phone") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneDigits = phone.replace(/\D/g, "");
    const contactMissing = [
      ...(!phone || phoneDigits.length < 10 ? ["phone"] : []),
      ...(!emailOk ? ["email"] : []),
    ];

    if (contactMissing.length) {
      setMissingFields((prev) => Array.from(new Set([...prev.filter((id) => id !== "phone" && id !== "email"), ...contactMissing])));
      setQuickCompareNotice("Please complete the highlighted phone number and email address before submitting your application.");
      setLoading(false);
      setTimeout(() => {
        const first = form.querySelector(`[name="${contactMissing[0]}"]`) as HTMLElement | null;
        first?.scrollIntoView({ behavior: "smooth", block: "center" });
        first?.focus();
      }, 80);
      return;
    }

    setMissingFields((prev) => prev.filter((id) => id !== "phone" && id !== "email"));
    setQuickCompareNotice("");
    setLoading(true);
    const payload = Object.fromEntries(formData.entries());
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || data?.error) { alert(`Lead was NOT saved. ${data?.error || data?.message || "Unknown error"}`); setLoading(false); return; }
      router.push(data?.token ? `/status/${data.token}` : "/thank-you/demo");
    } catch (err: any) { alert(`Lead was NOT saved. ${err?.message || "Unknown error"}`); setLoading(false); }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(184,137,32,.25),transparent_30%),radial-gradient(circle_at_100%_20%,rgba(214,163,61,.13),transparent_28%),linear-gradient(180deg,#020202,#0b0a07)]" />

      <a href="tel:9498662466" className="live-agent-tab" aria-label="Connect to a non-AI live agent by phone">
        <span className="agent-orb">☎</span>
        <span className="agent-copy">
          <strong>Connect to Non-AI Live Agent!</strong>
          <small>Tap to call now</small>
        </span>
      </a>

      <header className="sticky top-0 z-50 border-b border-amber-200/10 bg-[#050505]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="/" className="flex items-center gap-3" aria-label="HELOC CONNECT home">
            <img src="/hc-logo-premium-visible-v52.png" alt="HELOC CONNECT" className="hc-nav-logo h-20 w-auto object-contain sm:h-24" />
          </a>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-amber-300/25 bg-amber-300/8 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-amber-100 sm:px-4">Yahoo Finance</div>
          </div>
        </div>
      </header>

      <form onSubmit={submitLead} noValidate className="mx-auto max-w-6xl px-3 pb-16 pt-4 sm:px-6 lg:pt-8">
        <input type="hidden" name="selected_product" value={selected.title} />
        <input type="hidden" name="main_goal" value={mainGoal} />
        <input type="hidden" name="property_address" value={`${street}${unit ? " #" + unit : ""}, ${city}, ${stateName} ${zip}`} />
        <input type="hidden" name="home_value" value={homeValue} />
        <input type="hidden" name="possible_equity_room" value={maxEquity} />
        <input type="hidden" name="estimated_monthly_payment" value={estimatedPayment} />
        <input type="hidden" name="calculator_credit_score_range" value={calculatorCreditRange === "below_550" ? "Below 550" : calculatorCreditRange === "550_619" ? "550–619" : calculatorCreditRange === "620_679" ? "620–679" : calculatorCreditRange === "680_719" ? "680–719" : "720+"} />
        <input type="hidden" name="credit_score" value={calculatorCreditRange === "below_550" ? "Below 550" : calculatorCreditRange === "550_619" ? "550–619" : calculatorCreditRange === "620_679" ? "620–679" : calculatorCreditRange === "680_719" ? "680–719" : "720+"} />
        <input type="hidden" name="current_interest_rate" value={currentRateInput} />
        <input type="hidden" name="existing_loan_count" value={loanCountInput} />
        <input type="hidden" name="total_existing_loans" value={mortgageBalance} />
        <input type="hidden" name="extra_existing_loans" value={JSON.stringify(extraLoanInputs)} />
        <input type="hidden" name="existing_loan_rates" value={JSON.stringify([currentRateInput, ...extraLoanRateInputs.slice(0, visibleExtraLoanCount)])} />

        <section className="process-shell">
          <div className="topbar2">
            <div className="yahoo-premium"><small>AS FEATURED ON</small><b>yahoo! <em>finance</em></b></div>
          </div>
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">SMART. FAST. TARGETED.</div>
              <h1>How <strong>HELOC CONNECT</strong><br/>Works for You</h1>
              <p>Our intelligent system matches you with the right mortgage company so you can avoid wasting time with the wrong fit — fast, secure, and 100% free for homeowners.</p>
              <div className="trust-row"><span>✓ Homeowners Pay $0</span><span>✓ No SSN to Start</span><span>✓ Secure Review</span><span>✓ Premium Network</span></div>
            </div>
            <div className="hero-visual mascot-stage" aria-label="HC Hopper, the HELOC CONNECT mascot, waves hello">
              <div className="mascot-glow" aria-hidden="true" />
              <img
                className="mascot-video"
                src="/mascot/hc-hopper-wave-transparent.webp"
                alt="HC Hopper waves hello"
                draggable={false}
                decoding="async"
              />
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

        <section id="services" className="mt-5 rounded-[26px] border border-amber-300/20 bg-white/[.035] p-4 sm:p-7">
          <div className="text-center"><div className="mx-auto w-fit rounded-full border border-amber-300/25 bg-amber-300/8 px-4 py-2 text-[10px] font-black uppercase tracking-[.28em] text-amber-200">Choose Your Path</div><h2 className="mt-3 text-2xl font-black tracking-[-.04em] sm:text-5xl">What brings you in today?</h2><p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-white/60">Tap one option. Step 1 below updates instantly.</p></div>
          <div className="service-grid service-grid-three mt-4">
            {products.map((p) => <button key={p.key} type="button" onClick={() => chooseProduct(p.key)} className={`service-tile service-${p.key} accent-${p.accent} ${product === p.key ? "selected" : ""}`} aria-pressed={product === p.key}><span className="tile-shine" /><span className="tile-pattern" /><div className="tile-top"><div className="icon3d"><span>{p.icon}</span></div>{product === p.key && <div className="selected-pill">✓</div>}</div><div className="tile-copy"><div className="tile-title">{p.shortTitle}</div>{p.eyebrow && <div className="tile-eyebrow">{p.eyebrow}</div>}<div className="gold-rule" /><p>{p.short}</p></div><span className="tile-art" /></button>)}
          </div>
        </section>

        <section id="step1" className="mt-5 rounded-[28px] border border-amber-300/20 bg-[#11100b]/88 p-4 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="text-[11px] font-black uppercase tracking-[.28em] text-amber-200">Step 1 • Smart Calculator & Payment Preview</div><h2 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-5xl">Preview your {selected.title} numbers</h2></div><div className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100">Estimated in seconds</div></div>
          <div id="calc-address" className={wrapperClass("address", "mt-5 rounded-[26px] border border-amber-300/20 bg-black/20 p-4 sm:p-5")}><label className="text-sm font-black text-white/80">{product === "purchase" ? "Property purchasing address" : "Property address"}</label><div className="mt-2 grid gap-3 lg:grid-cols-[1fr_150px_150px_110px_120px]"><div className="relative"><input value={street} onChange={(e) => searchAddress(e.target.value)} placeholder="Search your property address" className="field" />{addressResults.length > 0 && <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-amber-300/20 bg-[#11100b] p-2 shadow-2xl">{addressResults.map((r, i) => <button key={`${r.label}-${i}`} type="button" onClick={() => selectAddress(r)} className="block w-full rounded-xl px-3 py-3 text-left text-sm font-bold text-white/85 hover:bg-amber-300/10">{r.label}</button>)}</div>}</div><input name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className="field" /><input name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="field" /><input name="state" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" className="field" /><input name="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" className="field" /></div><div className="mt-3 flex flex-col gap-2 text-sm font-black text-amber-100 sm:flex-row sm:items-center sm:justify-between"><span>{valueStatus || addressStatus}</span><button type="button" onClick={() => lookupHomeValue({ street, city, state: stateName, zip, address: `${street}, ${city}, ${stateName} ${zip}` })} className="rounded-2xl border border-amber-300/25 bg-amber-300/8 px-4 py-3">Re-check Property Value</button></div></div>
          {product === "purchase" && <label className="mt-4 flex items-start gap-3 rounded-3xl border border-white/15 bg-white/[.035] p-4 text-sm font-black"><input type="checkbox" checked={purchaseTargetMode} onChange={(e) => setPurchaseTargetMode(e.target.checked)} className="mt-1 h-5 w-5" /> I haven’t found the right home yet — let me choose the approximate purchase loan amount.</label>}
          <div className="mt-5 grid gap-4 lg:grid-cols-[.9fr_1.1fr]"><div className="rounded-[26px] border border-white/15 bg-white/[.035] p-4 sm:p-5"><div className="text-[11px] font-black uppercase tracking-[.28em] text-amber-200">You Enter</div><h3 className="mt-2 text-2xl font-black">Information needed from you</h3><div className="mt-4 grid gap-3">
                {product !== "purchase" && <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[.045] p-4">
                  <label className="text-[11px] font-black uppercase tracking-[.22em] text-amber-200">How many existing loans are on this property?</label>
                  <select name="existing_loan_count_visible" value={loanCountInput} onChange={(e) => setLoanCountInput(e.target.value)} className="field mt-3">
                    <option value="1">1 existing loan</option>
                    <option value="2">2 existing loans</option>
                    <option value="3">3 existing loans</option>
                    <option value="4+">4+ existing loans</option>
                  </select>
                  <p className="mt-2 text-sm font-semibold text-white/45">This lets the calculator use your total property payoff, not just the first mortgage.</p>
                </div>}
                {product !== "purchase" && <div className="rounded-3xl border border-amber-300/20 bg-amber-300/[.045] p-4">
                  <label className="text-[11px] font-black uppercase tracking-[.22em] text-amber-200">Credit score range</label>
                  <select name="calculator_credit_score_range_visible" value={calculatorCreditRange} onChange={(e) => setCalculatorCreditRange(e.target.value)} className="field mt-3">
                    <option value="below_550">Below 550</option>
                    <option value="550_619">550–619</option>
                    <option value="620_679">620–679</option>
                    <option value="680_719">680–719</option>
                    <option value="720_plus">720+</option>
                  </select>
                  <p className="mt-2 text-sm font-semibold text-white/45">This helps us make the payment preview more accurate.</p>
                </div>}
                {product !== "purchase" && (loanCount > 1
                  ? <div id="calc-mortgageBalance" className={wrapperClass("mortgageBalance")}> <LoanAmountRateInput label="Loan 1 / first mortgage" name="mortgage_balance" value={mortgageBalanceInput} onChange={setMortgageBalanceInput} rateName="current_interest_rate_visible" rateValue={currentRateInput} onRateChange={setCurrentRateInput} help="Enter the balance and current interest rate for your first mortgage." /></div>
                  : <div id="calc-mortgageBalance" className={wrapperClass("mortgageBalance")}><MoneyInput label="Current mortgage balance" name="mortgage_balance" value={mortgageBalanceInput} onChange={setMortgageBalanceInput} help="Approximate balance remaining on your current mortgage." /></div>
                )}
                {product !== "purchase" && <div id="calc-currentPayment" className={wrapperClass("currentPayment", "premium-input-card")}><div className="input-header"><span>Payment Compare</span><b>Current monthly mortgage payment</b></div><div className="money-shell"><em>$</em><input value={currentPaymentInput} onChange={(e) => setCurrentPaymentInput(e.target.value)} name="current_mortgage_monthly_payment" className="premium-money-input" placeholder="3500" inputMode="decimal" /></div><p className="input-help">Enter the amount you pay each month now. Do not enter your loan balance here. Used for HELOC total: current payment + new HELOC payment.</p></div>}
                {product !== "purchase" && extraLoanInputs.slice(0, visibleExtraLoanCount).map((value, index) => (
                  <div key={index} id={`calc-extraLoan${index}`} className={wrapperClass(`extraLoan${index}`) || wrapperClass(`extraLoanRate${index}`)}><LoanAmountRateInput label={`Loan ${index + 2} / additional property loan`} name={`existing_loan_${index + 2}_balance`} value={value} onChange={(next) => setExtraLoanInputs((prev) => prev.map((item, i) => i === index ? next : item))} rateName={`existing_loan_${index + 2}_interest_rate`} rateValue={extraLoanRateInputs[index] || ""} onRateChange={(next) => setExtraLoanRateInputs((prev) => prev.map((item, i) => i === index ? next : item))} help="Enter this loan balance and its own interest rate so the payment comparison is more accurate." /></div>
                ))}
                {product !== "purchase" && <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-4">
                  <div className="text-[11px] font-black uppercase tracking-[.22em] text-amber-200">Calculated Total Existing Loans</div>
                  <div className="mt-2 text-3xl font-black tracking-[-.04em] text-amber-300">{money(mortgageBalance)}</div>
                  <p className="mt-2 text-sm font-semibold text-white/55">Used for equity, HELOC room, and refinance payoff calculations.</p>
                </div>}
                {product !== "purchase" && <div id="calc-requestedCash" className={wrapperClass("requestedCash")}><MoneyInput label="Cash amount requested" name="requested_cash" value={requestedCashInput} onChange={setRequestedCashInput} help="Amount of cash you would like reviewed on top of your existing payoff." /></div>}
                {product === "refinance" && loanCount === 1 && <div id="calc-currentRate" className={wrapperClass("currentRate", "premium-input-card")}><div className="input-header"><span>Client Input</span><b>Current loan interest rate</b></div><div className="money-shell"><input value={currentRateInput} onChange={(e) => setCurrentRateInput(e.target.value)} name="current_interest_rate_visible" className="premium-money-input" placeholder="" inputMode="decimal" /><em>%</em></div><p className="input-help">Used only to estimate what you may be paying now.</p></div>}
                {product === "purchase" && <MoneyInput label={purchaseTargetMode ? "Approximate purchase loan wanted" : "Purchase loan amount"} name="purchase_loan_amount" value={purchaseLoanInput} onChange={setPurchaseLoanInput} help="Move this to preview the monthly payment." />}
                <div id="calc-homeValue" className={wrapperClass("homeValue")}><label className="text-sm font-black text-white/70">Editable property value</label><input value={homeValueInput} onChange={(e) => setHomeValueInput(e.target.value)} className="field mt-2" placeholder="Auto-filled after address" /></div>
              </div></div><div className="rounded-[26px] border border-amber-300/20 bg-amber-300/8 p-4 sm:p-5"><div className="text-[11px] font-black uppercase tracking-[.28em] text-amber-200">We Calculate</div><h3 className="mt-2 text-2xl font-black">Your estimated preview</h3><div className="mt-4 grid grid-cols-2 gap-3"><ResultCard label="Property Value" value={homeValue ? money(homeValue) : "Waiting"} />{product !== "purchase" && <ResultCard label="Total Existing Loans" value={money(mortgageBalance)} />}{product !== "purchase" && <ResultCard label="Estimated Equity Room" value={maxEquity ? money(maxEquity) : "$0"} />}{product === "refinance" && <ResultCard label="Estimated Current Payment" value={`${money(currentMortgagePayment)}/mo`} />}{product === "refinance" && <ResultCard label="New Loan With Cash" value={money(refinanceLoan)} highlight />}{product === "purchase" && <ResultCard label="Purchase Loan" value={money(purchaseLoan)} />}<ResultCard label={product === "refinance" ? "Estimated New Payment" : "Estimated Payment"} value={`${money(estimatedPayment)}/mo`} highlight />{product !== "purchase" && <ResultCard label="Cash Requested" value={money(cashToUse)} highlight />}</div><p className="mt-4 rounded-2xl border border-amber-300/15 bg-black/20 p-3 text-sm font-semibold leading-relaxed text-white/68">{product === "refinance" ? "Refinance preview totals every existing property loan, adds the cash requested, then estimates one new combined payment." : product === "purchase" ? "Purchase preview estimates a monthly payment based on the selected loan amount." : "HELOC / equity-line preview subtracts all existing property loans from the home value to estimate available equity room."}</p>{product !== "purchase" && <div className="mt-4 space-y-3">{quickCompareNotice && <div className="rounded-2xl border border-red-400/55 bg-red-500/10 p-3 text-sm font-black text-red-100 shadow-[0_0_24px_rgba(239,68,68,.10)]">{quickCompareNotice}</div>}<div className="quick-compare-card"><div><span>Quick Compare</span><p>No need to re-enter your information. Instantly switch the preview to compare both paths.</p></div><button type="button" onClick={switchCalculatorPreview} className="quick-compare-btn">Show Me {quickCompareTargetLabel} Numbers</button></div><div className="payment-compare-card"><div><span>Payment Comparison</span><p>See the real monthly difference between keeping your current mortgage with a new HELOC payment versus one refinance payment.</p></div><button type="button" onClick={togglePaymentCompare} className="payment-compare-btn">{paymentCompareOpen ? "Hide Payment Compare" : "Compare Payment"}</button></div>{paymentCompareOpen && <div className="payment-review-panel"><div className="payment-review-head"><span>Monthly Payment Difference</span><b>Side-by-side preview</b></div><div className="payment-review-grid"><div className="payment-review-box"><small>HELOC Option</small><strong>{money(helocTotalMonthlyPayment)}/mo</strong><p>Current mortgage payment {money(currentMortgagePayment)}/mo + new HELOC payment {money(helocPayment)}/mo.</p></div><div className="payment-review-box highlight"><small>Refinance Option</small><strong>{money(refinancePayment)}/mo</strong><p>One estimated refinance payment based on current payoff plus requested cash.</p></div></div><div className="payment-review-delta">Difference: <b>{money(Math.abs(helocTotalMonthlyPayment - refinancePayment))}/mo</b> {helocTotalMonthlyPayment > refinancePayment ? "lower with refinance" : helocTotalMonthlyPayment < refinancePayment ? "lower with HELOC" : "about the same"}</div></div>}</div>}</div></div>
        </section>

        <section id="client-information" className="mt-5 rounded-[28px] border border-amber-300/20 bg-white/[.035] p-4 sm:p-7"><div className="text-[11px] font-black uppercase tracking-[.28em] text-amber-200">Step 2 • Tell Us About Yourself</div><h2 className="mt-2 text-3xl font-black tracking-[-.05em] sm:text-5xl">Finish your match review</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><input name="first_name" required placeholder="First name" className="field" /><input name="last_name" required placeholder="Last name" className="field" /><input name="phone" required inputMode="tel" autoComplete="tel" placeholder="Mobile number *" aria-invalid={isMissingField("phone")} onChange={() => setMissingFields((prev) => prev.filter((id) => id !== "phone"))} className={`field ${isMissingField("phone") ? "contact-field-error" : ""}`} /><input name="email" required type="email" autoComplete="email" placeholder="Email address *" aria-invalid={isMissingField("email")} onChange={() => setMissingFields((prev) => prev.filter((id) => id !== "email"))} className={`field ${isMissingField("email") ? "contact-field-error" : ""}`} /></div>{(isMissingField("phone") || isMissingField("email")) && <div className="mt-3 rounded-2xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Please enter a valid phone number and email address. Both are required to submit your application.</div>}<label className="mt-4 flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/75"><input type="checkbox" name="sms_consent" value="yes" className="mt-1 h-5 w-5" /> It’s ok to receive SMS updates about my application status.</label><div className="mt-4 grid gap-3 sm:grid-cols-2"><Select name="credit_card_payments" label="Credit card payment history" options={["I am current and never missed a payment", "I am current now but had a few missed payments in the past", "I have stopped making payments completely"]} /><Select name="bankruptcy_10_years" label="Filed bankruptcy in last 10 years?" options={["No", "Yes", "Not sure"]} /><input name="monthly_income" placeholder="Monthly income" className="field" /><Select name="mortgage_good_standing" label="Current on mortgage payments?" options={["Current", "Current now, missed in the past", "Behind right now", "No mortgage"]} /></div><label className="mt-4 flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-bold text-white/75"><input type="checkbox" checked={hasCoOwner} onChange={(e) => setHasCoOwner(e.target.checked)} className="mt-1 h-5 w-5" /> Add another owner on the property</label>{hasCoOwner && <div className="mt-4 grid gap-3 rounded-3xl border border-amber-300/20 bg-amber-300/5 p-4 sm:grid-cols-2"><input name="co_first_name" placeholder="Co-owner first name" className="field" /><input name="co_last_name" placeholder="Co-owner last name" className="field" /><input name="co_phone" placeholder="Co-owner phone" className="field" /><input name="co_email" placeholder="Co-owner email" className="field" /><Select name="co_credit_score" label="Co-owner credit score" options={["720+", "680–719", "620–679", "580–619", "Below 580", "Not sure"]} /><Select name="co_bankruptcy_10_years" label="Co-owner bankruptcy?" options={["No", "Yes", "Not sure"]} /></div>}<button disabled={loading} className="mt-6 w-full rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 px-6 py-5 text-lg font-black text-[#02111c] shadow-[0_0_44px_rgba(246,193,90,.22)] disabled:opacity-60">{loading ? "Submitting..." : "Find My Right Match →"}</button><p className="mt-3 text-center text-xs font-semibold text-white/45">Secure review • No obligation • Homeowners pay $0</p></section>
      </form>

      <style jsx global>{`
        .hc-nav-logo{filter:drop-shadow(0 0 12px rgba(246,193,90,.42)) drop-shadow(0 4px 12px rgba(0,0,0,.65));max-width:190px;object-fit:contain}.process-shell{border:1px solid rgba(246,193,90,.35);border-radius:28px;background:linear-gradient(180deg,rgba(15,14,10,.96),rgba(5,5,5,.98));box-shadow:0 30px 90px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.04);padding:18px;position:relative;overflow:hidden}.process-shell:before{content:"";position:absolute;inset:-1px;background:radial-gradient(circle at 76% 7%,rgba(246,193,90,.18),transparent 22%),radial-gradient(circle at 6% 90%,rgba(246,193,90,.10),transparent 22%);pointer-events:none}.topbar2,.hero-grid,.process-steps,.why-panel{position:relative;z-index:1}.topbar2{display:flex;align-items:center;justify-content:flex-end;gap:14px;margin-bottom:22px}.brandline{display:flex;align-items:center;gap:10px;font-weight:950;letter-spacing:.2em}.brandmark{width:42px;height:42px;border-radius:16px;background:linear-gradient(135deg,#15120b,#4b3510);border:1px solid rgba(246,193,90,.46);display:grid;place-items:center;box-shadow:0 0 30px rgba(246,193,90,.18);color:#d4af37}.brandline b{display:block}.brandline span{display:block;color:#d4af37;font-size:11px}.yahoo-premium{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:18px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10);box-shadow:inset 0 1px rgba(255,255,255,.08)}.yahoo-premium small{font-size:9px;letter-spacing:.22em;color:#f7d982;font-weight:900}.yahoo-premium b{font-size:22px;line-height:.85;letter-spacing:-.08em}.yahoo-premium em{font-size:14px;font-style:normal}.hero-grid{display:grid;gap:22px}.hero-copy .eyebrow{color:#d4af37;letter-spacing:.28em;font-weight:950;font-size:12px;margin-bottom:12px}.hero-copy h1{font-size:clamp(36px,10vw,68px);line-height:.94;letter-spacing:-.06em;margin:0 0 16px;font-weight:1000}.hero-copy h1 strong{color:#d4af37;text-shadow:0 0 24px rgba(246,193,90,.25)}.hero-copy p{font-size:16px;line-height:1.52;color:#f7e7b1;max-width:560px;margin:0}.trust-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.trust-row span{border:1px solid rgba(246,193,90,.22);border-radius:16px;padding:11px 12px;background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));font-weight:850;font-size:12px}.hero-visual{min-height:280px;border-radius:26px;background:radial-gradient(circle at 50% 58%,rgba(246,193,90,.23),transparent 26%),linear-gradient(180deg,rgba(24,20,12,.98),rgba(5,5,5,.96));border:1px solid rgba(246,193,90,.22);position:relative;overflow:hidden;box-shadow:inset 0 0 50px rgba(246,193,90,.07)}.hud-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(246,193,90,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(246,193,90,.05) 1px,transparent 1px);background-size:26px 26px}.scan-line{position:absolute;left:8%;right:8%;height:3px;top:28%;background:linear-gradient(90deg,transparent,#d4af37,#d4af37,transparent);box-shadow:0 0 22px #d4af37;animation:scanY 3.2s ease-in-out infinite alternate}.orb{position:absolute;left:31%;right:20%;bottom:54px;height:86px;border-radius:50%;border:3px solid rgba(246,193,90,.72);box-shadow:0 0 30px rgba(246,193,90,.4), inset 0 0 20px rgba(246,193,90,.18);transform:perspective(500px) rotateX(67deg)}.home-model{position:absolute;left:44%;top:100px;width:132px;height:104px;filter:drop-shadow(0 22px 34px rgba(0,0,0,.55));animation:houseFloat 4s ease-in-out infinite}.roof{position:absolute;left:2px;top:0;width:128px;height:50px;background:linear-gradient(135deg,#4b3510,#050505);clip-path:polygon(50% 0,100% 100%,0 100%);border-bottom:3px solid rgba(246,193,90,.35)}.base{position:absolute;left:14px;top:42px;width:106px;height:62px;border-radius:8px;background:linear-gradient(135deg,#1c160d,#0b0a07);border:1px solid rgba(246,193,90,.35)}.win{position:absolute;background:#d4af37;box-shadow:0 0 18px #d4af37;border-radius:3px}.w1{left:30px;top:58px;width:20px;height:17px}.w2{left:82px;top:58px;width:20px;height:17px}.door{position:absolute;left:58px;top:72px;width:20px;height:32px;background:#050505;border-radius:8px 8px 0 0}.float-card{position:absolute;padding:10px 12px;border-radius:15px;background:rgba(2,11,22,.86);border:1px solid rgba(246,193,90,.42);box-shadow:0 0 28px rgba(246,193,90,.18);font-weight:950}.float-card small{display:block;color:#f7e7b1;font-size:9px;letter-spacing:.10em;text-transform:uppercase}.float-card b{font-size:15px;color:#d4af37}.v1{right:16px;top:36px;transform:rotate(4deg)}.v2{right:8px;top:128px;transform:rotate(-4deg)}.v3{right:30px;bottom:34px;transform:rotate(2deg)}.process-steps{display:grid;gap:12px;margin-top:18px}.process-step{display:grid;grid-template-columns:44px 1fr;gap:12px;align-items:center;border:1px solid rgba(246,193,90,.22);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.025));border-radius:20px;padding:14px;overflow:hidden}.step-num{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:1000;font-size:20px;background:rgba(246,193,90,.08);border:2px solid #d4af37;box-shadow:0 0 20px rgba(246,193,90,.22)}.process-step h3{font-size:17px;margin:0 0 5px;letter-spacing:-.02em}.process-step p{margin:0;color:rgba(255,255,255,.68);line-height:1.4;font-size:13px}.step-mock{grid-column:1 / -1;border:1px solid rgba(246,193,90,.30);background:#0b0a07;border-radius:16px;padding:12px;text-align:center;font-size:12px;font-weight:950;color:#f7e7b1}.why-panel{margin-top:18px;border:1px solid rgba(246,193,90,.24);border-radius:22px;background:linear-gradient(180deg,rgba(55,39,14,.45),rgba(7,17,29,.92));padding:18px}.why-head{display:flex;align-items:center;gap:12px;margin-bottom:14px}.shield{width:48px;height:48px;border-radius:16px;background:rgba(246,193,90,.08);border:1px solid rgba(246,193,90,.35);display:grid;place-items:center;color:#d4af37;font-size:28px;box-shadow:0 0 28px rgba(246,193,90,.18);flex:0 0 auto}.why-head small{display:block;color:#d4af37;letter-spacing:.18em;font-weight:950;margin-bottom:4px;font-size:10px}.why-head h2{font-size:24px;margin:0;letter-spacing:-.05em}.benefit-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.benefit{border:1px solid rgba(246,193,90,.16);border-radius:16px;padding:12px;background:rgba(0,0,0,.18)}.benefit b{display:block;font-size:13px;margin-bottom:5px}.benefit p{margin:0;color:rgba(255,255,255,.62);line-height:1.35;font-size:12px}.freebar{margin:16px auto 0;max-width:680px;border:1px solid rgba(246,193,90,.30);border-radius:999px;padding:12px 15px;text-align:center;background:rgba(0,0,0,.28);font-weight:900;font-size:13px}.freebar span{color:#d4af37}.service-tile{position:relative;min-height:330px;border-radius:28px;border:1px solid rgba(255,255,255,.16);background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.018));padding:18px 17px;text-align:center;overflow:hidden;box-shadow:inset 0 1px rgba(255,255,255,.10),0 26px 64px rgba(0,0,0,.42);transition:transform .26s ease,border-color .26s ease,box-shadow .26s ease,filter .26s ease;isolation:isolate}.service-tile:before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(circle at 50% 22%,rgba(246,193,90,.20),transparent 18%),linear-gradient(180deg,rgba(255,255,255,.055),transparent 24%,rgba(0,0,0,.20));opacity:.75;pointer-events:none}.service-tile:after{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(120deg,transparent 0%,transparent 34%,rgba(255,226,133,.24) 46%,transparent 57%,transparent 100%);transform:translateX(-120%);opacity:.55;pointer-events:none}.service-tile:hover:after,.service-tile.selected:after{animation:cardSweep 3.8s ease-in-out infinite}.service-tile:hover{transform:translateY(-6px);border-color:rgba(246,193,90,.68);box-shadow:inset 0 1px rgba(255,255,255,.14),0 34px 84px rgba(0,0,0,.52),0 0 36px rgba(246,193,90,.16)}.service-tile.selected{transform:translateY(-8px);border-color:rgba(255,216,117,.96);box-shadow:inset 0 1px rgba(255,255,255,.18),0 34px 94px rgba(0,0,0,.58),0 0 0 1px rgba(246,193,90,.34),0 0 42px rgba(246,193,90,.32)}.tile-shine{position:absolute;inset:-2px;border-radius:inherit;background:linear-gradient(90deg,rgba(246,193,90,.95),rgba(255,255,255,.52),rgba(246,193,90,.65));opacity:0;filter:blur(10px);z-index:-1;transition:opacity .25s ease}.service-tile.selected .tile-shine,.service-tile:hover .tile-shine{opacity:.45}.tile-pattern{position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:.9}.service-heloc .tile-pattern{background:radial-gradient(circle at 50% 24%,rgba(246,193,90,.20),transparent 26%),radial-gradient(circle at 50% 24%,rgba(246,193,90,.14) 0 1px,transparent 2px);background-size:auto,12px 12px}.service-refinance .tile-pattern{background:repeating-conic-gradient(from 18deg at 50% 24%,rgba(255,255,255,.05) 0 8deg,transparent 8deg 18deg);opacity:.35}.service-equity_card .tile-pattern{background:radial-gradient(circle at 50% 25%,rgba(246,193,90,.16) 0 1px,transparent 2px);background-size:13px 13px}.service-purchase .tile-pattern{background:linear-gradient(135deg,transparent 0 23%,rgba(246,193,90,.22) 24%,transparent 26% 62%,rgba(246,193,90,.16) 63%,transparent 65%)}.tile-top{position:relative;z-index:2;display:flex;align-items:flex-start;justify-content:center;min-height:78px}.icon3d{display:grid;height:72px;width:72px;place-items:center;border-radius:999px;border:1px solid rgba(246,193,90,.30);background:radial-gradient(circle at 32% 18%,rgba(255,255,255,.14),transparent 30%),linear-gradient(180deg,#232323,#070707);font-size:32px;color:#f7d982;box-shadow:0 18px 40px rgba(0,0,0,.42),0 0 28px rgba(246,193,90,.12),inset 0 1px rgba(255,255,255,.18)}.icon3d span{display:block;filter:drop-shadow(0 0 10px rgba(246,193,90,.32))}.selected-pill{position:absolute;right:5px;top:4px;border-radius:999px;background:linear-gradient(180deg,#fff3bf,#d4af37);color:#080704;padding:9px 12px;font-size:14px;font-weight:1000;box-shadow:0 0 24px rgba(246,193,90,.35)}.tile-copy{position:relative;z-index:2;margin-top:24px}.tile-eyebrow{margin-top:6px;font-size:11px;font-weight:1000;letter-spacing:.08em;color:#fff;text-transform:uppercase}.tile-title{margin-top:0;font-size:34px;font-weight:1000;line-height:.94;letter-spacing:-.035em;text-transform:uppercase;background:linear-gradient(180deg,#fff8cd 0%,#d4af37 48%,#8c6418 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 12px 28px rgba(246,193,90,.14)}.service-purchase .tile-title{font-size:29px}.gold-rule{height:2px;width:34px;margin:17px auto 0;border-radius:999px;background:linear-gradient(90deg,transparent,#f5d779,transparent);box-shadow:0 0 14px rgba(246,193,90,.50)}.service-tile p{margin:17px auto 0;max-width:245px;font-size:14px;line-height:1.42;color:rgba(255,255,255,.82);font-weight:750}.tile-art{position:absolute;left:0;right:0;bottom:0;height:86px;z-index:1;opacity:.88;pointer-events:none}.service-heloc .tile-art{background:radial-gradient(ellipse at 50% 105%,rgba(246,193,90,.40),transparent 44%),repeating-radial-gradient(ellipse at 10% 120%,rgba(246,193,90,.55) 0 1px,transparent 2px 7px);mask-image:linear-gradient(to top,#000 35%,transparent)}.service-refinance .tile-art{background:linear-gradient(154deg,transparent 0 54%,rgba(255,219,116,.75) 55%,rgba(246,193,90,.12) 58%,transparent 62%)}.service-equity_card .tile-art{background:radial-gradient(ellipse at 50% 105%,rgba(246,193,90,.42),transparent 42%),radial-gradient(circle at 50% 45%,rgba(246,193,90,.45) 0 1px,transparent 2px);background-size:auto,10px 10px;mask-image:linear-gradient(to top,#000 42%,transparent)}.service-purchase .tile-art{background:linear-gradient(to top,rgba(246,193,90,.32),transparent 55%),linear-gradient(90deg,transparent 8%,rgba(246,193,90,.85) 8% 9%,transparent 9% 15%,rgba(246,193,90,.55) 15% 16%,transparent 16% 78%,rgba(246,193,90,.60) 78% 79%,transparent 79%),linear-gradient(to right,transparent 25%,rgba(246,193,90,.70) 25% 75%,transparent 75%);clip-path:polygon(0 100%,0 76%,14% 76%,14% 63%,28% 63%,28% 82%,38% 82%,38% 46%,54% 35%,70% 46%,70% 82%,82% 82%,82% 65%,100% 65%,100% 100%)}@keyframes cardSweep{0%,55%{transform:translateX(-120%)}75%,100%{transform:translateX(120%)}}.premium-input-card{position:relative;overflow:hidden;border-radius:26px;border:1px solid rgba(246,193,90,.24);background:linear-gradient(145deg,rgba(24,20,12,.88),rgba(5,5,5,.94));padding:16px;box-shadow:inset 0 1px rgba(255,255,255,.08),0 18px 40px rgba(0,0,0,.24)}.premium-input-card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 12% 0%,rgba(246,193,90,.14),transparent 38%),linear-gradient(90deg,rgba(255,255,255,.06),transparent 35%,rgba(246,193,90,.05));pointer-events:none}.input-header{position:relative;z-index:1;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.input-header span{border:1px solid rgba(246,193,90,.28);border-radius:999px;padding:6px 8px;background:rgba(246,193,90,.08);color:#f7d982;font-size:9px;font-weight:1000;letter-spacing:.16em;text-transform:uppercase;white-space:nowrap}.input-header b{display:block;text-align:right;color:#fff;font-size:13px;font-weight:1000;letter-spacing:.02em;text-transform:uppercase}.money-shell{position:relative;z-index:1;margin-top:14px;display:flex;align-items:center;gap:8px;border-radius:22px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.26);padding:12px 14px;box-shadow:inset 0 1px 18px rgba(0,0,0,.22)}.money-shell em{font-style:normal;color:#d4af37;font-size:26px;font-weight:1000;text-shadow:0 0 20px rgba(246,193,90,.18)}.premium-money-input{min-width:0;width:100%;border:0;background:transparent;color:white;font-size:32px;font-weight:1000;letter-spacing:-.05em;outline:none}.premium-money-input::placeholder{color:transparent}.loan-duo{position:relative;z-index:1;display:grid;gap:12px;margin-top:14px}.duo-label{margin:0 0 7px 2px;color:#f7d982;font-size:10px;font-weight:1000;text-transform:uppercase;letter-spacing:.18em}@media(min-width:640px){.loan-duo{grid-template-columns:1fr .62fr}}.loan-duo .money-shell{margin-top:0}.money-shell:focus-within{border-color:rgba(246,193,90,.72);box-shadow:0 0 0 3px rgba(246,193,90,.11),inset 0 1px 18px rgba(0,0,0,.22)}.input-help{position:relative;z-index:1;margin:10px 0 0;color:rgba(255,255,255,.48);font-size:12px;font-weight:750;line-height:1.35}.quick-compare-card,.payment-compare-card{position:relative;display:flex;align-items:center;justify-content:space-between;gap:14px;border-radius:28px;border:1px solid rgba(246,193,90,.38);background:radial-gradient(circle at 80% 20%,rgba(246,193,90,.22),transparent 30%),linear-gradient(135deg,rgba(20,15,6,.94),rgba(73,49,13,.70));padding:16px;box-shadow:0 18px 48px rgba(0,0,0,.34),inset 0 1px rgba(255,255,255,.12);overflow:hidden}.quick-compare-card:before,.payment-compare-card:before{content:"";position:absolute;inset:-2px;background:linear-gradient(90deg,transparent,rgba(246,193,90,.25),transparent);transform:translateX(-120%);animation:cardSweep 4.8s ease-in-out infinite;pointer-events:none}.quick-compare-card span,.payment-compare-card span{display:block;color:#f7d982;font-size:10px;font-weight:1000;letter-spacing:.28em;text-transform:uppercase}.quick-compare-card p,.payment-compare-card p{margin:6px 0 0;max-width:285px;color:rgba(255,255,255,.67);font-size:13px;font-weight:850;line-height:1.35}.quick-compare-btn,.payment-compare-btn{position:relative;z-index:1;border-radius:999px;border:1px solid rgba(255,255,255,.42);background:linear-gradient(180deg,#fff3b7,#d4af37 55%,#a97819);padding:13px 18px;color:#060606;font-size:12px;font-weight:1000;letter-spacing:.12em;text-transform:uppercase;box-shadow:0 0 0 3px rgba(246,193,90,.12),0 13px 30px rgba(0,0,0,.30);white-space:nowrap}.payment-compare-card{border-color:rgba(246,193,90,.28);background:linear-gradient(135deg,rgba(7,7,7,.94),rgba(35,24,7,.86))}.payment-review-panel{border-radius:28px;border:1px solid rgba(246,193,90,.38);background:linear-gradient(180deg,rgba(5,5,5,.96),rgba(37,25,8,.88));padding:16px;box-shadow:0 20px 55px rgba(0,0,0,.35),0 0 32px rgba(246,193,90,.10)}.payment-review-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.payment-review-head span{color:#f7d982;font-size:10px;font-weight:1000;letter-spacing:.24em;text-transform:uppercase}.payment-review-head b{font-size:13px;color:rgba(255,255,255,.72)}.payment-review-grid{display:grid;gap:12px}.payment-review-box{border-radius:22px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.26);padding:15px}.payment-review-box.highlight{border-color:rgba(246,193,90,.42);box-shadow:inset 0 0 22px rgba(246,193,90,.07)}.payment-review-box small{display:block;color:rgba(255,255,255,.62);font-size:11px;font-weight:1000;text-transform:uppercase;letter-spacing:.16em}.payment-review-box strong{display:block;margin-top:6px;background:linear-gradient(180deg,#fff2b8,#d4af37);-webkit-background-clip:text;background-clip:text;color:transparent;font-size:30px;font-weight:1000;letter-spacing:-.05em}.payment-review-box p{margin:8px 0 0;color:rgba(255,255,255,.62);font-size:12px;font-weight:800;line-height:1.35}.payment-review-delta{margin-top:12px;border-radius:18px;border:1px solid rgba(246,193,90,.18);background:rgba(246,193,90,.06);padding:12px;text-align:center;color:rgba(255,255,255,.72);font-size:13px;font-weight:900}.payment-review-delta b{color:#f7d982}.missing-input-zone{border-radius:28px!important;outline:2px solid rgba(248,113,113,.92)!important;box-shadow:0 0 0 5px rgba(248,113,113,.14),0 0 34px rgba(248,113,113,.18)!important;background:rgba(127,29,29,.16)!important}.missing-input-zone .field,.missing-input-zone .money-shell{border-color:rgba(248,113,113,.85)!important;box-shadow:0 0 0 3px rgba(248,113,113,.14)!important}@media(min-width:640px){.payment-review-grid{grid-template-columns:1fr 1fr}}@media(max-width:640px){.quick-compare-card,.payment-compare-card{align-items:stretch;flex-direction:column;padding:14px}.quick-compare-card p,.payment-compare-card p{max-width:none}.quick-compare-btn,.payment-compare-btn{width:100%;padding:13px 12px;font-size:11px}.payment-review-box strong{font-size:25px}}.field{width:100%;border-radius:18px;border:1px solid rgba(246,193,90,.24);background:rgba(2,8,17,.72);padding:16px 18px;color:white;font-weight:800;outline:none}.field::placeholder{color:rgba(255,255,255,.42)}.field:focus{border-color:rgba(246,193,90,.8);box-shadow:0 0 0 3px rgba(246,193,90,.12)}.contact-field-error,.contact-field-error:focus{border-color:#f87171!important;background:rgba(127,29,29,.22)!important;box-shadow:0 0 0 3px rgba(248,113,113,.2)!important}.contact-field-error::placeholder{color:#fecaca!important}.live-agent-tab{position:fixed;right:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:12px;max-width:330px;border-radius:999px;border:1px solid rgba(246,193,90,.42);background:linear-gradient(135deg,rgba(13,12,9,.94),rgba(36,27,12,.94) 48%,rgba(82,55,12,.92));padding:12px 16px 12px 12px;color:#fff;text-decoration:none;box-shadow:0 18px 55px rgba(0,0,0,.42),0 0 34px rgba(246,193,90,.18),inset 0 1px rgba(255,255,255,.15);backdrop-filter:blur(18px);transform:translateZ(0);transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease}.live-agent-tab:before{content:"";position:absolute;inset:-1px;border-radius:999px;background:linear-gradient(90deg,transparent,rgba(246,193,90,.35),rgba(246,193,90,.34),transparent);opacity:.7;filter:blur(10px);z-index:-1;animation:agentGlow 2.8s ease-in-out infinite}.live-agent-tab:hover{transform:translateY(-3px) scale(1.015);border-color:rgba(246,193,90,.78);box-shadow:0 22px 70px rgba(0,0,0,.5),0 0 42px rgba(246,193,90,.24),inset 0 1px rgba(255,255,255,.2)}.agent-orb{display:grid;width:46px;height:46px;flex:0 0 46px;place-items:center;border-radius:50%;background:radial-gradient(circle at 30% 20%,#ffffff,#f9e7a5 32%,#d4af37 70%,#6f5219);color:#050505;font-size:21px;font-weight:1000;box-shadow:0 0 22px rgba(246,193,90,.42),inset 0 2px 7px rgba(255,255,255,.55)}.agent-copy{display:flex;min-width:0;flex-direction:column;line-height:1.05}.agent-copy strong{font-size:14px;font-weight:1000;letter-spacing:-.02em;text-transform:uppercase}.agent-copy small{margin-top:4px;color:#f7d982;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}@keyframes agentGlow{0%,100%{opacity:.45;transform:scale(.98)}50%{opacity:.9;transform:scale(1.03)}}@media(max-width:640px){.live-agent-tab{left:12px;right:12px;bottom:12px;justify-content:center;padding:11px 14px 11px 11px}.agent-orb{width:42px;height:42px;flex-basis:42px}.agent-copy strong{font-size:12px}.agent-copy small{font-size:10px}}@keyframes scanY{from{top:20%}to{top:78%}}@keyframes houseFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@media(min-width:760px){.process-shell{padding:28px;border-radius:34px}.hero-grid{grid-template-columns:1.02fr .98fr;align-items:center;gap:30px}.hero-copy p{font-size:21px}.hero-visual{min-height:330px}.trust-row{display:flex;flex-wrap:wrap}.process-step{grid-template-columns:72px 1fr minmax(260px,390px);gap:18px;padding:18px}.step-num{width:52px;height:52px;font-size:24px}.process-step h3{font-size:21px}.process-step p{font-size:16px}.step-mock{grid-column:auto}.why-panel{padding:24px}.why-head h2{font-size:clamp(28px,4vw,44px)}.benefit-grid{grid-template-columns:repeat(4,1fr)}.benefit{border:0;border-left:1px solid rgba(246,193,90,.25);border-radius:0;background:transparent}.benefit:first-child{border-left:0}.benefit b{font-size:16px}.benefit p{font-size:14px}.freebar{font-size:15px}.service-tile{min-height:360px;padding:22px 20px}.tile-title{font-size:40px}.service-purchase .tile-title{font-size:34px}.service-tile p{font-size:16px}.icon3d{height:86px;width:86px;font-size:38px}.tile-art{height:104px}.float-card{padding:13px 16px}.float-card b{font-size:24px}.float-card small{font-size:11px}.home-model{left:42%;width:150px;height:112px}.v1{right:40px;top:45px}.v2{right:24px;top:145px}.v3{right:64px;bottom:42px}}
.service-grid-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:stretch}@media(max-width:640px){.hc-nav-logo{height:76px!important;max-width:168px!important}header .mx-auto{padding-top:8px!important;padding-bottom:8px!important}#services{padding:14px 8px!important;border-radius:24px!important;overflow:hidden}#services .text-center{padding:0 4px}#services h2{font-size:28px!important;line-height:1.02!important;letter-spacing:-.05em!important}#services p{font-size:13px!important}.service-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important;width:100%!important;align-items:stretch!important}.service-tile{min-width:0!important;min-height:178px!important;border-radius:18px!important;padding:8px 5px 10px!important;box-shadow:inset 0 1px rgba(255,255,255,.10),0 12px 28px rgba(0,0,0,.38)!important}.service-tile.selected{transform:none!important;box-shadow:inset 0 1px rgba(255,255,255,.18),0 16px 34px rgba(0,0,0,.5),0 0 0 1px rgba(246,193,90,.45),0 0 22px rgba(246,193,90,.28)!important}.tile-top{min-height:42px!important}.icon3d{width:38px!important;height:38px!important;font-size:18px!important}.selected-pill{right:3px!important;top:3px!important;padding:5px 7px!important;font-size:10px!important}.tile-copy{margin-top:11px!important}.tile-title{font-size:14px!important;line-height:.96!important;letter-spacing:-.02em!important;word-break:normal!important}.service-purchase .tile-title{font-size:12px!important;line-height:1.02!important}.tile-eyebrow{font-size:7px!important;line-height:1.05!important;letter-spacing:.045em!important;margin-top:4px!important}.gold-rule{width:22px!important;margin-top:8px!important}.service-tile p{margin-top:7px!important;font-size:8.2px!important;line-height:1.18!important;font-weight:800!important;max-width:100%!important;color:rgba(255,255,255,.78)!important;display:-webkit-box!important;-webkit-line-clamp:4!important;-webkit-box-orient:vertical!important;overflow:hidden!important}.tile-art{height:42px!important;opacity:.72!important}.service-tile:before{background:radial-gradient(circle at 50% 20%,rgba(246,193,90,.16),transparent 28%),linear-gradient(180deg,rgba(255,255,255,.05),transparent 28%,rgba(0,0,0,.20))!important}.service-tile:hover{transform:none!important}.live-agent-tab{left:12px!important;right:12px!important;bottom:12px!important;max-width:none!important}}
@media(max-width:375px){.service-grid{gap:5px!important}.service-tile{min-height:164px!important;padding:7px 4px 9px!important}.icon3d{width:34px!important;height:34px!important;font-size:16px!important}.tile-title{font-size:12px!important}.service-purchase .tile-title{font-size:10.8px!important}.tile-eyebrow{font-size:6.5px!important}.service-tile p{font-size:7.4px!important;-webkit-line-clamp:4!important}.tile-art{height:36px!important}}
.mascot-stage{position:relative;display:flex;align-items:center;justify-content:center;min-width:0;min-height:300px;overflow:visible;isolation:isolate;background:transparent;padding:8px}.mascot-stage:before{content:"";position:absolute;left:50%;top:50%;width:78%;height:76%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,226,151,.34) 0%,rgba(212,175,55,.20) 31%,rgba(212,175,55,.08) 52%,transparent 72%);filter:blur(25px);animation:mascotGlow 3.8s ease-in-out infinite;z-index:0;pointer-events:none}.mascot-glow{position:absolute;left:50%;top:52%;width:68%;height:64%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(255,241,198,.22),rgba(212,175,55,.10) 42%,transparent 72%);filter:blur(18px);z-index:0;pointer-events:none}.mascot-video{position:relative;z-index:2;display:block;width:min(88%,390px);height:auto;max-height:360px;object-fit:contain;filter:drop-shadow(0 22px 28px rgba(0,0,0,.52)) drop-shadow(0 0 24px rgba(212,175,55,.16));background:transparent;pointer-events:none}@keyframes mascotGlow{0%,100%{opacity:.72;transform:translate(-50%,-50%) scale(.97)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.035)}}@media(max-width:759px){.hero-grid{display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(118px,.85fr)!important;align-items:center!important;gap:8px!important}.hero-copy{min-width:0}.hero-copy h1{font-size:clamp(27px,8vw,37px)!important;line-height:.98!important}.hero-copy p{font-size:12.5px!important;line-height:1.42!important}.trust-row{gap:5px!important}.trust-row span{font-size:8.5px!important;padding:7px 8px!important}.mascot-stage{min-height:245px!important;padding:0!important;align-self:stretch}.mascot-video{width:115%!important;max-width:260px!important;max-height:285px!important;transform:translateX(-3%)}.mascot-stage:before{width:110%;height:78%;filter:blur(18px)}.mascot-glow{width:95%;height:66%;filter:blur(14px)}}@media(max-width:390px){.hero-grid{grid-template-columns:minmax(0,1.2fr) minmax(108px,.8fr)!important;gap:4px!important}.hero-copy h1{font-size:28px!important}.hero-copy p{font-size:11.5px!important}.mascot-stage{min-height:225px!important}.mascot-video{width:122%!important;max-width:225px!important;max-height:255px!important;transform:translateX(-5%)}}
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
  return <div className={`rounded-3xl border p-4 shadow-[inset_0_1px_rgba(255,255,255,.06)] ${highlight ? "border-amber-300/30 bg-gradient-to-br from-amber-300/14 to-amber-300/6" : "border-white/10 bg-black/24"}`}><div className="text-[10px] font-black uppercase tracking-[.18em] text-white/46">HELOC CONNECT CALCULATES</div><div className="mt-1 text-[11px] font-black uppercase tracking-[.16em] text-white/58">{label}</div><div className={`mt-2 text-2xl font-black tracking-[-.04em] ${highlight ? "text-amber-300" : "text-white"}`}>{value}</div></div>;
}
function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-white/72">{label}</span><select name={name} className="field">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}
