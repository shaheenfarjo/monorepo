import { listMemberships } from "@repo/auth/organizations";
import { auth, createClient, requireUser } from "@repo/auth/server";
import { showBetaFeature } from "@repo/feature-flags";
import { secure } from "@repo/security";
import type { ReactNode } from "react";
import { env } from "@/env";
import { AuthenticatedProviders } from "./components/providers";
import { GlobalSidebar } from "./components/sidebar";

interface AppLayoutProperties {
  readonly children: ReactNode;
}

const AppLayout = async ({ children }: AppLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(["CATEGORY:PREVIEW"]);
  }

  const user = await requireUser();
  const [{ orgId }, organizations] = await Promise.all([
    auth(),
    createClient().then((supabase) => listMemberships(supabase, user.id)),
  ]);

  // <module:feature-flags>
  const betaFeature = await showBetaFeature();
  // </module:feature-flags>

  return (
    <AuthenticatedProviders user={user}>
      <GlobalSidebar activeOrganizationId={orgId} organizations={organizations}>
        {/* <module:feature-flags> */}
        {betaFeature ? (
          <div className="m-4 rounded-full bg-blue-500 p-1.5 text-center text-sm text-white">
            Beta feature now available
          </div>
        ) : null}
        {/* </module:feature-flags> */}
        {children}
      </GlobalSidebar>
    </AuthenticatedProviders>
  );
};

export default AppLayout;
