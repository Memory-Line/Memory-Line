import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import CookieNotice from "@/components/CookieNotice";
import SeasonBanner from "@/components/SeasonBanner";
import { getActiveSeason } from "@/lib/seasonDb";
import { seasonVars } from "@/lib/seasons";

// Pages follow the date (a seasonal look can switch on or off), so none of them is built once and kept.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activity Central – Engagement activities for care home staff",
  description:
     "A subscription library of dementia engagement activities for care home activity teams — reminiscence, seasonal, music, arts & crafts, and conversation resources, ready to download.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const active = await getActiveSeason();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-ink font-sans antialiased" style={active ? (seasonVars(active.season) as React.CSSProperties) : undefined}>
        {active && <SeasonBanner active={active} />}
        <Providers>{children}</Providers>
        <CookieNotice />
      </body>
    </html>
  );
}
