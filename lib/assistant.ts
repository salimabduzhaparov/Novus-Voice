import type { Business } from "@/lib/types";

/**
 * Assistant personalization — the receptionist's brain, editable in the
 * Studio. Stored as businesses.assistant_config (jsonb). The same config
 * builds (a) the generated system prompt for Vapi and (b) a deterministic
 * simulated call so changes are testable instantly, before a number is live.
 */

export type Personality = "friendly" | "professional" | "energetic";
export type VoiceGender = "female" | "male";

export interface Faq {
  q: string;
  a: string;
}

export interface AssistantConfig {
  assistant_name: string;
  greeting: string;
  alternate_openers: string[];
  personality: Personality;
  voice_gender: VoiceGender;
  languages: string[];
  business_summary: string;
  service_area: string;
  business_hours: string;
  services: string[];
  emergency_note: string;
  redirect_line: string;
  ask_address: boolean;
  ask_urgency: boolean;
  offer_slots: boolean;
  booking_duration_minutes: number;
  confirm_critical_details: boolean;
  transfer_when_uncertain: boolean;
  faqs: Faq[];
}

export const COMMON_FAQS: Faq[] = [
  { q: "What are your opening hours?", a: "We are available during the business hours listed for this location. I can also take a message outside those hours." },
  { q: "What areas do you serve?", a: "We serve the local area and nearby communities. Share your postcode or ZIP code and I will confirm coverage." },
  { q: "Do you offer free estimates?", a: "Estimate policies depend on the job. I can collect the details and have the team confirm before your visit." },
  { q: "How much will the service cost?", a: "Pricing depends on the work required. I will take the details so the team can provide an accurate quote." },
  { q: "What is your next available appointment?", a: "I can check the live calendar and offer the next available times." },
  { q: "Do you handle emergency calls?", a: "Yes, I can flag urgent requests for priority review and transfer you to the owner when required." },
];

export function defaultConfig(business: Business): AssistantConfig {
  return {
    assistant_name: "Nova",
    greeting: `Thanks for calling ${business.name}! This is their assistant — how can I help you today?`,
    alternate_openers: [
      `Hello, you've reached ${business.name}. This is Nova. How may I help?`,
    ],
    personality: "friendly",
    voice_gender: "female",
    languages: [business.language || "en"],
    business_summary: "",
    service_area: "",
    business_hours: "Monday to Friday, 8:00 AM to 6:00 PM",
    services: business.trade ? [business.trade] : [],
    emergency_note:
      "For active emergencies, reassure the caller, flag the call as urgent, and promise a callback within the hour.",
    redirect_line:
      "I want to make sure you get the right answer. Let me connect you with the owner now.",
    ask_address: true,
    ask_urgency: true,
    offer_slots: true,
    booking_duration_minutes: 60,
    confirm_critical_details: true,
    transfer_when_uncertain: true,
    faqs: COMMON_FAQS.slice(0, 5),
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
    alternate_openers: Array.isArray(r.alternate_openers)
      ? r.alternate_openers.filter((v): v is string => typeof v === "string" && !!v.trim()).slice(0, 3)
      : d.alternate_openers,
    personality: ["friendly", "professional", "energetic"].includes(
      r.personality as string,
    )
      ? (r.personality as Personality)
      : d.personality,
    voice_gender: r.voice_gender === "male" ? "male" : "female",
    languages: Array.isArray(r.languages)
      ? r.languages.filter((v): v is string => typeof v === "string" && !!v.trim()).slice(0, 4)
      : d.languages,
    business_summary: r.business_summary?.trim() || d.business_summary,
    service_area: r.service_area?.trim() || d.service_area,
    business_hours: r.business_hours?.trim() || d.business_hours,
    services: Array.isArray(r.services)
      ? r.services.filter((s): s is string => typeof s === "string").slice(0, 12)
      : d.services,
    emergency_note: r.emergency_note?.trim() || d.emergency_note,
    redirect_line: r.redirect_line?.trim() || d.redirect_line,
    ask_address: r.ask_address ?? d.ask_address,
    ask_urgency: r.ask_urgency ?? d.ask_urgency,
    offer_slots: r.offer_slots ?? d.offer_slots,
    booking_duration_minutes: [30, 45, 60, 90, 120].includes(Number(r.booking_duration_minutes))
      ? Number(r.booking_duration_minutes)
      : d.booking_duration_minutes,
    confirm_critical_details: r.confirm_critical_details ?? d.confirm_critical_details,
    transfer_when_uncertain: r.transfer_when_uncertain ?? d.transfer_when_uncertain,
    faqs: Array.isArray(r.faqs)
      ? r.faqs
          .filter(
            (f): f is Faq =>
              !!f && typeof f.q === "string" && typeof f.a === "string",
          )
          .slice(0, 12)
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
    `Speak ${cfg.languages.join(", ") || business.language || "en"}. Automatically continue in the caller's language when it is one of these configured languages. ${TONE[cfg.personality]}`,
    ``,
    `Open every call with: "${cfg.greeting}"`,
    ...(cfg.alternate_openers.length
      ? [`Approved alternative openers: ${cfg.alternate_openers.map((opener) => `"${opener}"`).join("; ")}. Use the primary opener by default and an alternative only when it better matches the caller's language or returning-caller context.`]
      : []),
    ``,
    `Your job is to capture the job, not to sell. Never invent prices, availability, or guarantees.`,
    `Accuracy is the priority. Use only the business facts, FAQs, services, and live calendar supplied to you. If information is missing, say so plainly instead of guessing.`,
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
  if (cfg.business_summary || cfg.service_area || cfg.business_hours) {
    lines.push(``, `Verified business information:`);
    if (cfg.business_summary) lines.push(`About: ${cfg.business_summary}`);
    if (cfg.service_area) lines.push(`Service area: ${cfg.service_area}`);
    if (cfg.business_hours) lines.push(`Business hours: ${cfg.business_hours}`);
  }
  lines.push(``, `Emergencies: ${cfg.emergency_note}`);
  if (cfg.offer_slots) {
    lines.push(
      ``,
      `When the caller is ready to book, query the connected calendar, offer only slots returned as available, and create a ${cfg.booking_duration_minutes}-minute appointment after the caller chooses. Never claim a booking succeeded until the booking tool confirms it.`,
    );
  }
  if (cfg.faqs.length > 0) {
    lines.push(``, `Common questions:`);
    for (const f of cfg.faqs) lines.push(`Q: ${f.q}\nA: ${f.a}`);
  }
  lines.push(
    ...(cfg.transfer_when_uncertain
      ? [
          ``,
          `If you cannot confidently fulfil the request, say: "${cfg.redirect_line}" Then use the transfer tool for the owner's verified number.`,
        ]
      : []),
    ``,
    cfg.confirm_critical_details
      ? `Before closing, repeat the caller's name, callback number, appointment date/time, and address. Ask the caller to correct anything inaccurate.`
      : `Close by repeating the callback number and confirming next steps.`,
    `Keep replies under two sentences.`,
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

  const ask = `Thanks, Sam. What's the best number for a callback?`;
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
