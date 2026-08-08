import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { includedMinutes, isTrial, planLabel, trialDaysLeft, getPlan } from "@/lib/plans";
import AppShell from "@/components/AppShell";
import Onboarding from "@/components/Onboarding";
import PageHeader from "@/components/PageHeader";
import PlanCards from "@/components/PlanCards";
import { fmtDay, localeOf } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const { supabase, user, business, demoMode, minutesUsed } = await getContext();
  if (!user) redirect("/login");
  if (!business) return <Onboarding />;

  const loc = localeOf(business);
  const trial = isTrial(business.plan_key);
  const daysLeft = trialDaysLeft(business.trial_ends_at);
  const plan = getPlan(business.plan_key);
  const included = includedMinutes(business.plan_key);
  const minutesPct = Math.min(100, Math.round((minutesUsed / Math.max(1, included)) * 100));

  const { count: numberCount } = await supabase
    .from("phone_numbers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("active", true);
  const numbers = numberCount ?? 0;

  return (
    <AppShell
      business={business}
      email={user.email ?? ""}
      demoMode={demoMode}
      minutesUsed={minutesUsed}
    >
      <PageHeader
        icon="card"
        title="Billing"
        caption="Your plan, your usage, and what each tier unlocks."
      />

      {/* Current plan + usage */}
      <div id="usage" className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr] mb-8 scroll-mt-20">
        <div
          className={`rounded-2xl bg-ink-900 border p-5 ${
            trial ? "border-warn-400/40" : "border-edge"
          }`}
        >
          <div className="flex items-center gap-2">
            <p className="text-overline uppercase text-ink-300">Current plan</p>
            {trial && daysLeft != null && (
              <span className="text-overline uppercase text-warn-300 bg-warn-400/10 border border-warn-400/30 rounded-full px-2 py-0.5">
                Trial · {daysLeft} day{daysLeft === 1 ? "" : "s"} left
              </span>
            )}
          </div>
          <p className="text-section text-ink-50 mt-2">{planLabel(business.plan_key)}</p>
          <p className="mt-1">
            <span className="text-stat text-ink-50">
              {trial ? "$0" : `$${plan.monthlyUsd}`}
            </span>
            <span className="text-body text-ink-300"> /mo</span>
          </p>
          <p className="text-caption text-ink-300 mt-1.5">
            {trial && business.trial_ends_at
              ? `Trial ends ${fmtDay(business.trial_ends_at, loc)} — pick a plan below to keep your assistant answering.`
              : "Billed monthly in USD · invoiced by Novus while checkout is being finished."}
          </p>
        </div>

        <Meter
          label="Minutes this month"
          value={minutesUsed}
          max={included}
          pct={minutesPct}
          unit="min"
        />
        <Meter
          label="Phone numbers"
          value={numbers}
          max={trial ? 1 : plan.maxNumbers}
          pct={Math.min(100, Math.round((numbers / Math.max(1, trial ? 1 : plan.maxNumbers)) * 100))}
          unit=""
        />
      </div>

      <PlanCards business={business} />

      {/* FAQ */}
      <section className="mt-8 max-w-3xl">
        <h2 className="text-overline uppercase text-ink-300 mb-2.5">
          Fair-billing rules
        </h2>
        <div className="rounded-xl bg-ink-900 border border-edge divide-y divide-edge">
          {[
            [
              "What happens if I run out of minutes?",
              "You get an alert at 80% and 100%. At the cap the assistant pauses and calls forward straight to your phone — you never lose a call, and we never auto-charge you by default.",
            ],
            [
              "Can I change plans any time?",
              "Yes — upgrades apply immediately, downgrades at the next cycle. No contracts, no cancellation fees.",
            ],
            [
              "What happens when my trial ends?",
              "Your assistant pauses, but call forwarding to your phone stays on for 7 more days and your data is kept for 30 — one click restores everything.",
            ],
          ].map(([q, a]) => (
            <details key={q} className="group">
              <summary className="px-5 py-4 text-body text-ink-50 cursor-pointer list-none flex items-center justify-between gap-3">
                {q}
                <span className="text-ink-300 transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="px-5 pb-4 text-body text-ink-300">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Meter({
  label,
  value,
  max,
  pct,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  pct: number;
  unit: string;
}) {
  return (
    <div className="rounded-2xl bg-ink-900 border border-edge p-5">
      <p className="text-overline uppercase text-ink-300">{label}</p>
      <p className="mt-2">
        <span className="text-stat text-ink-50" style={{ fontVariantNumeric: "tabular-nums" }}>
          {value}
        </span>
        <span className="text-body text-ink-300"> / {max} {unit}</span>
      </p>
      <div className="relative h-2 rounded-full bg-ink-800 mt-3">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-meridian"
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct >= 90 && (
        <p className="text-caption text-warn-300 mt-2">Approaching limit</p>
      )}
    </div>
  );
}
