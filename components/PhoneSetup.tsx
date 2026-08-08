"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COUNTRIES, countryName } from "@/lib/geo";
import { fmtPhone, isValidE164 } from "@/lib/format";
import { Icon } from "@/components/Icons";
import { OrbitSpinner } from "@/components/Logo";
import type { Business, NumberRequest } from "@/lib/types";

const inputCls =
  "h-10 w-full rounded-lg bg-ink-950 border border-edge px-3 text-body text-ink-50 placeholder:text-ink-300 hover:border-edge-strong focus:border-arc-400 transition-colors";

interface PhoneRow {
  id: string;
  e164: string;
  vapi_number_id: string | null;
  active: boolean;
}

const STEPS = ["requested", "provisioning", "live"] as const;
const STEP_LABEL: Record<(typeof STEPS)[number], string> = {
  requested: "Requested",
  provisioning: "Provisioning",
  live: "Live",
};

export default function PhoneSetup({
  business,
  phones,
  requests,
}: {
  business: Business;
  phones: PhoneRow[];
  requests: NumberRequest[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"new" | "port" | null>(null);
  const [country, setCountry] = useState(business.country ?? "US");
  const [area, setArea] = useState("");
  const [existing, setExisting] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const liveNumbers = phones.filter((p) => p.active && p.vapi_number_id);
  // A request marked 'live' before its phone row lands still counts as
  // in-progress — otherwise the form reopens and invites duplicates.
  const pending = requests.find(
    (r) =>
      r.status === "requested" ||
      r.status === "provisioning" ||
      (r.status === "live" && liveNumbers.length === 0),
  );

  async function submit() {
    setErr(null);
    if (mode === "port" && !isValidE164(existing.trim())) {
      setErr("Enter the number in international format, e.g. +19735551234.");
      return;
    }
    if (mode === "new" && area && !/^\d{2,5}$/.test(area.trim())) {
      setErr("Area code should be 2–5 digits.");
      return;
    }
    setBusy(true);
    const { error } = await createClient().from("number_requests").insert({
      business_id: business.id,
      kind: mode,
      country,
      area_code: mode === "new" ? area.trim() || null : null,
      existing_e164: mode === "port" ? existing.trim() : null,
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setMode(null);
    router.refresh();
  }

  return (
    <section id="phone" className="rounded-xl border border-edge bg-ink-900 p-5 scroll-mt-20">
      <div className="flex items-center gap-2.5 mb-1">
        <h2 className="text-section text-ink-50">Phone line</h2>
        {liveNumbers.length > 0 ? (
          <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-good-400/[0.12] text-good-300 border border-good-400/20 text-caption font-semibold">
            <span className="size-1.5 rounded-full bg-good-400" aria-hidden />
            Live
          </span>
        ) : pending ? (
          <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-arc-400/10 text-arc-300 border border-arc-400/25 text-caption font-semibold">
            In progress
          </span>
        ) : null}
      </div>
      <p className="text-caption text-ink-300 mb-4">
        The number your assistant answers. Novus provisions it with you —
        typically live within 1 business day.
      </p>

      {/* Existing numbers */}
      {phones.length > 0 && (
        <ul className="space-y-2 mb-4">
          {phones.map((p) => {
            const live = p.active && p.vapi_number_id;
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-md border border-edge p-3.5">
                <span className="text-body font-semibold text-ink-50" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmtPhone(p.e164, business.country)}
                </span>
                {live ? (
                  <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-good-400/[0.12] text-good-300 border border-good-400/20 text-caption font-semibold">
                    <span className="size-1.5 rounded-full bg-good-400" aria-hidden />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center h-[22px] px-2.5 rounded-full bg-warn-400/10 text-warn-300 border border-warn-400/20 text-caption font-semibold">
                    Wiring up
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Pending request: status timeline */}
      {pending ? (
        <div className="rounded-xl border border-edge bg-ink-950 p-5">
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const currentIdx = STEPS.indexOf(pending.status as (typeof STEPS)[number]);
              const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "next";
              return (
                <div key={s} className={`flex items-center ${i > 0 ? "flex-1" : ""}`}>
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={`h-0.5 flex-1 mx-2 rounded-full ${
                        state === "next" ? "bg-ink-800" : "bg-arc-400"
                      }`}
                    />
                  )}
                  <span className="flex flex-col items-center gap-1.5">
                    {state === "done" ? (
                      <span className="size-4 rounded-full bg-arc-400 grid place-items-center">
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path d="M2.5 6.5L5 9l4.5-5.5" stroke="#070B14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    ) : state === "current" ? (
                      <span className="size-2 rounded-full bg-arc-400 ring-4 ring-arc-400/20 animate-pulse" />
                    ) : (
                      <span className="size-2 rounded-full bg-ink-800 border border-edge-strong" />
                    )}
                    <span
                      className={
                        state === "current"
                          ? "text-card-title text-ink-50"
                          : "text-caption text-ink-300"
                      }
                    >
                      {STEP_LABEL[s]}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-caption text-ink-300 mt-4">
            {pending.kind === "new"
              ? `New ${countryName(pending.country)} number${pending.area_code ? ` · area ${pending.area_code}` : ""}`
              : `Porting ${fmtPhone(pending.existing_e164, business.country)}`}
            {" · requested "}
            {new Date(pending.created_at).toLocaleDateString()}
          </p>
          <p className="flex items-center gap-2 text-caption text-ink-300 mt-1.5">
            <OrbitSpinner size={12} />
            Novus is on it — typically live within 1 business day.
          </p>
        </div>
      ) : liveNumbers.length === 0 ? (
        /* No request yet: option tiles */
        <div>
          <div className="grid sm:grid-cols-2 gap-3">
            {(
              [
                ["new", "phone-ring", "Get a new local number", "We pick a number in your area — live in a day."],
                ["port", "phone", "Keep my current number", "Porting keeps the number customers know · 1–3 days."],
              ] as const
            ).map(([kind, icon, title, help]) => (
              <button
                key={kind}
                onClick={() => setMode(mode === kind ? null : kind)}
                aria-pressed={mode === kind}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  mode === kind
                    ? "border-arc-400/40 bg-white/[0.03]"
                    : "border-edge bg-ink-950 hover:border-edge-strong"
                }`}
              >
                <span className="inline-flex size-8 items-center justify-center rounded-md bg-white/[0.06] text-arc-300 mb-2.5">
                  <Icon name={icon} size={16} />
                </span>
                <span className="block text-card-title text-ink-50">{title}</span>
                <span className="block text-caption text-ink-300 mt-0.5">{help}</span>
              </button>
            ))}
          </div>

          {mode && (
            <div className="mt-3 rounded-xl border border-edge bg-ink-950 p-4 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ph-country" className="block text-caption text-ink-300 mb-1.5">
                    Country
                  </label>
                  <select
                    id="ph-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={inputCls}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {countryName(c)}
                      </option>
                    ))}
                  </select>
                </div>
                {mode === "new" ? (
                  <div>
                    <label htmlFor="ph-area" className="block text-caption text-ink-300 mb-1.5">
                      Preferred area code (optional)
                    </label>
                    <input
                      id="ph-area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. 973"
                      className={inputCls}
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="ph-existing" className="block text-caption text-ink-300 mb-1.5">
                      Your current number
                    </label>
                    <input
                      id="ph-existing"
                      value={existing}
                      onChange={(e) => setExisting(e.target.value)}
                      placeholder="+19735551234"
                      className={inputCls}
                    />
                  </div>
                )}
              </div>
              {err && <p className="text-caption text-bad-300">{err}</p>}
              <div className="flex gap-2">
                <button
                  onClick={submit}
                  disabled={busy}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-arc-400 text-ink-950 text-body font-semibold shadow-sheen hover:bg-arc-300 transition-colors disabled:opacity-60"
                >
                  {busy && <OrbitSpinner size={13} />}
                  {mode === "new" ? "Request number" : "Start port"}
                </button>
                <button
                  onClick={() => setMode(null)}
                  className="h-9 px-3 rounded-lg text-body text-ink-300 hover:text-ink-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
