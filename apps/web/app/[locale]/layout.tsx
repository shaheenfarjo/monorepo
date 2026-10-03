import "./styles.css";
import { AnalyticsProvider } from "@repo/analytics/provider";
import { Toolbar as CMSToolbar } from "@repo/cms/components/toolbar";
import { DesignSystemProvider } from "@repo/design-system";
import { fonts } from "@repo/design-system/lib/fonts";
import { cn } from "@repo/design-system/lib/utils";
import { Toolbar } from "@repo/feature-flags/components/toolbar";
import { getDictionary, getDirection } from "@repo/internationalization";
import type { ReactNode } from "react";
import { Footer } from "./components/footer";
import { Header } from "./components/header";

interface RootLayoutProperties {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
}

const RootLayout = async ({ children, params }: RootLayoutProperties) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const dir = getDirection(locale);

  return (
    <html
      className={cn(fonts, "scroll-smooth")}
      dir={dir}
      lang={locale}
      suppressHydrationWarning
    >
      <body>
        <AnalyticsProvider>
          <DesignSystemProvider dir={dir}>
            <Header dictionary={dictionary} />
            {children}
            <Footer />
          </DesignSystemProvider>
          {/* <module:feature-flags> */}
          <Toolbar />
          {/* </module:feature-flags> */}
          {/* <module:cms> */}
          <CMSToolbar />
          {/* </module:cms> */}
        </AnalyticsProvider>
      </body>
    </html>
  );
};

export default RootLayout;
