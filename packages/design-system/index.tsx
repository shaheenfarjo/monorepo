import type { ThemeProviderProps } from "next-themes";
import { DirectionProvider } from "./components/ui/direction";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./providers/theme";

type DesignSystemProviderProperties = ThemeProviderProps & {
  /** Text direction; set "rtl" for Arabic and Kurdish (also set on <html>). */
  dir?: "ltr" | "rtl";
};

export const DesignSystemProvider = ({
  children,
  dir = "ltr",
  ...properties
}: DesignSystemProviderProperties) => (
  <ThemeProvider {...properties}>
    {/* Radix components (menus, popovers, sliders…) read the direction from here. */}
    <DirectionProvider dir={dir}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster
        dir={dir}
        position={dir === "rtl" ? "bottom-left" : "bottom-right"}
      />
    </DirectionProvider>
  </ThemeProvider>
);
