"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { OrbitSpinner } from "@/components/Logo";

type Status = {
  connected: boolean;
  calendar_email?: string | null;
  unavailable?: boolean;
};

export default function CalendarConnection({ result }: { result?: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/google/calendar/status", { cache: "no-store" })
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setStatus({ connected: false, unavailable: true }));
  }, []);

  async function disconnect() {
    setBusy(true);
    const response = await fetch("/api/google/calendar/status", { method: "DELETE" });
    if (response.ok) setStatus({ connected: false });
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-arc-400/25 bg-gradient-to-br from-ink-850 to-ink-900 p-5 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="size-10 rounded-xl bg-white/[0.07] border border-edge grid place-items-center text-arc-200">
          <Icon name="calendar" size={20} />
        </span>
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2">
            <h2 className="text-section text-ink-50">Google Calendar booking agent</h2>
            {status?.connected && <span className="text-overline uppercase text-good-300 bg-good-400/10 border border-good-400/20 rounded-full px-2 py-0.5">Connected</span>}
          </div>
          <p className="text-caption text-ink-300 mt-1">
            {status?.connected
              ? `Nova reads live availability and adds confirmed appointments to ${status.calendar_email || "your calendar"}.`
              : "Connect the owner's calendar so Nova offers only free times and creates bookings automatically."}
          </p>
        </div>
        {status === null ? (
          <OrbitSpinner size={18} />
        ) : status.connected ? (
          <button onClick={disconnect} disabled={busy} className="h-9 px-4 rounded-lg border border-edge text-body font-semibold text-ink-200 hover:bg-white/[0.05] disabled:opacity-50">
            {busy ? "Disconnecting…" : "Disconnect"}
          </button>
        ) : (
          <a href="/api/google/calendar/connect" className="h-9 px-4 rounded-lg bg-arc-400 text-ink-950 text-body font-semibold inline-flex items-center shadow-sheen hover:bg-arc-300">
            Connect Google Calendar
          </a>
        )}
      </div>
      {result === "connected" && <p className="text-caption text-good-300 mt-3">Calendar connected successfully.</p>}
      {result === "failed" && <p className="text-caption text-bad-300 mt-3">Calendar connection failed. Please try again.</p>}
      {result === "not_configured" && <p className="text-caption text-warn-300 mt-3">Google OAuth credentials must be added before calendars can connect.</p>}
      {status?.unavailable && <p className="text-caption text-warn-300 mt-3">Run the latest database migration to enable calendar connections.</p>}
    </section>
  );
}
