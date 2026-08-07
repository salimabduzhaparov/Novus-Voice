import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import type { CallOutcome } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vapi server webhook.
 *
 * Set this URL as the assistant's "Server URL" in the Vapi dashboard:
 *   https://YOUR-APP.vercel.app/api/vapi
 * and set "Server URL Secret" to the same value as VAPI_WEBHOOK_SECRET.
 *
 * This route uses the service_role client, which bypasses RLS — that is
 * correct here because Vapi is not a logged-in user. Every write below
 * must therefore set business_id explicitly and never trust the caller
 * for it: we resolve it from the dialled number.
 */
export async function POST(req: NextRequest) {
  // --- 1. Authenticate the webhook -------------------------------------
  const expected = process.env.VAPI_WEBHOOK_SECRET;
  const provided = req.headers.get("x-vapi-secret");

  if (!expected) {
    console.error("VAPI_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }
  if (provided !== expected) {
    // Do not leak why. Anyone can find this URL.
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const msg = body?.message ?? body;
  const type: string = msg?.type ?? "unknown";
  const call = msg?.call ?? {};
  const vapiCallId: string | undefined = call?.id;
  const toNumber: string | undefined =
    call?.phoneNumber?.number ?? msg?.phoneNumber?.number;
  const fromNumber: string | undefined =
    call?.customer?.number ?? msg?.customer?.number;

  const supabase = createAdminClient();

  // --- 2. Resolve which business owns the dialled number ---------------
  let businessId: string | null = null;
  if (toNumber) {
    const { data } = await supabase
      .from("phone_numbers")
      .select("business_id")
      .eq("e164", toNumber)
      .eq("active", true)
      .maybeSingle();
    businessId = (data as any)?.business_id ?? null;
  }

  if (!businessId) {
    // Unknown number — log and 200 so Vapi does not retry forever.
    console.warn("No business mapped to number", toNumber);
    return NextResponse.json({ ok: true, ignored: "unmapped_number" });
  }

  try {
    switch (type) {
      // ----------------------------------------------------------------
      case "status-update": {
        const status = mapStatus(msg?.status);
        await supabase
          .from("calls")
          .upsert(
            {
              vapi_call_id: vapiCallId,
              business_id: businessId,
              from_number: fromNumber ?? null,
              to_number: toNumber ?? null,
              status,
            } as any,
            { onConflict: "vapi_call_id" },
          );
        break;
      }

      // ----------------------------------------------------------------
      case "transcript": {
        const { data } = await supabase
          .from("calls")
          .select("id")
          .eq("vapi_call_id", vapiCallId!)
          .maybeSingle();
        const row = data as { id: string } | null;
        if (row?.id && msg?.transcript) {
          await supabase.from("transcripts").insert({
            call_id: row.id,
            role: msg?.role === "user" ? "user" : "assistant",
            content: String(msg.transcript),
            seconds_in: msg?.secondsFromStart ?? null,
          } as any);
        }
        break;
      }

      // ----------------------------------------------------------------
      case "end-of-call-report": {
        const analysis = msg?.analysis ?? {};
        const structured = analysis?.structuredData ?? {};

        const { data: savedRaw } = await supabase
          .from("calls")
          .upsert(
            {
              vapi_call_id: vapiCallId,
              business_id: businessId,
              from_number: fromNumber ?? null,
              to_number: toNumber ?? null,
              status: "completed",
              outcome: mapOutcome(structured?.outcome),
              duration_seconds: msg?.durationSeconds
                ? Math.round(msg.durationSeconds)
                : null,
              recording_url: msg?.recordingUrl ?? null,
              summary: analysis?.summary ?? null,
              cost_usd: msg?.cost ?? null,
              ended_at: new Date().toISOString(),
            } as any,
            { onConflict: "vapi_call_id" },
          )
          .select("id")
          .maybeSingle();

        const saved = savedRaw as { id: string } | null;

        // Create a lead when the caller actually wants work done.
        const wantsWork =
          structured?.outcome === "booked" ||
          structured?.outcome === "quote_requested" ||
          Boolean(structured?.jobType);

        if (wantsWork) {
          await supabase.from("leads").insert({
            business_id: businessId,
            call_id: saved?.id ?? null,
            name: structured?.name ?? null,
            phone: structured?.phone ?? fromNumber ?? null,
            email: structured?.email ?? null,
            address: structured?.address ?? null,
            job_type: structured?.jobType ?? null,
            urgency: structured?.urgency ?? null,
            notes: analysis?.summary ?? null,
            status: "new",
          } as any);
        }
        break;
      }

      // ----------------------------------------------------------------
      default:
        // assistant-request, hang, speech-update, etc. — nothing to store.
        break;
    }
  } catch (err) {
    console.error("vapi webhook error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function mapStatus(s: unknown) {
  switch (s) {
    case "in-progress":
      return "in_progress";
    case "ended":
      return "completed";
    case "forwarding":
      return "in_progress";
    default:
      return "ringing";
  }
}

function mapOutcome(o: unknown): CallOutcome {
  const allowed: CallOutcome[] = [
    "booked",
    "quote_requested",
    "message_taken",
    "spam",
    "transferred",
    "no_outcome",
  ];
  return allowed.includes(o as CallOutcome) ? (o as CallOutcome) : "no_outcome";
}
