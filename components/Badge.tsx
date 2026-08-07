import type { CallOutcome, CallStatus, LeadStatus } from "@/lib/types";

const base =
  "inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-caption font-semibold whitespace-nowrap border";

export function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  switch (outcome) {
    case "booked":
      return (
        <span className={`${base} bg-viz-green-400/[0.14] text-viz-green-300 border-viz-green-400/20`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <rect x="1" y="2" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M1 4.5h10" stroke="currentColor" strokeWidth="1.3" />
            <path d="M4 7.5l1.5 1.5L8.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Booked
        </span>
      );
    case "quote_requested":
      return (
        <span className={`${base} bg-arc-400/[0.14] text-arc-300 border-arc-400/20`}>
          <span className="size-1.5 rounded-full bg-arc-500" aria-hidden />
          Quote requested
        </span>
      );
    case "message_taken":
      return (
        <span className={`${base} bg-viz-amber-400/[0.14] text-viz-amber-300 border-viz-amber-400/20`}>
          <span className="size-1.5 rounded-full bg-viz-amber-400" aria-hidden />
          Message taken
        </span>
      );
    case "transferred":
      return (
        <span className={`${base} bg-viz-violet-400/[0.14] text-viz-violet-300 border-viz-violet-400/20`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path d="M2 8L8 2M8 2H3.5M8 2v4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Transferred
        </span>
      );
    case "spam":
      return (
        <span className={`${base} bg-white/[0.05] text-ink-200 border-edge`}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="6" cy="6" r="4.6" stroke="currentColor" strokeWidth="1.3" />
            <path d="M2.8 2.8l6.4 6.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Spam blocked
        </span>
      );
    default:
      return (
        <span className={`${base} bg-transparent text-ink-300 border-edge-strong`}>
          <span className="size-1.5 rounded-full ring-1 ring-inset ring-ink-400" aria-hidden />
          No outcome
        </span>
      );
  }
}

export function CallStatusBadge({ status }: { status: CallStatus }) {
  if (status === "completed")
    return (
      <span className={`${base} bg-good-400/[0.12] text-good-300 border-good-400/20`}>
        <span className="size-1.5 rounded-full bg-good-400" aria-hidden />
        Answered
      </span>
    );
  if (status === "missed" || status === "failed")
    return (
      <span className={`${base} bg-bad-400/10 text-bad-300 border-bad-400/15`}>
        <span className="size-1.5 rounded-full bg-bad-400" aria-hidden />
        {status === "missed" ? "Missed" : "Failed"}
      </span>
    );
  return (
    <span className={`${base} bg-arc-400/[0.14] text-arc-300 border-arc-400/20`}>
      <span className="size-1.5 rounded-full bg-arc-400 animate-pulse" aria-hidden />
      {status === "ringing" ? "Ringing" : "In progress"}
    </span>
  );
}

export function LeadBadge({ status }: { status: LeadStatus }) {
  switch (status) {
    case "new":
      return (
        <span className={`${base} bg-arc-400/[0.14] text-arc-300 border-arc-400/20`}>
          <span className="size-1.5 rounded-full bg-arc-400" aria-hidden />
          New
        </span>
      );
    case "contacted":
      return (
        <span className={`${base} bg-viz-teal-400/[0.14] text-viz-teal-300 border-viz-teal-400/20`}>
          <span className="size-1.5 rounded-full bg-viz-teal-400" aria-hidden />
          Contacted
        </span>
      );
    case "quoted":
      return (
        <span className={`${base} bg-viz-amber-400/[0.14] text-viz-amber-300 border-viz-amber-400/20`}>
          <span className="size-1.5 rounded-full bg-viz-amber-400" aria-hidden />
          Quoted
        </span>
      );
    case "won":
      return (
        <span className={`${base} bg-good-400 text-ink-950 border-transparent`}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 6.5L5 9l4.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Won
        </span>
      );
    case "lost":
      return (
        <span className={`${base} bg-bad-400/10 text-bad-300 border-bad-400/15`}>
          <span className="size-1.5 rounded-full bg-bad-400/70" aria-hidden />
          Lost
        </span>
      );
  }
}

export function UrgencyBadge({ urgency }: { urgency: string | null }) {
  if (urgency === "emergency")
    return (
      <span className={`${base} bg-bad-400/10 text-bad-300 border-bad-400/20`}>
        Emergency
      </span>
    );
  if (urgency === "this_week")
    return (
      <span className={`${base} bg-warn-400/10 text-warn-300 border-warn-400/20`}>
        This week
      </span>
    );
  if (urgency === "flexible")
    return (
      <span className={`${base} bg-white/[0.05] text-ink-200 border-edge`}>
        Flexible
      </span>
    );
  return null;
}

export function EstimatedChip() {
  return (
    <span className="inline-flex items-center h-[18px] px-1.5 rounded-full bg-white/[0.06] border border-edge text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-300">
      Estimated
    </span>
  );
}
