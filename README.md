# Novus Voice

AI phone receptionist for home-services trades. Answers missed calls, captures
the lead, and shows it in a dashboard.

**Stack:** Next.js (Vercel) · Supabase (Postgres + auth) · Vapi (voice AI) · Twilio (phone number)

---

## Security: read this first

- `SUPABASE_SERVICE_ROLE_KEY` (or `sb_secret_...`) **bypasses every database
  security rule.** It belongs in exactly two places: Vercel environment
  variables and your local `.env.local`. Never in a screenshot, a chat message,
  a commit, or a client-side file.
- Any variable named `NEXT_PUBLIC_*` is shipped to the visitor's browser and is
  readable by anyone. Only the project URL and the anon/publishable key go there.
- If a secret key is ever exposed, **rotate it** in Supabase → Settings → API
  Keys. Deleting the message it appeared in does nothing.

---

## Setup

### 1. Database

Open Supabase → **SQL Editor** → **New query**. Paste the entire contents of
`supabase/migrations/0001_init.sql` and click **Run**.

Then Table Editor → confirm `businesses`, `phone_numbers`, `calls`,
`transcripts`, `leads`, `appointments` exist and each shows **RLS enabled**.

> No CLI needed. If you prefer it: `supabase link --project-ref <ref> && supabase db push`

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill it in.

Supabase renamed its keys — either generation works, map them like this:

| Env var | Old name | New name |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` | `sb_secret_...` |

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account, and fill in the onboarding form
with your client's business name and Twilio number in E.164 format (`+1555...`).

### 4. Deploy

Push to GitHub, then Vercel → **Add New → Project** → import the repo. Add all
seven environment variables **before** clicking Deploy. Env var changes require
a redeploy to take effect.

### 5. Vapi

1. Vapi → Phone Numbers → import your Twilio number
2. Vapi → Assistants → create one, paste the prompt below
3. Set **Server URL** to `https://YOUR-APP.vercel.app/api/vapi`
4. Set **Server URL Secret** to the same string as `VAPI_WEBHOOK_SECRET`
5. Attach the assistant to the number

Enable these server messages on the assistant: `status-update`, `transcript`,
`end-of-call-report`.

---

## Assistant prompt (starting point)

```
You are the receptionist for {{businessName}}, a {{trade}} company.

Your job is to capture the job, not to sell. Be warm, fast, and concrete.
Never invent prices, availability, or guarantees.

Collect, in this order:
1. Caller's name
2. Best callback number (confirm it back digit by digit)
3. What's wrong, in their words
4. Property address
5. Urgency: emergency / this week / flexible

If it's an active emergency (water pouring in, no heat in winter, gas smell),
say you're flagging it as urgent and that someone will call within the hour.
For a gas smell, tell them to leave the property and call 911 first.

If asked for a price: "I can't quote over the phone, but I'll have someone
get you a number today."

Close by repeating the callback number and confirming someone will follow up.
Keep replies under two sentences.
```

Set the assistant's **structured data** extraction to return:
`name`, `phone`, `email`, `address`, `jobType`, `urgency`, and `outcome`
(one of `booked`, `quote_requested`, `message_taken`, `spam`, `transferred`).
The webhook reads these to create the lead row.

---

## Project layout

```
app/
  api/vapi/route.ts    Vapi webhook — verifies secret, writes calls/leads
  dashboard/page.tsx   Stats, leads, calls
  login/page.tsx       Email + password auth
components/            SignOutButton, Onboarding
lib/
  supabase/client.ts   Browser client (anon key, RLS applies)
  supabase/server.ts   Server client + admin client (service_role)
  types.ts             Row interfaces
middleware.ts          Refreshes the auth session cookie
supabase/migrations/   The SQL to paste into Supabase
```

## Before you sell this

- [ ] Sign up a second test account and confirm it sees **zero** of the first
      account's calls. This is the whole product promise.
- [ ] Move Supabase to the Pro plan. Free projects pause after a week of
      inactivity, which silently kills a paying client's phone line.
- [ ] Add call recording consent to the greeting if your state requires
      two-party consent.

## Known gaps

- No SMS follow-up yet — Twilio credentials are wired in `.env` but the send
  path is not built.
- No appointment booking UI; the `appointments` table exists but is unused.
- No billing.
- One business per user in the dashboard (the schema supports many).
