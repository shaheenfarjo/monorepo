import { createAdminClient } from "@964reserve/database";
import { isAuthorizedCronRequest, unauthorized } from "@/lib/cron";

// Touches the database daily so free-tier Supabase projects are not paused.
export const GET = async (request: Request) => {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorized();
  }

  const { error } = await createAdminClient().auth.admin.listUsers({
    perPage: 1,
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response("OK", { status: 200 });
};
