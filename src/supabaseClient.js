import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly at build/dev time instead of silently breaking every
  // screen — the two most common setup mistakes are a missing .env.local
  // or forgetting to restart `npm run dev` after adding one.
  // eslint-disable-next-line no-console
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local, fill in your Supabase project's URL and anon key, then restart `npm run dev`."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
