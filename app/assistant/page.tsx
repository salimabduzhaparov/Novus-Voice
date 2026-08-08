import { redirect } from "next/navigation";
import { getContext } from "@/lib/data";
import { parseConfig } from "@/lib/assistant";
import AppShell from "@/components/AppShell";
import Onboarding from "@/components/Onboarding";
import PageHeader from "@/components/PageHeader";
import AssistantStudio from "@/components/AssistantStudio";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const { user, business, demoMode, minutesUsed } = await getContext();
  if (!user) redirect("/login");
  if (!business) return <Onboarding />;

  const config = parseConfig(business, business.assistant_config);

  return (
    <AppShell
      business={business}
      email={user.email ?? ""}
      demoMode={demoMode}
      minutesUsed={minutesUsed}
    >
      <PageHeader
        icon="bot"
        title="Assistant Studio"
        caption="What your receptionist says on every call — test it live below."
      />
      <AssistantStudio business={business} initial={config} />
    </AppShell>
  );
}
