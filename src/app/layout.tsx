import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  Inter,
  Manrope,
  Shantell_Sans,
  Source_Serif_4,
} from "next/font/google";
import { cookies } from "next/headers";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SpoilerProvider } from "@/components/spoiler/SpoilerProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SPOILER_COOKIE } from "@/lib/spoiler";

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
};

export default async function RootLayout({
  children,
  banner,
}: Readonly<{ children: React.ReactNode; banner: React.ReactNode }>) {
  const hideScores = (await cookies()).get(SPOILER_COOKIE)?.value === "1";

  return (
    <html
      lang="en"
      className={`${sourceSerif4.variable} ${inter.variable} ${ibmPlexMono.variable} ${manrope.variable} ${shantellSans.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <ToastProvider>
          <SpoilerProvider initialHidden={hideScores}>
            {banner}
            <Header />
            <main className="flex flex-1 flex-col">
              <QueryProvider>{children}</QueryProvider>
            </main>
            <Footer />
          </SpoilerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
