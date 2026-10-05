import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readConfig } from "./config";

/**
 * Server-side client for public reads. Returns null when settings are missing
 * so callers can render the Missing state instead of throwing.
 * This client uses the anonymous key only; the service-role key is never used
 * in the browser path.
 */
export function getServerClient(): SupabaseClient | null {
  const config = readConfig();
  if (!config.configured) return null;
  return createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false },
  });
}
