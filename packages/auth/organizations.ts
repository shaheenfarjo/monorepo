import type { Database, OrgRole } from "@repo/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Cookie remembering which organization the user is working in. */
export const ACTIVE_ORGANIZATION_COOKIE = "active_org";

export interface OrganizationMembership {
  id: string;
  name: string;
  role: OrgRole;
  slug: string;
}

/** The user's organizations, oldest membership first (RLS-scoped). */
export const listMemberships = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<OrganizationMembership[]> => {
  const { data, error } = await supabase
    .from("memberships")
    .select("role, organization:organizations (id, name, slug)")
    .eq("user_id", userId)
    .order("created_at");

  if (error) {
    throw error;
  }

  return data.flatMap(({ organization, role }) =>
    organization ? [{ ...organization, role }] : []
  );
};

/**
 * The organization to act in: the preferred one if the user is a member of
 * it (the cookie is client-controlled, so it is only a preference), otherwise
 * the first membership.
 */
export const pickActiveOrganization = (
  memberships: OrganizationMembership[],
  preferredId?: string | null
) =>
  memberships.find((membership) => membership.id === preferredId) ??
  memberships[0] ??
  null;

/** Browser only: remember the active organization for server rendering. */
export const setActiveOrganizationCookie = (organizationId: string) => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is not available in all supported browsers
  document.cookie = `${ACTIVE_ORGANIZATION_COOKIE}=${encodeURIComponent(organizationId)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
};
