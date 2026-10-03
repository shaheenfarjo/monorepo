"use server";

import { auth } from "@repo/auth/server";
import { createAdminClient } from "@repo/database";
import Fuse from "fuse.js";

const PAGE_SIZE = 1000;

export const searchUsers = async (
  query: string
): Promise<
  | {
      data: string[];
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
    const members: { id: string; name: string }[] = [];

    // Only users in the caller's organization are searchable.
    for (let page = 1; ; page += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: pages must be fetched sequentially
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage: PAGE_SIZE,
      });

      if (error) {
        throw error;
      }

      for (const user of data.users) {
        if (user.app_metadata?.org_id === orgId) {
          members.push({
            id: user.id,
            name:
              user.user_metadata?.full_name ?? user.email ?? user.phone ?? "",
          });
        }
      }

      if (data.users.length < PAGE_SIZE) {
        break;
      }
    }

    const fuse = new Fuse(members, {
      keys: ["name"],
      minMatchCharLength: 1,
      threshold: 0.3,
    });

    const data = fuse.search(query).map((result) => result.item.id);

    return { data };
  } catch (error) {
    return { error };
  }
};
