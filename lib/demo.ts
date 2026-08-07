import type { SupabaseClient } from "@supabase/supabase-js";
import type { Business } from "@/lib/types";

/**
 * Deterministic two-week sample dataset — "Summit Ridge Roofing".
 * Seeded relative to the moment of loading so the demo always looks fresh.
 * Every row carries is_sample=true and can be removed with one click.
 * All phone numbers use the reserved fictional 555-01XX range.
 * recording_url stays null everywhere — we never fake audio.
 */

// ---------------------------------------------------------------------------
// Timezone-correct instant construction: "day offset D at HH:MM wall time in
// TZ" → UTC Date. Two-pass offset correction handles DST edges.
// ---------------------------------------------------------------------------
function tzOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) =>
    parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  let hour = get("hour");
  if (hour === 24) hour = 0;
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second"),
  );
  return asUtc - date.getTime();
}

function instantAt(dayOffset: number, hhmm: string, tz: string): Date {
  const [hh, mm] = hhmm.split(":").map(Number);
  // Today's LOCAL calendar date in tz, then step whole days in pure UTC —
  // DST-safe (fixed-milliseconds day stepping can skip/duplicate a date).
  const todayLocal = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  const target = new Date(
    Date.UTC(todayLocal[0], todayLocal[1] - 1, todayLocal[2] + dayOffset, 12),
  );
  const guess = new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
      hh,
      mm,
      0,
    ),
  );
  let result = new Date(guess.getTime() - tzOffsetMs(guess, tz));
  result = new Date(guess.getTime() - tzOffsetMs(result, tz));
  return result;
}

// ---------------------------------------------------------------------------
// Dataset literals
// ---------------------------------------------------------------------------
type CallSpec = {
  key?: string; // referenced by leads/transcripts
  d: number;
  t: string;
  dur: number;
  status: "completed" | "missed" | "failed";
  outcome:
    | "booked"
    | "quote_requested"
    | "message_taken"
    | "spam"
    | "transferred"
    | "no_outcome";
  last4: string;
  summary: string;
};

