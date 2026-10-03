import { blog } from "@repo/cms";
import { Button } from "@repo/design-system/components/ui/button";
import { MoveRight } from "lucide-react";
import Link from "next/link";

interface LatestPostAnnouncementProps {
  readonly label: string;
}

export const LatestPostAnnouncement = async ({
  label,
}: LatestPostAnnouncementProps) => {
  const latestPost = await blog.getLatestPost();

  if (!latestPost) {
    return null;
  }

  return (
    <div>
      <Button asChild className="gap-4" size="sm" variant="secondary">
        <Link href={`/blog/${latestPost._slug}`}>
          {label} <MoveRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
};
