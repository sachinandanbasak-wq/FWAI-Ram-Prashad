import { readConfig } from "./config";
import { getServerClient } from "./supabase";

export type SettingsState =
  | { status: "missing"; missing: string[] }
  | { status: "failed"; message: string }
  | { status: "empty" }
  | { status: "ok"; settings: Record<string, unknown> };

/**
 * Loads settings from the database. Distinguishes the three states so the UI
 * can show Missing / Empty / Failed exactly as the PRD requires.
 */
export async function loadSettings(): Promise<SettingsState> {
  const config = readConfig();
  if (!config.configured) {
    return { status: "missing", missing: config.missing };
  }

  const client = getServerClient();
  if (!client) {
    return {
      status: "failed",
      message: "The database client could not be created.",
    };
  }

  const { data, error } = await client.from("settings").select("key, value");

  if (error) {
    return { status: "failed", message: error.message };
  }
  if (!data || data.length === 0) {
    return { status: "empty" };
  }

  const settings: Record<string, unknown> = {};
  for (const row of data as Array<{ key: string; value: unknown }>) {
    settings[row.key] = row.value;
  }
  return { status: "ok", settings };
}
