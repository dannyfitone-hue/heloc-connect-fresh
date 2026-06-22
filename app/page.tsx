"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductPath = "heloc" | "refinance" | "creditLine" | "purchase";
type AddressResult = { label: string; street?: string; city?: string; state?: string; zip?: string };

const HERO_PHOTO = "https://images.pexels.com/photos/7031607/pexels-photo-7031607.jpeg?auto=compress&cs=tinysrgb&w=2200";
const RATE_FOR_PREVIEW = 0.065;
const TERM_MONTHS = 360;

const products: Array<{
  id: ProductPath;
  label: string;
  nav: string;
  icon: string;
  eyebrow: string;
  title: string;
  desc: string;
  color: string;
}> = [
  { id: "heloc", label: "HELOC", nav: "HELOC", icon: "⌂", eyebrow: "Equity access", title: "Access equity from my home", desc: "Keep your current mortgage while reviewing equity line options.", color: "cyan" },
  { id: "refinance", label: "Refinance", nav: "Refinance", icon: "↻", eyebrow: "Payment review • Cash-out", title: "Refinance my mortgage", desc: "Review a new loan that can pay off your current mortgage and include cash-out.", color: "gold" },
  { id: "creditLine", label: "Home Equity Credit Line", nav: "Home Equity Line", icon: "💳", eyebrow: "Your equity • Your limit", title: "Increase my spending power", desc: "A credit-card style equity line for flexible spending power and larger limits.", color: "green" },
  { id: "purchase", label: "Purchase Mortgage", nav: "Purchase Mortgage", icon: "🔑", eyebrow: "Buy a home", title: "Purchase a new home", desc: "Review a full mortgage option for buying your next home.", color: "blue" }
];

