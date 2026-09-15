import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { readOAuthState } from "@/lib/oauth-state";

export async function GET(req: NextRequest) {
  const destination = (status: string) =>
    NextResponse.redirect(new URL(`/appointments?calendar=${status}`, req.url));
  const state = readOAuthState(req.nextUrl.searchParams.get("state"));
  const code = req.nextUrl.searchParams.get("code");
  if (!state || !code) return destination("failed");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== state.userId) return destination("failed");
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", state.businessId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!business) return destination("failed");

  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      code,
      grant_type: "authorization_code",
      redirect_uri: `${origin}/api/google/calendar/callback`,
    }),
    cache: "no-store",
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) return destination("failed");

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  const profile = profileResponse.ok ? await profileResponse.json() : {};
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("calendar_connections")
    .select("refresh_token")
    .eq("business_id", business.id)
    .maybeSingle();
  const { error } = await admin.from("calendar_connections").upsert(
    {
      business_id: business.id,
      provider: "google",
      calendar_id: "primary",
      calendar_email: profile.email ?? user.email ?? null,
      access_token: token.access_token,
      refresh_token: token.refresh_token || (current as { refresh_token?: string } | null)?.refresh_token || null,
      token_expires_at: new Date(Date.now() + Number(token.expires_in ?? 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  );
  return destination(error ? "failed" : "connected");
}
