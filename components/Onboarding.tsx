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

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("Roofing");
  const [country, setCountry] = useState(browserRegion);
  const [currency, setCurrency] = useState(
    COUNTRY_CURRENCY[browserRegion] ?? "USD",
  );
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState(browserTz);
  const [avgJob, setAvgJob] = useState("500");
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
              Step {step} of 2 · takes about a minute
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
              submit();
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
                  onChange={(e) => setLanguage(e.target.value)}
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
                {busy && <OrbitSpinner size={15} />}
                {busy ? "Setting up your dashboard…" : "Finish setup"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
