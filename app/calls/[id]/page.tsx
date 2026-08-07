import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getContext } from "@/lib/data";
import {
  fmtDateTime,
  fmtDuration,
  fmtMoney,
  fmtPhone,
  localeOf,
} from "@/lib/format";
import type { Call, Lead, Transcript } from "@/lib/types";
import AppShell from "@/components/AppShell";
import Onboarding from "@/components/Onboarding";
import { CallStatusBadge, OutcomeBadge, LeadBadge, UrgencyBadge } from "@/components/Badge";
import { ArcMark } from "@/components/Logo";
import CreateLeadButton from "@/components/CreateLeadButton";

export const dynamic = "force-dynamic";

export default async function CallDetail({
  params,
}: {
  params: { id: string };
}) {
  const { supabase, user, business, demoMode } = await getContext();
  if (!user) redirect("/login");
  if (!business) return <Onboarding />;

  const loc = localeOf(business);

  const { data: callRaw } = await supabase
    .from("calls")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  const call = callRaw as Call | null;
  if (!call) notFound();

  const [{ data: transcriptRaw }, { data: leadRaw }] = await Promise.all([
    supabase
      .from("transcripts")
      .select("*")
      .eq("call_id", call.id)
      .order("seconds_in", { ascending: true })
      .order("id", { ascending: true }),
    supabase.from("leads").select("*").eq("call_id", call.id).maybeSingle(),
  ]);
  const transcript = (transcriptRaw ?? []) as Transcript[];
  const lead = leadRaw as Lead | null;

  return (
    <AppShell
      businessName={business.name}
      trade={business.trade}
      email={user.email ?? ""}
      demoMode={demoMode}
      businessId={business.id}
    >
      <Link
        href="/calls"
        className="inline-flex items-center gap-1.5 text-body text-ink-300 hover:text-ink-50 mb-4 transition-colors"
      >
        ← All calls
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] items-start">
        {/* Transcript column */}
        <section className="rounded-xl border border-edge bg-ink-900">
          <header className="p-5 border-b border-edge-faint">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-section text-ink-50">
                {fmtPhone(call.from_number, business.country)}
              </h1>
              <CallStatusBadge status={call.status} />
              <OutcomeBadge outcome={call.outcome} />
            </div>
            <p className="text-caption text-ink-300 mt-1.5">
              {fmtDateTime(call.started_at, loc)} ·{" "}
              {fmtDuration(call.duration_seconds)}
              {call.is_sample && " · sample call"}
            </p>
            {call.recording_url && (
              <audio
                controls
                src={call.recording_url}
                className="mt-3 w-full h-10"
                preload="none"
              />
            )}
          </header>

          {call.summary && (
            <div className="px-5 py-4 border-b border-edge-faint">
              <p className="text-overline uppercase text-ink-300 mb-1">
                Summary
              </p>
              <p className="text-body text-ink-200">{call.summary}</p>
            </div>
          )}

          <div className="p-5 space-y-4">
            {transcript.length === 0 ? (
              <p className="text-body text-ink-300 py-6 text-center">
                No transcript for this call
                {call.status !== "completed"
                  ? " — it never connected."
                  : "."}
              </p>
            ) : (
              transcript.map((t) =>
                t.role === "system" ? (
                  <div key={t.id} className="relative flex items-center justify-center py-1">
                    <span className="absolute inset-x-0 h-px bg-horizon" aria-hidden />
                    <span className="relative bg-ink-900 px-2.5 text-[11px] uppercase tracking-[0.08em] text-ink-300">
                      {t.content}
                    </span>
                  </div>
                ) : t.role === "assistant" ? (
                  <div key={t.id} className="flex items-start gap-2.5 max-w-[85%]">
                    <ArcMark size={24} />
                    <div>
                      <p className="text-[11px] text-ink-300 mb-1">
                        Nova{t.seconds_in != null && ` · ${fmtDuration(t.seconds_in)}`}
                      </p>
                      <div className="bg-arc-500/[0.10] border border-arc-400/[0.14] rounded-xl rounded-tl-sm px-3.5 py-2.5 text-body text-ink-50">
                        {t.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={t.id} className="flex justify-end">
                    <div className="max-w-[85%]">
                      <p className="text-[11px] text-ink-300 mb-1 text-right">
                        Caller{t.seconds_in != null && ` · ${fmtDuration(t.seconds_in)}`}
                      </p>
                      <div className="bg-white/[0.05] border border-edge-faint rounded-xl rounded-tr-sm px-3.5 py-2.5 text-body text-ink-50">
                        {t.content}
                      </div>
                    </div>
                  </div>
                ),
              )
            )}
          </div>
        </section>

        {/* Side column */}
        <aside className="space-y-4">
          <section className="rounded-xl border border-edge bg-ink-900 p-5">
            <h2 className="text-card-title text-ink-200 mb-3">Captured lead</h2>
            {lead ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-body font-semibold text-ink-50">
                    {lead.name || "Unknown caller"}
                  </p>
                  <LeadBadge status={lead.status} />
                  <UrgencyBadge urgency={lead.urgency} />
                </div>
                {lead.job_type && (
                  <p className="text-body text-ink-200">{lead.job_type}</p>
                )}
                {lead.address && (
                  <p className="text-caption text-ink-300">{lead.address}</p>
                )}
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="block text-body text-arc-300 hover:text-arc-200"
                  >
                    {fmtPhone(lead.phone, business.country)}
                  </a>
                )}
                {lead.est_value_usd != null && (
                  <p className="text-body text-ink-200">
                    Est. value:{" "}
                    <span className="font-semibold text-ink-50">
                      {fmtMoney(lead.est_value_usd, loc)}
                    </span>
                  </p>
                )}
                {lead.notes && (
                  <p className="text-caption text-ink-300 border-t border-edge-faint pt-2.5">
                    {lead.notes}
                  </p>
                )}
                <Link
                  href="/leads"
                  className="inline-flex text-caption font-semibold text-arc-300 hover:text-arc-200"
                >
                  Open in Leads →
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-body text-ink-300 mb-3">
                  No lead was created from this call.
                </p>
                <CreateLeadButton
                  callId={call.id}
                  businessId={business.id}
                  phone={call.from_number}
                  isSample={call.is_sample}
                />
              </div>
            )}
          </section>

          <section className="rounded-xl border border-edge bg-ink-900 p-5">
            <h2 className="text-card-title text-ink-200 mb-3">Call details</h2>
            <dl className="space-y-2 text-body">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-300">From</dt>
                <dd className="text-ink-50">
                  {fmtPhone(call.from_number, business.country)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-300">To</dt>
                <dd className="text-ink-50">
                  {fmtPhone(call.to_number, business.country)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-300">Duration</dt>
                <dd className="text-ink-50" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmtDuration(call.duration_seconds)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-300">Started</dt>
                <dd className="text-ink-50">{fmtDateTime(call.started_at, loc)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
