import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import {
  IBM_Plex_Mono,
  Inter,
  Manrope,
  Shantell_Sans,
  Source_Serif_4,
} from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SpoilerProvider } from "@/components/spoiler/SpoilerProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SPOILER_HEAD_SCRIPT } from "@/lib/spoiler-store";

import "./globals.css";

const sourceSerif4 = Source_Serif_4({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-source-serif-4",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

// Manrope stands in for Graphik (headings); Shantell Sans is only used for the
// announcement-bar link, so it is not preloaded.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const shantellSans = Shantell_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-shantell-sans",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "THUMBZ",
  description:
    "Premium Mobile Legends esports streaming and content platform — live matches, tournaments, teams, players and statistics.",
  applicationName: "THUMBZ",
  // iOS home-screen web app (installed PWA) chrome.
  appleWebApp: { capable: true, title: "THUMBZ", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // viewport-fit=cover exposes the iOS safe-area insets used by the header/footer.
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  themeColor: "#fefdfc",
};

export default function RootLayout({
  children,
  banner,
}: Readonly<{ children: React.ReactNode; banner: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // The head script may add data-hide-scores before React hydrates.
      suppressHydrationWarning
      className={`${sourceSerif4.variable} ${inter.variable} ${ibmPlexMono.variable} ${manrope.variable} ${shantellSans.variable}`}
    >
      <head>
        {/* Before first paint: spoiler preference from the cookie onto <html>. */}
        <script dangerouslySetInnerHTML={{ __html: SPOILER_HEAD_SCRIPT }} />
      </head>
      <body className="flex flex-col">
        <a
          href="#main"
          className="sr-only z-[70] rounded-lg bg-ink text-body-sm font-semibold text-paper focus:not-sr-only focus:fixed focus:px-4 focus:py-2.5 focus:left-4 focus:top-[calc(0.75rem+env(safe-area-inset-top))]"
        >
          Skip to content
        </a>
        {/* Suspense: useSearchParams must not opt static pages out of prerendering. */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <QueryProvider>
          <ToastProvider>
            <SpoilerProvider>
              {banner}
              <Header />
              <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
                {children}
              </main>
              <Footer />
            </SpoilerProvider>
            <ServiceWorkerRegister />
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
