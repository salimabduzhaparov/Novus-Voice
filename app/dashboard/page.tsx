import { redirect } from "next/navigation";
import Link from "next/link";
import { getContext, windowFromParam } from "@/lib/data";
import {
  fmtDateTime,
  fmtDuration,
  fmtMoney,
  fmtPhone,
  isAfterHours,
  lastNDays,
  localeOf,
  localParts,
  pctDelta,
} from "@/lib/format";
import type { Appointment, Call, Lead } from "@/lib/types";
import AppShell from "@/components/AppShell";
import Onboarding from "@/components/Onboarding";
import { StatTile, StatTileCta } from "@/components/StatTile";
import { VolumeChart, OutcomesBar, type DayPoint } from "@/components/charts";
import { OutcomeBadge } from "@/components/Badge";

export const dynamic = "force-dynamic";

const OUTCOME_META: Record<string, { label: string; color: string; hover: string }> = {
  booked: { label: "Booked", color: "#07AC6C", hover: "#2FBD7C" },
  quote_requested: { label: "Quote requested", color: "#4191F4", hover: "#6FAEFF" },
  message_taken: { label: "Message taken", color: "#BF8305", hover: "#D99C33" },
  transferred: { label: "Transferred", color: "#8F7FE5", hover: "#9C8CF4" },
  spam: { label: "Spam blocked", color: "#55617B", hover: "#75829C" },
  no_outcome: { label: "No outcome", color: "#38445C", hover: "#55617B" },
};

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { w?: string };
}) {
  const { supabase, user, business, demoMode } = await getContext();
  if (!user) redirect("/login");
  if (!business) return <Onboarding />;

  const loc = localeOf(business);
  const w = windowFromParam(searchParams.w);
  const now = Date.now();
  const windowStart = new Date(now - w * 86400_000).toISOString();
  const doubleStart = new Date(now - 2 * w * 86400_000).toISOString();

  const [
    { data: callsRaw },
    { data: leadsRaw },
    { data: apptsRaw },
    { count: upcomingCount },
  ] = await Promise.all([
    supabase
      .from("calls")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_sample", demoMode)
      .gte("started_at", doubleStart)
      .order("started_at", { ascending: false })
      .limit(1000),
    supabase
      .from("leads")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_sample", demoMode)
      .gte("created_at", doubleStart)
      .limit(1000),
    supabase
      .from("appointments")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_sample", demoMode)
      .gte("created_at", doubleStart)
      .limit(1000),
    // Upcoming is about starts_at, not when it was booked — no created_at window.
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("is_sample", demoMode)
      .gte("starts_at", new Date(now).toISOString()),
  ]);

  const calls = (callsRaw ?? []) as Call[];
  const leads = (leadsRaw ?? []) as Lead[];
  const appts = (apptsRaw ?? []) as Appointment[];

  const inWindow = (iso: string) => iso >= windowStart;
  const cur = {
    calls: calls.filter((c) => inWindow(c.started_at)),
    leads: leads.filter((l) => inWindow(l.created_at)),
    appts: appts.filter((a) => inWindow(a.created_at)),
  };
  const prev = {
    calls: calls.filter((c) => !inWindow(c.started_at)),
    leads: leads.filter((l) => !inWindow(l.created_at)),
    appts: appts.filter((a) => !inWindow(a.created_at)),
  };

  const answered = cur.calls.filter((c) => c.status === "completed");
  const answeredPrev = prev.calls.filter((c) => c.status === "completed");
  const answerRate =
    cur.calls.length > 0
      ? Math.round((answered.length / cur.calls.length) * 100)
      : null;
  const afterHoursAnswered = answered.filter((c) =>
    isAfterHours(c.started_at, loc.timezone),
  ).length;
  const urgent = cur.leads.filter((l) => l.urgency === "emergency").length;
  const upcoming = upcomingCount ?? 0;

  const booked = cur.appts.length;
  const bookedPrev = prev.appts.length;
  const avg = business.avg_job_value;
  const recovered = avg != null ? booked * avg : null;

  // After-hours booked value: appointment → lead → source call
  const leadById = new Map(leads.map((l) => [l.id, l]));
  const callById = new Map(calls.map((c) => [c.id, c]));
  const afterHoursBooked = cur.appts.filter((a) => {
    const lead = a.lead_id ? leadById.get(a.lead_id) : null;
    const call = lead?.call_id ? callById.get(lead.call_id) : null;
    return call ? isAfterHours(call.started_at, loc.timezone) : false;
  }).length;

  // ---- chart buckets (business-timezone calendar days, DST-safe) ----------
  const dayKeys: DayPoint[] = lastNDays(w, loc).map((d) => ({
    ...d,
    count: 0,
  }));
  const bucket = new Map(dayKeys.map((d) => [d.key, d]));
  for (const c of cur.calls) {
    const { dayKey } = localParts(c.started_at, loc.timezone);
    const b = bucket.get(dayKey);
    if (b) b.count += 1;
  }

  const outcomeCounts = new Map<string, number>();
  for (const c of cur.calls) {
    outcomeCounts.set(c.outcome, (outcomeCounts.get(c.outcome) ?? 0) + 1);
  }
  const segments = Object.entries(OUTCOME_META).map(([key, meta]) => ({
    key,
    label: meta.label,
    count: outcomeCounts.get(key) ?? 0,
    color: meta.color,
    hover: meta.hover,
    href: `/calls?outcome=${key}&w=${w}`,
  }));

  const recent = cur.calls.slice(0, 6);
  const empty = cur.calls.length === 0;

  return (
    <AppShell
      businessName={business.name}
      trade={business.trade}
      email={user.email ?? ""}
      demoMode={demoMode}
      businessId={business.id}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-page-title text-ink-50">Dashboard</h1>
          <p className="text-caption text-ink-300 mt-0.5">
            {business.name} · last {w} days
          </p>
        </div>
        <div
          className="inline-flex items-center h-9 rounded-lg bg-ink-850 border border-edge p-0.5"
          role="group"
          aria-label="Time window"
        >
          {[7, 14, 30].map((opt) => (
            <Link
              key={opt}
              href={`/dashboard?w=${opt}`}
              aria-current={w === opt ? "true" : undefined}
              className={`h-8 px-3.5 inline-flex items-center rounded-[6px] text-[13px] font-semibold transition-colors ${
                w === opt
                  ? "bg-white/[0.08] text-ink-50"
                  : "text-ink-300 hover:text-ink-50"
              }`}
            >
              {opt}d
            </Link>
          ))}
        </div>
      </div>

      {empty ? (
        <EmptyDashboard />
      ) : (
        <>
          {/* Headline tiles */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-6">
            <StatTile
              label="Calls answered"
              value={String(answered.length)}
              sub={
                answerRate != null
                  ? `${answerRate}% answer rate · ${afterHoursAnswered} after hours`
                  : undefined
              }
              delta={pctDelta(answered.length, answeredPrev.length)}
              href={`/calls?w=${w}`}
            />
            <StatTile
              label="Leads captured"
              value={String(cur.leads.length)}
              sub={urgent > 0 ? `${urgent} marked emergency` : "From calls in this period"}
              delta={pctDelta(cur.leads.length, prev.leads.length)}
              href="/leads"
            />
            <StatTile
              label="Jobs booked"
              value={String(booked)}
              sub={`${upcoming} upcoming`}
              delta={pctDelta(booked, bookedPrev)}
              href="/appointments"
            />
            {recovered != null && avg != null ? (
              <StatTile
                label="Est. revenue recovered"
                value={fmtMoney(recovered, loc)}
                sub={`${booked} jobs × ${fmtMoney(avg, loc)} avg job`}
                estimated
                href="/appointments"
              />
            ) : (
              <StatTileCta
                label="Est. revenue recovered"
                message="Set your average job value to see what your receptionist is earning you."
                actionLabel="Set it in Settings"
                href="/settings"
              />
            )}
          </div>

          {/* After-hours callout */}
          {afterHoursBooked > 0 && avg != null && (
            <div className="rounded-md border border-good-400/25 bg-good-400/[0.07] px-4 py-3 mb-6 flex items-center gap-3">
              <span className="size-2 rounded-full bg-good-400 shrink-0" aria-hidden />
              <p className="text-body text-ink-200">
                <span className="font-semibold text-ink-50">
                  {afterHoursBooked} {afterHoursBooked === 1 ? "job" : "jobs"} booked
                  outside business hours
                </span>{" "}
                — an estimated {fmtMoney(afterHoursBooked * avg, loc)} captured
                while you were closed.
              </p>
            </div>
          )}

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] mb-6">
            <VolumeChart
              days={dayKeys}
              title="Call volume"
              totalNote={`${cur.calls.length} calls · last ${w} days`}
            />
            <OutcomesBar
              segments={segments}
              title="What happened on your calls"
              totalNote={`${cur.calls.length} calls`}
            />
          </div>

          {/* Recent calls */}
          <section className="rounded-xl border border-edge bg-ink-900 overflow-clip">
            <div className="h-14 px-5 flex items-center justify-between">
              <h2 className="text-section text-ink-50">Recent calls</h2>
              <Link
                href={`/calls?w=${w}`}
                className="text-caption font-semibold text-arc-300 hover:text-arc-200"
              >
                View all →
              </Link>
            </div>
            <ul className="border-t border-edge-faint">
              {recent.map((c) => (
                <li key={c.id} className="border-b border-edge-faint last:border-0">
                  <Link
                    href={`/calls/${c.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="min-w-[150px]">
                      <p className="text-body font-medium text-ink-50">
                        {fmtPhone(c.from_number, business.country)}
                      </p>
                      <p className="text-caption text-ink-300">
                        {fmtDateTime(c.started_at, loc)}
                      </p>
                    </div>
                    <OutcomeBadge outcome={c.outcome} />
                    <span className="text-num text-ink-300 ml-auto" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {fmtDuration(c.duration_seconds)}
                    </span>
                    {c.summary && (
                      <p className="w-full text-caption text-ink-300 truncate">
                        {c.summary}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </AppShell>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 rounded-xl border border-edge bg-ink-900">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden>
        <path
          d="M 28 8 A 20 20 0 1 0 48 28"
          stroke="rgba(199,214,240,0.16)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="46" cy="15" r="4" fill="#6FAEFF" />
      </svg>
      <h2 className="text-section text-ink-50 mt-4">
        Your receptionist is hired. She just needs a phone to answer.
      </h2>
      <p className="text-card-title text-ink-200 max-w-[42ch] mt-1.5">
        Home-services businesses miss roughly one in four calls — and most
        callers who hit voicemail simply ring the next company on the list.
        Novus Voice answers every call in seconds and shows you the revenue
        here.
      </p>
      <a
        href="/settings#phone"
        className="mt-5 inline-flex items-center h-10 px-5 rounded-lg bg-arc-400 text-ink-950 font-semibold shadow-sheen hover:bg-arc-300 transition-colors"
      >
        Connect my number
      </a>
    </div>
  );
}
