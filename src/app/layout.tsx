import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Source_Serif_4 } from "next/font/google";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { QueryProvider } from "@/components/providers/QueryProvider";

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

export const metadata: Metadata = {
  title: "THUMBZ",
  description:
    "Premium Mobile Legends esports streaming and content platform — live matches, tournaments, teams, players and statistics.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif4.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 flex-col">
          <QueryProvider>{children}</QueryProvider>
        </main>
        <Footer />
      </body>
    </html>
  );
}