const CALLS: CallSpec[] = [
  // day -13
  { d: -13, t: "10:05", dur: 128, status: "completed", outcome: "message_taken", last4: "0142", summary: "Caller asked about gutter guard options; message taken for a callback with pricing." },
  { d: -13, t: "14:22", dur: 204, status: "completed", outcome: "quote_requested", key: "Q1", last4: "0117", summary: "Quote request: shingle repair over garage, visible granule loss. Flexible timing; email captured for written estimate." },
  { d: -13, t: "19:40", dur: 246, status: "completed", outcome: "booked", key: "B1", last4: "0163", summary: "After-hours: attic leak near chimney flashing. Booked inspection for next morning 10:30." },
  // day -12
  { d: -12, t: "08:30", dur: 232, status: "completed", outcome: "booked", key: "B2", last4: "0128", summary: "Skylight flashing leak in home office. Booked repair visit same week; caller confirmed address and gate code." },
  { d: -12, t: "11:15", dur: 22, status: "completed", outcome: "spam", last4: "0190", summary: "Robocall about business loan offers. Identified as spam and ended." },
  { d: -12, t: "15:45", dur: 186, status: "completed", outcome: "quote_requested", key: "Q2", last4: "0151", summary: "Quote request: full replacement on a ranch house, ~1,400 sq ft. Comparing three companies; prefers written quote by email." },
  { d: -12, t: "21:10", dur: 104, status: "completed", outcome: "message_taken", last4: "0175", summary: "After-hours: tenant reported ceiling stain. Property manager wants a callback before noon." },
  // day -11
  { d: -11, t: "09:12", dur: 158, status: "completed", outcome: "quote_requested", key: "Q3", last4: "0136", summary: "Quote request: insurance inspection after wind damage claim. Adjuster visit scheduled; wants contractor present." },
  { d: -11, t: "13:30", dur: 62, status: "completed", outcome: "transferred", last4: "0109", summary: "Existing customer with billing question. Warm-transferred to the office line." },
  { d: -11, t: "17:25", dur: 214, status: "completed", outcome: "booked", key: "B3", last4: "0184", summary: "Loose ridge cap after windstorm. Booked repair for Thursday morning; ladder access confirmed." },
  // day -10
  { d: -10, t: "10:44", dur: 18, status: "completed", outcome: "spam", last4: "0192", summary: "Automated 'Google listing verification' call. Identified as spam and ended." },
  { d: -10, t: "16:20", dur: 96, status: "completed", outcome: "no_outcome", last4: "0121", summary: "Caller asked service-area question (Bayonne). Confirmed coverage; caller will call back after talking to spouse." },
  // day -9 — the hailstorm morning
  { d: -9, t: "05:40", dur: 292, status: "completed", outcome: "booked", key: "B4", last4: "0147", summary: "Storm emergency: hail damage, water in kitchen. Booked emergency tarp for 8:00 AM; caller advised on containment." },
  { d: -9, t: "06:15", dur: 218, status: "completed", outcome: "quote_requested", key: "Q4", last4: "0158", summary: "Storm damage inspection request after overnight hail. Wants crew this week; photos offered by email." },
  { d: -9, t: "07:28", dur: 197, status: "completed", outcome: "quote_requested", key: "Q5", last4: "0169", summary: "Hail damage on two-year-old roof; concerned about warranty. Inspection quote requested." },
  { d: -9, t: "08:10", dur: 240, status: "completed", outcome: "booked", key: "B5", last4: "0112", summary: "Storm damage: missing shingles over bedroom. Booked same-day emergency repair slot." },
  { d: -9, t: "09:05", dur: 176, status: "completed", outcome: "quote_requested", key: "Q6", last4: "0133", summary: "Neighbor referral after storm. Wants full inspection and quote; scheduled callback with estimator." },
  { d: -9, t: "10:30", dur: 262, status: "completed", outcome: "booked", key: "B6", last4: "0155", summary: "Hail-damaged gutters and downspouts. Booked combined gutter/roof assessment." },
  { d: -9, t: "12:15", dur: 118, status: "completed", outcome: "message_taken", last4: "0166", summary: "Insurance company office requesting documentation for a claim. Message routed to office." },
  { d: -9, t: "14:50", dur: 74, status: "completed", outcome: "transferred", last4: "0102", summary: "Supplier delivery scheduling call. Transferred to site foreman." },
  { d: -9, t: "20:35", dur: 154, status: "completed", outcome: "quote_requested", key: "Q7", last4: "0178", summary: "Evening caller: slow leak spotted during storm cleanup. Quote requested for flashing reseal." },
  // day -8
  { d: -8, t: "08:55", dur: 132, status: "completed", outcome: "message_taken", last4: "0119", summary: "Caller checking on yesterday's tarp job; wants confirmation crew returns for full repair. Message taken." },
  { d: -8, t: "12:40", dur: 26, status: "completed", outcome: "spam", last4: "0195", summary: "Telemarketer offering SEO services. Identified as spam and ended." },
  { d: -8, t: "15:10", dur: 58, status: "completed", outcome: "no_outcome", last4: "0126", summary: "Wrong number — caller was looking for a different company. Politely redirected." },
  { d: -8, t: "18:30", dur: 172, status: "completed", outcome: "quote_requested", key: "Q8", last4: "0139", summary: "After-hours quote request: moss treatment and roof cleaning on a shaded colonial." },
  // day -7
  { d: -7, t: "11:20", dur: 188, status: "completed", outcome: "quote_requested", key: "Q9", last4: "0144", summary: "Weekend caller: comparing quotes for architectural shingle upgrade. Email captured." },
  { d: -7, t: "16:05", dur: 20, status: "completed", outcome: "spam", last4: "0197", summary: "Recorded warranty-expiration robocall. Identified as spam and ended." },
  // day -6
  { d: -6, t: "10:15", dur: 0, status: "missed", outcome: "no_outcome", last4: "0131", summary: "Caller hung up before connecting." },
  { d: -6, t: "14:35", dur: 164, status: "completed", outcome: "quote_requested", key: "Q10", last4: "0153", summary: "Quote request: replace three cracked vent boots found during solar install." },
  // day -5
  { d: -5, t: "08:20", dur: 226, status: "completed", outcome: "booked", key: "B7", last4: "0165", summary: "Recurring leak returned after heavy rain. Booked diagnostic visit; prior repair history noted." },
  { d: -5, t: "11:50", dur: 108, status: "completed", outcome: "message_taken", last4: "0172", summary: "HOA board member asking about multi-building bid. Message taken for owner." },
  { d: -5, t: "13:25", dur: 44, status: "completed", outcome: "no_outcome", last4: "0106", summary: "Caller asked about hours and service area; no further action requested." },
  { d: -5, t: "19:15", dur: 82, status: "completed", outcome: "transferred", last4: "0187", summary: "After-hours: existing customer about tomorrow's start time. Transferred to on-call line." },
  // day -4
  { d: -4, t: "09:40", dur: 24, status: "completed", outcome: "spam", last4: "0193", summary: "Automated solar-panel sales call. Identified as spam and ended." },
  { d: -4, t: "11:20", dur: 168, status: "completed", outcome: "quote_requested", key: "QB", last4: "0148", summary: "Quote request: full replacement, ~2,000 sq ft two-story colonial, 30-year-old curling shingles. Comparing quotes, flexible timing. Callback promised before 5 PM; email captured." },
  { d: -4, t: "15:30", dur: 96, status: "completed", outcome: "message_taken", last4: "0161", summary: "Caller rescheduling Friday's inspection to the following week. Message taken for scheduler." },
  { d: -4, t: "17:50", dur: 234, status: "completed", outcome: "booked", key: "B8", last4: "0124", summary: "Chimney flashing leak confirmed by home inspector. Booked repair; report will be emailed." },
  // day -3
  { d: -3, t: "10:10", dur: 36, status: "completed", outcome: "no_outcome", last4: "0113", summary: "Caller asked whether company handles flat commercial roofs; referred to partner firm." },
  { d: -3, t: "14:05", dur: 24, status: "completed", outcome: "spam", key: "QC", last4: "0199", summary: "Automated telemarketing call about Google listing. Identified as spam and ended." },
  { d: -3, t: "16:40", dur: 142, status: "completed", outcome: "quote_requested", key: "Q11", last4: "0157", summary: "Quote request: gutter replacement with leaf guards on a split-level." },
  { d: -3, t: "20:20", dur: 208, status: "completed", outcome: "booked", key: "B9", last4: "0181", summary: "After-hours: active drip in hallway during rain. Booked priority visit for the flexible afternoon slot." },
  // day -2
  { d: -2, t: "09:30", dur: 114, status: "completed", outcome: "message_taken", last4: "0138", summary: "Realtor requesting roof certification letter for a closing. Message taken with deadline." },
  { d: -2, t: "12:20", dur: 68, status: "completed", outcome: "transferred", last4: "0104", summary: "Existing customer warranty question. Transferred to office." },
  { d: -2, t: "15:15", dur: 8, status: "failed", outcome: "no_outcome", last4: "0129", summary: "Call dropped on connect — carrier failure." },
  { d: -2, t: "18:05", dur: 178, status: "completed", outcome: "quote_requested", key: "Q12", last4: "0174", summary: "After-hours quote request: ice-dam prevention and attic ventilation review before winter." },
  // day -1
  { d: -1, t: "08:15", dur: 152, status: "completed", outcome: "quote_requested", key: "Q13", last4: "0146", summary: "Quote request: replace storm-lifted shingles on detached garage." },
  { d: -1, t: "10:50", dur: 122, status: "completed", outcome: "message_taken", last4: "0168", summary: "Supplier confirming shingle color availability. Message routed to foreman." },
  { d: -1, t: "13:40", dur: 58, status: "completed", outcome: "transferred", last4: "0107", summary: "Bank verification call for financing application. Transferred to owner." },
  { d: -1, t: "18:45", dur: 0, status: "missed", outcome: "no_outcome", last4: "0134", summary: "Caller hung up after two rings." },
  { d: -1, t: "21:47", dur: 112, status: "completed", outcome: "booked", key: "BA", last4: "0116", summary: "After-hours emergency: active ceiling leak at 214 Chestnut St. Booked emergency tarp + repair quote for 8:00 AM. Caller advised on containment." },
  // day 0 (early hours only, so the seed never creates future calls)
  { d: 0, t: "07:55", dur: 218, status: "completed", outcome: "booked", key: "B0", last4: "0159", summary: "Early caller before opening: sagging gutter pulling from fascia. Booked mid-morning visit in two days." },
  { d: 0, t: "09:25", dur: 88, status: "completed", outcome: "message_taken", last4: "0171", summary: "Caller asked for the estimator directly; message taken with preferred callback window." },
  { d: 0, t: "10:40", dur: 16, status: "completed", outcome: "spam", last4: "0196", summary: "Robocall — extended auto warranty. Identified as spam and ended." },
];

