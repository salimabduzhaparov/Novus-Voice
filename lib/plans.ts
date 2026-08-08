/**
 * Subscription tiers — priced by the marketing pass of Aug 2026.
 * Prices are USD ("billed in USD"; UI may show approximate local prices).
 * Trial runs at CREW level for 14 days.
 */

export type PlanKey = "trial" | "solo" | "crew" | "fleet";

export interface Plan {
  key: PlanKey;
  name: string;
  tagline: string;
  monthlyUsd: number;
  annualUsd: number; // per year (2 months free)
  includedMinutes: number;
  maxNumbers: number;
  maxBusinesses: number;
  smsTextBack: boolean;
  retentionDays: number;
  multiLanguage: boolean;
  prioritySupport: boolean;
  whiteLabel: boolean;
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    key: "solo",
    name: "Solo",
    tagline: "Every missed call answered and texted back.",
    monthlyUsd: 49,
    annualUsd: 490,
    includedMinutes: 200,
    maxNumbers: 1,
    maxBusinesses: 1,
    smsTextBack: true,
    retentionDays: 30,
    multiLanguage: false,
    prioritySupport: false,
    whiteLabel: false,
  },
  {
    key: "crew",
    name: "Crew",
    tagline: "Double the minutes, answers in 30+ languages.",
    monthlyUsd: 99,
    annualUsd: 990,
    includedMinutes: 400,
    maxNumbers: 2,
    maxBusinesses: 1,
    smsTextBack: true,
    retentionDays: 90,
    multiLanguage: true,
    prioritySupport: true,
    whiteLabel: false,
    popular: true,
  },
  {
    key: "fleet",
    name: "Fleet",
    tagline: "Three brands, one login, white-labeled.",
    monthlyUsd: 249,
    annualUsd: 2490,
    includedMinutes: 1000,
    maxNumbers: 6,
    maxBusinesses: 3,
    smsTextBack: true,
    retentionDays: 365,
    multiLanguage: true,
    prioritySupport: true,
    whiteLabel: true,
  },
];

/** Trial behaves like Crew, capped at 60 live minutes. */
export const TRIAL = {
  days: 14,
  featureLevel: "crew" as const,
  liveMinutes: 60,
  graceDays: 7,
};

export function getPlan(key: string | null | undefined): Plan {
  const found = PLANS.find((p) => p.key === key);
  if (found) return found;
  // Trial (and anything unknown) gets Crew features with the trial minute cap.
  const crew = PLANS.find((p) => p.key === "crew")!;
  return { ...crew, key: "trial", name: "Trial", monthlyUsd: 0, annualUsd: 0 };
}

export function isTrial(planKey: string | null | undefined): boolean {
  return !planKey || planKey === "trial";
}

export function trialDaysLeft(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400_000));
}

/** Included minutes for the CURRENT account state (trial cap applies). */
export function includedMinutes(planKey: string | null | undefined): number {
  const p = getPlan(planKey);
  // getPlan returns the trial persona for unknown keys too — respect its cap.
  return p.key === "trial" ? TRIAL.liveMinutes : p.includedMinutes;
}

export function planLabel(planKey: string | null | undefined): string {
  return isTrial(planKey) ? "Trial" : getPlan(planKey).name;
}
