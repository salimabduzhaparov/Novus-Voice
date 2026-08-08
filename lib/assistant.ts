import type { Business } from "@/lib/types";

/**
 * Assistant personalization — the receptionist's brain, editable in the
 * Studio. Stored as businesses.assistant_config (jsonb). The same config
 * builds (a) the generated system prompt for Vapi and (b) a deterministic
 * simulated call so changes are testable instantly, before a number is live.
 */

export type Personality = "friendly" | "professional" | "energetic";

export interface Faq {
  q: string;
  a: string;
}

export interface AssistantConfig {
  assistant_name: string;
  greeting: string;
  personality: Personality;
  services: string[];
  emergency_note: string;
  ask_address: boolean;
  ask_urgency: boolean;
  offer_slots: boolean;
  faqs: Faq[];
}

export function defaultConfig(business: Business): AssistantConfig {
  return {
    assistant_name: "Nova",
    greeting: `Thanks for calling ${business.name}! This is their assistant — how can I help you today?`,
    personality: "friendly",
    services: business.trade ? [business.trade] : [],
    emergency_note:
      "For active emergencies, reassure the caller, flag the call as urgent, and promise a callback within the hour.",
    ask_address: true,
    ask_urgency: true,
    offer_slots: true,
    faqs: [],
  };
}

export function parseConfig(
  business: Business,
  raw: unknown,
): AssistantConfig {
  const d = defaultConfig(business);
  if (!raw || typeof raw !== "object") return d;
  const r = raw as Partial<AssistantConfig>;
  return {
    assistant_name: r.assistant_name?.trim() || d.assistant_name,
    greeting: r.greeting?.trim() || d.greeting,
    personality: ["friendly", "professional", "energetic"].includes(
      r.personality as string,
    )
      ? (r.personality as Personality)
      : d.personality,
    services: Array.isArray(r.services)
      ? r.services.filter((s): s is string => typeof s === "string").slice(0, 12)
      : d.services,
    emergency_note: r.emergency_note?.trim() || d.emergency_note,
    ask_address: r.ask_address ?? d.ask_address,
    ask_urgency: r.ask_urgency ?? d.ask_urgency,
    offer_slots: r.offer_slots ?? d.offer_slots,
    faqs: Array.isArray(r.faqs)
      ? r.faqs
          .filter(
            (f): f is Faq =>
              !!f && typeof f.q === "string" && typeof f.a === "string",
          )
          .slice(0, 5)
      : d.faqs,
  };
}

const TONE: Record<Personality, string> = {
  friendly: "Warm and personable. Use the caller's name once you have it.",
  professional: "Courteous and efficient. No small talk, no filler.",
  energetic: "Upbeat and quick. Short sentences, positive language.",
};

export function buildPrompt(business: Business, cfg: AssistantConfig): string {
  const lines: string[] = [
    `You are ${cfg.assistant_name}, the phone receptionist for ${business.name}${business.trade ? `, a ${business.trade.toLowerCase()} company` : ""}.`,
    `Speak ${business.language || "en"}. ${TONE[cfg.personality]}`,
    ``,
    `Open every call with: "${cfg.greeting}"`,
    ``,
    `Your job is to capture the job, not to sell. Never invent prices, availability, or guarantees.`,
    `If asked for a price: "I can't quote over the phone, but I'll have someone get you a number today."`,
    ``,
    `Collect, in order:`,
    `1. Caller's name`,
    `2. Best callback number (confirm it back)`,
    `3. What they need, in their words`,
  ];
  let n = 4;
  if (cfg.ask_address) lines.push(`${n++}. Property address`);
  if (cfg.ask_urgency)
    lines.push(`${n++}. Urgency: emergency / this week / flexible`);
  if (cfg.services.length > 0) {
    lines.push(
      ``,
      `Services offered: ${cfg.services.join(", ")}. If the caller asks for something else, take a message rather than turning them away.`,
    );
  }
  lines.push(``, `Emergencies: ${cfg.emergency_note}`);
  if (cfg.offer_slots) {
    lines.push(
      ``,
      `When the caller is ready to book, offer the next available slot and confirm date, time, and address back to them.`,
    );
  }
  if (cfg.faqs.length > 0) {
    lines.push(``, `Common questions:`);
    for (const f of cfg.faqs) lines.push(`Q: ${f.q}\nA: ${f.a}`);
  }
  lines.push(
    ``,
    `Close by repeating the callback number and confirming next steps. Keep replies under two sentences.`,
  );
  return lines.join("\n");
}

export interface PreviewTurn {
  role: "assistant" | "user" | "system";
  text: string;
}

/**
 * Deterministic simulated call, generated from the config — this is what
 * makes the receptionist testable before a phone number is wired. Change
 * the greeting or toggles and the conversation changes instantly.
 */
export function buildPreview(
  business: Business,
  cfg: AssistantConfig,
): PreviewTurn[] {
  const service = cfg.services[0] || business.trade || "a repair";
  const turns: PreviewTurn[] = [
    {
      role: "system",
      text: `Simulated call · answered by ${cfg.assistant_name} for ${business.name}`,
    },
    { role: "assistant", text: cfg.greeting },
    {
      role: "user",
      text: `Hi — I think I need ${/^[aeiou]/i.test(service) ? "an" : "a"} ${service.toLowerCase()} visit. Water's coming in near the ceiling light.`,
    },
  ];

  const empathy =
    cfg.personality === "professional"
      ? "Understood — let's get that handled."
      : cfg.personality === "energetic"
        ? "On it! Let's get you sorted right away."
        : "Oh no — let's get that sorted for you.";
  turns.push({
    role: "assistant",
    text: `${empathy} Can I get your name?`,
  });
  turns.push({ role: "user", text: "Sam Rivera." });

  let ask = `Thanks, Sam. What's the best number for a callback?`;
  turns.push({ role: "assistant", text: ask });
  turns.push({ role: "user", text: "This one is fine — the one I'm calling from." });

  if (cfg.ask_address) {
    turns.push({
      role: "assistant",
      text: "Perfect. And the address of the property?",
    });
    turns.push({ role: "user", text: "42 Harbor Lane." });
  }
  if (cfg.ask_urgency) {
    turns.push({
      role: "assistant",
      text: "Got it. Is this an active emergency, or okay to schedule this week?",
    });
    turns.push({ role: "user", text: "It's dripping now, so… pretty urgent." });
    turns.push({
      role: "assistant",
      text: "Understood — I'm flagging this as urgent. " +
        (cfg.offer_slots
          ? "I can get a crew out first thing tomorrow at 8:00 AM — does that work?"
          : "The team will call you back within the hour."),
    });
  } else if (cfg.offer_slots) {
    turns.push({
      role: "assistant",
      text: "I can offer tomorrow at 8:00 AM or Thursday at 2:00 PM — which works better?",
    });
  }
  if (cfg.offer_slots) {
    turns.push({ role: "user", text: "Tomorrow at 8 works." });
    turns.push({
      role: "assistant",
      text: `Booked: tomorrow, 8:00 AM${cfg.ask_address ? ", 42 Harbor Lane" : ""}. You'll get a text confirmation shortly.`,
    });
  }
  if (cfg.faqs.length > 0) {
    turns.push({ role: "user", text: cfg.faqs[0].q });
    turns.push({ role: "assistant", text: cfg.faqs[0].a });
  }
  turns.push({ role: "user", text: "That's everything — thank you!" });
  turns.push({
    role: "assistant",
    text:
      cfg.personality === "energetic"
        ? "You're all set, Sam — help's on the way!"
        : "You're welcome, Sam. Help is on the way.",
  });
  return turns;
}
