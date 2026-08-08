import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import type { NumberRequest } from "@/lib/types";
import AppShell from "@/components/AppShell";
import Onboarding from "@/components/Onboarding";
import PageHeader from "@/components/PageHeader";
import SettingsForm from "@/components/SettingsForm";
import PhoneSetup from "@/components/PhoneSetup";
import LogoUploader from "@/components/LogoUploader";
import SampleControls from "@/components/SampleControls";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

interface PhoneRow {
  id: string;
  e164: string;
  vapi_number_id: string | null;
  active: boolean;
}

export default async function SettingsPage() {
  const { supabase, user, business, demoMode, minutesUsed } = await getContext();
  if (!user) redirect("/login");
  if (!business) return <Onboarding />;

  const [{ data: phonesRaw }, { data: requestsRaw }] = await Promise.all([
    supabase
      .from("phone_numbers")
      .select("id, e164, vapi_number_id, active")
      .eq("business_id", business.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("number_requests")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const phones = (phonesRaw ?? []) as PhoneRow[];
  const requests = (requestsRaw ?? []) as NumberRequest[];

  return (
    <AppShell
      business={business}
      email={user.email ?? ""}
      demoMode={demoMode}
      minutesUsed={minutesUsed}
    >
      <PageHeader
        icon="gear"
        title="Settings"
        caption="Business profile, branding, locale, and your phone line."
      />

      <div className="space-y-4 max-w-3xl">
        <PhoneSetup business={business} phones={phones} requests={requests} />
        <LogoUploader business={business} />
        <SettingsForm business={business} />
        <SampleControls business={business} demoMode={demoMode} />
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
