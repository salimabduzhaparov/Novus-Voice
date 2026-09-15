import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCalendarStatus } from "@/lib/google-calendar";

async function ownedBusinessId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET() {
  const businessId = await ownedBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await getCalendarStatus(businessId));
  } catch {
    return NextResponse.json({ connected: false, unavailable: true });
  }
}

export async function DELETE() {
  const businessId = await ownedBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await createAdminClient()
    .from("calendar_connections")
    .delete()
    .eq("business_id", businessId);
  return error
    ? NextResponse.json({ error: "Calendar could not be disconnected." }, { status: 500 })
    : NextResponse.json({ connected: false });
}
