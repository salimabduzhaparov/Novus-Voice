"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArcMark, OrbitSpinner } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icons";

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "phone-ring",
    title: "A customer calls — any hour",
    body: "On the roof, at dinner, 2 AM storm. The line never rings out.",
  },
  {
    icon: "bot",
    title: "Nova answers in two rings",
    body: "Warm, human-sounding, in your language. Captures name, job, address, urgency.",
  },
  {
    icon: "calendar-check",
    title: "The job lands on your calendar",
    body: "Booked, confirmed back to the caller, and priced into your recovered-revenue total.",
  },
];

const STATS: { icon: IconName; value: string; label: string }[] = [
  { icon: "phone-missed", value: "62%", label: "of calls to small businesses go unanswered" },
  { icon: "voicemail-off", value: "85%", label: "of callers who hit voicemail never call back" },
  { icon: "moon", value: "24/7", label: "answered — nights, weekends, holidays" },
];

const TRADES: { icon: IconName; label: string }[] = [
  { icon: "home", label: "Roofing" },
  { icon: "droplet", label: "Plumbing" },
  { icon: "flame", label: "HVAC" },
  { icon: "bolt", label: "Electrical" },
  { icon: "leaf", label: "Landscaping" },
  { icon: "sparkle", label: "Cleaning" },
  { icon: "scissors", label: "Salons" },
  { icon: "wrench", label: "Auto repair" },
];

