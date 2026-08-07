"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const fn =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { error } = await fn;
    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }
    if (mode === "signup") {
      setMsg("Account created. Check your email if confirmation is on, then sign in.");
      setMode("signin");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Novus Voice</h1>
        <p className="text-muted text-sm mt-1 mb-7">
          {mode === "signin" ? "Sign in to your dashboard" : "Create an account"}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full rounded-lg bg-panel border border-edge px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 characters)"
            className="w-full rounded-lg bg-panel border border-edge px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-accent text-ink font-semibold py-2.5 text-sm disabled:opacity-50"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        {msg && <p className="text-warn text-sm mt-4">{msg}</p>}

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMsg(null);
          }}
          className="text-muted text-sm mt-6 hover:text-white"
        >
          {mode === "signin"
            ? "No account? Create one"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
