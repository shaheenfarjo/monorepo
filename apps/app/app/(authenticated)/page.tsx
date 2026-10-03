import { auth, createClient } from "@repo/auth/server";
import { project } from "@repo/config";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { env } from "@/env";
import { AvatarStack } from "./components/avatar-stack";
import { Cursors } from "./components/cursors";
import { Header } from "./components/header";

const title = project.name;
const description = project.orgName;

// <module:collaboration>
const CollaborationProvider = dynamic(() =>
  import("./components/collaboration-provider").then(
    (mod) => mod.CollaborationProvider
  )
);
// </module:collaboration>

export const metadata: Metadata = {
  description,
  title,
};

const App = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    notFound();
  }

  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  return (
    <>
      <Header page="Data Fetching" pages={["Building Your Application"]}>
        {/* <module:collaboration> */}
        {env.LIVEBLOCKS_SECRET ? (
          <CollaborationProvider orgId={orgId}>
            <AvatarStack />
            <Cursors />
          </CollaborationProvider>
        ) : null}
        {/* </module:collaboration> */}
      </Header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {(projects ?? []).map((item) => (
            <div
              className="aspect-video rounded-xl bg-muted/50 p-4"
              key={item.id}
            >
              {item.name}
            </div>
          ))}
        </div>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </>
  );
};

export default App;