function moneyNumber(value: string | number) {
  return Number(String(value || "").replace(/[^0-9.]/g, "")) || 0;
}
function formatMoney(value: number) {
  if (!value || value < 0) return "$0";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function moneyDisplay(value: string) {
  const n = moneyNumber(value);
  return n ? formatMoney(n) : "";
}
function payment(amount: number, rate = RATE_FOR_PREVIEW, months = TERM_MONTHS) {
  if (!amount) return 0;
  const monthlyRate = rate / 12;
  return Math.round((amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));
}
function parseAddress(label: string) {
  const parts = label.split(",").map((p) => p.trim());
  const street = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts[2] || "";
  const [state, zip] = stateZip.split(" ").filter(Boolean);
  return { street, city, state: state || "", zip: zip || "" };
}
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [path, setPath] = useState<ProductPath>("purchase");
  const selected = products.find((p) => p.id === path) || products[0];

  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [addressStatus, setAddressStatus] = useState("Start typing and select the matching address.");
  const [valueStatus, setValueStatus] = useState("");
  const [searching, setSearching] = useState(false);
  const [noPurchaseAddress, setNoPurchaseAddress] = useState(false);

  const [homeValueInput, setHomeValueInput] = useState("");
  const [mortgageBalanceInput, setMortgageBalanceInput] = useState("");
  const [requestedCash, setRequestedCash] = useState(500000);
  const [currentLoanRate, setCurrentLoanRate] = useState("7.25");
  const [downPayment, setDownPayment] = useState(250000);

  const homeValue = moneyNumber(homeValueInput);
  const mortgageBalance = moneyNumber(mortgageBalanceInput);
  const currentRate = Number(currentLoanRate) / 100 || 0.0725;

  const maxEquity = useMemo(() => Math.max(0, Math.round(homeValue * 0.85 - mortgageBalance)), [homeValue, mortgageBalance]);
  const refiCashRoom = useMemo(() => Math.max(0, Math.round(homeValue * 0.85 - mortgageBalance)), [homeValue, mortgageBalance]);
  const refiLoan = mortgageBalance + clamp(requestedCash, 0, Math.max(refiCashRoom, 0));
  const helocAmount = clamp(requestedCash, 25000, Math.max(maxEquity, 25000));
  const purchaseLoanFromAddress = Math.max(0, homeValue - downPayment);
  const purchaseTargetLoan = clamp(requestedCash, 100000, 2000000);
  const purchaseLoan = noPurchaseAddress ? purchaseTargetLoan : purchaseLoanFromAddress;
  const estimatedHomeLow = Math.round(purchaseTargetLoan / 0.8 / 25000) * 25000;
  const estimatedHomeHigh = estimatedHomeLow + 50000;
  const estimatedDownNeeded = Math.round(estimatedHomeLow * 0.2);

  const activeAmount = path === "purchase" ? purchaseLoan : path === "refinance" ? refiLoan : helocAmount;
  const monthlyPreview = payment(activeAmount);
  const currentPayment = payment(mortgageBalance, currentRate);
  const maxPreviewPayment = payment(path === "refinance" ? mortgageBalance + refiCashRoom : maxEquity);

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
      setAddressStatus(data?.results?.length ? "Select your address below." : data?.message || "No address matches yet.");
    } catch {
      setAddressResults([]);
      setAddressStatus("Address autocomplete is temporarily unavailable.");
    } finally {
      setSearching(false);
    }
  }

  async function lookupHomeValue(fullAddress: string, selectedParts?: Partial<AddressResult>) {
    try {
      setValueStatus("Looking up estimated property value...");
      const payloadStreet = selectedParts?.street || street;
      const payloadCity = selectedParts?.city || city;
      const payloadState = selectedParts?.state || stateName;
      const payloadZip = selectedParts?.zip || zip;
      const res = await fetch("/api/property-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: fullAddress,
          address1: payloadStreet,
          street: payloadStreet,
          city: payloadCity,
          state: payloadState,
          zip: payloadZip,
          address2: [payloadCity, [payloadState, payloadZip].filter(Boolean).join(" ")].filter(Boolean).join(", ")
        })
      });
      const data = await res.json();
      if (data?.value) {
        setHomeValueInput(String(data.value));
        setValueStatus(`Estimated value found: ${formatMoney(Number(data.value))}`);
      } else {
        setValueStatus(data?.message || "Value lookup did not return a value. You can enter it manually.");
      }
    } catch {
      setValueStatus("Value lookup is unavailable right now. You can enter the value manually.");
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
    setAddressStatus("Address selected. Property value lookup started.");
    lookupHomeValue(result.label || `${selectedStreet}, ${selectedCity}, ${selectedState} ${selectedZip}`, {
      street: selectedStreet,
      city: selectedCity,
      state: selectedState,
      zip: selectedZip
    });
  }

  function manualValueLookup() {
    if (!street || !city || !stateName || !zip) {
      setValueStatus("Enter full address, city, state and ZIP before value lookup.");
      return;
    }
    lookupHomeValue(`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`);
  }

  async function submitLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const productLabel = selected.label;
    formData.set("requested_cash", String(path === "purchase" ? purchaseLoan : path === "refinance" ? requestedCash : helocAmount));
    formData.set("possible_equity_room", String(path === "purchase" ? purchaseLoan : path === "refinance" ? refiCashRoom : maxEquity));
    formData.set("estimated_monthly_payment", String(monthlyPreview));
    formData.set("product_interest", productLabel);
    formData.set("selected_program", productLabel);
    formData.set("current_interest_rate", currentLoanRate);
    formData.set("purchase_mode", path === "purchase" && noPurchaseAddress ? "no_property_found_yet" : "property_address_selected");
    const payload = Object.fromEntries(formData.entries());
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
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

  const sliderMax = path === "purchase" ? 2000000 : path === "refinance" ? Math.max(refiCashRoom, 25000) : Math.max(maxEquity, 25000);
  const sliderMin = path === "purchase" ? 100000 : 25000;
  const sliderValue = clamp(requestedCash, sliderMin, sliderMax);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020712] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_12%,rgba(42,206,255,.18),transparent_27%),radial-gradient(circle_at_85%_18%,rgba(105,255,154,.14),transparent_24%),linear-gradient(180deg,#050b17,#020712_62%,#01040a)]" />
      <div className="relative z-10">
        <section className="mx-auto max-w-[1700px] px-4 pt-4 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-blue-400/40 bg-[#06101f]/90 p-4 shadow-[0_0_50px_rgba(34,118,255,.18)] backdrop-blur-xl lg:p-5">
            <div className="grid items-center gap-4 lg:grid-cols-[1.35fr_repeat(4,1fr)]">
              <div className="flex items-center gap-5 border-white/15 lg:border-r lg:pr-8">
                <div className="text-xs font-black uppercase tracking-[.22em] text-white/70">As Featured On</div>
                <div className="text-4xl font-black tracking-[-.08em] text-white sm:text-5xl">yahoo! <span className="block text-2xl tracking-[-.05em] sm:inline sm:text-4xl">finance</span></div>
              </div>
              {[
                ["🛡️", "Secure Review", "Your information is protected"],
                ["📄", "No Obligation", "Completely free to review"],
                ["👥", "Top Mortgage Network", "Matched with mortgage companies"],
                ["⚡", "Fast & Easy", "Get matched quickly"]
              ].map(([icon, title, desc]) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl bg-white/[.035] p-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-2xl">{icon}</div>
                  <div>
                    <div className="text-sm font-black">{title}</div>
                    <div className="text-xs font-semibold leading-snug text-white/68">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <nav className="mx-auto flex max-w-[1700px] items-center justify-between gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="text-5xl leading-none text-emerald-300">⌂</div>
            <div>
              <div className="text-3xl font-black tracking-[.08em]">HELOC <span className="text-emerald-300">CONNECT</span></div>
              <div className="text-[10px] font-black uppercase tracking-[.38em] text-cyan-300">Home Equity. Better Options.</div>
            </div>
          </a>
          <div className="hidden items-center gap-8 text-base font-bold text-white/85 lg:flex">
            {products.map((p) => (
              <button key={p.id} type="button" onClick={() => setPath(p.id)} className={`border-b-2 pb-2 transition ${path === p.id ? "border-cyan-300 text-white" : "border-transparent hover:border-white/40"}`}>{p.nav}</button>
            ))}
            <a href="#apply" className="hover:text-cyan-300">Check My Options</a>
          </div>
          <a href="tel:+19498662466" className="hidden rounded-full border border-cyan-300/50 bg-gradient-to-r from-emerald-400/20 to-blue-500/25 px-5 py-3 text-sm font-black shadow-[0_0_30px_rgba(42,206,255,.18)] lg:inline-flex">☎ Connect to Live Agent</a>
        </nav>

        <section id="apply" className="mx-auto max-w-[1700px] px-4 pb-12 sm:px-6 lg:px-8">
          <form onSubmit={submitLead} className="overflow-hidden rounded-[34px] border border-blue-400/35 bg-[#07101d]/92 shadow-[0_30px_100px_rgba(0,0,0,.65)] backdrop-blur-xl">
            <div className="relative min-h-[470px] overflow-hidden border-b border-white/10">
              <img src={HERO_PHOTO} alt="Luxury home" className="absolute inset-0 h-full w-full object-cover object-center opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#04101f] via-[#04101f]/72 to-[#04101f]/10" />
              <div className="relative z-10 grid min-h-[470px] items-center gap-8 p-6 lg:grid-cols-[.9fr_1.1fr] lg:p-12">
                <div>
                  <div className="text-sm font-black uppercase tracking-[.24em] text-cyan-300">{selected.label}</div>
                  <h1 className="mt-5 max-w-[720px] text-5xl font-black leading-[.95] tracking-[-.06em] sm:text-7xl lg:text-[86px]">
                    Let&apos;s find the <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">right mortgage</span> for you.
                  </h1>
                  <p className="mt-6 max-w-[750px] text-xl font-bold text-white/88">Fast approvals • Low rates • 97% happy approvals</p>
                  <div className="mt-7 grid max-w-[760px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["⏱", "Approvals", "as quick as 1 hour"],
                      ["📄", "Only 3 months", "bank statements • No tax docs"],
                      ["%", "Lower APR", "than banks & lenders"],
                      ["💵", "Funds deposited", "2X faster than others"]
                    ].map(([icon, title, desc]) => (
                      <div key={title} className="rounded-2xl border border-cyan-300/25 bg-[#08182b]/75 p-4 backdrop-blur">
                        <div className="text-2xl text-cyan-300">{icon}</div>
                        <div className="mt-2 text-sm font-black">{title}</div>
                        <div className="text-xs font-semibold text-white/72">{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden lg:block" />
              </div>
            </div>

            <div className="p-5 sm:p-8 lg:p-10">
              <div className="mb-6">
                <div className="inline-flex rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-cyan-200">Personalized Review</div>
                <h2 className="mt-4 text-4xl font-black tracking-[-.04em] lg:text-5xl">First, tell us what you prefer?</h2>
                <p className="mt-3 max-w-4xl text-lg font-semibold text-white/65">Choose your main goal and the calculator will adjust to show the right numbers for that path.</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-4">
                {products.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPath(p.id)} className={`group min-h-[190px] rounded-[26px] border p-6 text-left transition hover:-translate-y-1 ${path === p.id ? "border-cyan-300 bg-white/[.08] shadow-[0_0_45px_rgba(42,206,255,.20)]" : "border-white/12 bg-white/[.035] hover:border-white/30"}`}>
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[.08] text-3xl">{p.icon}</div>
                    <h3 className="mt-5 text-2xl font-black">{p.label}</h3>
                    <p className="mt-3 text-sm font-semibold leading-relaxed text-white/68">{p.desc}</p>
                    <div className="mt-4 text-xs font-black text-emerald-300">{p.eyebrow}</div>
                  </button>
                ))}
              </div>

              <div className="mt-8 rounded-[30px] border border-cyan-300/25 bg-[#06101d]/88 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] sm:p-7">
                <div className="grid gap-5 lg:grid-cols-[1fr_.78fr]">
                  <div>
                    <label className="block text-xl font-black">{path === "purchase" ? "Property purchasing address" : "Property address"}</label>
                    <input name="street_address" value={street} onChange={(e) => searchAddress(e.target.value)} placeholder={path === "purchase" ? "Search the property purchasing address" : "Search your property address"} required={!(path === "purchase" && noPurchaseAddress)} autoComplete="off" className="mt-3 w-full rounded-[24px] border border-cyan-400/35 bg-[#020914] px-6 py-5 text-lg font-semibold outline-none transition focus:border-emerald-300" />
                    <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
                    <p className="mt-2 text-sm font-bold text-cyan-200">{searching ? "Searching..." : addressStatus}</p>
                    {addressResults.length > 0 && (
                      <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-cyan-300/30 bg-[#071527] p-2 shadow-2xl">
                        {addressResults.map((result, index) => (
                          <button key={`${result.label}-${index}`} type="button" onClick={() => selectAddress(result)} className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white hover:border-cyan-300 hover:bg-cyan-300/10">
                            {result.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {valueStatus && <p className="mt-2 text-sm font-black text-emerald-300">{valueStatus}</p>}
                    {path === "purchase" && (
                      <label className="mt-5 flex cursor-pointer gap-4 rounded-3xl border border-white/12 bg-white/[.045] p-5 text-lg font-black">
                        <input type="checkbox" checked={noPurchaseAddress} onChange={(e) => setNoPurchaseAddress(e.target.checked)} className="mt-1 h-5 w-5" />
                        <span>I haven&apos;t found the right home yet <span className="block pt-1 text-sm font-bold text-white/62">No problem — choose the approximate purchase loan amount you want reviewed.</span></span>
                      </label>
                    )}
                  </div>

                  <div className="grid gap-3 rounded-[26px] border border-white/10 bg-white/[.035] p-5">
                    <input name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit / Apt" className="rounded-2xl border border-white/12 bg-[#020914] p-4 outline-none" />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-2xl border border-white/12 bg-[#020914] p-4 outline-none" />
                      <input name="state" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" className="rounded-2xl border border-white/12 bg-[#020914] p-4 outline-none" />
                      <input name="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP" className="rounded-2xl border border-white/12 bg-[#020914] p-4 outline-none" />
                    </div>
                    <button type="button" onClick={manualValueLookup} className="rounded-2xl border border-cyan-300/45 px-5 py-3 text-sm font-black text-cyan-200">Re-check Property Value</button>
                  </div>
                </div>

                {path === "refinance" && (
                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <label className="rounded-[24px] border border-white/12 bg-white/[.035] p-5">
                      <span className="text-sm font-black text-white/68">Current loan interest rate</span>
                      <input value={currentLoanRate} onChange={(e) => setCurrentLoanRate(e.target.value)} name="current_interest_rate_display" className="mt-3 w-full rounded-2xl border border-white/12 bg-[#020914] p-4 text-2xl font-black outline-none" />
                    </label>
                    <div className="rounded-[24px] border border-emerald-300/25 bg-emerald-300/10 p-5 text-lg font-bold text-white/85">Refinance selected: your current mortgage is paid off and replaced with one new loan. The cash-out amount you choose is included in the new payment preview.</div>
                  </div>
                )}

                <div className="mt-8 rounded-[30px] border border-emerald-300/35 bg-gradient-to-br from-emerald-400/10 via-white/[.035] to-blue-500/10 p-5 sm:p-7">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[.32em] text-cyan-300">{selected.label} Preview</div>
                      <h3 className="mt-2 text-3xl font-black tracking-[-.04em] lg:text-4xl">{path === "purchase" ? "How much would you like to borrow?" : path === "refinance" ? "How much cash-out would you like to review?" : "How much would you like to access?"}</h3>
                      <p className="mt-2 text-base font-semibold text-white/62">Move the bar first — your selected amount and estimated payment will update below.</p>
                    </div>
                    <div className="rounded-full border border-emerald-300/35 bg-emerald-300/10 px-5 py-3 text-sm font-black text-emerald-100">Estimated in seconds</div>
                  </div>

                  <div className="mt-7">
                    <input type="range" min={sliderMin} max={sliderMax} step={path === "purchase" ? 25000 : 10000} value={sliderValue} onChange={(e) => setRequestedCash(Number(e.target.value))} className="w-full accent-emerald-300" />
                    <div className="mt-3 flex justify-between text-sm font-bold text-white/55"><span>{formatMoney(sliderMin)} minimum</span><span>Up to {formatMoney(sliderMax)} preview</span></div>
                  </div>

                  <div className="mt-7 grid gap-4 lg:grid-cols-4">
                    <ResultCard title={path === "purchase" ? "Selected Loan Amount" : path === "refinance" ? "Requested Cash-Out" : "Selected Access Amount"} value={formatMoney(path === "purchase" ? purchaseLoan : path === "refinance" ? requestedCash : helocAmount)} icon="💵" />
                    <ResultCard title="Estimated Monthly Payment" value={`${formatMoney(monthlyPreview)}/mo`} icon="📅" white />
                    {path === "purchase" ? (
                      <>
                        <ResultCard title={noPurchaseAddress ? "Estimated Home Price Range" : "Purchase Price Preview"} value={noPurchaseAddress ? `${formatMoney(estimatedHomeLow)} – ${formatMoney(estimatedHomeHigh)}` : formatMoney(homeValue)} icon="🏠" white />
                        <ResultCard title={noPurchaseAddress ? "Estimated Down Payment Needed" : "Estimated Down Payment"} value={noPurchaseAddress ? formatMoney(estimatedDownNeeded) : formatMoney(downPayment)} icon="◔" white />
                      </>
                    ) : path === "refinance" ? (
                      <>
                        <ResultCard title="Current Mortgage Payment" value={`${formatMoney(currentPayment)}/mo`} icon="↻" white />
                        <ResultCard title="New Loan Preview" value={formatMoney(refiLoan)} icon="🏦" white />
                      </>
                    ) : (
                      <>
                        <ResultCard title="Maximum Possible Equity" value={formatMoney(maxEquity)} icon="🏠" white />
                        <ResultCard title="Payment On Full Preview" value={`${formatMoney(maxPreviewPayment)}/mo`} icon="◔" white />
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <input name="home_value" value={moneyDisplay(homeValueInput)} onChange={(e) => setHomeValueInput(e.target.value)} placeholder="Estimated Home Value" className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none" />
                  <input name="mortgage_balance" value={moneyDisplay(mortgageBalanceInput)} onChange={(e) => setMortgageBalanceInput(e.target.value)} placeholder={path === "purchase" ? "Down Payment / Cash Available" : "Mortgage Balance"} className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none" />
                  <select name="loans_on_property" className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none"><option>How many loans?</option><option>1 loan</option><option>2 loans</option><option>3+ loans</option></select>
                  <select name="mortgage_good_standing" className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none"><option>Mortgage standing?</option><option>Current</option><option>Mostly current</option><option>Behind</option><option>Purchase buyer</option></select>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <input name="first_name" placeholder="First Name" required className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none" />
                  <input name="last_name" placeholder="Last Name" required className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none" />
                  <input name="phone" placeholder="Phone Number" required className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none" />
                  <input name="email" type="email" placeholder="Email Address" required className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none" />
                  <select name="credit_score" className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none"><option>Credit Score Range</option><option>720+</option><option>680-719</option><option>620-679</option><option>580-619</option><option>Under 580</option></select>
                  <input name="monthly_income" placeholder="Monthly Income" className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none" />
                  <input name="credit_card_balances" placeholder="Credit Card Balances" className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none" />
                  <select name="payment_frequency" className="rounded-2xl border border-white/15 bg-[#020914] p-4 outline-none"><option>How are payments going?</option><option>Always on time</option><option>Mostly on time</option><option>Sometimes late</option><option>Need help urgently</option></select>
                </div>

                <input type="hidden" name="requested_cash" value={path === "purchase" ? purchaseLoan : path === "refinance" ? requestedCash : helocAmount} />
                <input type="hidden" name="possible_equity_room" value={path === "purchase" ? purchaseLoan : path === "refinance" ? refiCashRoom : maxEquity} />
                <input type="hidden" name="estimated_monthly_payment" value={monthlyPreview} />
                <input type="hidden" name="selected_program" value={selected.label} />
                <input type="hidden" name="product_interest" value={selected.label} />

                <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_280px]">
                  <button disabled={loading} className="group rounded-3xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 p-6 text-left shadow-[0_0_45px_rgba(53,114,255,.30)] transition hover:scale-[1.01]">
                    <div className="flex items-center justify-between gap-5">
                      <div>
                        <div className="text-2xl font-black">{loading ? "Submitting..." : "Match Me With The Right Mortgage Company"}</div>
                        <div className="mt-1 text-sm font-semibold text-white/75">We&apos;ll connect you with a mortgage company from our network that fits your needs.</div>
                      </div>
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/10 text-4xl">›</div>
                    </div>
                  </button>
                  <div className="rounded-3xl border border-[#f2c15b]/30 bg-[#f2c15b]/10 p-5 text-center">
                    <div className="text-5xl font-black text-[#ffd66e]">97%</div>
                    <div className="text-sm font-black">Happy Approvals</div>
                    <div className="mt-1 text-[#ffd66e]">★★★★★</div>
                  </div>
                </div>
                <p className="mt-4 text-center text-sm font-semibold text-white/60">Your information is secure and will never be shared without your consent. Estimates are previews only. Final terms depend on program, qualification, property, credit profile, and mortgage company review.</p>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function ResultCard({ title, value, icon, white }: { title: string; value: string; icon: string; white?: boolean }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-[#06101d]/72 p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-400/12 text-2xl">{icon}</div>
        <div className="text-base font-bold leading-snug text-white/75">{title}</div>
      </div>
      <div className={`mt-4 text-3xl font-black tracking-[-.04em] ${white ? "text-white" : "text-emerald-300"}`}>{value}</div>
    </div>
  );
}
