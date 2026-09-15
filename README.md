# Novus Voice

AI phone receptionist for service businesses — answers every call 24/7, books
the job, captures the lead, and shows the owner the revenue it recovered.
Global-ready: every money amount, timestamp, and phone number renders in the
business's own currency, timezone, and language.

**Stack:** Next.js 16 (Vercel) · React 19 · Supabase (Postgres + Auth, RLS everywhere) · Vapi (voice AI) · Twilio (numbers)

Built by [Novus Co.](https://www.novuswebsites.com/)

---

## What's in the product (v3)

| Page | What it does |
|---|---|
| **Dashboard** | 4 headline stats with vs-prior-period deltas, estimated-revenue tile (booked jobs × avg job value, always labeled *Estimated*), after-hours revenue callout, call-volume chart, outcomes breakdown, recent calls. 7/14/30-day window. |
| **Calls** | Filterable, searchable log. Each call opens to a full transcript (chat bubbles), summary, recording player, and the lead it produced. |
| **Leads** | Pipeline with status chips (new → contacted → quoted → won/lost), one-click status changes, pipeline + won value totals. |
| **Appointments** | Upcoming and past appointments, live Google Calendar connection, availability checks, automatic event creation, and sync state. |
| **Assistant Studio** | Female/male voice, up to four simultaneous languages, alternate openers, approved business knowledge, FAQ presets, booking rules, accuracy guardrails, and human handoff. |
| **Billing** | Stripe Checkout for Essential, Professional, and Business Plus plus one-time additional-minute packs. |
| **Settings** | Business profile + locale, average job value, AI receptionist line and owner transfer line, branding, and sample-data controls. |

**Demo mode:** new accounts are auto-seeded with two weeks of realistic
roofing-company data (53 calls, 24 leads, 11 appointments, 3 full
transcripts) so the first thing anyone sees is a busy dashboard. The moment
one real call arrives, samples vanish from every stat. Load/clear any time in
Settings.

## Security model

- RLS on every table; each user sees only their own business's rows. The
  ownership helper lives in a private schema so it is not callable via the
  public API.
- The webhook authenticates with a shared secret (`x-vapi-secret`) and is
  idempotent on redelivery (calls upsert on `vapi_call_id`; one lead per call
  enforced by a unique index).
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it `NEXT_PUBLIC_`.
- Recommended dashboard toggle: Authentication → Settings → **enable leaked
  password protection** (one advisory the SQL can't fix).

## Setup

Database migrations in `supabase/migrations/` are the source of truth. Run
`0006_billing_calendar.sql` on existing v2 installations before deploying v3;
for a fresh project, run every migration in order in the SQL Editor.

Environment variables (Vercel → Settings → Environment Variables):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret key — server only |
| `VAPI_PRIVATE_KEY` | Vapi API key |
| `VAPI_WEBHOOK_SECRET` | long random string, same value set in Vapi |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | for SMS follow-up (next phase) |
| `NEXT_PUBLIC_APP_URL` | canonical app origin, e.g. `https://voice.example.com` |
| `STRIPE_SECRET_KEY` | Stripe secret key — server only |
| `STRIPE_WEBHOOK_SECRET` | signing secret for `/api/stripe/webhook` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth web-app credentials |
| `OAUTH_STATE_SECRET` | random secret used to sign Calendar OAuth state |

Stripe price IDs are optional. Without them, Checkout uses the names and
prices from `lib/plans.ts`. To manage prices in Stripe instead, provide
`STRIPE_PRICE_SOLO_MONTHLY`, `STRIPE_PRICE_SOLO_ANNUAL`, the corresponding
`CREW` and `FLEET` variables, and optionally `STRIPE_PRICE_MINUTES_100`,
`STRIPE_PRICE_MINUTES_500`, and `STRIPE_PRICE_MINUTES_1000`.

The app also falls back to the Vercel↔Supabase integration's auto-injected
`SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` (see `next.config.mjs`), so it
deploys even with only the integration connected.

Local: `npm install && npm run dev` with the same vars in `.env.local`.

## Going live with a real phone number

1. Vapi → Phone Numbers → import the client's Twilio number
2. Vapi → Assistants → create one (prompt below), set **Server URL** to
   `https://YOUR-APP.vercel.app/api/vapi` and **Server URL Secret** to your
   `VAPI_WEBHOOK_SECRET`
3. Enable server messages: `status-update`, `transcript` (finals),
   `end-of-call-report`
4. Add the number to the business in the `phone_numbers` table — the webhook
   routes calls to the business that owns the dialled number
5. In the app: Settings shows the line as **Live** once `vapi_number_id` is set

Assistant Studio publishes saved prompt, language, and voice changes directly
to Vapi. It uses Vapi Voice V2 with automatic language detection when more
than one language is enabled: Savannah for the female option and Elliot for
the male option.

### Assistant prompt (starting point)

```
You are the receptionist for {{businessName}}, a {{trade}} company.
Speak {{language}}. Your job is to capture the job, not to sell.
Be warm, fast, and concrete. Never invent prices, availability, or guarantees.

Collect in order: caller's name; best callback number (confirm it back);
what's wrong in their words; property address; urgency (emergency /
this week / flexible).

If it's an active emergency (water coming in, no heat, gas smell), say you're
flagging it as urgent and someone will call within the hour. For a gas smell,
tell them to leave the property and call emergency services first.

If asked for a price: "I can't quote over the phone, but I'll have someone
get you a number today."

Close by repeating the callback number and confirming next steps.
Keep replies under two sentences.
```

Set structured-data extraction to return: `name`, `phone`, `email`,
`address`, `jobType`, `urgency`, `outcome` (one of `booked`,
`quote_requested`, `message_taken`, `spam`, `transferred`), plus ISO-8601
`appointmentStart` and `appointmentEnd` when booked. The webhook creates the
lead, appointment, and Google Calendar event.

For live availability during a call, add a Vapi server tool that POSTs to
`/api/vapi/calendar` with the `x-vapi-secret` header. Use `action:
"availability"` with the dialled `toNumber`, ISO `start`, and ISO `end`; use
`action: "book"` with the selected start/end and caller details. The endpoint
rechecks availability before creating a booking so two callers cannot claim
the same slot.

## Design system

Navy ink surface scale + light-blue "arc" accent, derived from the Novus
orbital-arc mark. Chart palette machine-validated for contrast and
color-blind safety on the dark surface. Signature details: the satellite dot
(active nav, live status), the horizon hairline, the orbit focus ring, and
the 270° arc spinner. Tokens live in `tailwind.config.ts`.

## Roadmap

- SMS missed-call text-back + follow-up sequences (credentials already wired)
- Multi-business switcher / agency console (schema supports it today)
- Team members and roles
- Per-business business-hours editor (after-hours is Mon–Fri 8–18 tonight)
- Lead value/notes inline editing and CSV export
- Translated UI (data layer is already locale-aware)
- Rename `est_value_usd` → `est_value` (it already stores business currency)

## Before selling to a client

- [ ] Second test account sees zero of the first account's data (RLS check)
- [ ] Supabase Pro plan — free projects pause after 1 week idle, which would
      silently kill a client's phone line
- [ ] Call-recording consent line in the greeting where required by law
- [ ] Enable leaked-password protection (Auth → Settings)
