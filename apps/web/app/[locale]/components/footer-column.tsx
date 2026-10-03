import Link from "next/link";

export interface FooterLink {
  href: string;
  title: string;
}

interface FooterColumnProps {
  readonly href?: string;
  readonly items?: FooterLink[];
  readonly title: string;
}

const isExternal = (href: string) => href.includes("http");

export const FooterColumn = ({ href, items, title }: FooterColumnProps) => (
  <div className="flex flex-col items-start gap-1 text-base">
    <div className="flex flex-col gap-2">
      {href ? (
        <Link
          className="flex items-center justify-between"
          href={href}
          rel={isExternal(href) ? "noopener noreferrer" : undefined}
          target={isExternal(href) ? "_blank" : undefined}
        >
          <span className="text-xl">{title}</span>
        </Link>
      ) : (
        <p className="text-xl">{title}</p>
      )}
      {items?.map((item) => (
        <Link
          className="flex items-center justify-between"
          href={item.href}
          key={item.title}
          rel={isExternal(item.href) ? "noopener noreferrer" : undefined}
          target={isExternal(item.href) ? "_blank" : undefined}
        >
          <span className="text-foreground/75">{item.title}</span>
        </Link>
      ))}
    </div>
  </div>
);
