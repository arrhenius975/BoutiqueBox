
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined. Please check your .env file for NEXT_PUBLIC_SUPABASE_URL.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is not defined. Please check your .env file for NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

// Validate if the URL is a valid http/https URL before attempting to create the client
try {
  new URL(supabaseUrl);
} catch (e) {
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}. Please check your .env file for NEXT_PUBLIC_SUPABASE_URL.`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

