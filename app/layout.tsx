import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import CookieNotice from "@/components/CookieNotice";
import { SeasonSky, SeasonGround, SeasonFalling } from "@/components/SeasonScenes";
import { getActiveSeason } from "@/lib/seasonDb";
import { seasonVars } from "@/lib/seasons";
import { SITE_URL } from "@/lib/site";

// Pages follow the date (a seasonal look can switch on or off), so none of them is built once and kept.
export const dynamic = "force-dynamic";

const SITE_TITLE = "Activity Central – Ready-made activities for care homes";
const SITE_DESCRIPTION =
  "Ready-made activities for care homes: puzzles, quizzes, sing-alongs, reminiscence newsletters and talking boards for residents, including dementia-friendly activities. Print them or play online. Try the free samples with no sign-up.";
const SHARE_IMAGE = "/activity-central-icon.png";

// openGraph and twitter are what Facebook, LinkedIn and similar sites show when the link is shared.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Activity Central",
    type: "website",
    locale: "en_GB",
    url: SITE_URL,
    images: [{ url: SHARE_IMAGE, alt: "Activity Central" }],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SHARE_IMAGE],
  },
  alternates: { canonical: "/" },
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
      <body
        className={`bg-bg text-ink font-sans antialiased${active ? " flex flex-col min-h-screen" : ""}`}
        style={active ? (seasonVars(active.season) as React.CSSProperties) : undefined}
      >
        {active && <SeasonSky active={active} />}
        <Providers>{active ? <div className="flex-1 flex flex-col">{children}</div> : children}</Providers>
        {active && <SeasonGround active={active} />}
        {active && <SeasonFalling active={active} />}
        <CookieNotice />
      </body>
    </html>
  );
}
