import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  source?: string;
  created_at: string;
  updated_at: string;
  user_agent?: string;
  ip_address?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface ButtonClick {
  id: string;
  contact_id?: string;
  button_type: string;
  page_url?: string;
  clicked_at: string;
  session_id?: string;
  user_agent?: string;
  ip_address?: string;
  referrer?: string;
}

export interface EmailSubscription {
  id: string;
  contact_id?: string;
  email: string;
  subscribed: boolean;
  subscription_type: string;
  subscribed_at: string;
  unsubscribed_at?: string;
}

export interface ConversionEvent {
  id: string;
  contact_id?: string;
  event_type: string;
  event_data?: any;
  created_at: string;
}
