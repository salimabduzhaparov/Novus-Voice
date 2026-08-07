"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearSampleData } from "@/lib/demo";
import { OrbitSpinner } from "@/components/Logo";

export default function SampleBanner({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <div className="px-4 lg:px-8 pt-4 max-w-[1320px] w-full mx-auto">
      <div className="rounded-md border border-arc-400/25 bg-arc-500/[0.07] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-body text-ink-200 flex-1 min-w-[240px]">
          <span className="font-semibold text-ink-50">Sample data.</span> This
          is Novus Voice after two busy weeks. Your real calls replace this the
          moment your number is live.
        </p>
        <div className="flex items-center gap-2">
          <a
            href="/settings#phone"
            className="inline-flex items-center h-8 px-3 rounded-lg bg-arc-400 text-ink-950 text-[13px] font-semibold shadow-sheen hover:bg-arc-300 transition-colors"
          >
            Connect my number
          </a>
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await clearSampleData(createClient(), businessId);
                router.refresh();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="inline-flex items-center gap-2 h-8 px-3 rounded-lg border border-edge text-[13px] font-semibold text-ink-200 hover:bg-white/[0.05] transition-colors disabled:opacity-50"
          >
            {busy && <OrbitSpinner size={13} />}
            Clear sample data
          </button>
        </div>
      </div>
    </div>
  );
}
