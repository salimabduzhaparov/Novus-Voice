import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isMinuteBundleKey,
  isPaidPlanKey,
  stripePriceEnvForBundle,
  stripePriceEnvForPlan,
  type BillingPeriod,
} from "@/lib/billing";
import { MINUTE_BUNDLES } from "@/lib/plans";
import { PLANS } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: "Stripe checkout is not configured yet. Add the Stripe environment variables to enable payments." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, owner_id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  let body: { kind?: unknown; key?: unknown; period?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const form = new URLSearchParams();
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  form.set("success_url", `${origin}/billing?checkout=success`);
  form.set("cancel_url", `${origin}/billing?checkout=cancelled`);
  form.set("line_items[0][quantity]", "1");
  form.set("client_reference_id", business.id);
  if (user.email) form.set("customer_email", user.email);
  form.set("metadata[business_id]", business.id);

  if (body.kind === "plan" && isPaidPlanKey(body.key)) {
    const period: BillingPeriod = body.period === "annual" ? "annual" : "monthly";
    const envName = stripePriceEnvForPlan(body.key, period);
    const priceId = process.env[envName];
    const plan = PLANS.find((item) => item.key === body.key)!;

    form.set("mode", "subscription");
    if (priceId) {
      form.set("line_items[0][price]", priceId);
    } else {
      form.set("line_items[0][price_data][currency]", "usd");
      form.set("line_items[0][price_data][unit_amount]", String((period === "annual" ? plan.annualUsd : plan.monthlyUsd) * 100));
      form.set("line_items[0][price_data][recurring][interval]", period === "annual" ? "year" : "month");
      form.set("line_items[0][price_data][product_data][name]", `Novus Voice ${plan.name}`);
      form.set("line_items[0][price_data][product_data][description]", `${plan.includedMinutes.toLocaleString()} receptionist minutes per month`);
    }
    form.set("metadata[kind]", "plan");
    form.set("metadata[plan_key]", body.key);
    form.set("metadata[billing_period]", period);
    form.set("subscription_data[metadata][business_id]", business.id);
    form.set("subscription_data[metadata][plan_key]", body.key);
  } else if (body.kind === "minutes" && isMinuteBundleKey(body.key)) {
    const envName = stripePriceEnvForBundle(body.key);
    const priceId = process.env[envName];
    const bundle = MINUTE_BUNDLES.find((item) => item.key === body.key)!;

    form.set("mode", "payment");
    if (priceId) {
      form.set("line_items[0][price]", priceId);
    } else {
      form.set("line_items[0][price_data][currency]", "usd");
      form.set("line_items[0][price_data][unit_amount]", String(bundle.priceUsd * 100));
      form.set("line_items[0][price_data][product_data][name]", `Novus Voice ${bundle.minutes.toLocaleString()}-minute pack`);
      form.set("line_items[0][price_data][product_data][description]", "One-time additional receptionist minutes");
    }
    form.set("metadata[kind]", "minutes");
    form.set("metadata[bundle_key]", body.key);
    form.set("metadata[minutes]", String(bundle.minutes));
  } else {
    return NextResponse.json({ error: "Unknown checkout item" }, { status: 400 });
  }

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${stripeKey}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form,
    cache: "no-store",
  });
  const session = await stripeResponse.json();
  if (!stripeResponse.ok || !session.url) {
    console.error("Stripe checkout error", session?.error?.type);
    return NextResponse.json(
      { error: session?.error?.message || "Stripe checkout could not be created." },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: session.url });
}
