import { redirect } from "next/navigation";
import Link from "next/link";
import { getContext, windowFromParam } from "@/lib/data";
import {
  fmtDateTime,
  fmtDuration,
  fmtPhone,
  localeOf,
} from "@/lib/format";
import type { Call, CallOutcome, CallStatus } from "@/lib/types";
import AppShell from "@/components/AppShell";
import Onboarding from "@/components/Onboarding";
import { CallStatusBadge, OutcomeBadge } from "@/components/Badge";

export const dynamic = "force-dynamic";

const OUTCOMES: { value: string; label: string }[] = [
  { value: "", label: "All outcomes" },
  { value: "booked", label: "Booked" },
  { value: "quote_requested", label: "Quote requested" },
  { value: "message_taken", label: "Message taken" },
  { value: "transferred", label: "Transferred" },
  { value: "spam", label: "Spam blocked" },
  { value: "no_outcome", label: "No outcome" },
];

const STATUSES: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "completed", label: "Answered" },
  { value: "missed", label: "Missed" },
  { value: "failed", label: "Failed" },
];

export default async function CallsPage({
  searchParams,
}: {
  searchParams: { w?: string; status?: string; outcome?: string; q?: string };
}) {
  const { supabase, user, business, demoMode } = await getContext();
  if (!user) redirect("/login");
  if (!business) return <Onboarding />;

  const loc = localeOf(business);
  const w = windowFromParam(searchParams.w);
  const windowStart = new Date(Date.now() - w * 86400_000).toISOString();
  const status = (searchParams.status ?? "") as CallStatus | "";
  const outcome = (searchParams.outcome ?? "") as CallOutcome | "";
  const q = (searchParams.q ?? "").trim();

  let query = supabase
    .from("calls")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_sample", demoMode)
    .gte("started_at", windowStart)
    .order("started_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (outcome) query = query.eq("outcome", outcome);
  if (q) {
    const safe = q.replace(/[%_,()]/g, "").trim();
    const digits = q.replace(/\D/g, "");
    const parts: string[] = [];
    if (safe) parts.push(`summary.ilike.%${safe}%`);
    // Numbers are stored as E.164 (+19085550142) but displayed formatted —
    // match on the digits so a copied "(908) 555-0142" still finds the call.
    if (digits.length >= 4) parts.push(`from_number.ilike.%${digits}%`);
    else if (safe) parts.push(`from_number.ilike.%${safe}%`);
    if (parts.length > 0) query = query.or(parts.join(","));
  }

  const { data } = await query;
  const calls = (data ?? []) as Call[];

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
          <h1 className="text-page-title text-ink-50">Calls</h1>
          <p className="text-caption text-ink-300 mt-0.5">
            {calls.length} {calls.length === 1 ? "call" : "calls"} · last {w}{" "}
            days
          </p>
        </div>
      </div>

      {/* Filters — plain GET form, server-rendered */}
      <form
        method="GET"
        className="rounded-xl border border-edge bg-ink-900 p-3 mb-4 flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="w" value={String(w)} />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search number or summary…"
          className="h-9 flex-1 min-w-[180px] rounded-lg bg-ink-950 border border-edge px-3 text-body text-ink-50 placeholder:text-ink-300 focus:border-arc-400"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-9 rounded-lg bg-ink-950 border border-edge px-2.5 text-body text-ink-200"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          name="outcome"
          defaultValue={outcome}
          className="h-9 rounded-lg bg-ink-950 border border-edge px-2.5 text-body text-ink-200"
        >
          {OUTCOMES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 px-4 rounded-lg bg-white/[0.06] border border-edge text-body font-semibold text-ink-50 hover:bg-white/[0.09] transition-colors"
        >
          Filter
        </button>
        {(status || outcome || q) && (
          <Link
            href={`/calls?w=${w}`}
            className="h-9 px-3 inline-flex items-center rounded-lg text-body text-ink-300 hover:text-ink-50"
          >
            Clear
          </Link>
        )}
      </form>

      {calls.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-6 rounded-xl border border-edge bg-ink-900">
          <h2 className="text-section text-ink-50">
            {q || status || outcome
              ? "No calls match these filters."
              : "Every call will land here."}
          </h2>
          <p className="text-card-title text-ink-200 max-w-[40ch] mt-1.5">
            {q || status || outcome
              ? "Try widening the time window or clearing the filters."
              : "Answered in two rings, transcribed word for word, tagged with what happened — even the 10pm emergency while your phone was on the truck seat."}
          </p>
          {(q || status || outcome) && (
            <Link
              href={`/calls?w=${w}`}
              className="mt-4 text-body font-semibold text-arc-300 hover:text-arc-200"
            >
              Clear filters →
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-edge bg-ink-900 overflow-clip">
            <table className="w-full">
              <thead>
                <tr className="h-10 bg-white/[0.02] border-b border-edge text-left">
                  {["Caller", "When", "Status", "Outcome", "Duration"].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`text-overline uppercase text-ink-300 font-semibold px-3 ${
                          i === 0 ? "pl-5" : ""
                        } ${h === "Duration" ? "text-right pr-5" : ""}`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => (
                  <tr
                    key={c.id}
                    className="h-12 border-b border-edge-faint last:border-0 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-3 pl-5">
                      <Link href={`/calls/${c.id}`} className="block">
                        <span className="text-body font-medium text-ink-50">
                          {fmtPhone(c.from_number, business.country)}
                        </span>
                        {c.summary && (
                          <span className="block text-caption text-ink-300 truncate max-w-[360px]">
                            {c.summary}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-3 text-num text-ink-200 whitespace-nowrap">
                      {fmtDateTime(c.started_at, loc)}
                    </td>
                    <td className="px-3">
                      <CallStatusBadge status={c.status} />
                    </td>
                    <td className="px-3">
                      <OutcomeBadge outcome={c.outcome} />
                    </td>
                    <td
                      className="px-3 pr-5 text-right text-num text-ink-200"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {fmtDuration(c.duration_seconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden space-y-2.5">
            {calls.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/calls/${c.id}`}
                  className="block rounded-md border border-edge bg-ink-900 p-4 space-y-1.5 hover:border-edge-strong transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body font-medium text-ink-50">
                      {fmtPhone(c.from_number, business.country)}
                    </span>
                    <OutcomeBadge outcome={c.outcome} />
                  </div>
                  <p className="text-caption text-ink-300">
                    {fmtDateTime(c.started_at, loc)} ·{" "}
                    {fmtDuration(c.duration_seconds)}
                  </p>
                  {c.summary && (
                    <p className="text-caption text-ink-300 line-clamp-2">
                      {c.summary}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </AppShell>
  );
}
