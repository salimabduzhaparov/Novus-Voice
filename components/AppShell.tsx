"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lockup } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icons";
import SampleBanner from "@/components/SampleBanner";
import {
  includedMinutes,
  isTrial,
  planLabel,
  trialDaysLeft,
} from "@/lib/plans";
import type { Business } from "@/lib/types";

const GROUPS: { label: string; items: { label: string; href: string; icon: IconName }[] }[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "grid" },
      { label: "Calls", href: "/calls", icon: "phone" },
      { label: "Leads", href: "/leads", icon: "users" },
      { label: "Appointments", href: "/appointments", icon: "calendar" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Assistant Studio", href: "/assistant", icon: "bot" },
      { label: "Billing", href: "/billing", icon: "card" },
      { label: "Settings", href: "/settings", icon: "gear" },
    ],
  },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col" aria-label="Main">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <p className="text-overline uppercase text-ink-300/70 px-3 pt-5 pb-1.5 ml-2">
            {g.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {g.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`relative h-9 px-3 mx-2 rounded-lg flex items-center gap-3 text-body font-medium transition-colors ${
                    active
                      ? "bg-white/[0.06] text-ink-50"
                      : "text-ink-200 hover:bg-white/[0.04] hover:text-ink-50"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2 size-[5px] rounded-full bg-arc-400"
                    />
                  )}
                  <span className={active ? "text-arc-300" : "text-ink-300"}>
                    <Icon name={item.icon} size={18} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AppShell({
  business,
  email,
  demoMode,
  minutesUsed,
  children,
}: {
  business: Business;
  email: string;
  demoMode: boolean;
  minutesUsed: number;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const included = includedMinutes(business.plan_key);
  const pct = Math.min(100, Math.round((minutesUsed / Math.max(1, included)) * 100));
  const trial = isTrial(business.plan_key);
  const daysLeft = trialDaysLeft(business.trial_ends_at);

  const sidebarInner = (
    <>
      <div className="h-14 px-4 flex items-center border-b border-edge-faint">
        <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
          <Lockup />
        </Link>
      </div>

      {/* Business identity */}
      <Link
        href="/settings"
        onClick={() => setMenuOpen(false)}
        className="mx-2 mt-3 px-3 py-2.5 rounded-md flex items-center gap-2.5 hover:bg-white/[0.05] transition-colors"
      >
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt=""
            className="size-7 rounded-lg object-cover border border-edge shrink-0"
          />
        ) : (
          <span className="size-7 rounded-lg bg-meridian grid place-items-center text-caption font-semibold text-ink-950 shrink-0">
            {business.name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="text-card-title text-ink-50 truncate flex-1">
          {business.name}
        </span>
        <span
          className={`text-overline uppercase border rounded-sm px-1.5 py-0.5 shrink-0 ${
            trial
              ? "text-warn-300 border-warn-400/30 bg-warn-400/10"
              : "text-ink-300 border-edge bg-white/[0.06]"
          }`}
        >
          {planLabel(business.plan_key)}
        </span>
      </Link>
      <div className="h-px bg-horizon mx-2 mt-3" aria-hidden />

      <NavItems onNavigate={() => setMenuOpen(false)} />

      {/* Usage meter footer */}
      <div className="mt-auto px-2 pb-1">
        <Link
          href="/billing#usage"
          onClick={() => setMenuOpen(false)}
          className="block p-3 rounded-xl bg-ink-950 border border-edge hover:border-edge-strong transition-colors"
        >
          <p className="text-caption text-ink-300">Minutes this month</p>
          <div className="relative h-1.5 rounded-full bg-ink-800 mt-2">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-meridian"
              style={{ width: `${pct}%` }}
            />
            <span
              aria-hidden
              className="absolute top-1/2 -translate-y-1/2 size-[7px] rounded-full bg-ink-50 shadow-[0_0_8px_2px_rgba(111,174,255,0.5)]"
              style={{ left: `calc(${pct}% - 3px)` }}
            />
          </div>
          <p
            className={`text-caption mt-2 ${
              pct >= 90 ? "text-warn-300" : "text-ink-200"
            }`}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {minutesUsed} / {included} min ·{" "}
            {trial && daysLeft != null
              ? `Trial · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
              : planLabel(business.plan_key)}
          </p>
        </Link>
        <p className="text-caption text-ink-300/60 text-center py-2.5">
          Powered by Novus
        </p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden lg:flex w-[248px] shrink-0 bg-ink-950 border-r border-edge-faint flex-col fixed inset-y-0">
        {sidebarInner}
      </aside>
      <div className="hidden lg:block w-[248px] shrink-0" aria-hidden />

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-ink-900 shadow-overlay flex flex-col overflow-y-auto">
            {sidebarInner}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-ink-950/[0.93] backdrop-blur">
          <div className="h-14 px-4 lg:px-8 flex items-center gap-3">
            <button
              className="lg:hidden inline-flex items-center justify-center size-9 rounded-lg text-ink-200 hover:bg-white/[0.05]"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M2 4.5h14M2 9h14M2 13.5h14" strokeLinecap="round" />
              </svg>
            </button>
            <span className="lg:hidden">
              <Lockup compact />
            </span>
            <span className="ml-auto inline-flex items-center gap-2 h-7 px-3 rounded-full border border-edge text-[12px] font-medium text-ink-200">
              <span className="relative flex size-1.5" aria-hidden>
                <span className="absolute inline-flex size-full rounded-full bg-good-400 opacity-60 animate-ping" />
                <span className="relative inline-flex size-1.5 rounded-full bg-good-400" />
              </span>
              Answering calls
            </span>
          </div>
          <div className="h-px w-full bg-horizon" aria-hidden />
        </header>

        {/* Trial banner */}
        {trial && daysLeft != null && (
          <div className="px-4 lg:px-8 pt-4 max-w-[1320px] w-full mx-auto">
            <div className="rounded-xl border border-warn-400/40 bg-warn-400/10 px-4 py-3 flex flex-wrap items-center gap-3">
              <span className="text-warn-400">
                <Icon name="clock" size={16} />
              </span>
              <p className="text-body text-ink-50 flex-1 min-w-[200px]">
                {daysLeft === 0 ? (
                  <>
                    <span className="text-warn-300 font-semibold">
                      Trial ended
                    </span>{" "}
                    <span className="text-ink-300">
                      · choose a plan to keep your assistant answering.
                    </span>
                  </>
                ) : (
                  <>
                    Trial —{" "}
                    <span
                      className={
                        daysLeft <= 3
                          ? "text-warn-300 font-semibold"
                          : "font-semibold"
                      }
                    >
                      {daysLeft} day{daysLeft === 1 ? "" : "s"} left
                    </span>{" "}
                    <span className="text-ink-300">
                      · your assistant keeps answering until it ends.
                    </span>
                  </>
                )}
              </p>
              <Link
                href="/billing"
                className="inline-flex items-center h-8 px-3 rounded-lg bg-arc-400 text-ink-950 text-[13px] font-semibold shadow-sheen hover:bg-arc-300 transition-colors"
              >
                Choose a plan
              </Link>
            </div>
          </div>
        )}

        {demoMode && <SampleBanner businessId={business.id} />}

        <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1320px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
