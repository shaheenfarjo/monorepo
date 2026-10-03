import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";
import { NotificationsProvider } from "./notifications-provider";

interface AuthenticatedProvidersProperties {
  readonly children: ReactNode;
  readonly userId: string;
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
    <NotificationsProvider userId={props.userId}>
      {content}
    </NotificationsProvider>
  );
  // </module:notifications>

  return content;
};
