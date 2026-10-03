import "server-only";

import { auth, createClient } from "@repo/auth/server";

/**
 * Profiles of the members of the caller's active organization. Runs as the
 * signed-in user, so Row Level Security decides what is visible.
 */
export const getOrganizationMembers = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error("Not signed in to an organization");
  }

  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("organization_id", orgId);

  if (error) {
    throw error;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in(
      "id",
      memberships.map((membership) => membership.user_id)
    );

  if (profilesError) {
    throw profilesError;
  }

  return profiles;
};