type LeadSpec = {
  callKey: string;
  name: string | null;
  job: string;
  urgency: "emergency" | "this_week" | "flexible";
  status: "new" | "contacted" | "quoted" | "won" | "lost";
  value: number | null;
  address: string | null;
  email: string | null;
  notes: string | null;
};

const LEADS: LeadSpec[] = [
  // Booked-call leads (11) — these get appointments
  { callKey: "B1", name: "Daniel Okafor", job: "Roof leak repair", urgency: "this_week", status: "won", value: 1450, address: "47 Maple Ave, Union", email: null, notes: "Chimney flashing resealed; paid on completion." },
  { callKey: "B2", name: "Priya Raman", job: "Skylight flashing", urgency: "this_week", status: "won", value: 980, address: "12 Orchard St, Cranford", email: "praman@example.com", notes: "Gate code 4417. Completed and invoiced." },
  { callKey: "B3", name: "Mike Castellano", job: "Ridge cap repair", urgency: "this_week", status: "contacted", value: 760, address: "230 Elm St, Westfield", email: null, notes: "Crew scheduled; ladder access from driveway side." },
  { callKey: "B4", name: "Sandra Whitfield", job: "Storm damage / emergency tarp", urgency: "emergency", status: "won", value: 12400, address: "88 Sycamore Rd, Springfield", email: "swhitfield@example.com", notes: "Tarp completed storm morning; full replacement approved by State Farm. Claim #SF-88213." },
  { callKey: "B5", name: "Luis Herrera", job: "Storm damage repair", urgency: "emergency", status: "contacted", value: 1850, address: "301 Grove St, Rahway", email: null, notes: "Missing shingles replaced; awaiting final walkthrough." },
  { callKey: "B6", name: "Karen Doyle", job: "Gutter + roof assessment", urgency: "this_week", status: "won", value: 2650, address: "5 Birchwood Ct, Linden", email: null, notes: "Hail-damaged gutters replaced with 6-inch seamless." },
  { callKey: "B7", name: "Tom Nguyen", job: "Recurring leak diagnostic", urgency: "this_week", status: "contacted", value: 890, address: "142 Prospect St, Summit", email: "tnguyen@example.com", notes: "Second visit — prior repair under warranty review." },
  { callKey: "B8", name: "Alicia Grant", job: "Chimney flashing repair", urgency: "flexible", status: "contacted", value: 1120, address: "76 Hillside Ave, Elizabeth", email: "agrant@example.com", notes: "Inspector report received by email." },
  { callKey: "B9", name: "Robert Feldman", job: "Priority leak visit", urgency: "emergency", status: "contacted", value: null, address: "19 Colonial Dr, Union", email: null, notes: "Hallway drip during rain; assess scope on site." },
  { callKey: "BA", name: "Maria Delgado", job: "Roof leak repair", urgency: "emergency", status: "new", value: 1850, address: "214 Chestnut St, Elizabeth", email: null, notes: "Active bedroom ceiling leak. Emergency tarp + quote booked for 8:00 AM." },
  { callKey: "B0", name: "Gene Park", job: "Gutter repair", urgency: "this_week", status: "new", value: 640, address: "58 Warren St, Cranford", email: null, notes: "Sagging gutter pulling from fascia; booked in two days." },
  // Quote-request leads (13)
  { callKey: "Q1", name: "Hannah Silva", job: "Shingle repair", urgency: "flexible", status: "quoted", value: 720, address: "33 Ridge Rd, Westfield", email: "hsilva@example.com", notes: "Written estimate sent; following up Friday." },
  { callKey: "Q2", name: "Frank Marino", job: "Full replacement", urgency: "flexible", status: "lost", value: 9800, address: "410 Lake Ave, Clark", email: "fmarino@example.com", notes: "Went with a cheaper quote from another contractor." },
  { callKey: "Q3", name: "Denise Holloway", job: "Insurance inspection", urgency: "this_week", status: "won", value: 6800, address: "27 Fairview Pl, Elizabeth", email: null, notes: "State Farm claim approved for partial reroof; adjuster met on site." },
  { callKey: "Q4", name: "Ahmed Malik", job: "Storm damage inspection", urgency: "this_week", status: "quoted", value: 480, address: "163 Morris Ave, Union", email: "amalik@example.com", notes: "Hail photos received; inspection quote delivered." },
  { callKey: "Q5", name: "Beth Kowalczyk", job: "Storm damage inspection", urgency: "this_week", status: "quoted", value: 450, address: "9 Pine St, Cranford", email: null, notes: "Two-year-old roof; warranty documents requested." },
  { callKey: "Q6", name: "Victor Osei", job: "Storm inspection + quote", urgency: "flexible", status: "contacted", value: null, address: "72 Amherst Rd, Linden", email: null, notes: "Referral from Sycamore Rd job. Estimator callback set." },
  { callKey: "Q7", name: "Janet Brower", job: "Flashing reseal", urgency: "flexible", status: "new", value: 390, address: "121 Salem Rd, Union", email: null, notes: "Slow leak found during storm cleanup." },
  { callKey: "Q8", name: "Paul Christensen", job: "Moss treatment / cleaning", urgency: "flexible", status: "new", value: 520, address: "44 Shady Ln, Summit", email: "pchristensen@example.com", notes: "Shaded colonial, heavy moss on north face." },
  { callKey: "Q9", name: "Olivia Trent", job: "Shingle upgrade", urgency: "flexible", status: "quoted", value: 14800, address: "8 Beacon Hill Rd, Westfield", email: "otrent@example.com", notes: "Architectural shingle upgrade; comparing two other bids." },
  { callKey: "Q10", name: "Sam Ferraro", job: "Vent boot replacement", urgency: "this_week", status: "new", value: 350, address: "290 Stiles St, Linden", email: null, notes: "Three cracked boots found during solar install." },
  { callKey: "Q11", name: "Grace Lindqvist", job: "Gutter replacement", urgency: "flexible", status: "new", value: null, address: "61 Dorset Dr, Clark", email: null, notes: "Wants leaf guards; measure on next visit nearby." },
  { callKey: "Q12", name: "Ray Patterson", job: "Ice-dam prevention", urgency: "flexible", status: "new", value: 1200, address: "17 Winter St, Summit", email: null, notes: "Attic ventilation review before winter." },
  { callKey: "QB", name: "Tom Kowalski", job: "Full replacement", urgency: "this_week", status: "lost", value: 1200, address: "88 Lincoln Ave, Cranford", email: "tkowalski@example.com", notes: "Unreachable after two callbacks; number rings out." },
];

