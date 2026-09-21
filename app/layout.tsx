import type { Metadata, Viewport } from "next";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { HydrateStill } from "@/components/hydrate-still";
import { Toaster } from "sonner";
import "@/styles.css";

export const metadata: Metadata = {
  title: "Still",
  description: "A quiet companion for hard nights and ordinary days.",
  icons: { icon: "/favicon.svg", apple: "/__grok/icon-180.png" },
  manifest: "/__grok/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0e0d0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;1,400&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&display=swap"
        />
      </head>
      <body>
        <PreviewHostBridge />
        <HydrateStill />
        {children}
        <Toaster theme="dark" position="bottom-center" />
      </body>
    </html>
  );
}
