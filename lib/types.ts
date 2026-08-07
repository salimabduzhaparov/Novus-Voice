export type CallStatus =
  | "ringing"
  | "in_progress"
  | "completed"
  | "missed"
  | "failed";

export type CallOutcome =
  | "booked"
  | "quote_requested"
  | "message_taken"
  | "spam"
  | "transferred"
  | "no_outcome";

export type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  trade: string | null;
  timezone: string;
  forward_to: string | null;
  sms_from: string | null;
  created_at: string;
}

export interface Call {
  id: string;
  business_id: string;
  vapi_call_id: string | null;
  from_number: string | null;
  to_number: string | null;
  status: CallStatus;
  outcome: CallOutcome;
  duration_seconds: number | null;
  recording_url: string | null;
  summary: string | null;
  cost_usd: number | null;
  started_at: string;
  ended_at: string | null;
}

export interface Transcript {
  id: number;
  call_id: string;
  role: "assistant" | "user" | "system";
  content: string;
  seconds_in: number | null;
  created_at: string;
}

export interface Lead {
  id: string;
  business_id: string;
  call_id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  job_type: string | null;
  urgency: string | null;
  notes: string | null;
  status: LeadStatus;
  est_value_usd: number | null;
  created_at: string;
}

/**
 * Minimal Database shape for the Supabase client generics.
 * Regenerate properly later with:
 *   supabase gen types typescript --linked > lib/database.types.ts
 */
export interface Database {
  public: {
    Tables: {
      businesses: { Row: Business; Insert: Partial<Business>; Update: Partial<Business> };
      calls: { Row: Call; Insert: Partial<Call>; Update: Partial<Call> };
      transcripts: { Row: Transcript; Insert: Partial<Transcript>; Update: Partial<Transcript> };
      leads: { Row: Lead; Insert: Partial<Lead>; Update: Partial<Lead> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
