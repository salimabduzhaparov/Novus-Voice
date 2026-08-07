"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lockup } from "@/components/Logo";
import SampleBanner from "@/components/SampleBanner";

const NAV = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden>
        <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" />
        <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" />
        <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" />
        <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Calls",
    href: "/calls",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden>
        <path d="M4 3.5h3l1.5 4-2 1.5a11 11 0 0 0 4.5 4.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5C8.4 17.4 2.6 11.6 2.5 5.1A1.5 1.5 0 0 1 4 3.5Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Leads",
    href: "/leads",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden>
        <circle cx="7" cy="6.5" r="3" />
        <path d="M2.5 16.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" strokeLinecap="round" />
        <path d="M13.5 8.5h4M15.5 6.5v4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Appointments",
    href: "/appointments",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden>
        <rect x="3" y="4" width="14" height="13" rx="2" />
        <path d="M3 8h14M7 2.5V5M13 2.5V5" strokeLinecap="round" />
        <path d="M7 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden>
        <circle cx="10" cy="10" r="2.75" />
        <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="mt-2 flex flex-col gap-0.5" aria-label="Main">
      <p className="text-overline uppercase text-ink-300 px-3 mt-4 mb-2">
        Overview
      </p>
      {NAV.map((item) => {
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
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({
  businessName,
  trade,
  email,
  demoMode,
  businessId,
  children,
}: {
  businessName: string;
  trade: string | null;
  email: string;
  demoMode: boolean;
  businessId: string;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const sidebarInner = (
    <>
      <div className="h-14 px-4 flex items-center border-b border-edge-faint">
        <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
          <Lockup />
        </Link>
      </div>
      <NavItems onNavigate={() => setMenuOpen(false)} />
      <div className="mt-auto p-3">
        <div className="rounded-md border border-edge p-3">
          <p className="text-body font-medium text-ink-50 truncate">
            {businessName}
          </p>
          <p className="text-caption text-ink-300 truncate">
            {trade || "Service business"} · {email}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[248px] shrink-0 bg-ink-950 border-r border-edge-faint flex-col fixed inset-y-0">
        {sidebarInner}
      </aside>
      <div className="hidden lg:block w-[248px] shrink-0" aria-hidden />

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] bg-ink-900 shadow-overlay flex flex-col">
            {sidebarInner}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-ink-950/93 backdrop-blur">
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
          {/* horizon hairline */}
          <div className="h-px w-full bg-horizon" aria-hidden />
        </header>

        {demoMode && <SampleBanner businessId={businessId} />}

        <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1320px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