type ApptSpec = {
  callKey: string; // ties to the lead created from that call
  d: number;
  t: string;
  durMin: number;
  confirmed: boolean;
};

const APPOINTMENTS: ApptSpec[] = [
  { callKey: "B1", d: -12, t: "10:30", durMin: 60, confirmed: true },
  { callKey: "B2", d: -11, t: "09:00", durMin: 90, confirmed: true },
  { callKey: "B3", d: -8, t: "08:00", durMin: 60, confirmed: true },
  { callKey: "B4", d: -9, t: "08:00", durMin: 90, confirmed: true },
  { callKey: "B5", d: -9, t: "13:00", durMin: 90, confirmed: true },
  { callKey: "B6", d: -6, t: "10:30", durMin: 60, confirmed: true },
  { callKey: "B7", d: -4, t: "08:30", durMin: 60, confirmed: false },
  { callKey: "B8", d: -1, t: "14:00", durMin: 60, confirmed: true },
  // Upcoming — these are what make the Appointments page demo live
  { callKey: "BA", d: 1, t: "08:00", durMin: 90, confirmed: true },
  { callKey: "B0", d: 2, t: "10:30", durMin: 60, confirmed: true },
  { callKey: "B9", d: 5, t: "14:00", durMin: 60, confirmed: false },
];

