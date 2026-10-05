export type AppConfig =
  | { configured: true; supabaseUrl: string; supabaseKey: string }
  | { configured: false; missing: string[] };

/**
 * Reads the environment once and reports exactly which settings are absent.
 * The app must show a clear "A setting is missing" screen naming these, never
 * fail silently or fall back to fake data.
 */
export function readConfig(): AppConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return { configured: false, missing };
  }
  return { configured: true, supabaseUrl, supabaseKey };
}
