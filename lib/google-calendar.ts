import { createAdminClient } from "@/lib/supabase/server";

interface CalendarConnection {
  business_id: string;
  calendar_id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
}

export interface CalendarEventInput {
  summary: string;
  description?: string;
  start: string;
  end: string;
  timezone: string;
  location?: string | null;
  attendeeEmail?: string | null;
}

async function connectionFor(businessId: string): Promise<CalendarConnection | null> {
  const { data } = await createAdminClient()
    .from("calendar_connections")
    .select("business_id, calendar_id, access_token, refresh_token, token_expires_at")
    .eq("business_id", businessId)
    .maybeSingle();
  return (data as CalendarConnection | null) ?? null;
}

async function validAccessToken(connection: CalendarConnection): Promise<string> {
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;
  if (expiresAt > Date.now() + 60_000) return connection.access_token;
  if (!connection.refresh_token) throw new Error("Google Calendar needs to be reconnected.");

  const form = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    refresh_token: connection.refresh_token,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
  });
  const token = await response.json();
  if (!response.ok || !token.access_token) throw new Error("Google Calendar token refresh failed.");

  await createAdminClient()
    .from("calendar_connections")
    .update({
      access_token: token.access_token,
      token_expires_at: new Date(Date.now() + Number(token.expires_in ?? 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("business_id", connection.business_id);
  return token.access_token;
}

export async function getCalendarStatus(businessId: string) {
  const { data } = await createAdminClient()
    .from("calendar_connections")
    .select("calendar_email, calendar_id, connected_at")
    .eq("business_id", businessId)
    .maybeSingle();
  return data
    ? { connected: true, ...(data as object) }
    : { connected: false, calendar_email: null, calendar_id: null, connected_at: null };
}

export async function listBusyTimes(businessId: string, start: string, end: string) {
  const connection = await connectionFor(businessId);
  if (!connection) return { connected: false, busy: [] as { start: string; end: string }[] };
  const accessToken = await validAccessToken(connection);
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      timeMin: new Date(start).toISOString(),
      timeMax: new Date(end).toISOString(),
      items: [{ id: connection.calendar_id }],
    }),
    cache: "no-store",
  });
  const payload = await response.json();
  if (!response.ok) throw new Error("Google Calendar availability could not be read.");
  return {
    connected: true,
    busy: payload?.calendars?.[connection.calendar_id]?.busy ?? [],
  };
}

export async function createGoogleCalendarEvent(
  businessId: string,
  event: CalendarEventInput,
): Promise<{ connected: boolean; eventId?: string; htmlLink?: string }> {
  const connection = await connectionFor(businessId);
  if (!connection) return { connected: false };
  const accessToken = await validAccessToken(connection);
  const calendarId = encodeURIComponent(connection.calendar_id);
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        location: event.location || undefined,
        start: { dateTime: new Date(event.start).toISOString(), timeZone: event.timezone },
        end: { dateTime: new Date(event.end).toISOString(), timeZone: event.timezone },
        attendees: event.attendeeEmail ? [{ email: event.attendeeEmail }] : undefined,
        extendedProperties: { private: { source: "novus_voice", business_id: businessId } },
      }),
      cache: "no-store",
    },
  );
  const payload = await response.json();
  if (!response.ok || !payload.id) throw new Error("Google Calendar event could not be created.");
  return { connected: true, eventId: payload.id, htmlLink: payload.htmlLink };
}

export async function syncAppointmentToGoogleCalendar(args: {
  appointmentId: string;
  businessId: string;
  businessName: string;
  timezone: string;
  start: string;
  end: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  jobType?: string | null;
  address?: string | null;
}) {
  const admin = createAdminClient();
  await admin.from("appointments").update({ calendar_sync_status: "pending" }).eq("id", args.appointmentId);
  try {
    const result = await createGoogleCalendarEvent(args.businessId, {
      summary: `${args.jobType || "Service appointment"} — ${args.customerName || "Novus Voice caller"}`,
      description: [
        `Booked automatically by Novus Voice for ${args.businessName}.`,
        args.customerPhone ? `Phone: ${args.customerPhone}` : "",
      ].filter(Boolean).join("\n"),
      start: args.start,
      end: args.end,
      timezone: args.timezone,
      location: args.address,
      attendeeEmail: args.customerEmail,
    });
    await admin
      .from("appointments")
      .update({
        calendar_sync_status: result.connected ? "synced" : "not_connected",
        external_calendar_event_id: result.eventId ?? null,
      })
      .eq("id", args.appointmentId);
    return result;
  } catch (error) {
    await admin.from("appointments").update({ calendar_sync_status: "failed" }).eq("id", args.appointmentId);
    throw error;
  }
}