type TranscriptLine = { role: "assistant" | "user" | "system"; s: number; text: string };

const TRANSCRIPTS: Record<string, TranscriptLine[]> = {
  // Call A — the money shot: after-hours emergency → booked
  BA: [
    { role: "system", s: 0, text: "Call answered by Novus Voice for Summit Ridge Roofing." },
    { role: "assistant", s: 0, text: "Thanks for calling Summit Ridge Roofing. This is their after-hours assistant — I can help you right away. What's going on?" },
    { role: "user", s: 6, text: "Hi, yeah — we've got water coming through the bedroom ceiling. There's a brown patch spreading and it's dripping onto the bed." },
    { role: "assistant", s: 15, text: "That sounds stressful — let's get you sorted. If it's dripping, put a bucket under it and move anything electrical away from the wet area. Can I get your name?" },
    { role: "user", s: 27, text: "Maria Delgado." },
    { role: "assistant", s: 31, text: "Thanks, Maria. And the address of the property?" },
    { role: "user", s: 35, text: "214 Chestnut Street, Elizabeth." },
    { role: "assistant", s: 41, text: "Got it. Is water still actively coming in, or has it slowed?" },
    { role: "user", s: 48, text: "It's slowed since the rain stopped, but the patch is getting bigger." },
    { role: "assistant", s: 55, text: "Understood. I have our first emergency slot at 8:00 AM — the crew can tarp the area and quote the repair on the spot. Does 8:00 AM work?" },
    { role: "user", s: 66, text: "Yes, the earlier the better." },
    { role: "assistant", s: 70, text: "Booked: 8:00 AM at 214 Chestnut Street. Is this the best number for the crew to reach you on?" },
    { role: "user", s: 78, text: "Yes, this number." },
    { role: "assistant", s: 82, text: "Perfect, you'll get a text confirmation shortly. If it gets worse overnight, call back any time — I'm always on. Anything else?" },
    { role: "user", s: 92, text: "No, that's everything. Thank you so much." },
    { role: "assistant", s: 96, text: "You're welcome, Maria. Help arrives at 8. Good night." },
  ],
  // Call B — daytime quote request
  QB: [
    { role: "system", s: 0, text: "Call answered by Novus Voice for Summit Ridge Roofing." },
    { role: "assistant", s: 0, text: "Thanks for calling Summit Ridge Roofing, this is their assistant. How can I help today?" },
    { role: "user", s: 5, text: "Hi, I'm looking to get a quote on a roof replacement. The house is a two-story colonial, around two thousand square feet." },
    { role: "assistant", s: 15, text: "Happy to help with that. Can I get your name and the property address?" },
    { role: "user", s: 21, text: "Tom Kowalski, 88 Lincoln Avenue in Cranford." },
    { role: "assistant", s: 28, text: "Thanks, Tom. How old is the current roof, and what's prompting the replacement?" },
    { role: "user", s: 35, text: "It's about thirty years old. The shingles are curling at the edges and we lost a few in the last storm." },
    { role: "assistant", s: 46, text: "That's right at end-of-life for asphalt shingles, so replacement is the right thing to price. We can do a free on-site inspection and written estimate — would you like me to book that?" },
    { role: "user", s: 60, text: "I'm getting a few quotes first. Can someone just call me back with ballpark numbers?" },
    { role: "assistant", s: 68, text: "Of course. I'll have our estimator call you back before 5 PM today with a range for a two-thousand square foot colonial. What's the best email for the written version?" },
    { role: "user", s: 80, text: "tkowalski at example dot com." },
    { role: "assistant", s: 86, text: "Got it. You'll hear from us before 5, and the written estimate will follow by email. Anything else I can help with?" },
    { role: "user", s: 95, text: "No, that covers it. Thanks." },
    { role: "assistant", s: 98, text: "Thanks for calling, Tom. Talk soon." },
  ],
  // Call C — spam filtered
  QC: [
    { role: "assistant", s: 0, text: "Thanks for calling Summit Ridge Roofing. How can I help?" },
    { role: "user", s: 5, text: "Hello! This is an important message about your business's Google listing. Press one to—" },
    { role: "assistant", s: 12, text: "This line is for Summit Ridge Roofing customers. I'm removing this number from your list. Goodbye." },
  ],
};

