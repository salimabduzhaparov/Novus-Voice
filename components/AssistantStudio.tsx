"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  buildPreview,
  buildPrompt,
  type AssistantConfig,
  type Personality,
} from "@/lib/assistant";
import { getPlan, isTrial } from "@/lib/plans";
import { ArcMark, OrbitSpinner } from "@/components/Logo";
import { Icon } from "@/components/Icons";
import type { Business } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-ink-950 border border-edge px-3 py-2.5 text-body text-ink-50 placeholder:text-ink-300 hover:border-edge-strong focus:border-arc-400 transition-colors";
const cardCls = "rounded-2xl bg-ink-900 border border-edge p-5";

function Section({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cardCls}>
      <h2 className="text-card-title text-ink-50">{title}</h2>
      {help && <p className="text-caption text-ink-300 mt-0.5 mb-3">{help}</p>}
      {!help && <div className="mb-3" />}
      {children}
    </section>
  );
}

export default function AssistantStudio({
  business,
  initial,
}: {
  business: Business;
  initial: AssistantConfig;
}) {
  const router = useRouter();
  const [cfg, setCfg] = useState<AssistantConfig>(initial);
  const [saved, setSaved] = useState<AssistantConfig>(initial);
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<"configure" | "preview">(
    "configure",
  );
  const [serviceDraft, setServiceDraft] = useState("");

  const dirty = JSON.stringify(cfg) !== JSON.stringify(saved);

  // Debounced preview regeneration
  const [previewCfg, setPreviewCfg] = useState(cfg);
  const [regenerating, setRegenerating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setRegenerating(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPreviewCfg(cfg);
      setRegenerating(false);
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [cfg]);

  const preview = useMemo(
    () => buildPreview(business, previewCfg),
    [business, previewCfg],
  );
  const prompt = useMemo(() => buildPrompt(business, cfg), [business, cfg]);

  const plan = getPlan(business.plan_key);
  const langUnlocked = plan.multiLanguage || isTrial(business.plan_key);

  function set<K extends keyof AssistantConfig>(k: K, v: AssistantConfig[K]) {
    setCfg((c) => ({ ...c, [k]: v }));
  }

  function commitService(raw?: string) {
    const v = (raw ?? serviceDraft).trim().replace(/,+$/, "");
    if (!v) {
      setServiceDraft("");
      return;
    }
    // Support pasting comma-separated lists
    const items = v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const next = [...cfg.services];
    for (const item of items) {
      if (next.length >= 12) break;
      if (!next.includes(item)) next.push(item);
    }
    set("services", next);
    setServiceDraft("");
  }

  async function save() {
    setBusy(true);
    setErr(null);
    const { error } = await createClient()
      .from("businesses")
      .update({ assistant_config: cfg })
      .eq("id", business.id);
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setSaved(cfg);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
    router.refresh();
  }

  const previewPanel = (
    <div className="lg:sticky lg:top-20 self-start space-y-4">
      {/* Phone frame */}
      <div className="bg-ink-950 border border-edge-strong rounded-2xl p-1.5">
        <div className="bg-ink-900 rounded-xl overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-2.5">
            <ArcMark size={24} />
            <span className="text-card-title text-ink-50 flex-1 truncate">
              {cfg.assistant_name || "Nova"}
            </span>
            {regenerating ? (
              <OrbitSpinner size={14} />
            ) : (
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-arc-400 animate-pulse"
              />
            )}
            <span className="text-overline uppercase text-arc-300 bg-arc-400/10 border border-arc-400/30 rounded-full px-2 py-0.5">
              Simulated preview
            </span>
          </div>
          <div className="h-px bg-horizon" aria-hidden />
          <div className="max-h-[440px] overflow-y-auto p-4 space-y-3.5">
            {preview.map((t, i) =>
              t.role === "system" ? (
                <p
                  key={i}
                  className="text-center text-[11px] uppercase tracking-[0.08em] text-ink-300"
                >
                  {t.text}
                </p>
              ) : t.role === "assistant" ? (
                <div key={i} className="flex items-start gap-2 max-w-[90%]">
                  <ArcMark size={20} />
                  <div className="bg-arc-500/[0.10] border border-arc-400/[0.14] rounded-xl rounded-tl-sm px-3 py-2 text-body text-ink-50">
                    {t.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[90%] bg-white/[0.05] border border-edge-faint rounded-xl rounded-tr-sm px-3 py-2 text-body text-ink-50">
                    {t.text}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Generated instructions */}
      <div className="rounded-xl bg-ink-900 border border-edge">
        <button
          onClick={() => setShowPrompt((v) => !v)}
          className="w-full px-4 py-3 flex items-center gap-2 text-left"
        >
          <span
            className={`text-ink-300 transition-transform ${showPrompt ? "rotate-180" : ""}`}
          >
            <Icon name="chevron-down" size={14} />
          </span>
          <span className="text-card-title text-ink-50 flex-1">
            Generated instructions
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard?.writeText(prompt).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className={`inline-flex items-center gap-1.5 text-caption font-semibold ${
              copied ? "text-good-300" : "text-ink-300 hover:text-ink-50"
            }`}
          >
            <Icon name={copied ? "check" : "copy"} size={13} />
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
        {showPrompt && (
          <div className="px-4 pb-4">
            <pre className="bg-ink-950 border border-edge rounded-lg p-3 text-caption text-ink-200 whitespace-pre-wrap max-h-64 overflow-auto font-mono">
              {prompt}
            </pre>
            <p className="text-caption text-ink-300 mt-2">
              This is exactly what your assistant is told before every call —
              it powers the live phone line once your number is connected.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="pb-20">
      {/* Mobile tabs */}
      <div className="lg:hidden mb-4 inline-flex items-center h-9 rounded-lg bg-ink-850 border border-edge p-0.5">
        {(["configure", "preview"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`h-8 px-4 rounded-[6px] text-[13px] font-semibold capitalize transition-colors ${
              mobileTab === t
                ? "bg-white/[0.08] text-ink-50"
                : "text-ink-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6">
        {/* Config column */}
        <div
          className={`space-y-4 ${mobileTab === "preview" ? "hidden lg:block" : ""}`}
        >
          <Section
            title="Identity & greeting"
            help="The first thing every caller hears."
          >
            <div className="space-y-3">
              <div>
                <label htmlFor="as-name" className="block text-caption text-ink-300 mb-1.5">
                  Assistant name
                </label>
                <input
                  id="as-name"
                  value={cfg.assistant_name}
                  onChange={(e) => set("assistant_name", e.target.value)}
                  maxLength={30}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="as-greet" className="block text-caption text-ink-300 mb-1.5">
                  Greeting
                </label>
                <textarea
                  id="as-greet"
                  value={cfg.greeting}
                  onChange={(e) => set("greeting", e.target.value)}
                  maxLength={220}
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
                <p className="text-caption text-ink-300 mt-1 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {cfg.greeting.length}/220
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-edge-faint">
                {langUnlocked ? (
                  <p className="text-caption text-ink-300 pt-2">
                    Answering in{" "}
                    <span className="text-ink-200 font-medium">
                      {business.language?.toUpperCase() || "EN"}
                    </span>{" "}
                    — change the language in Settings.
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-caption text-ink-300 pt-2">
                    <Icon name="lock" size={13} />
                    Answer in Spanish + 30 more languages — included with Crew.
                    <a href="/billing" className="text-arc-300 font-semibold hover:text-arc-200">
                      Upgrade
                    </a>
                  </p>
                )}
              </div>
            </div>
          </Section>

          <Section title="Personality" help="How the assistant carries the conversation.">
            <div className="p-1 bg-ink-950 border border-edge rounded-md grid grid-cols-3 gap-1" role="group">
              {(
                [
                  ["friendly", "Friendly"],
                  ["professional", "Professional"],
                  ["energetic", "Energetic"],
                ] as [Personality, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => set("personality", v)}
                  aria-pressed={cfg.personality === v}
                  className={`py-1.5 text-body rounded-lg transition-colors ${
                    cfg.personality === v
                      ? "bg-white/[0.06] text-ink-50 border border-edge-strong"
                      : "text-ink-300 hover:text-ink-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>

          <Section
            title="Services offered"
            help="Callers asking for anything else get a polite message taken."
          >
            <div className="flex flex-wrap gap-2 mb-2">
              {cfg.services.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-edge text-caption text-ink-200"
                >
                  {s}
                  <button
                    onClick={() =>
                      set(
                        "services",
                        cfg.services.filter((x) => x !== s),
                      )
                    }
                    aria-label={`Remove ${s}`}
                    className="text-ink-300 hover:text-ink-50"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              value={serviceDraft}
              onChange={(e) => {
                if (e.target.value.endsWith(",")) {
                  commitService(e.target.value); // commit the fresh value, not stale state
                } else setServiceDraft(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitService();
                }
              }}
              onBlur={() => commitService()}
              placeholder="Type a service and press Enter — e.g. Roof repair"
              className={inputCls}
            />
          </Section>

          <Section
            title="Emergency handling"
            help="What the assistant does when a caller is in trouble."
          >
            <textarea
              value={cfg.emergency_note}
              onChange={(e) => set("emergency_note", e.target.value)}
              maxLength={400}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Section>

          <Section title="Booking rules">
            <div className="space-y-1">
              {(
                [
                  ["ask_address", "Ask for the property address", "Needed before a crew can roll."],
                  ["ask_urgency", "Ask how urgent it is", "Emergencies get flagged and prioritized."],
                  ["offer_slots", "Offer appointment slots", "The assistant books the job, not just a message."],
                ] as [keyof AssistantConfig, string, string][]
              ).map(([key, label, help]) => {
                const on = cfg[key] as boolean;
                return (
                  <button
                    key={key}
                    onClick={() => set(key, !on as never)}
                    role="switch"
                    aria-checked={on}
                    className="w-full flex items-center gap-3 py-2.5 text-left border-b border-edge-faint last:border-0"
                  >
                    <span className="flex-1">
                      <span className="block text-body text-ink-50">{label}</span>
                      <span className="block text-caption text-ink-300">{help}</span>
                    </span>
                    <span
                      aria-hidden
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                        on ? "bg-arc-400" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
                          on ? "left-[18px]" : "left-0.5"
                        }`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section
            title="FAQs"
            help="Up to five questions the assistant can answer on the spot."
          >
            <div className="space-y-3">
              {cfg.faqs.map((f, i) => (
                <div key={i} className="rounded-lg border border-edge p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={f.q}
                      onChange={(e) => {
                        const faqs = [...cfg.faqs];
                        faqs[i] = { ...faqs[i], q: e.target.value };
                        set("faqs", faqs);
                      }}
                      placeholder="Question — e.g. Do you offer free estimates?"
                      className={inputCls}
                    />
                    <button
                      onClick={() =>
                        set(
                          "faqs",
                          cfg.faqs.filter((_, j) => j !== i),
                        )
                      }
                      aria-label="Remove FAQ"
                      className="text-ink-300 hover:text-bad-300 shrink-0 p-1.5"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                  <textarea
                    value={f.a}
                    onChange={(e) => {
                      const faqs = [...cfg.faqs];
                      faqs[i] = { ...faqs[i], a: e.target.value };
                      set("faqs", faqs);
                    }}
                    placeholder="The answer, in one or two sentences."
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />
                </div>
              ))}
              {cfg.faqs.length === 0 && (
                <div className="border border-dashed border-edge rounded-lg p-4 text-center">
                  <p className="text-caption text-ink-300">No FAQs yet.</p>
                </div>
              )}
              <button
                onClick={() => set("faqs", [...cfg.faqs, { q: "", a: "" }])}
                disabled={cfg.faqs.length >= 5}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/[0.06] border border-edge text-body font-semibold text-ink-50 hover:bg-white/[0.09] transition-colors disabled:opacity-50"
              >
                <Icon name="plus" size={14} />
                {cfg.faqs.length >= 5 ? "5 of 5 added" : "Add FAQ"}
              </button>
            </div>
          </Section>
        </div>

        {/* Preview column */}
        <div className={mobileTab === "configure" ? "hidden lg:block" : "mt-2 lg:mt-0"}>
          {previewPanel}
        </div>
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed bottom-0 inset-x-0 lg:left-[248px] z-30 bg-ink-850/95 backdrop-blur border-t border-edge">
          <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-3 flex items-center gap-3">
            <p className="text-body text-ink-200 flex-1">Unsaved changes</p>
            {err && <p className="text-caption text-bad-300">{err}</p>}
            <button
              onClick={() => setCfg(saved)}
              className="h-9 px-4 rounded-lg text-body font-semibold text-ink-200 hover:bg-white/[0.05] transition-colors"
            >
              Discard
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-lg bg-arc-400 text-ink-950 font-semibold shadow-sheen hover:bg-arc-300 transition-colors disabled:opacity-60"
            >
              {busy && <OrbitSpinner size={14} />}
              Save changes
            </button>
          </div>
        </div>
      )}
      {savedFlash && !dirty && (
        <div className="fixed bottom-5 right-5 z-30 rounded-lg bg-good-400/[0.12] border border-good-400/30 px-4 py-2.5 text-body font-semibold text-good-300">
          Saved — your assistant is updated.
        </div>
      )}
    </div>
  );
}
