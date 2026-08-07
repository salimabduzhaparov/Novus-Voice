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

export type Urgency = "emergency" | "this_week" | "flexible";

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  trade: string | null;
  timezone: string;
  forward_to: string | null;
  sms_from: string | null;
  country: string | null; // ISO 3166-1 alpha-2
  currency: string; // ISO 4217
  language: string; // BCP-47
  avg_job_value: number | null; // denominated in `currency`
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
  is_sample: boolean;
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
  est_value_usd: number | null; // NOTE: denominated in business.currency despite the column name
  is_sample: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  business_id: string;
  lead_id: string | null;
  starts_at: string;
  ends_at: string | null;
  address: string | null;
  confirmed: boolean;
  is_sample: boolean;
  created_at: string;
}
