"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  getLocaleLabel,
  type Locale,
  locales,
} from "@repo/internationalization/config";
import { Languages } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";

export const LanguageSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { locale: current } = useParams<{ locale: string }>();

  // Every URL starts with its locale (/ar/…, /en/…); swap that segment.
  const switchLanguage = (locale: Locale) => {
    const rest = pathname.split("/").slice(2).join("/");
    router.push(`/${locale}${rest ? `/${rest}` : ""}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="shrink-0 text-foreground"
          size="icon"
          variant="ghost"
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {locales.map((locale) => (
          <DropdownMenuItem
            disabled={locale === current}
            key={locale}
            lang={locale}
            onClick={() => switchLanguage(locale)}
          >
            {getLocaleLabel(locale)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
