import { createClient } from "@supabase/supabase-js";

// Uses dummy values to prevent crashing if the user hasn't created the project yet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummyproject.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to check if Supabase is actually configured by the user
export const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
};
