"use server";

import { getOrganizationMembers } from "./members";

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

type UserInfo = Liveblocks["UserMeta"]["info"];

/** Resolves Liveblocks user ids to display info, in the order requested. */
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
    const members = new Map(
      (await getOrganizationMembers()).map((profile) => [profile.id, profile])
    );

    const data = userIds.map((userId) => {
      const profile = members.get(userId);

      return profile
        ? ({
            avatar: profile.avatar_url ?? undefined,
            color: colors[Math.floor(Math.random() * colors.length)],
            name: profile.full_name ?? undefined,
          } satisfies UserInfo)
        : undefined;
    });

    return { data };
  } catch (error) {
    return { error };
  }
};
