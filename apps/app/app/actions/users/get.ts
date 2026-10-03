"use server";

import { auth } from "@964reserve/auth/server";
import { createAdminClient } from "@964reserve/database";

const colors = [
  "var(--color-red-500)",
  "var(--color-orange-500)",
  "var(--color-amber-500)",
  "var(--color-yellow-500)",
  "var(--color-lime-500)",
  "var(--color-green-500)",
  "var(--color-emerald-500)",
  "var(--color-teal-500)",
  "var(--color-cyan-500)",
  "var(--color-sky-500)",
  "var(--color-blue-500)",
  "var(--color-indigo-500)",
  "var(--color-violet-500)",
  "var(--color-purple-500)",
  "var(--color-fuchsia-500)",
  "var(--color-pink-500)",
  "var(--color-rose-500)",
];

// Upper bound on lookups per call so a client can't force unbounded work.
const MAX_USERS = 100;

type UserInfo = Liveblocks["UserMeta"]["info"];

export const getUsers = async (
  userIds: string[]
): Promise<
  | {
      data: (UserInfo | undefined)[];
    }
  | {
      error: unknown;
    }
> => {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      throw new Error("Not logged in");
    }

    const admin = createAdminClient();
    const results = await Promise.all(
      userIds
        .slice(0, MAX_USERS)
        .map((userId) => admin.auth.admin.getUserById(userId))
    );

    // Preserve the order of `userIds` (Liveblocks expects it) and only resolve
    // users that belong to the caller's organization.
    const data = results.map(({ data: { user } }) =>
      user && user.app_metadata?.org_id === orgId
        ? ({
            avatar: user.user_metadata?.avatar_url,
            color: colors[Math.floor(Math.random() * colors.length)],
            name: user.user_metadata?.full_name ?? user.email ?? user.phone,
          } satisfies UserInfo)
        : undefined
    );

    return { data };
  } catch (error) {
    return { error };
  }
};
