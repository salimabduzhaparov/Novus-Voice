"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearSampleData, loadSampleData } from "@/lib/demo";
import { OrbitSpinner } from "@/components/Logo";
import type { Business } from "@/lib/types";

export default function SampleControls({
  business,
  demoMode,
}: {
  business: Business;
  demoMode: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"load" | "clear" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <section className="rounded-xl border border-edge bg-ink-900 p-5">
      <h2 className="text-section text-ink-50 mb-1">Sample data</h2>
      <p className="text-caption text-ink-300 mb-4">
        Two weeks of realistic activity for a roofing company — perfect for
        demos. It disappears from your stats the moment real calls arrive, and
        you can remove it any time.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={async () => {
            setBusy("load");
            setMsg(null);
            try {
              const r = await loadSampleData(createClient(), business);
              setMsg(
                `Loaded ${r.calls} calls, ${r.leads} leads, ${r.appointments} appointments.`,
              );
              router.refresh();
            } catch (e) {
              setMsg(e instanceof Error ? e.message : "Something went wrong.");
            } finally {
              setBusy(null);
            }
          }}
          disabled={busy != null}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/[0.06] border border-edge text-body font-semibold text-ink-50 hover:bg-white/[0.09] hover:border-edge-strong transition-colors disabled:opacity-50"
        >
          {busy === "load" && <OrbitSpinner size={14} />}
          {demoMode ? "Reload sample data" : "Load sample data"}
        </button>
        <button
          onClick={async () => {
            setBusy("clear");
            setMsg(null);
            try {
              await clearSampleData(createClient(), business.id);
              setMsg("Sample data removed.");
              router.refresh();
            } catch (e) {
              setMsg(e instanceof Error ? e.message : "Something went wrong.");
            } finally {
              setBusy(null);
            }
          }}
          disabled={busy != null}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-edge text-body font-semibold text-ink-200 hover:bg-white/[0.05] transition-colors disabled:opacity-50"
        >
          {busy === "clear" && <OrbitSpinner size={14} />}
          Clear sample data
        </button>
        {msg && <span className="text-caption text-ink-300">{msg}</span>}
      </div>
    </section>
  );
}
