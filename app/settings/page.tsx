import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { fmtPhone } from "@/lib/format";
import AppShell from "@/components/AppShell";
import Onboarding from "@/components/Onboarding";
import SettingsForm from "@/components/SettingsForm";
import SampleControls from "@/components/SampleControls";
import SignOutButton from "@/components/SignOutButton";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

interface PhoneRow {
  id: string;
  e164: string;
  vapi_number_id: string | null;
  active: boolean;
}

export default async function SettingsPage() {
  const { supabase, user, business, demoMode } = await getContext();
  if (!user) redirect("/login");
  if (!business) return <Onboarding />;

  const { data: phonesRaw } = await supabase
    .from("phone_numbers")
    .select("id, e164, vapi_number_id, active")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });
  const phones = (phonesRaw ?? []) as PhoneRow[];

  return (
    <AppShell
      businessName={business.name}
      trade={business.trade}
      email={user.email ?? ""}
      demoMode={demoMode}
      businessId={business.id}
    >
      <PageHeader
        icon="gear"
        title="Settings"
        caption="Business profile, locale, and your phone line."
      />

      <div className="space-y-4 max-w-3xl">
        <SettingsForm business={business} />

        {/* Phone line */}
        <section
          id="phone"
          className="rounded-xl border border-edge bg-ink-900 p-5 scroll-mt-20"
        >
          <h2 className="text-section text-ink-50 mb-1">Phone line</h2>
          <p className="text-caption text-ink-300 mb-4">
            The number Novus Voice answers for this business.
          </p>
          {phones.length === 0 ? (
            <div className="rounded-md border border-dashed border-edge-strong p-4">
              <p className="text-body text-ink-200">
                No number connected yet.
              </p>
              <p className="text-caption text-ink-300 mt-1">
                Novus sets this up with you — we provision a number (or port
                your existing one), point it at your receptionist, and it goes
                live the same day.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {phones.map((p) => {
                const live = p.active && p.vapi_number_id;
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-md border border-edge p-3.5"
                  >
                    <span className="text-body font-semibold text-ink-50" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {fmtPhone(p.e164, business.country)}
                    </span>
                    {live ? (
                      <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-good-400/[0.12] text-good-300 border border-good-400/20 text-caption font-semibold">
                        <span className="size-1.5 rounded-full bg-good-400" aria-hidden />
                        Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-warn-400/10 text-warn-300 border border-warn-400/20 text-caption font-semibold">
                        Setup in progress
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Sample data */}
        <SampleControls business={business} demoMode={demoMode} />

        {/* Account */}
        <section className="rounded-xl border border-edge bg-ink-900 p-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-section text-ink-50">Account</h2>
            <p className="text-caption text-ink-300 mt-0.5">{user.email}</p>
          </div>
          <SignOutButton />
        </section>
      </div>
    </AppShell>
  );
}
