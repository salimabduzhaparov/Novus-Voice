"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PLANS, isTrial } from "@/lib/plans";
import { Icon } from "@/components/Icons";
import { OrbitSpinner } from "@/components/Logo";
import type { Business } from "@/lib/types";

export default function PlanCards({ business }: { business: Business }) {
  const router = useRouter();
  const [annual, setAnnual] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function choose(key: string) {
    setBusy(key);
    setErr(null);
    const { error } = await createClient()
      .from("businesses")
      .update({ plan_key: key })
      .eq("id", business.id);
    setBusy(null);
    if (error) {
      setErr(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <section>
      {/* Toggle on the horizon */}
      <div className="relative flex justify-center mb-6">
        <span className="absolute inset-x-0 top-1/2 h-px bg-horizon" aria-hidden />
        <div className="relative inline-flex p-1 bg-ink-950 border border-edge rounded-full">
          {(["Monthly", "Annual"] as const).map((label) => {
            const active = annual === (label === "Annual");
            return (
              <button
                key={label}
                onClick={() => setAnnual(label === "Annual")}
                className={`px-4 py-1.5 text-body rounded-full transition-colors ${
                  active ? "bg-white/[0.06] text-ink-50" : "text-ink-300"
                }`}
              >
                {label}
                {label === "Annual" && (
                  <span className="text-caption text-good-300 ml-1.5">
                    2 months free
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 items-stretch">
        {PLANS.map((p) => {
          const current = business.plan_key === p.key;
          const price = annual ? Math.floor(p.annualUsd / 12) : p.monthlyUsd;
          const features = [
            `${p.includedMinutes} minutes / month${p.key === "fleet" ? " (pooled)" : ""}`,
            `${p.maxNumbers} phone number${p.maxNumbers > 1 ? "s" : ""}${p.maxBusinesses > 1 ? ` · ${p.maxBusinesses} businesses` : ""}`,
            "Missed-call SMS text-back",
            p.multiLanguage
              ? "Answers in 30+ languages"
              : "English answering",
            `${p.retentionDays}-day call recordings${p.whiteLabel ? " · white-label" : ""}`,
          ];
          return (
            <div
              key={p.key}
              className={`relative flex flex-col rounded-2xl p-5 border ${
                p.popular
                  ? "bg-ink-850 border-arc-400/40"
                  : "bg-ink-900 border-edge"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-arc-400 text-ink-950 text-overline uppercase font-semibold rounded-full px-2.5 py-1">
                  Most popular
                </span>
              )}
              <h3 className="text-section text-ink-50">{p.name}</h3>
              <p className="text-caption text-ink-300 mt-0.5">{p.tagline}</p>
              <p className="mt-3">
                <span className="text-stat text-ink-50">${price}</span>
                <span className="text-body text-ink-300"> /mo</span>
              </p>
              <p className="text-caption text-ink-300 h-4">
                {annual ? `$${p.annualUsd} billed annually` : "billed monthly"}
              </p>
              <ul className="mt-4 space-y-2 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body text-ink-200">
                    <span className="text-arc-300 mt-0.5 shrink-0">
                      <Icon name="check" size={14} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => choose(p.key)}
                disabled={current || busy != null}
                className={`mt-5 h-10 rounded-lg font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                  current
                    ? "bg-white/[0.06] border border-edge text-ink-300 opacity-60"
                    : "bg-arc-400 text-ink-950 shadow-sheen hover:bg-arc-300"
                } disabled:cursor-default`}
              >
                {busy === p.key && <OrbitSpinner size={14} />}
                {current
                  ? "Current plan"
                  : isTrial(business.plan_key)
                    ? `Start ${p.name}`
                    : `Switch to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>
      {err && <p className="text-caption text-bad-300 mt-3">{err}</p>}
      <p className="text-caption text-ink-300 mt-4 text-center">
        Prices in USD. Plan changes take effect immediately; Novus invoices
        while in-app checkout is being finished. No contracts — cancel any
        time.
      </p>
    </section>
  );
}
