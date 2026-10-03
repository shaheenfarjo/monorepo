import { auth, createClient } from "@repo/auth/server";
import { notFound, redirect } from "next/navigation";
import { Header } from "../components/header";

const LIKE_WILDCARDS = /[%_\\]/g;

interface SearchPageProperties {
  searchParams: Promise<{
    q: string;
  }>;
}

export const generateMetadata = async ({
  searchParams,
}: SearchPageProperties) => {
  const { q } = await searchParams;

  return {
    description: `Search results for ${q}`,
    title: `${q} - Search results`,
  };
};

const SearchPage = async ({ searchParams }: SearchPageProperties) => {
  const { q } = await searchParams;
  const { orgId } = await auth();

  if (!orgId) {
    notFound();
  }

  if (!q) {
    redirect("/");
  }

  const supabase = await createClient();
  // Escape LIKE wildcards so the query matches literally.
  const pattern = `%${q.replace(LIKE_WILDCARDS, "\\$&")}%`;
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", orgId)
    .ilike("name", pattern);

  return (
    <>
      <Header page="Search" pages={["Building Your Application"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {(projects ?? []).map((project) => (
            <div
              className="aspect-video rounded-xl bg-muted/50 p-4"
              key={project.id}
            >
              {project.name}
            </div>
          ))}
        </div>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </>
  );
};

export default SearchPage;
