"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArcMark, OrbitSpinner } from "@/components/Logo";

const inputCls =
  "h-10 w-full rounded-lg bg-ink-950 border border-edge px-3 text-body text-ink-50 placeholder:text-ink-300 hover:border-edge-strong focus:border-arc-400 transition-colors";

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

    const { error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }
    if (mode === "signup") {
      setMsg(
        "Account created. If email confirmation is on, check your inbox — then sign in.",
      );
      setMode("signin");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <section className="hidden lg:flex flex-col justify-between bg-meridian p-10 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -right-40 -top-40 size-[520px] rounded-full border-[3px] border-white/10"
        />
        <div
          aria-hidden
          className="absolute -right-24 -top-24 size-[320px] rounded-full border-[3px] border-white/10"
        />
        <div className="flex items-center gap-3">
          <ArcMark size={34} />
          <span className="text-[17px] font-semibold tracking-tight text-white">
            Novus Voice
          </span>
        </div>
        <div className="max-w-md">
          <h1 className="text-[34px] leading-[1.15] font-semibold tracking-tight text-white">
            Every missed call is a job your competitor booked.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-arc-100/90">
            Novus Voice answers in seconds, day or night — books the job,
            captures the lead, and shows you the revenue it recovered.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-4">
            {[
              ["62%", "of calls to small businesses go unanswered"],
              ["85%", "of callers who hit voicemail never call back"],
              ["24/7", "answered — nights, weekends, holidays"],
            ].map(([v, l]) => (
              <div
                key={l}
                className="rounded-md border border-white/15 bg-white/[0.06] p-3"
              >
                <dt className="sr-only">{l}</dt>
                <dd className="text-[22px] font-semibold text-white">{v}</dd>
                <dd className="text-[11.5px] leading-snug text-arc-100/80 mt-1">
                  {l}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="text-[12px] text-arc-100/60">
          Built by Novus Co. · novuswebsites.com
        </p>
      </section>

      {/* Form panel */}
      <section className="min-h-screen flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <ArcMark size={28} />
            <span className="text-[15px] font-semibold tracking-tight">
              Novus Voice
            </span>
          </div>

          <h2 className="text-page-title text-ink-50">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-body text-ink-300 mt-1 mb-7">
            {mode === "signin"
              ? "Sign in to your dashboard."
              : "Your receptionist is ready in about a minute."}
          </p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-card-title text-ink-200 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-card-title text-ink-200 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full h-10 rounded-lg bg-arc-400 text-ink-950 font-semibold shadow-sheen hover:bg-arc-300 active:bg-arc-500 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {busy && <OrbitSpinner size={15} />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {msg && <p className="text-caption text-warn-300 mt-4">{msg}</p>}

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setMsg(null);
            }}
            className="text-body text-ink-300 mt-6 hover:text-ink-50 transition-colors"
          >
            {mode === "signin"
              ? "No account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}
