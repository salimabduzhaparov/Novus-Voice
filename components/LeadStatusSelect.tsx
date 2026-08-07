"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LeadStatus } from "@/lib/types";

const OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const TONE: Record<LeadStatus, string> = {
  new: "border-arc-400/30 text-arc-300",
  contacted: "border-viz-teal-400/30 text-viz-teal-300",
  quoted: "border-viz-amber-400/30 text-viz-amber-300",
  won: "border-good-400/40 text-good-300",
  lost: "border-bad-400/30 text-bad-300",
};

export default function LeadStatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<LeadStatus>(status);
  const [busy, setBusy] = useState(false);

  return (
    <select
      value={current}
      disabled={busy}
      aria-label="Lead status"
      onChange={async (e) => {
        const next = e.target.value as LeadStatus;
        const prev = current;
        setCurrent(next); // optimistic
        setBusy(true);
        const { error } = await createClient()
          .from("leads")
          .update({ status: next })
          .eq("id", leadId);
        setBusy(false);
        if (error) {
          setCurrent(prev);
          return;
        }
        router.refresh();
      }}
      className={`h-8 rounded-lg bg-ink-950 border px-2.5 text-[13px] font-semibold transition-colors disabled:opacity-60 ${TONE[current]}`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
