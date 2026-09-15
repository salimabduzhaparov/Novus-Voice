import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isPaidPlanKey } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature || !verifyStripeSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const object = event?.data?.object ?? {};

  try {
    if (event.type === "checkout.session.completed") {
      const businessId = object?.metadata?.business_id || object?.client_reference_id;
      if (!businessId) return NextResponse.json({ ok: true, ignored: "no_business" });

      const { error: eventError } = await supabase.from("stripe_events").insert(
        { id: event.id, event_type: event.type, business_id: businessId },
      );
      if (eventError?.code === "23505") {
        return NextResponse.json({ received: true, duplicate: true });
      }
      if (eventError) throw eventError;

      if (object?.metadata?.kind === "plan" && isPaidPlanKey(object?.metadata?.plan_key)) {
        await Promise.all([
          supabase
            .from("businesses")
            .update({ plan_key: object.metadata.plan_key })
            .eq("id", businessId),
          supabase.from("billing_accounts").upsert(
            {
              business_id: businessId,
              stripe_customer_id: String(object.customer ?? ""),
              stripe_subscription_id: String(object.subscription ?? ""),
              status: "active",
              current_plan_key: object.metadata.plan_key,
              billing_period: object.metadata.billing_period ?? "monthly",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "business_id" },
          ),
        ]);
      }

      if (object?.metadata?.kind === "minutes") {
        const minutes = Math.max(0, Number(object?.metadata?.minutes) || 0);
        if (minutes > 0) {
          await supabase.rpc("add_purchased_minutes", {
            bid: businessId,
            additional_minutes: minutes,
          });
        }
      }
    }

    if (event.type === "customer.subscription.deleted") {
      await supabase
        .from("billing_accounts")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", object.id);
    }
  } catch (error) {
    console.error("Stripe webhook error", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const values = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key, value];
    }),
  );
  if (!values.t || !values.v1) return false;
  const timestamp = Number(values.t);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = createHmac("sha256", secret)
    .update(`${values.t}.${payload}`, "utf8")
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(values.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
