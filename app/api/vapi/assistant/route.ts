import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPrompt, parseConfig } from "@/lib/assistant";
import type { Business } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = process.env.VAPI_PRIVATE_KEY;
  if (!apiKey) return NextResponse.json({ synced: false, reason: "vapi_not_configured" });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: businessRaw } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();
  const business = businessRaw as Business | null;
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  const config = parseConfig(business, business.assistant_config);
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || req.nextUrl.origin;
  const tools: object[] = [];
  if (config.transfer_when_uncertain && business.forward_to) {
    tools.push({
      type: "transferCall",
      destinations: [{ type: "number", number: business.forward_to, message: config.redirect_line }],
    });
  }

  const payload = {
    name: `${business.name} — ${config.assistant_name}`.slice(0, 80),
    firstMessage: config.greeting,
    model: {
      provider: "openai",
      model: process.env.VAPI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: buildPrompt(business, config) }],
      tools,
    },
    voice: {
      provider: "vapi",
      voiceId: config.voice_gender === "male" ? "Elliot" : "Savannah",
      version: 2,
      language: config.languages.length > 1 ? "auto" : config.languages[0] || "en",
    },
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: config.languages.length > 1 ? "multi" : config.languages[0] || "en",
    },
    serverUrl: `${origin}/api/vapi`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
    serverMessages: ["status-update", "transcript", "end-of-call-report"],
  };

  const assistantId = business.vapi_assistant_id;
  const response = await fetch(
    assistantId ? `https://api.vapi.ai/assistant/${assistantId}` : "https://api.vapi.ai/assistant",
    {
      method: assistantId ? "PATCH" : "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );
  const assistant = await response.json();
  if (!response.ok || !assistant.id) {
    console.error("Vapi assistant sync failed", assistant?.message || response.status);
    return NextResponse.json({ error: "The live phone assistant could not be updated." }, { status: 502 });
  }
  if (!assistantId) {
    const { error } = await supabase
      .from("businesses")
      .update({ vapi_assistant_id: assistant.id })
      .eq("id", business.id);
    if (error) return NextResponse.json({ error: "Assistant was created but could not be linked." }, { status: 500 });
  }
  return NextResponse.json({ synced: true, assistantId: assistant.id });
}
