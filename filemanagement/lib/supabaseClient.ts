// supabase/client.ts
import { createClient } from "@supabase/supabase-js";

// URL dan Key Supabase dari environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables (URL or Anon Key)");
}

// Inisialisasi Supabase Client
// Kita gunakan createClient di sini karena ini untuk sisi client (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);