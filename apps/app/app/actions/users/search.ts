"use server";

import Fuse from "fuse.js";
import { getOrganizationMembers } from "./members";

/** Member ids matching a mention query, within the active organization. */
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
    const members = await getOrganizationMembers();
    const fuse = new Fuse(members, {
      keys: ["full_name"],
      minMatchCharLength: 1,
      threshold: 0.3,
    });

    return { data: fuse.search(query).map((result) => result.item.id) };
  } catch (error) {
    return { error };
  }
};
