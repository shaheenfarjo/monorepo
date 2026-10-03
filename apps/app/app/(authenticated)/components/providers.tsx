import { AuthProvider } from "@repo/auth/provider";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import type { User } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { NotificationsProvider } from "./notifications-provider";

interface AuthenticatedProvidersProperties {
  readonly children: ReactNode;
  readonly user: User;
}

/**
 * Providers for the signed-in area. Each optional module wraps the tree in its
 * own block so `bun run init` can remove it cleanly.
 */
export const AuthenticatedProviders = (
  props: AuthenticatedProvidersProperties
) => {
  let content = <SidebarProvider>{props.children}</SidebarProvider>;

  // <module:notifications>
  content = (
    <NotificationsProvider userId={props.user.id}>
      {content}
    </NotificationsProvider>
  );
  // </module:notifications>

  return <AuthProvider initialUser={props.user}>{content}</AuthProvider>;
};
