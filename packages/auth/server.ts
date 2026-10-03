import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { keys } from "./keys";

export const createClient = async () => {
  const cookieStore = await cookies();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } =
    keys();

  if (!(NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
    throw new Error(
      "Supabase requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createServerClient(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
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
            // The proxy refreshes the session, so this can be ignored.
          }
        },
      },
    }
  );
};

export const currentUser = async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return data.user ?? null;
};

/**
 * Resolves the caller's identity and organization.
 *
 * SECURITY: the organization is read from `app_metadata`, which only the
 * server (secret key) can write. `user_metadata` is editable by the user via
 * `supabase.auth.updateUser()` and must never be used for authorization.
 * There is deliberately no fallback organization.
 */
export const auth = async () => {
  const user = await currentUser();
  const orgId = user?.app_metadata?.org_id;

  return {
    orgId: typeof orgId === "string" && orgId.length > 0 ? orgId : null,
    userId: user?.id ?? null,
  };
};
