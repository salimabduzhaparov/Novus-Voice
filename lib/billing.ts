import { MINUTE_BUNDLES, PLANS, type PlanKey } from "@/lib/plans";

export type BillingPeriod = "monthly" | "annual";

export function stripePriceEnvForPlan(
  planKey: Exclude<PlanKey, "trial">,
  period: BillingPeriod,
): string {
  return `STRIPE_PRICE_${planKey.toUpperCase()}_${period.toUpperCase()}`;
}

export function stripePriceEnvForBundle(bundleKey: string): string {
  return `STRIPE_PRICE_${bundleKey.toUpperCase()}`;
}

export function isPaidPlanKey(value: unknown): value is Exclude<PlanKey, "trial"> {
  return PLANS.some((plan) => plan.key === value);
}

export function isMinuteBundleKey(
  value: unknown,
): value is (typeof MINUTE_BUNDLES)[number]["key"] {
  return MINUTE_BUNDLES.some((bundle) => bundle.key === value);
}
