import { createClient as createBrowserClient } from "@repo/auth/client";
import type { Database } from "@repo/database";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<Database> | undefined;

/**
 * One Supabase client per app instance: the cookie-based browser client from
 * @repo/auth. Every query runs as the signed-in user, so Row Level Security
 * applies.
 */
export const getSupabase = () => {
  client ??= createBrowserClient();

  return client;
};
