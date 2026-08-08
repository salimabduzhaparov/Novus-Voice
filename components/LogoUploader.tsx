"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OrbitSpinner } from "@/components/Logo";
import type { Business } from "@/lib/types";

export default function LogoUploader({ business }: { business: Business }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setErr("Logo must be under 2 MB.");
      return;
    }
    // Extension comes from the MIME type, never the filename — filenames can
    // carry '?' or anything else that breaks the public URL.
    const MIME_EXT: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
    };
    const ext = MIME_EXT[file.type];
    if (!ext) {
      setErr("Please upload a PNG, JPG, or WebP image.");
      return;
    }
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const path = `${business.id}/logo.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) {
      setBusy(false);
      setErr(upErr.message);
      return;
    }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    const url = `${data.publicUrl}?v=${Date.now()}`; // bust stale cache
    const { error: dbErr } = await supabase
      .from("businesses")
      .update({ logo_url: url })
      .eq("id", business.id);
    setBusy(false);
    if (dbErr) {
      setErr(dbErr.message);
      return;
    }
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-edge bg-ink-900 p-5">
      <h2 className="text-section text-ink-50 mb-1">Your logo</h2>
      <p className="text-caption text-ink-300 mb-4">
        Shown in your sidebar and, later, on customer-facing texts and emails.
        PNG or JPG, up to 2 MB.
      </p>
      <div className="flex items-center gap-4">
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt="Business logo"
            className="size-14 rounded-xl object-cover border border-edge"
          />
        ) : (
          <span className="size-14 rounded-xl bg-meridian grid place-items-center text-section font-semibold text-ink-950">
            {business.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/[0.06] border border-edge text-body font-semibold text-ink-50 hover:bg-white/[0.09] hover:border-edge-strong transition-colors disabled:opacity-50"
          >
            {busy && <OrbitSpinner size={14} />}
            {business.logo_url ? "Replace logo" : "Upload logo"}
          </button>
          {err && <p className="text-caption text-bad-300 mt-2">{err}</p>}
        </div>
      </div>
    </section>
  );
}
