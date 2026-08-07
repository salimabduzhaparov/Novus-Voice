import type { Business } from "@/lib/types";

/**
 * Every money, date, and time rendered in the app goes through these helpers
 * with the business's own locale fields — never the browser's, never a
 * hardcoded "$". This is what makes the product global-ready.
 */

export interface LocaleCtx {
  currency: string; // ISO 4217
  language: string; // BCP-47
  timezone: string; // IANA
}

export function localeOf(b: Business | null | undefined): LocaleCtx {
  return {
    currency: b?.currency || "USD",
    language: b?.language || "en",
    timezone: b?.timezone || "America/New_York",
  };
}

export function fmtMoney(n: number | null | undefined, loc: LocaleCtx): string {
  if (n == null || Number.isNaN(n)) return "—";
  try {
    return new Intl.NumberFormat(loc.language, {
      style: "currency",
      currency: loc.currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  }
}

export function fmtNumber(n: number, loc: LocaleCtx): string {
  try {
    return new Intl.NumberFormat(loc.language).format(n);
  } catch {
    return String(n);
  }
}

/** Date + time in the business timezone, e.g. "Fri, Aug 7 · 9:42 PM" */
export function fmtDateTime(iso: string, loc: LocaleCtx): string {
  const d = new Date(iso);
  try {
    const date = new Intl.DateTimeFormat(loc.language, {
      timeZone: loc.timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(d);
    const time = new Intl.DateTimeFormat(loc.language, {
      timeZone: loc.timezone,
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
    return `${date} · ${time}`;
  } catch {
    return d.toLocaleString();
  }
}

export function fmtTime(iso: string, loc: LocaleCtx): string {
  try {
    return new Intl.DateTimeFormat(loc.language, {
      timeZone: loc.timezone,
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleTimeString();
  }
}

export function fmtDay(iso: string, loc: LocaleCtx): string {
  try {
    return new Intl.DateTimeFormat(loc.language, {
      timeZone: loc.timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

/** Extract local parts (weekday index, hour, YYYY-MM-DD key) in the business tz. */
export function localParts(
  iso: string | Date,
  tz: string,
): { weekday: number; hour: number; dayKey: string } {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  return {
    weekday: weekdayMap[get("weekday")] ?? 0,
    hour,
    dayKey: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/**
 * The last N calendar days in the business timezone, oldest first.
 * DST-safe: anchors on today's LOCAL date parts, then steps whole days in
 * pure UTC (noon-anchored), so no day is ever skipped or duplicated across
 * spring-forward / fall-back.
 */
export function lastNDays(
  n: number,
  loc: LocaleCtx,
): { key: string; label: string; labelFull: string }[] {
  const { dayKey } = localParts(new Date(), loc.timezone);
  const [y, m, d] = dayKey.split("-").map(Number);
  const anchor = Date.UTC(y, m - 1, d, 12); // noon UTC of today's local date
  const out: { key: string; label: string; labelFull: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(anchor - i * 86400_000);
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
    const isMonday = dt.getUTCDay() === 1;
    const label = new Intl.DateTimeFormat(loc.language, {
      timeZone: "UTC",
      day: "numeric",
      ...(i === n - 1 || isMonday ? { month: "short" } : {}),
    }).format(dt);
    const labelFull = new Intl.DateTimeFormat(loc.language, {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(dt);
    out.push({ key, label, labelFull });
  }
  return out;
}

/** Business hours constant for tonight: Mon-Fri, 08:00-18:00 local. */
export function isAfterHours(iso: string, tz: string): boolean {
  const { weekday, hour } = localParts(iso, tz);
  if (weekday === 0 || weekday === 6) return true;
  return hour < 8 || hour >= 18;
}

export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const t = Math.round(seconds); // round first, then split — avoids "1:60"
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Lightweight E.164 display formatter (no dependency).
 * NANP numbers get (XXX) XXX-XXXX national format when the business is
 * US/CA; everything else renders grouped international form.
 */
export function fmtPhone(
  e164: string | null | undefined,
  country?: string | null,
): string {
  if (!e164) return "Unknown";
  const digits = e164.replace(/[^\d+]/g, "");
  const nanp = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(digits);
  if (nanp) {
    const national = `(${nanp[1]}) ${nanp[2]}-${nanp[3]}`;
    return country && country !== "US" && country !== "CA"
      ? `+1 ${national}`
      : national;
  }
  // Generic international grouping: +CC XXX XXX XXXX...
  const m = /^\+(\d{1,3})(\d+)$/.exec(digits);
  if (!m) return e164;
  const rest = m[2].replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  return `+${m[1]} ${rest}`;
}

export function isValidE164(v: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(v.trim());
}

/** Signed percent delta between two counts; null when prior is 0. */
export function pctDelta(current: number, prior: number): number | null {
  if (prior <= 0) return null;
  return Math.round(((current - prior) / prior) * 100);
}
