"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OrbitSpinner } from "@/components/Logo";

export default function CreateLeadButton({
  callId,
  businessId,
  phone,
  isSample,
}: {
  callId: string;
  businessId: string;
  phone: string | null;
  isSample: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={async () => {
          setBusy(true);
          setErr(null);
          const { error } = await createClient().from("leads").insert({
            business_id: businessId,
            call_id: callId,
            phone,
            status: "new",
            is_sample: isSample,
          });
          setBusy(false);
          if (error) {
            setErr(error.message);
            return;
          }
          router.refresh();
        }}
        disabled={busy}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/[0.06] border border-edge text-body font-semibold text-ink-50 hover:bg-white/[0.09] hover:border-edge-strong transition-colors disabled:opacity-50"
      >
        {busy && <OrbitSpinner size={14} />}
        Create lead from this call
      </button>
      {err && <p className="text-caption text-bad-300 mt-2">{err}</p>}
    </div>
  );
}
