import { legal } from "@repo/cms";
import { FooterColumn } from "./footer-column";

export const FooterLegalColumn = async () => {
  const legalPages = await legal.getPostsMeta();

  return (
    <FooterColumn
      items={legalPages.map((post) => ({
        href: `/legal/${post._slug}`,
        title: post._title,
      }))}
      title="Legal"
    />
  );
};
