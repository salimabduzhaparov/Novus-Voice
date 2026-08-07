"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Shown once, when a freshly signed-up user has no business row yet.
 * Creates the business and its first phone number.
 */
export default function Onboarding() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [trade, setTrade] = useState("");
  const [number, setNumber] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErr("Session expired — sign in again.");
      setBusy(false);
      return;
    }

    const { data: bizRaw, error: bizErr } = await supabase
      .from("businesses")
      .insert({ owner_id: user.id, name, trade: trade || null })
      .select("id")
      .single();

    const biz = bizRaw as { id: string } | null;

    if (bizErr || !biz) {
      setErr(bizErr?.message ?? "Could not create business");
      setBusy(false);
      return;
    }

    if (number.trim()) {
      const { error: numErr } = await supabase
        .from("phone_numbers")
        .insert({ business_id: biz.id, e164: number.trim() });
      if (numErr) {
        setErr(`Business created, but the number failed: ${numErr.message}`);
        setBusy(false);
        return;
      }
    }

    router.refresh();
  }

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold tracking-tight">Set up your first client</h1>
      <p className="text-muted text-sm mt-1 mb-6">
        One business per client. You can add more later.
      </p>

      <form onSubmit={submit} className="space-y-3">
        <Field
          label="Business name"
          value={name}
          onChange={setName}
          placeholder="Apex Roofing"
          required
        />
        <Field
          label="Trade"
          value={trade}
          onChange={setTrade}
          placeholder="Roofing"
        />
        <Field
          label="Phone number (E.164)"
          value={number}
          onChange={setNumber}
          placeholder="+15551234567"
        />
        <p className="text-muted text-xs">
          Must match the Twilio number exactly, including <code>+1</code>. The
          webhook uses it to route calls to this client.
        </p>
        <button
          disabled={busy}
          className="w-full rounded-lg bg-accent text-ink font-semibold py-2.5 text-sm disabled:opacity-50"
        >
          {busy ? "…" : "Create"}
        </button>
      </form>

      {err && <p className="text-bad text-sm mt-4">{err}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-panel border border-edge px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}
