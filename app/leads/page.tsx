import { redirect } from "next/navigation";
import Link from "next/link";
import { getContext } from "@/lib/data";
import { fmtDay, fmtMoney, fmtPhone, localeOf } from "@/lib/format";
import type { Lead, LeadStatus } from "@/lib/types";
import AppShell from "@/components/AppShell";
import Onboarding from "@/components/Onboarding";
import { UrgencyBadge } from "@/components/Badge";
import LeadStatusSelect from "@/components/LeadStatusSelect";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

const STATUS_ORDER: { key: LeadStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "quoted", label: "Quoted" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { supabase, user, business, demoMode, minutesUsed } = await getContext();
  if (!user) redirect("/login");
  if (!business) return <Onboarding />;

  const loc = localeOf(business);
  const filter = (searchParams.status ?? "all") as LeadStatus | "all";

  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_sample", demoMode)
    .order("created_at", { ascending: false })
    .limit(500);
  const all = (data ?? []) as Lead[];

  const counts = new Map<string, number>();
  for (const l of all) counts.set(l.status, (counts.get(l.status) ?? 0) + 1);
  const leads = filter === "all" ? all : all.filter((l) => l.status === filter);

  const pipelineValue = all
    .filter((l) => ["new", "contacted", "quoted"].includes(l.status))
    .reduce((a, l) => a + (l.est_value_usd ?? 0), 0);
  const wonValue = all
    .filter((l) => l.status === "won")
    .reduce((a, l) => a + (l.est_value_usd ?? 0), 0);

  return (
    <AppShell
      business={business}
      email={user.email ?? ""}
      demoMode={demoMode}
      minutesUsed={minutesUsed}
    >
      <PageHeader
        icon="users"
        title="Leads"
        caption={`${all.length} captured${
          pipelineValue > 0
            ? ` · ${fmtMoney(pipelineValue, loc)} in open pipeline`
            : ""
        }${wonValue > 0 ? ` · ${fmtMoney(wonValue, loc)} won` : ""}`}
      />

      {/* Status chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {STATUS_ORDER.map((s) => {
          const active = filter === s.key;
          const count =
            s.key === "all" ? all.length : (counts.get(s.key) ?? 0);
          return (
            <Link
              key={s.key}
              href={s.key === "all" ? "/leads" : `/leads?status=${s.key}`}
              aria-current={active ? "true" : undefined}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-white/[0.08] border-edge-strong text-ink-50"
                  : "border-edge text-ink-300 hover:text-ink-50 hover:border-edge-strong"
              }`}
            >
              {s.label}
              <span className="text-[11px] text-ink-300" style={{ fontVariantNumeric: "tabular-nums" }}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-6 rounded-xl border border-edge bg-ink-900">
          <h2 className="text-section text-ink-50">
            {filter === "all"
              ? "Not every caller books on the spot — none of them should vanish."
              : `No ${filter} leads right now.`}
          </h2>
          <p className="text-card-title text-ink-200 max-w-[42ch] mt-1.5">
            {filter === "all"
              ? "When someone wants a quote or leaves a message, Novus Voice captures who they are, what job they need, and the best number to call back. That list becomes this pipeline."
              : "Leads move between statuses as you work them — check another tab."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {leads.map((l) => (
            <li
              key={l.id}
              className="rounded-md border border-edge bg-ink-900 p-4 hover:border-edge-strong transition-colors"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="min-w-[160px]">
                  <p className="text-body font-semibold text-ink-50">
                    {l.name || "Unknown caller"}
                  </p>
                  <p className="text-caption text-ink-300">
                    {l.job_type || "—"}
                  </p>
                </div>
                <UrgencyBadge urgency={l.urgency} />
                <span className="text-num text-ink-200 ml-auto" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {l.est_value_usd != null ? fmtMoney(l.est_value_usd, loc) : ""}
                </span>
                <LeadStatusSelect leadId={l.id} status={l.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-caption text-ink-300">
                {l.phone && (
                  <a
                    href={`tel:${l.phone}`}
                    className="text-arc-300 hover:text-arc-200 font-medium"
                  >
                    {fmtPhone(l.phone, business.country)}
                  </a>
                )}
                {l.email && (
                  <a
                    href={`mailto:${l.email}`}
                    className="text-arc-300 hover:text-arc-200"
                  >
                    {l.email}
                  </a>
                )}
                {l.address && <span>{l.address}</span>}
                <span className="ml-auto">{fmtDay(l.created_at, loc)}</span>
                {l.call_id && (
                  <Link
                    href={`/calls/${l.call_id}`}
                    className="text-arc-300 hover:text-arc-200 font-medium"
                  >
                    View call →
                  </Link>
                )}
              </div>
              {l.notes && (
                <p className="text-caption text-ink-300 mt-2 border-t border-edge-faint pt-2">
                  {l.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
