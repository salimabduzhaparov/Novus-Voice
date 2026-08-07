import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses the anon key, so every query is
 * constrained by the RLS policies in supabase/migrations.
 *
 * Rows are cast at the call site using the interfaces in lib/types.ts.
 * Once the schema settles, generate real types with:
 *   supabase gen types typescript --linked > lib/database.types.ts
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
