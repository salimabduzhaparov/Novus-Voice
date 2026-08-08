import { createClient } from "@/lib/supabase/server";
import type { Business } from "@/lib/types";

/**
 * Shared per-request context: the signed-in user, their business, and
 * whether the account is in demo mode (no real calls yet → sample data
 * is shown; one real call → samples disappear from every query).
 */
export async function getContext() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, business: null, demoMode: false };
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);

  const business = ((businesses ?? [])[0] as Business | undefined) ?? null;

  let demoMode = false;
  let minutesUsed = 0;
  if (business) {
    const { count } = await supabase
      .from("calls")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("is_sample", false);
    demoMode = (count ?? 0) === 0;

    // Month-to-date talk minutes, summed in the database (no row cap).
    // RLS applies inside the function, so it only ever sums owned rows.
    // NOTE: month boundary is server time (UTC), not business timezone —
    // acceptable drift for a usage meter; revisit with billing cycles.
    const { data: mins } = await supabase.rpc("minutes_this_month", {
      bid: business.id,
      sample: demoMode,
    });
    minutesUsed = typeof mins === "number" ? mins : 0;
  }

  return { supabase, user, business, demoMode, minutesUsed };
}

export function windowFromParam(w?: string): 7 | 14 | 30 {
  return w === "7" ? 7 : w === "30" ? 30 : 14;
}
