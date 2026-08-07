"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmToggle({
  apptId,
  confirmed,
}: {
  apptId: string;
  confirmed: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState(confirmed);
  const [busy, setBusy] = useState(false);

  return (
    <button
      onClick={async () => {
        const next = !state;
        setState(next); // optimistic
        setBusy(true);
        const { error } = await createClient()
          .from("appointments")
          .update({ confirmed: next })
          .eq("id", apptId);
        setBusy(false);
        if (error) {
          setState(!next);
          return;
        }
        router.refresh();
      }}
      disabled={busy}
      aria-pressed={state}
      className={`inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full text-caption font-semibold border transition-colors disabled:opacity-60 ${
        state
          ? "bg-good-400/[0.12] text-good-300 border-good-400/20"
          : "bg-warn-400/10 text-warn-300 border-warn-400/20 hover:bg-warn-400/[0.16]"
      }`}
    >
      {state ? (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 6.5L5 9l4.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Confirmed
        </>
      ) : (
        "Needs confirmation"
      )}
    </button>
  );
}
