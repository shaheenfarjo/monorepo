import { currentUser } from "@repo/auth/server";
import { showBetaFeature } from "@repo/feature-flags";
import { secure } from "@repo/security";
import { redirect } from "next/navigation";
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

  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // <module:feature-flags>
  const betaFeature = await showBetaFeature();
  // </module:feature-flags>

  return (
    <AuthenticatedProviders userId={user.id}>
      <GlobalSidebar>
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
