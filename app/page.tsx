"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AddressResult = {
  label: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
};

const HERO_PHOTO = "https://images.pexels.com/photos/7979605/pexels-photo-7979605.jpeg?auto=compress&cs=tinysrgb&w=1800";

function moneyNumber(value: string) {
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

function parseAddress(label: string) {
  const parts = label.split(",").map((p) => p.trim());
  const street = parts[0] || "";
  const city = parts[1] || "";
  const stateZip = parts[2] || "";
  const [state, zip] = stateZip.split(" ").filter(Boolean);
  return { street, city, state: state || "", zip: zip || "" };
}

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [street, setStreet] = useState("");
  const [unit, setUnit] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");

  const [homeValueInput, setHomeValueInput] = useState("");
  const [mortgageBalanceInput, setMortgageBalanceInput] = useState("");
  const [requestedCashInput, setRequestedCashInput] = useState("");

  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [addressStatus, setAddressStatus] = useState("Start typing your property address");
  const [valueStatus, setValueStatus] = useState("");
  const [searching, setSearching] = useState(false);

  const homeValue = moneyNumber(homeValueInput);
  const mortgageBalance = moneyNumber(mortgageBalanceInput);
  const requestedCash = moneyNumber(requestedCashInput);

  const equityRoom = useMemo(() => {
    if (!homeValue || !mortgageBalance) return 0;
    return Math.max(0, Math.round(homeValue * 0.85 - mortgageBalance));
  }, [homeValue, mortgageBalance]);

  const paymentPreview = useMemo(() => {
    const amount = requestedCash || equityRoom;
    if (!amount) return 0;
    const monthlyRate = 0.053 / 12;
    const months = 240;
    return Math.round((amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)));
  }, [requestedCash, equityRoom]);

  async function searchAddress(q: string) {
    setStreet(q);
    setValueStatus("");

    if (!q || q.trim().length < 3) {
      setAddressResults([]);
      setAddressStatus("Type at least 3 characters to search address");
      return;
    }

    try {
      setSearching(true);
      setAddressStatus("Searching matching addresses...");
      const res = await fetch(`/api/address-autocomplete?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setAddressResults(data?.results || []);
      setAddressStatus(data?.results?.length ? "Select your address below" : (data?.message || "No address matches yet"));
    } catch {
      setAddressResults([]);
      setAddressStatus("Address autocomplete is temporarily unavailable.");
    } finally {
      setSearching(false);
    }
  }

  async function lookupHomeValue(fullAddress: string) {
    try {
      setValueStatus("Looking up estimated home value...");
      const res = await fetch("/api/property-value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: fullAddress,
          address1: street,
          street,
          city,
          state: stateName,
          zip,
          address2: [city, [stateName, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")
        })
      });
      const data = await res.json();

      if (data?.value) {
        setHomeValueInput(String(data.value));
        setValueStatus(`Estimated value found: ${formatMoney(Number(data.value))}`);
      } else {
        setValueStatus(data?.message || "Home value API did not return a value. Enter the value manually.");
      }
    } catch {
      setValueStatus("Home value lookup is not connected yet. You can enter value manually.");
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
    setAddressStatus("Address selected and auto-filled");

    lookupHomeValue(result.label || `${selectedStreet}, ${selectedCity}, ${selectedState} ${selectedZip}`);
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
    <main className="min-h-screen overflow-x-hidden bg-[#06111f] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#06101d]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" className="flex shrink-0 items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d9a94e]/70 bg-[#091827] text-[#f6c15a] shadow-lg">⌂</div>
            <div className="leading-none">
              <div className="text-2xl font-black tracking-[-.05em]">HELOC CONNECT</div>
              <div className="text-[11px] font-black uppercase tracking-[.45em] text-[#f6c15a]">Smart Match Platform</div>
            </div>
          </a>

          <div className="hidden items-center gap-6 text-sm font-black text-white/80 lg:flex">
            <a href="#how" className="hover:text-[#f6c15a]">How It Works</a>
            <a href="#deal" className="hover:text-[#f6c15a]">Example Result</a>
            <a href="#protection" className="hover:text-[#f6c15a]">Protection</a>
            <a href="#apply" className="hover:text-[#f6c15a]">Calculator</a>
            <a href="/about" className="hover:text-[#f6c15a]">About</a>
            <a href="/privacy-policy" className="hover:text-[#f6c15a]">Privacy</a>
          </div>

          <a href="#apply" className="rounded-2xl bg-gradient-to-b from-[#ffd36d] to-[#d89425] px-5 py-3 text-sm font-black text-[#07101c] shadow-lg shadow-[#d89425]/25">
            Explore My Options
          </a>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_10%_15%,rgba(246,193,90,.17),transparent_26%),radial-gradient(circle_at_90%_10%,rgba(52,211,153,.10),transparent_25%),linear-gradient(135deg,#06111f,#071827_52%,#030912)] px-3 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f6c15a]/60 to-transparent" />
        <div className="mx-auto max-w-[1500px]">
          <div className="grid gap-8 lg:grid-cols-[.92fr_1.08fr] lg:items-center">
            <div className="rounded-[34px] border border-white/10 bg-white/[.035] p-6 shadow-2xl shadow-black/40 sm:p-8 lg:p-10">
              <div className="inline-flex rounded-full border border-[#d9a94e]/70 bg-[#f6c15a]/10 px-4 py-2 text-xs font-black uppercase tracking-[.32em] text-[#f7c35e]">
                The smarter way to borrow
              </div>

              <h1 className="mt-7 max-w-[650px] text-[44px] font-black leading-[.92] tracking-[-.065em] text-white sm:text-7xl xl:text-[86px]">
                HELOC or Refinance?
              </h1>
              <h2 className="mt-3 max-w-[650px] bg-gradient-to-r from-[#f6c15a] via-[#ffe6a0] to-white bg-clip-text text-[36px] font-black leading-[1.02] tracking-[-.05em] text-transparent sm:text-6xl">
                Find the smarter path.
              </h2>

              <p className="mt-6 max-w-[690px] text-lg font-semibold leading-relaxed text-white/78">
                HELOC CONNECT helps homeowners explore whether a HELOC, refinance, cash-out, or purchase option may put them in a stronger financial position through carefully selected mortgage companies in our network.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <div className="text-3xl text-[#f6c15a]">★★★★★</div>
                <div className="text-sm font-black text-white">4.9/5 From 2,000+ Homeowners</div>
              </div>

              <div className="mt-7 grid max-w-[620px] gap-3 sm:grid-cols-3">
                {["100% FREE to homeowners", "No SSN to start", "No credit check to explore"].map((x) => (
                  <div key={x} className="rounded-2xl border border-white/10 bg-[#08182b] p-4 text-sm font-black">
                    <span className="mr-2 text-[#f6c15a]">✓</span>{x}
                  </div>
                ))}
              </div>

              <div className="mt-7 grid max-w-[650px] grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-[#08182b] p-4 text-center shadow-xl">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.35em] text-white/45">Featured On</div>
                  <div className="mt-1 text-xl font-black text-purple-300">Yahoo!</div>
                  <div className="text-lg font-black">finance</div>
                </div>
                <div>
                  <div className="text-2xl text-[#f6c15a]">★★★★★</div>
                  <div className="text-xs font-black uppercase tracking-[.15em]">Top Rated<br/>2026</div>
                </div>
                <div>
                  <div className="text-3xl">🛡️</div>
                  <div className="text-xs font-black uppercase tracking-[.15em]">Protection<br/>Shield</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[42px] bg-gradient-to-br from-[#f6c15a]/25 via-white/0 to-emerald-400/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[34px] border border-[#d9a94e]/35 bg-[#081827] shadow-2xl shadow-black/45">
                <div className="absolute left-5 top-5 z-20 rounded-2xl border border-[#f6c15a]/45 bg-[#06111f]/82 px-4 py-3 backdrop-blur">
                  <div className="text-[10px] font-black uppercase tracking-[.3em] text-[#f6c15a]">HELOC CONNECT Office</div>
                  <div className="text-sm font-black">Client matched with the right mortgage company</div>
                </div>
                <img src={HERO_PHOTO} alt="Happy couple meeting with a financial advisor in a modern office" className="h-[430px] w-full object-cover object-center lg:h-[640px]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06111f] via-[#06111f]/72 to-transparent p-5 pt-24">
                  <div className="rounded-3xl border border-white/10 bg-white/[.08] p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[.22em] text-emerald-300">Matched Successfully</div>
                        <div className="mt-1 text-xl font-black">Mortgage company fit confirmed</div>
                      </div>
                      <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-400 text-3xl font-black text-[#06111f]">✓</div>
                    </div>
                  </div>
                </div>
              </div>

              <div id="deal" className="relative mx-auto mt-6 max-w-[760px] rounded-[32px] border border-[#f6c15a]/25 bg-[#f2eadb] p-5 text-[#08111f] shadow-2xl sm:p-6">
                <div className="flex gap-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-emerald-500 text-4xl font-black text-white">✓</div>
                  <div>
                    <h3 className="text-2xl font-black leading-tight tracking-[-.04em] sm:text-3xl">Example Client Result</h3>
                    <p className="mt-2 text-base font-black text-emerald-700">Lower monthly payment + $100,000 cash access</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                  <div className="rounded-2xl bg-white p-4 text-center shadow-lg">
                    <div className="text-xs font-black uppercase text-slate-500">Before</div>
                    <div className="mt-2 text-3xl font-black text-red-600">$2,785<span className="text-sm">/mo</span></div>
                    <div className="mt-2 text-sm font-black text-slate-500">$0 cash out</div>
                  </div>
                  <div className="text-4xl font-black text-slate-500">→</div>
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center shadow-lg">
                    <div className="text-xs font-black uppercase text-slate-500">After Match</div>
                    <div className="mt-2 text-3xl font-black text-emerald-700">$2,125<span className="text-sm">/mo</span></div>
                    <div className="mt-2 text-xl font-black text-emerald-700">$100,000</div>
                  </div>
                </div>
                <div className="mt-5 rounded-2xl bg-emerald-600 px-4 py-4 text-center text-base font-black text-white">
                  $660 lower monthly payment • Cash access at closing
                </div>
                <p className="mt-4 text-center text-xs font-black leading-relaxed text-slate-600">
                  Illustration only. Final options depend on property, income, qualifications, market conditions, and participating mortgage company review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1500px] px-3 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["01", "Smart Calculator", "Start with your address, value, mortgage balance, and desired cash access."],
            ["02", "Review Your Situation", "We organize your numbers before matching you to the right mortgage company."],
            ["03", "Network Match", "A selected mortgage company reviews the file and available options."],
            ["04", "Status Tracking", "You receive a private status page so you always know where things stand."]
          ].map(([num, title, desc]) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-[#071421] p-6 shadow-xl">
              <div className="text-sm font-black text-[#f6c15a]">{num}</div>
              <h3 className="mt-4 text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-white/62">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="protection" className="mx-auto max-w-[1500px] px-3 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-[#071421] p-6 shadow-2xl sm:p-8">
          <div className="grid gap-5 md:grid-cols-4">
            {[
              ["🔐", "SSL Secured", "Encrypted HTTPS connection helps protect information submitted through HELOC CONNECT."],
              ["🛡️", "Protection Shield", "We help homeowners avoid bad-fit companies, unwanted products, and unrealistic expectations."],
              ["💚", "Free To Homeowners", "No consultation fee, matching fee, or hidden HELOC CONNECT charge."],
              ["🚫", "No SSN To Start", "No Social Security Number is required and this initial request does not pull credit."]
            ].map(([icon, title, desc]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-[#08182b] p-5">
                <div className="text-3xl">{icon}</div>
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-white/62">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="mx-auto max-w-[1500px] px-3 py-8 sm:px-6 lg:px-8">
        <form onSubmit={submitLead} className="grid gap-5 rounded-[34px] border border-white/10 bg-[#071421] p-5 shadow-2xl sm:p-8 lg:p-10">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[.09] to-white/[.03] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Smart Homeowner Calculator</div>
                <h2 className="mt-3 text-4xl font-black leading-[1.02] tracking-[-.04em] lg:text-5xl">
                  Check your possible equity path.
                  <span className="mt-2 block bg-gradient-to-r from-[#f6c15a] via-[#ffe7a3] to-white bg-clip-text text-transparent">Fast, private, and free.</span>
                </h2>
                <p className="mt-4 max-w-4xl text-base font-semibold leading-relaxed text-white/72">
                  Start with your property address. Address autocomplete and estimated property value lookup use Google Maps and ATTOM when connected.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <div className="rounded-full border border-emerald-300/35 bg-emerald-400/15 px-5 py-2 text-sm font-black text-emerald-200">● Property data powered</div>
                <div className="rounded-full border border-[#f6c15a]/35 bg-[#f6c15a]/10 px-5 py-2 text-sm font-black text-[#f6c15a]">🔐 SSL secured</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[#d9a94e]/45 bg-[#091a2f] p-5">
              <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Step 1 of 4</div>
              <label className="mt-4 block text-lg font-black">Property Address</label>
              <input name="street_address" value={street} onChange={(e) => searchAddress(e.target.value)} placeholder="Start typing property address" required autoComplete="off" className="mt-3 w-full rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none focus:border-[#f6c15a]" />
              <input type="hidden" name="property_address" value={`${street}${unit ? " " + unit : ""}, ${city}, ${stateName} ${zip}`} />
              <p className="mt-2 text-xs font-black text-emerald-200">{searching ? "Searching..." : addressStatus}</p>

              {addressResults.length > 0 && (
                <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-[#d9a94e]/30 bg-[#071527] p-2 shadow-2xl">
                  {addressResults.map((result, index) => (
                    <button key={`${result.label}-${index}`} type="button" onClick={() => selectAddress(result)} className="mb-2 block w-full rounded-xl border border-white/10 bg-white/[.06] px-4 py-3 text-left text-sm font-bold text-white transition hover:border-[#f6c15a] hover:bg-[#f6c15a]/10">
                      {result.label}
                    </button>
                  ))}
                </div>
              )}

              {valueStatus && <p className="mt-2 text-xs font-black text-[#f6c15a]">{valueStatus}</p>}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit / Apt" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
                <input name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
                <input name="state" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="State" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
                <input name="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="ZIP Code" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
              </div>

              <button type="button" onClick={manualValueLookup} className="mt-4 rounded-2xl border border-[#d9a94e]/60 px-5 py-3 text-sm font-black text-[#f6c15a]">
                Re-check Home Value
              </button>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#091a2f] p-5">
              <div className="text-xs font-black uppercase tracking-[.38em] text-[#f6c15a]">Smart Funding Breakdown</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input name="home_value" value={moneyDisplay(homeValueInput)} onChange={(e) => setHomeValueInput(e.target.value)} placeholder="Estimated Home Value" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
                <input name="mortgage_balance" value={moneyDisplay(mortgageBalanceInput)} onChange={(e) => setMortgageBalanceInput(e.target.value)} placeholder="Mortgage Balance" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
                <input name="requested_cash" value={moneyDisplay(requestedCashInput)} onChange={(e) => setRequestedCashInput(e.target.value)} placeholder="Requested Funding Amount" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none sm:col-span-2" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/25 bg-black/20 p-4 text-center">
                  <div className="text-xs font-black uppercase tracking-[.14em] text-emerald-300">Estimated Equity Access</div>
                  <div className="mt-2 text-3xl font-black text-emerald-300">{homeValue && mortgageBalance ? formatMoney(equityRoom) : "—"}</div>
                </div>
                <div className="rounded-2xl border border-[#d9a94e]/25 bg-[#d9a94e]/10 p-4 text-center">
                  <div className="text-xs font-black uppercase tracking-[.14em] text-[#f6c15a]">Payment Preview</div>
                  <div className="mt-2 text-3xl font-black">{paymentPreview ? `${formatMoney(paymentPreview)}/mo` : "—"}</div>
                </div>
              </div>
              <input type="hidden" name="possible_equity_room" value={equityRoom} />
              <input type="hidden" name="estimated_monthly_payment" value={paymentPreview} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input name="first_name" placeholder="First Name" required className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
            <input name="last_name" placeholder="Last Name" required className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
            <input name="phone" placeholder="Phone Number" required className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
            <input name="email" type="email" placeholder="Email Address" required className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
            <select name="loans_on_property" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none"><option>How many loans?</option><option>1 loan</option><option>2 loans</option><option>3+ loans</option></select>
            <select name="mortgage_good_standing" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none"><option>Mortgage standing?</option><option>Current</option><option>Mostly current</option><option>Behind</option></select>
            <select name="credit_score" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none"><option>Credit Score Range</option><option>720+</option><option>680-719</option><option>620-679</option><option>580-619</option><option>Under 580</option></select>
            <input name="monthly_income" placeholder="Monthly Income" className="rounded-2xl border border-white/15 bg-[#06101d] p-4 outline-none" />
          </div>

          <button disabled={loading} className="rounded-2xl bg-gradient-to-b from-[#ffd36d] to-[#d89425] p-5 text-lg font-black text-[#06101d] shadow-xl">
            {loading ? "Submitting..." : "SEE MY OPTIONS"}
          </button>
          <p className="text-center text-xs font-bold leading-relaxed text-white/75">No Social Security Number required for this initial request • Not a credit check • 100% free for homeowners</p>
        </form>
      </section>

      <a href="tel:+19498662466" className="fixed bottom-6 right-6 z-50 hidden items-center gap-3 rounded-full border border-[#f6c15a]/60 bg-gradient-to-r from-[#fff0b8] via-[#f6c15a] to-[#d89425] px-6 py-4 text-sm font-black uppercase tracking-[.14em] text-[#06101d] shadow-[0_18px_55px_rgba(216,148,37,.35)] md:inline-flex">
        ☎ Connect With A Live Agent <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      </a>
    </main>
  );
}
