import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { listBusyTimes, syncAppointmentToGoogleCalendar } from "@/lib/google-calendar";
import { parseConfig } from "@/lib/assistant";
import type { Business } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!process.env.VAPI_WEBHOOK_SECRET || req.headers.get("x-vapi-secret") !== process.env.VAPI_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const admin = createAdminClient();
  const toNumber = String(body.toNumber ?? body.phoneNumber ?? "");
  const { data: phone } = await admin
    .from("phone_numbers")
    .select("business_id")
    .eq("e164", toNumber)
    .eq("active", true)
    .maybeSingle();
  if (!phone?.business_id) return NextResponse.json({ error: "unknown phone line" }, { status: 404 });
  const { data: businessRaw } = await admin
    .from("businesses")
    .select("*")
    .eq("id", phone.business_id)
    .maybeSingle();
  const business = businessRaw as Business | null;
  if (!business) return NextResponse.json({ error: "business not found" }, { status: 404 });
  const config = parseConfig(business, business.assistant_config);

  if (body.action === "availability") {
    const start = validDate(body.start);
    const end = validDate(body.end);
    if (!start || !end || end <= start) return NextResponse.json({ error: "invalid date range" }, { status: 400 });
    try {
      const availability = await listBusyTimes(business.id, start.toISOString(), end.toISOString());
      if (!availability.connected) {
        return NextResponse.json({ available: false, reason: "calendar_not_connected", slots: [] });
      }
      const durationMs = config.booking_duration_minutes * 60_000;
      const busy = availability.busy.map((period: { start: string; end: string }) => ({
        start: new Date(period.start).getTime(),
        end: new Date(period.end).getTime(),
      }));
      const slots: { start: string; end: string }[] = [];
      for (let cursor = start.getTime(); cursor + durationMs <= end.getTime() && slots.length < 12; cursor += durationMs) {
        const slotEnd = cursor + durationMs;
        if (!busy.some((period: { start: number; end: number }) => cursor < period.end && slotEnd > period.start)) {
          slots.push({ start: new Date(cursor).toISOString(), end: new Date(slotEnd).toISOString() });
        }
      }
      return NextResponse.json({ available: slots.length > 0, timezone: business.timezone, slots });
    } catch (error) {
      console.error("Availability agent error", error);
      return NextResponse.json({ error: "availability unavailable" }, { status: 502 });
    }
  }

  if (body.action === "book") {
    const start = validDate(body.start);
    const suppliedEnd = validDate(body.end);
    if (!start) return NextResponse.json({ error: "invalid start" }, { status: 400 });
    const end = suppliedEnd && suppliedEnd > start
      ? suppliedEnd
      : new Date(start.getTime() + config.booking_duration_minutes * 60_000);
    try {
      const busy = await listBusyTimes(business.id, start.toISOString(), end.toISOString());
      if (busy.connected && busy.busy.length > 0) {
        return NextResponse.json({ booked: false, reason: "slot_no_longer_available" }, { status: 409 });
      }
      const { data: lead, error: leadError } = await admin.from("leads").insert({
        business_id: business.id,
        name: clean(body.name),
        phone: clean(body.phone),
        email: clean(body.email),
        address: clean(body.address),
        job_type: clean(body.jobType),
        urgency: clean(body.urgency),
        notes: "Booked by the Novus Voice scheduling agent.",
        status: "new",
      }).select("id").single();
      if (leadError || !lead) throw leadError || new Error("lead insert failed");
      const { data: appointment, error: appointmentError } = await admin.from("appointments").insert({
        business_id: business.id,
        lead_id: lead.id,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        address: clean(body.address),
        confirmed: true,
        calendar_sync_status: busy.connected ? "pending" : "not_connected",
      }).select("id").single();
      if (appointmentError || !appointment) throw appointmentError || new Error("appointment insert failed");
      const synced = await syncAppointmentToGoogleCalendar({
        appointmentId: appointment.id,
        businessId: business.id,
        businessName: business.name,
        timezone: business.timezone,
        start: start.toISOString(),
        end: end.toISOString(),
        customerName: clean(body.name),
        customerPhone: clean(body.phone),
        customerEmail: clean(body.email),
        jobType: clean(body.jobType),
        address: clean(body.address),
      });
      return NextResponse.json({ booked: true, appointmentId: appointment.id, calendarSynced: synced.connected });
    } catch (error) {
      console.error("Booking agent error", error);
      return NextResponse.json({ error: "booking failed" }, { status: 502 });
    }
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}

function validDate(value: unknown): Date | null {
  const date = new Date(String(value ?? ""));
  return Number.isFinite(date.getTime()) ? date : null;
}

function clean(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}
