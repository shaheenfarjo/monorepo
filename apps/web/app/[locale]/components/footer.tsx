import { project } from "@repo/config";
import { Status } from "@repo/observability/status";
import { env } from "@/env";
import { FooterColumn, type FooterLink } from "./footer-column";
import { FooterLegalColumn } from "./footer-legal-column";

export const Footer = () => {
  const pages: FooterLink[] = [
    // <module:cms>
    { href: "/blog", title: "Blog" },
    // </module:cms>
  ];

  if (env.NEXT_PUBLIC_DOCS_URL) {
    pages.push({ href: env.NEXT_PUBLIC_DOCS_URL, title: "Docs" });
  }

  return (
    <section className="dark border-foreground/10 border-t">
      <div className="w-full bg-background py-20 text-foreground lg:py-40">
        <div className="container mx-auto">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="flex flex-col items-start gap-8">
              <div className="flex flex-col gap-2">
                <h2 className="max-w-xl text-start font-regular text-3xl tracking-tighter md:text-5xl">
                  {project.name}
                </h2>
              </div>
              <Status />
            </div>
            <div className="grid items-start gap-10 lg:grid-cols-3">
              <FooterColumn href="/" title="Home" />
              {pages.length > 0 ? (
                <FooterColumn items={pages} title="Pages" />
              ) : null}
              {/* <module:cms> */}
              <FooterLegalColumn />
              {/* </module:cms> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
