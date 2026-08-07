import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Business, Call, Lead } from "@/lib/types";
import SignOutButton from "@/components/SignOutButton";
import Onboarding from "@/components/Onboarding";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS guarantees this only ever returns businesses this user owns.
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true });

  const business = (businesses ?? [])[0] as Business | undefined;

  if (!business) {
    return (
      <Shell email={user.email ?? ""}>
        <Onboarding />
      </Shell>
    );
  }

  const [{ data: calls }, { data: leads }] = await Promise.all([
    supabase
      .from("calls")
      .select("*")
      .eq("business_id", business.id)
      .order("started_at", { ascending: false })
      .limit(25),
    supabase
      .from("leads")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const callList = (calls ?? []) as Call[];
  const leadList = (leads ?? []) as Lead[];

  const booked = callList.filter((c) => c.outcome === "booked").length;
  const missed = callList.filter((c) => c.status === "missed").length;
  const minutes = Math.round(
    callList.reduce((a, c) => a + (c.duration_seconds ?? 0), 0) / 60,
  );

  return (
    <Shell email={user.email ?? ""} business={business.name}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Calls answered" value={callList.length} />
        <Stat label="Jobs booked" value={booked} tone="good" />
        <Stat label="New leads" value={leadList.length} tone="accent" />
        <Stat label="Talk minutes" value={minutes} />
      </div>

      <Section title="Recent leads">
        {leadList.length === 0 ? (
          <Empty>No leads yet. They appear here after the first call.</Empty>
        ) : (
          <div className="divide-y divide-edge">
            {leadList.map((l) => (
              <div key={l.id} className="py-3 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {l.name || l.phone || "Unknown caller"}
                    {l.urgency === "emergency" && (
                      <span className="ml-2 text-xs text-bad">urgent</span>
                    )}
                  </div>
                  <div className="text-muted text-sm truncate">
                    {l.job_type || "—"}
                    {l.address ? ` · ${l.address}` : ""}
                  </div>
                </div>
                <span className="text-xs text-muted whitespace-nowrap">
                  {new Date(l.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Recent calls">
        {callList.length === 0 ? (
          <Empty>
            No calls yet. Point your Vapi assistant at{" "}
            <code className="text-accent">/api/vapi</code> and call your number.
          </Empty>
        ) : (
          <div className="divide-y divide-edge">
            {callList.map((c) => (
              <div key={c.id} className="py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">
                    {c.from_number || "Unknown"}
                  </span>
                  <span className="text-xs text-muted">
                    {c.outcome.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted ml-auto">
                    {c.duration_seconds ? `${c.duration_seconds}s` : "—"}
                  </span>
                </div>
                {c.summary && (
                  <p className="text-muted text-sm mt-1">{c.summary}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </Shell>
  );
}

function Shell({
  children,
  email,
  business,
}: {
  children: React.ReactNode;
  email: string;
  business?: string;
}) {
  return (
    <main className="min-h-screen">
      <header className="border-b border-edge">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-3">
          <span className="font-semibold tracking-tight">Novus Voice</span>
          {business && (
            <span className="text-muted text-sm">· {business}</span>
          )}
          <span className="ml-auto text-muted text-sm hidden sm:inline">
            {email}
          </span>
          <SignOutButton />
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-5 py-8">{children}</div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "good" | "accent";
}) {
  const color =
    tone === "good" ? "text-good" : tone === "accent" ? "text-accent" : "text-white";
  return (
    <div className="rounded-xl bg-panel border border-edge p-4">
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-muted text-xs mt-0.5">{label}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
        {title}
      </h2>
      <div className="rounded-xl bg-panel border border-edge px-4">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted text-sm py-6">{children}</p>;
}
