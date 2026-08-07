"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  COUNTRIES,
  COUNTRY_CURRENCY,
  CURRENCIES,
  LANGUAGES,
  TRADES,
  countryName,
  currencyName,
} from "@/lib/geo";
import { isValidE164 } from "@/lib/format";
import { OrbitSpinner } from "@/components/Logo";
import type { Business } from "@/lib/types";

const inputCls =
  "h-10 w-full rounded-lg bg-ink-950 border border-edge px-3 text-body text-ink-50 placeholder:text-ink-300 hover:border-edge-strong focus:border-arc-400 transition-colors";
const labelCls = "block text-card-title text-ink-200 mb-1.5";

export default function SettingsForm({ business }: { business: Business }) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(business.name);
  const [trade, setTrade] = useState(business.trade ?? "Other");
  const [country, setCountry] = useState(business.country ?? "US");
  const [currency, setCurrency] = useState(business.currency ?? "USD");
  const [language, setLanguage] = useState(business.language ?? "en");
  const [timezone, setTimezone] = useState(business.timezone);
  const [avgJob, setAvgJob] = useState(
    business.avg_job_value != null ? String(business.avg_job_value) : "",
  );
  const [forwardTo, setForwardTo] = useState(business.forward_to ?? "");
  const [state, setState] = useState<"idle" | "busy" | "saved" | "error">(
    "idle",
  );
  const [err, setErr] = useState<string | null>(null);

  const timezones = useMemo(() => {
    try {
      const list = Intl.supportedValuesOf("timeZone");
      return list.includes(business.timezone)
        ? list
        : [business.timezone, ...list];
    } catch {
      return [business.timezone];
    }
  }, [business.timezone]);

  const trades = TRADES.includes(trade) ? TRADES : [trade, ...TRADES];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const fwd = forwardTo.trim();
    if (fwd && !isValidE164(fwd)) {
      setErr(
        "Forwarding number must be in international format, e.g. +14155551234.",
      );
      setState("error");
      return;
    }
    const avg = avgJob.trim() === "" ? null : parseFloat(avgJob);
    if (avg != null && (!Number.isFinite(avg) || avg <= 0)) {
      setErr("Average job value must be a positive number.");
      setState("error");
      return;
    }

    setState("busy");
    const { error } = await supabase
      .from("businesses")
      .update({
        name: name.trim() || business.name,
        trade,
        country,
        currency,
        language,
        timezone,
        avg_job_value: avg,
        forward_to: fwd || null,
      })
      .eq("id", business.id);

    if (error) {
      setErr(error.message);
      setState("error");
      return;
    }
    setState("saved");
    router.refresh();
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-edge bg-ink-900 p-5">
      <h2 className="text-section text-ink-50 mb-1">Business profile</h2>
      <p className="text-caption text-ink-300 mb-5">
        Currency, timezone, and language drive every number and timestamp in
        the app — and the language your receptionist speaks.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="s-name" className={labelCls}>
            Business name
          </label>
          <input
            id="s-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="s-trade" className={labelCls}>
            Trade
          </label>
          <select
            id="s-trade"
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className={inputCls}
          >
            {trades.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="s-country" className={labelCls}>
            Country
          </label>
          <select
            id="s-country"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              const cur = COUNTRY_CURRENCY[e.target.value];
              if (cur) setCurrency(cur);
            }}
            className={inputCls}
          >
            {(COUNTRIES.includes(country)
              ? COUNTRIES
              : [country, ...COUNTRIES]
            ).map((c) => (
              <option key={c} value={c}>
                {countryName(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="s-currency" className={labelCls}>
            Currency
          </label>
          <select
            id="s-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={inputCls}
          >
            {(CURRENCIES.includes(currency)
              ? CURRENCIES
              : [currency, ...CURRENCIES]
            ).map((c) => (
              <option key={c} value={c}>
                {currencyName(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="s-language" className={labelCls}>
            Receptionist language
          </label>
          <select
            id="s-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={inputCls}
          >
            {(LANGUAGES.some((l) => l.code === language)
              ? LANGUAGES
              : [{ code: language, label: language }, ...LANGUAGES]
            ).map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="s-tz" className={labelCls}>
            Timezone
          </label>
          <select
            id="s-tz"
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
        <div>
          <label htmlFor="s-avg" className={labelCls}>
            Average job value
          </label>
          <input
            id="s-avg"
            type="number"
            min="1"
            step="any"
            value={avgJob}
            onChange={(e) => setAvgJob(e.target.value)}
            placeholder="e.g. 500"
            className={inputCls}
          />
          <p className="text-caption text-ink-300 mt-1.5">
            Powers the estimated-revenue numbers on your dashboard.
          </p>
        </div>
        <div>
          <label htmlFor="s-fwd" className={labelCls}>
            Warm-transfer number
          </label>
          <input
            id="s-fwd"
            value={forwardTo}
            onChange={(e) => setForwardTo(e.target.value)}
            placeholder="+14155551234"
            className={inputCls}
          />
          <p className="text-caption text-ink-300 mt-1.5">
            Where the receptionist transfers callers who need a human.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          type="submit"
          disabled={state === "busy"}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-arc-400 text-ink-950 font-semibold shadow-sheen hover:bg-arc-300 transition-colors disabled:opacity-60"
        >
          {state === "busy" && <OrbitSpinner size={15} />}
          Save changes
        </button>
        {state === "saved" && (
          <span className="text-body text-good-300 font-medium">Saved.</span>
        )}
        {state === "error" && err && (
          <span className="text-body text-bad-300">{err}</span>
        )}
      </div>
    </form>
  );
}
