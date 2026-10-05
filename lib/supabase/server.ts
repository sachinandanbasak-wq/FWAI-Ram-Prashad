import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readConfig } from "@/lib/config";

/**
 * Server client that carries the signed-in user's cookies, so row-level
 * security is applied as that user (not as an anonymous visitor).
 * Returns null when settings are missing so callers can show the Missing state.
 */
export async function createSupabaseServerClient() {
  const config = readConfig();
  if (!config.configured) return null;

  const cookieStore = await cookies();

  return createServerClient(config.supabaseUrl, config.supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
