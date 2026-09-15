/**
 * Subscription tiers — September 2026 commercial structure.
 * Prices are USD ("billed in USD"; UI may show approximate local prices).
 * Trial runs at Professional feature level for 14 days.
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

export interface MinuteBundle {
  key: "minutes_100" | "minutes_500" | "minutes_1000";
  minutes: number;
  priceUsd: number;
  tagline: string;
}

export const PLANS: Plan[] = [
  {
    key: "solo",
    name: "Essential",
    tagline: "Reliable answering for independent service businesses.",
    monthlyUsd: 79,
    annualUsd: 790,
    includedMinutes: 300,
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
    name: "Professional",
    tagline: "Higher call volume, bilingual answering, and priority support.",
    monthlyUsd: 179,
    annualUsd: 1790,
    includedMinutes: 750,
    maxNumbers: 3,
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
    name: "Business Plus",
    tagline: "Multi-location coverage with pooled minutes and white-labeling.",
    monthlyUsd: 399,
    annualUsd: 3990,
    includedMinutes: 2000,
    maxNumbers: 8,
    maxBusinesses: 5,
    smsTextBack: true,
    retentionDays: 365,
    multiLanguage: true,
    prioritySupport: true,
    whiteLabel: true,
  },
];

export const MINUTE_BUNDLES: MinuteBundle[] = [
  {
    key: "minutes_100",
    minutes: 100,
    priceUsd: 35,
    tagline: "$0.35 per additional minute",
  },
  {
    key: "minutes_500",
    minutes: 500,
    priceUsd: 150,
    tagline: "$0.30 per additional minute",
  },
  {
    key: "minutes_1000",
    minutes: 1000,
    priceUsd: 250,
    tagline: "$0.25 per additional minute",
  },
];

/** Trial behaves like Professional, capped at 60 live minutes. */
export const TRIAL = {
  days: 14,
  featureLevel: "crew" as const,
  liveMinutes: 60,
  graceDays: 7,
};

export function getPlan(key: string | null | undefined): Plan {
  const found = PLANS.find((p) => p.key === key);
  if (found) return found;
  // Trial (and anything unknown) gets Professional features with the trial cap.
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