// ---------------------------------------------------------------------------
// Seeder
// ---------------------------------------------------------------------------
export interface SeedResult {
  calls: number;
  leads: number;
  appointments: number;
  transcripts: number;
}

export async function clearSampleData(
  supabase: SupabaseClient,
  businessId: string,
): Promise<void> {
  const { data: sampleCalls } = await supabase
    .from("calls")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_sample", true);
  const ids = (sampleCalls ?? []).map((c: { id: string }) => c.id);

  // FK-safe order: appointments → leads → transcripts → calls
  await supabase
    .from("appointments")
    .delete()
    .eq("business_id", businessId)
    .eq("is_sample", true);
  await supabase
    .from("leads")
    .delete()
    .eq("business_id", businessId)
    .eq("is_sample", true);
  if (ids.length > 0) {
    await supabase.from("transcripts").delete().in("call_id", ids);
  }
  await supabase
    .from("calls")
    .delete()
    .eq("business_id", businessId)
    .eq("is_sample", true);
}

export async function loadSampleData(
  supabase: SupabaseClient,
  business: Business,
): Promise<SeedResult> {
  const tz = business.timezone || "America/New_York";
  const now = Date.now();

  await clearSampleData(supabase, business.id);

  // --- calls ---------------------------------------------------------------
  const callRows = CALLS.map((c) => {
    const started = instantAt(c.d, c.t, tz);
    return { spec: c, started };
  }).filter((c) => c.started.getTime() <= now);

  const { data: insertedCalls, error: callErr } = await supabase
    .from("calls")
    .insert(
      callRows.map(({ spec, started }) => ({
        business_id: business.id,
        from_number: `+1908555${spec.last4}`,
        to_number: "+19085550100",
        status: spec.status,
        outcome: spec.outcome,
        duration_seconds: spec.status === "completed" ? spec.dur : spec.dur || null,
        summary: spec.summary,
        cost_usd: spec.status === "completed" ? Math.round((spec.dur / 60) * 0.11 * 100) / 100 : null,
        is_sample: true,
        started_at: started.toISOString(),
        ended_at:
          spec.status === "completed"
            ? new Date(started.getTime() + spec.dur * 1000).toISOString()
            : null,
      })),
    )
    .select("id");

  if (callErr || !insertedCalls) {
    throw new Error(callErr?.message ?? "Failed to insert sample calls");
  }

  const callIdByKey = new Map<string, string>();
  const callStartByKey = new Map<string, Date>();
  callRows.forEach(({ spec, started }, i) => {
    if (spec.key) {
      callIdByKey.set(spec.key, (insertedCalls[i] as { id: string }).id);
      callStartByKey.set(spec.key, started);
    }
  });

  // --- leads ---------------------------------------------------------------
  const leadSpecs = LEADS.filter((l) => callIdByKey.has(l.callKey));
  const { data: insertedLeads, error: leadErr } = await supabase
    .from("leads")
    .insert(
      leadSpecs.map((l) => {
        const callStart = callStartByKey.get(l.callKey)!;
        return {
          business_id: business.id,
          call_id: callIdByKey.get(l.callKey),
          name: l.name,
          phone: `+1908555${CALLS.find((c) => c.key === l.callKey)!.last4}`,
          email: l.email,
          address: l.address,
          job_type: l.job,
          urgency: l.urgency,
          notes: l.notes,
          status: l.status,
          est_value_usd: l.value,
          is_sample: true,
          created_at: new Date(callStart.getTime() + 2 * 60_000).toISOString(),
        };
      }),
    )
    .select("id");

  if (leadErr || !insertedLeads) {
    throw new Error(leadErr?.message ?? "Failed to insert sample leads");
  }

  const leadIdByKey = new Map<string, string>();
  leadSpecs.forEach((l, i) => {
    leadIdByKey.set(l.callKey, (insertedLeads[i] as { id: string }).id);
  });

  // --- appointments --------------------------------------------------------
  const apptSpecs = APPOINTMENTS.filter((a) => leadIdByKey.has(a.callKey));
  const { error: apptErr } = await supabase.from("appointments").insert(
    apptSpecs.map((a) => {
      const starts = instantAt(a.d, a.t, tz);
      const callStart = callStartByKey.get(a.callKey)!;
      const lead = LEADS.find((l) => l.callKey === a.callKey)!;
      return {
        business_id: business.id,
        lead_id: leadIdByKey.get(a.callKey),
        starts_at: starts.toISOString(),
        ends_at: new Date(starts.getTime() + a.durMin * 60_000).toISOString(),
        address: lead.address,
        confirmed: a.confirmed,
        is_sample: true,
        created_at: new Date(
          Math.min(callStart.getTime() + 3 * 60_000, now),
        ).toISOString(),
      };
    }),
  );
  if (apptErr) throw new Error(apptErr.message);

  // --- transcripts ---------------------------------------------------------
  let transcriptCount = 0;
  for (const [key, lines] of Object.entries(TRANSCRIPTS)) {
    const callId = callIdByKey.get(key);
    if (!callId) continue;
    const { error: tErr } = await supabase.from("transcripts").insert(
      lines.map((ln) => ({
        call_id: callId,
        role: ln.role,
        content: ln.text,
        seconds_in: ln.s,
      })),
    );
    if (!tErr) transcriptCount += lines.length;
  }

  // --- demo profile fields (only fill blanks — never overwrite real data) --
  const profilePatch: Record<string, unknown> = {};
  if (business.avg_job_value == null) profilePatch.avg_job_value = 4800;
  if (business.country == null) profilePatch.country = "US";
  if (business.trade == null) profilePatch.trade = "Roofing";
  if (Object.keys(profilePatch).length > 0) {
    await supabase.from("businesses").update(profilePatch).eq("id", business.id);
  }

  return {
    calls: callRows.length,
    leads: leadSpecs.length,
    appointments: apptSpecs.length,
    transcripts: transcriptCount,
  };
}
