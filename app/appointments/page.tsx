import { redirect } from "next/navigation";
import Link from "next/link";
import { getContext } from "@/lib/data";
import {
  fmtDay,
  fmtMoney,
  fmtPhone,
  fmtTime,
  localeOf,
} from "@/lib/format";
import type { Appointment, Lead } from "@/lib/types";
import AppShell from "@/components/AppShell";
import Onboarding from "@/components/Onboarding";
import ConfirmToggle from "@/components/ConfirmToggle";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  const { supabase, user, business, demoMode, minutesUsed } = await getContext();
  if (!user) redirect("/login");
  if (!business) return <Onboarding />;

  const loc = localeOf(business);
  const now = Date.now();

  const [{ data: apptsRaw }, { data: leadsRaw }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_sample", demoMode)
      .order("starts_at", { ascending: true })
      .limit(500),
    supabase
      .from("leads")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_sample", demoMode)
      .limit(500),
  ]);

  const appts = (apptsRaw ?? []) as Appointment[];
  const leadById = new Map(
    ((leadsRaw ?? []) as Lead[]).map((l) => [l.id, l]),
  );

  const upcoming = appts.filter((a) => new Date(a.starts_at).getTime() >= now);
  const past = appts
    .filter((a) => new Date(a.starts_at).getTime() < now)
    .reverse();

  // Group upcoming by local day
  const groups: { label: string; items: Appointment[] }[] = [];
  for (const a of upcoming) {
    const label = fmtDay(a.starts_at, loc);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(a);
    else groups.push({ label, items: [a] });
  }

  const Card = ({ a }: { a: Appointment }) => {
    const lead = a.lead_id ? leadById.get(a.lead_id) : null;
    return (
      <div className="rounded-md border border-edge bg-ink-900 p-4 flex flex-wrap items-center gap-x-4 gap-y-2 hover:border-edge-strong transition-colors">
        <div className="min-w-[92px]">
          <p className="text-body font-semibold text-ink-50" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmtTime(a.starts_at, loc)}
          </p>
          {a.ends_at && (
            <p className="text-caption text-ink-300" style={{ fontVariantNumeric: "tabular-nums" }}>
              until {fmtTime(a.ends_at, loc)}
            </p>
          )}
        </div>
        <div className="flex-1 min-w-[180px]">
          <p className="text-body font-medium text-ink-50">
            {lead?.name || "Booked caller"}
            {lead?.job_type && (
              <span className="text-ink-300 font-normal"> · {lead.job_type}</span>
            )}
          </p>
          <p className="text-caption text-ink-300">
            {a.address || lead?.address || "Address on file"}
            {lead?.phone && (
              <>
                {" · "}
                <a href={`tel:${lead.phone}`} className="text-arc-300 hover:text-arc-200">
                  {fmtPhone(lead.phone, business.country)}
                </a>
              </>
            )}
          </p>
        </div>
        {lead?.est_value_usd != null && (
          <span className="text-num text-ink-200" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmtMoney(lead.est_value_usd, loc)}
          </span>
        )}
        <ConfirmToggle apptId={a.id} confirmed={a.confirmed} />
        {lead?.call_id && (
          <Link
            href={`/calls/${lead.call_id}`}
            className="text-caption font-semibold text-arc-300 hover:text-arc-200"
          >
            Call →
          </Link>
        )}
      </div>
    );
  };

  return (
    <AppShell
      business={business}
      email={user.email ?? ""}
      demoMode={demoMode}
      minutesUsed={minutesUsed}
    >
      <PageHeader
        icon="calendar"
        title="Appointments"
        caption={`${upcoming.length} upcoming · ${past.length} past`}
      />

      {appts.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 px-6 rounded-xl border border-edge bg-ink-900">
          <h2 className="text-section text-ink-50">
            When a caller is ready to book, your receptionist takes the job —
            not a message.
          </h2>
          <p className="text-card-title text-ink-200 max-w-[42ch] mt-1.5">
            Date, time, and address captured and confirmed back to the caller.
            Your booked work shows up here without you touching your phone.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-overline uppercase text-ink-300 mb-2.5">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-body text-ink-300 rounded-md border border-edge bg-ink-900 p-4">
                Nothing on the calendar yet — the next booked call lands here.
              </p>
            ) : (
              <div className="space-y-5">
                {groups.map((g) => (
                  <div key={g.label}>
                    <p className="text-body font-semibold text-ink-50 mb-2">
                      {g.label}
                    </p>
                    <div className="space-y-2.5">
                      {g.items.map((a) => (
                        <Card key={a.id} a={a} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="text-overline uppercase text-ink-300 mb-2.5">
                Past
              </h2>
              <div className="space-y-2.5 opacity-80">
                {past.map((a) => (
                  <Card key={a.id} a={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