const TRUST: { icon: IconName; label: string }[] = [
  { icon: "shield", label: "Your data is isolated per business" },
  { icon: "sparkle", label: "Live demo data included" },
  { icon: "zap", label: "Set up in about a minute" },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    <main className="relative min-h-screen overflow-hidden bg-ink-950 grain">
      {/* ---- Aurora atmosphere ---- */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div
          className="aurora"
          style={{
            width: 640,
            height: 640,
            left: "-12%",
            top: "-18%",
            background: "rgba(65,145,244,0.28)",
          }}
        />
        <div
          className="aurora"
          style={{
            width: 560,
            height: 560,
            right: "-10%",
            top: "22%",
            background: "rgba(46,82,155,0.35)",
            animationDelay: "-9s",
          }}
        />
        <div
          className="aurora"
          style={{
            width: 480,
            height: 480,
            left: "18%",
            bottom: "-22%",
            background: "rgba(8,167,152,0.16)",
            animationDelay: "-17s",
          }}
        />
      </div>

      {/* ---- Giant orbit rings with a travelling satellite ---- */}
      <div
        aria-hidden
        className="hidden lg:block absolute -left-56 top-1/2 -translate-y-1/2"
      >
        <div className="relative size-[720px]">
          <div className="absolute inset-0 rounded-full border border-white/[0.05]" />
          <div className="absolute inset-16 rounded-full border border-white/[0.06]" />
          <div className="absolute inset-32 rounded-full border border-white/[0.07]" />
          <div className="orbit-track absolute inset-16">
            <span className="absolute left-1/2 -top-[5px] -ml-[5px] size-2.5 rounded-full bg-arc-400 shadow-[0_0_18px_4px_rgba(111,174,255,0.55)]" />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-5 lg:px-10 py-8 lg:py-12 flex flex-col lg:grid lg:grid-cols-[1.12fr_1fr] lg:gap-x-14 lg:items-center lg:min-h-screen">
        {/* =============== Hero (top on every screen) =============== */}
        <section className="order-1 max-w-xl w-full mx-auto lg:mx-0 lg:col-start-1 lg:row-start-1">
          {/* Lockup */}
          <div className="fade-up flex flex-wrap items-center gap-x-3 gap-y-2" style={{ animationDelay: "0ms" }}>
            <ArcMark size={34} />
            <span className="text-[17px] font-semibold tracking-tight text-ink-50 whitespace-nowrap">
              Novus Voice
            </span>
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full border border-good-400/25 bg-good-400/[0.08] text-[11px] font-semibold text-good-300 whitespace-nowrap">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full rounded-full bg-good-400 opacity-60 animate-ping" />
                <span className="relative inline-flex size-1.5 rounded-full bg-good-400" />
              </span>
              AI receptionist · live 24/7
            </span>
          </div>

          {/* Hero */}
          <div className="fade-up mt-8" style={{ animationDelay: "80ms" }}>
            <h1 className="text-[34px] lg:text-[42px] leading-[1.12] font-semibold tracking-[-0.02em] text-ink-50">
              Every missed call is a job your competitor booked.
              <br />
              <span className="text-sweep">Nova answers when you can't.</span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-200 max-w-md">
              Novus Voice picks up in seconds — day or night — books the job,
              captures the lead, and shows you the revenue it recovered. In
              your language, your currency, your timezone.
            </p>
          </div>
        </section>

        {/* =============== Story sections (below form on mobile) =============== */}
        <section className="order-3 lg:order-none max-w-xl w-full mx-auto lg:mx-0 lg:col-start-1 lg:row-start-2">
          {/* How it works */}
          <div className="fade-up mt-10 lg:mt-9" style={{ animationDelay: "160ms" }}>
            <p className="text-overline uppercase text-ink-300 mb-3">
              How it works
            </p>
            <ol className="relative space-y-4">
              <span
                aria-hidden
                className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-arc-400/50 via-arc-400/15 to-transparent"
              />
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative flex gap-4">
                  <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-md border border-arc-400/25 bg-ink-900/80 text-arc-300 backdrop-blur">
                    <Icon name={s.icon} size={18} />
                  </span>
                  <div className="pt-0.5">
                    <p className="text-body font-semibold text-ink-50">
                      <span className="text-ink-300 mr-1.5">{i + 1}.</span>
                      {s.title}
                    </p>
                    <p className="text-caption text-ink-300 mt-0.5 max-w-sm">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Why it matters — stat tiles */}
          <div className="fade-up mt-9" style={{ animationDelay: "240ms" }}>
            <p className="text-overline uppercase text-ink-300 mb-3">
              Why it matters
            </p>
            <dl className="grid grid-cols-3 gap-3">
              {STATS.map((s) => (
                <div
                  key={s.value}
                  className="rounded-md border border-edge bg-white/[0.04] backdrop-blur p-3.5 shadow-edge-glow"
                >
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-arc-400/[0.12] text-arc-300">
                    <Icon name={s.icon} size={15} />
                  </span>
                  <dd className="text-[22px] font-semibold text-ink-50 mt-2">
                    {s.value}
                  </dd>
                  <dd className="text-[11.5px] leading-snug text-ink-300 mt-0.5">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Trades marquee */}
          <div className="fade-up mt-9" style={{ animationDelay: "320ms" }}>
            <p className="text-overline uppercase text-ink-300 mb-3">
              Built for the trades
            </p>
            <div
              className="relative overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
              }}
            >
              <div className="marquee-row flex w-max gap-2.5 pr-2.5">
                {[...TRADES, ...TRADES].map((t, i) => (
                  <span
                    key={`${t.label}-${i}`}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-edge bg-ink-900/70 text-[12.5px] font-medium text-ink-200 whitespace-nowrap"
                  >
                    <span className="text-arc-300">
                      <Icon name={t.icon} size={13} />
                    </span>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-caption text-ink-300 mt-2.5">
              …and every business whose phone is its front door.
            </p>
          </div>

          <p
            className="fade-up hidden lg:block text-[12px] text-ink-300 mt-10"
            style={{ animationDelay: "400ms" }}
          >
            Built by Novus Co. · novuswebsites.com
          </p>
        </section>

        {/* =============== Auth panel =============== */}
        <section className="order-2 lg:order-none mt-10 lg:mt-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center w-full">
          <div
            className="fade-up relative mx-auto w-full max-w-md rounded-2xl p-px"
            style={{
              animationDelay: "120ms",
              background:
                "linear-gradient(160deg, rgba(111,174,255,0.45), rgba(199,214,240,0.08) 30%, rgba(199,214,240,0.06) 60%, rgba(8,167,152,0.25))",
            }}
          >
            <div className="rounded-2xl bg-ink-900/90 backdrop-blur-xl p-6 sm:p-8">
              <h2 className="text-page-title text-ink-50">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-body text-ink-300 mt-1 mb-6">
                {mode === "signin"
                  ? "Sign in to your dashboard."
                  : "Your receptionist is ready in about a minute."}
              </p>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-card-title text-ink-200 mb-1.5"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300">
                      <Icon name="mail" size={16} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="h-11 w-full rounded-lg bg-ink-950 border border-edge pl-10 pr-3 text-body text-ink-50 placeholder:text-ink-300 hover:border-edge-strong focus:border-arc-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-card-title text-ink-200 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300">
                      <Icon name="lock" size={16} />
                    </span>
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete={
                        mode === "signin" ? "current-password" : "new-password"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="h-11 w-full rounded-lg bg-ink-950 border border-edge pl-10 pr-11 text-body text-ink-50 placeholder:text-ink-300 hover:border-edge-strong focus:border-arc-400 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-8 items-center justify-center rounded-lg text-ink-300 hover:text-ink-50 hover:bg-white/[0.05] transition-colors"
                    >
                      <Icon name={showPw ? "eye-off" : "eye"} size={16} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 rounded-lg bg-arc-400 text-ink-950 font-semibold shadow-sheen hover:bg-arc-300 active:bg-arc-500 transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {busy && <OrbitSpinner size={15} />}
                  {mode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>

              {msg && (
                <p className="text-caption text-warn-300 mt-4" role="status">
                  {msg}
                </p>
              )}

              <button
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setMsg(null);
                }}
                className="text-body text-ink-300 mt-5 hover:text-ink-50 transition-colors"
              >
                {mode === "signin"
                  ? "No account? Create one"
                  : "Already have an account? Sign in"}
              </button>

              <div className="mt-6 pt-5 border-t border-edge-faint space-y-2">
                {TRUST.map((t) => (
                  <p
                    key={t.label}
                    className="flex items-center gap-2 text-caption text-ink-300"
                  >
                    <span className="text-good-300">
                      <Icon name={t.icon} size={13} />
                    </span>
                    {t.label}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <p className="lg:hidden text-center text-[12px] text-ink-300 mt-8">
            Built by Novus Co. · novuswebsites.com
          </p>
        </section>
      </div>
    </main>
  );
}
