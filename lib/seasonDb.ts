import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { SEASONS, seasonByKey, type Season } from "@/lib/seasons";

export const PREVIEW_COOKIE = "season-preview";

// The admin's settings, kept for a few minutes so a page view doesn't hit the
// database every time. Saving settings clears this (tag "seasons").
export const getSeasonRows = unstable_cache(
  async () => {
    try {
      return await prisma.siteSeason.findMany();
    } catch {
      return [];
    }
  },
  ["site-seasons"],
  { revalidate: 300, tags: ["seasons"] }
);

type Row = { key: string; bannerText: string | null; forceNow: boolean };

export type ActiveSeason = { season: Season; banner: string };

// The look to show right now, or null for the normal site. A look is simply on or off
// (the "forceNow" setting); only one can be on. An admin previewing (cookie) sees that
// one on their own browser.
export async function getActiveSeason(): Promise<ActiveSeason | null> {
  const rows = (await getSeasonRows()) as Row[];
  const bannerFor = (s: Season) => rows.find((r) => r.key === s.key)?.bannerText?.trim() || s.defaultBanner;

  const preview = cookies().get(PREVIEW_COOKIE)?.value;
  if (preview) {
    const s = seasonByKey(preview);
    if (s && (await requireAdmin())) return { season: s, banner: bannerFor(s) };
  }

  const on = SEASONS.find((s) => rows.find((r) => r.key === s.key)?.forceNow);
  return on ? { season: on, banner: bannerFor(on) } : null;
}
