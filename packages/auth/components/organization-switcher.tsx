"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type AuthMessages, defaultAuthMessages } from "../messages";
import {
  type OrganizationMembership,
  setActiveOrganizationCookie,
} from "../organizations";

interface OrganizationSwitcherProps {
  readonly activeId: string | null;
  /** Link to the page that creates an organization; hidden when omitted. */
  readonly createHref?: string;
  readonly messages?: AuthMessages;
  readonly organizations: OrganizationMembership[];
}

/** Switches the organization the user is working in. */
export const OrganizationSwitcher = ({
  activeId,
  createHref,
  messages = defaultAuthMessages,
  organizations,
}: OrganizationSwitcherProps) => {
  const router = useRouter();
  const active = organizations.find(
    (organization) => organization.id === activeId
  );

  const select = (organizationId: string) => {
    setActiveOrganizationCookie(organizationId);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full justify-between gap-2" variant="ghost">
          <span className="truncate">
            {active?.name ?? messages.organizations}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuLabel>{messages.organizations}</DropdownMenuLabel>
        {organizations.map((organization) => (
          <DropdownMenuItem
            key={organization.id}
            onSelect={() => select(organization.id)}
          >
            <span className="truncate">{organization.name}</span>
            {organization.id === activeId ? (
              <CheckIcon className="ms-auto size-4" />
            ) : null}
          </DropdownMenuItem>
        ))}
        {createHref ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={createHref}>
                <PlusIcon className="size-4" />
                {messages.createOrganization}
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
