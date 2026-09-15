"use client";

import { useState } from "react";
import { MINUTE_BUNDLES } from "@/lib/plans";
import { OrbitSpinner } from "@/components/Logo";

export default function MinuteBundles() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(key: string) {
    setBusy(key);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "minutes", key }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Checkout could not be started.");
      }
      window.location.assign(payload.url);
    } catch (err) {
      setBusy(null);
      setError(err instanceof Error ? err.message : "Checkout could not be started.");
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-3">
        <h2 className="text-section text-ink-50">Additional minute packs</h2>
        <p className="text-caption text-ink-300 mt-0.5">
          One-time credits are added to your available balance and never renew automatically.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {MINUTE_BUNDLES.map((bundle) => (
          <div key={bundle.key} className="rounded-xl border border-edge bg-ink-900 p-4">
            <p className="text-section text-ink-50">{bundle.minutes.toLocaleString()} minutes</p>
            <p className="text-stat text-ink-50 mt-2">${bundle.priceUsd}</p>
            <p className="text-caption text-ink-300 mt-1">{bundle.tagline}</p>
            <button
              onClick={() => buy(bundle.key)}
              disabled={busy != null}
              className="mt-4 h-9 w-full rounded-lg border border-arc-400/40 bg-arc-400/10 text-body font-semibold text-arc-200 hover:bg-arc-400/20 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy === bundle.key && <OrbitSpinner size={13} />}
              Buy minute pack
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-caption text-bad-300 mt-3">{error}</p>}
    </section>
  );
}
