"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadSampleData } from "@/lib/demo";
import {
  COUNTRIES,
  COUNTRY_CURRENCY,
  CURRENCIES,
  LANGUAGES,
  TRADES,
  countryName,
  currencyName,
} from "@/lib/geo";
import { ArcMark, OrbitSpinner } from "@/components/Logo";
import { COMMON_FAQS } from "@/lib/assistant";
import { isValidE164 } from "@/lib/format";
import type { Business } from "@/lib/types";

const inputCls =
  "h-10 w-full rounded-lg bg-ink-950 border border-edge px-3 text-body text-ink-50 placeholder:text-ink-300 hover:border-edge-strong focus:border-arc-400 transition-colors";
const labelCls = "block text-card-title text-ink-200 mb-1.5";

export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();

  const browserTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    [],
  );
  const browserRegion = useMemo(() => {
    const loc = typeof navigator !== "undefined" ? navigator.language : "en-US";
    const m = /-([A-Z]{2})$/.exec(loc);
    return m && COUNTRIES.includes(m[1]) ? m[1] : "US";
  }, []);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("Roofing");
  const [country, setCountry] = useState(browserRegion);
  const [currency, setCurrency] = useState(
    COUNTRY_CURRENCY[browserRegion] ?? "USD",
  );
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState(browserTz);
  const [avgJob, setAvgJob] = useState("500");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [voice, setVoice] = useState<"female" | "male">("female");
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [services, setServices] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [businessHours, setBusinessHours] = useState("Monday to Friday, 8:00 AM to 6:00 PM");
  const [greeting, setGreeting] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [browserTz, "America/New_York", "Europe/Lisbon", "Europe/London"];
    }
  }, [browserTz]);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      if (ownerPhone.trim() && !isValidE164(ownerPhone.trim())) {
        setErr("Owner number must use international format, e.g. +14155551234.");
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErr("Session expired — please sign in again.");
        return;
      }

      const avg = parseFloat(avgJob);
      const { data: bizRaw, error: bizErr } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
          name: name.trim(),
          trade,
          country,
          currency,
          language,
          timezone,
          avg_job_value: Number.isFinite(avg) && avg > 0 ? avg : null,
          forward_to: ownerPhone.trim() || null,
          assistant_config: {
            assistant_name: "Nova",
            greeting: greeting.trim() || `Thanks for calling ${name.trim()}! This is Nova — how can I help you today?`,
            alternate_openers: [`Hello, you've reached ${name.trim()}. This is Nova. How may I help?`],
            personality: "friendly",
            voice_gender: voice,
            languages,
            business_summary: "",
            service_area: serviceArea.trim(),
            business_hours: businessHours.trim(),
            services: services.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12),
            emergency_note: "For active emergencies, reassure the caller, flag the call as urgent, and offer to transfer the caller to the owner.",
            redirect_line: "I want to make sure you get the right answer. Let me connect you with the owner now.",
            ask_address: true,
            ask_urgency: true,
            offer_slots: true,
            booking_duration_minutes: 60,
            confirm_critical_details: true,
            transfer_when_uncertain: true,
            faqs: COMMON_FAQS,
          },
          trial_ends_at: new Date(
            Date.now() + 14 * 86400_000,
          ).toISOString(),
        })
        .select("*")
        .single();

      if (bizErr || !bizRaw) {
        setErr(bizErr?.message ?? "Could not create the business.");
        return;
      }

      // Seed the demo so the first thing they ever see is a busy dashboard.
      try {
        await loadSampleData(supabase, bizRaw as Business);
      } catch {
        // Demo data is a nicety — never block onboarding on it.
      }

      await fetch("/api/vapi/assistant", { method: "POST" }).catch(() => null);

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <ArcMark size={34} />
          <div>
            <h1 className="text-page-title text-ink-50">Set up your business</h1>
            <p className="text-caption text-ink-300">
              Step {step} of 3 · your receptionist will be ready when you finish
            </p>
          </div>
        </div>

        {step === 1 && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) setStep(2);
            }}
          >
            <div>
              <label htmlFor="ob-name" className={labelCls}>
                Business name
              </label>
              <input
                id="ob-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Summit Ridge Roofing"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="ob-trade" className={labelCls}>
                Trade
              </label>
              <select
                id="ob-trade"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className={inputCls}
              >
                {TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full h-10 rounded-lg bg-arc-400 text-ink-950 font-semibold shadow-sheen hover:bg-arc-300 transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {step === 2 && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setStep(3);
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ob-country" className={labelCls}>
                  Country
                </label>
                <select
                  id="ob-country"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    const cur = COUNTRY_CURRENCY[e.target.value];
                    if (cur) setCurrency(cur);
                  }}
                  className={inputCls}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {countryName(c)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ob-currency" className={labelCls}>
                  Currency
                </label>
                <select
                  id="ob-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={inputCls}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {currencyName(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ob-language" className={labelCls}>
                  Receptionist language
                </label>
                <select
                  id="ob-language"
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setLanguages([e.target.value, ...languages.filter((code) => code !== e.target.value)].slice(0, 4));
                  }}
                  className={inputCls}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ob-tz" className={labelCls}>
                  Timezone
                </label>
                <select
                  id="ob-tz"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={inputCls}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="ob-avg" className={labelCls}>
                Average job value
              </label>
              <input
                id="ob-avg"
                type="number"
                min="1"
                step="any"
                value={avgJob}
                onChange={(e) => setAvgJob(e.target.value)}
                className={inputCls}
              />
              <p className="text-caption text-ink-300 mt-1.5">
                Used to estimate recovered revenue on your dashboard. You can
                change it any time.
              </p>
            </div>

            {err && <p className="text-caption text-bad-300">{err}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-10 px-4 rounded-lg border border-edge text-body font-semibold text-ink-200 hover:bg-white/[0.05] transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="flex-1 h-10 rounded-lg bg-arc-400 text-ink-950 font-semibold shadow-sheen hover:bg-arc-300 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="rounded-xl border border-arc-400/25 bg-arc-400/[0.06] p-3">
              <p className="text-card-title text-arc-100">Receptionist setup</p>
              <p className="text-caption text-ink-300 mt-0.5">These answers build Nova&apos;s first call script. Everything stays editable in Assistant Studio.</p>
            </div>
            <div>
              <label htmlFor="ob-services" className={labelCls}>Main services</label>
              <input
                id="ob-services"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                placeholder="Roof repair, inspections, emergency leaks"
                className={inputCls}
              />
              <p className="text-caption text-ink-300 mt-1.5">Separate services with commas.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ob-area" className={labelCls}>Service area</label>
                <input id="ob-area" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} placeholder="Madrid + 20 km" className={inputCls} />
              </div>
              <div>
                <label htmlFor="ob-hours" className={labelCls}>Business hours</label>
                <input id="ob-hours" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor="ob-owner-phone" className={labelCls}>Owner transfer number</label>
              <input
                id="ob-owner-phone"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="+14155551234"
                className={inputCls}
              />
              <p className="text-caption text-ink-300 mt-1.5">Nova transfers urgent or uncertain calls here.</p>
            </div>
            <div>
              <label className={labelCls}>Voice</label>
              <div className="grid grid-cols-2 gap-2">
                {(["female", "male"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setVoice(option)}
                    className={`h-10 rounded-lg border capitalize text-body font-semibold ${voice === option ? "border-arc-400/60 bg-arc-400/10 text-arc-100" : "border-edge bg-ink-950 text-ink-200"}`}
                  >
                    {option} voice
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Languages</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                {LANGUAGES.map((option) => {
                  const active = languages.includes(option.code);
                  return (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => {
                        const next = active
                          ? languages.filter((code) => code !== option.code)
                          : [...languages, option.code].slice(0, 4);
                        if (next.length) {
                          setLanguages(next);
                          setLanguage(next[0]);
                        }
                      }}
                      className={`rounded-lg border px-3 py-2 text-caption text-left ${active ? "border-arc-400/60 bg-arc-400/10 text-arc-100" : "border-edge bg-ink-950 text-ink-300"}`}
                    >
                      {active ? "✓ " : ""}{option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="ob-greeting" className={labelCls}>Opening line</label>
              <textarea
                id="ob-greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                placeholder={`Thanks for calling ${name || "your business"}! This is Nova — how can I help you today?`}
                rows={2}
                className="w-full rounded-lg bg-ink-950 border border-edge px-3 py-2.5 text-body text-ink-50 placeholder:text-ink-300"
              />
            </div>
            {err && <p className="text-caption text-bad-300">{err}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="h-10 px-4 rounded-lg border border-edge text-body font-semibold text-ink-200 hover:bg-white/[0.05]">Back</button>
              <button type="submit" disabled={busy} className="flex-1 h-10 rounded-lg bg-arc-400 text-ink-950 font-semibold shadow-sheen hover:bg-arc-300 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {busy && <OrbitSpinner size={15} />}
                {busy ? "Building your receptionist…" : "Finish setup"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
