"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      className="inline-flex items-center h-9 px-4 rounded-lg border border-edge text-body font-semibold text-ink-200 hover:bg-white/[0.05] hover:text-ink-50 transition-colors"
    >
      Sign out
    </button>
  );
}
