import { createBrowserClient } from "@supabase/ssr";
import { readConfig } from "@/lib/config";

/**
 * Browser client for interactive screens. Uses the public key only; the
 * service-role key must never reach this code.
 */
export function createSupabaseBrowserClient() {
  const config = readConfig();
  if (!config.configured) return null;
  return createBrowserClient(config.supabaseUrl, config.supabaseKey);
}
