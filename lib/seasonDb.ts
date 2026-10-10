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

// Today's date in the UK as "YYYY-MM-DD".
export function todayUK(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

type Row = { key: string; enabled: boolean; bannerText: string | null; startDate: string | null; endDate: string | null; yearly: boolean; forceNow: boolean };

export function inWindow(row: Row, today: string) {
  if (!row.startDate || !row.endDate) return false;
  if (row.yearly) {
    const md = today.slice(5);
    const s = row.startDate.slice(-5);
    const e = row.endDate.slice(-5);
    return s <= e ? md >= s && md <= e : md >= s || md <= e; // a window can run over New Year
  }
  return today >= row.startDate && today <= row.endDate;
}

export type ActiveSeason = { season: Season; banner: string };

// The look to show right now, or null for the normal site. "Show now" wins, then any
// season whose dates include today. An admin previewing (cookie) sees that one.
export async function getActiveSeason(): Promise<ActiveSeason | null> {
  const rows = (await getSeasonRows()) as Row[];
  const bannerFor = (s: Season) => rows.find((r) => r.key === s.key)?.bannerText?.trim() || s.defaultBanner;

  const preview = cookies().get(PREVIEW_COOKIE)?.value;
  if (preview) {
    const s = seasonByKey(preview);
    if (s && (await requireAdmin())) return { season: s, banner: bannerFor(s) };
  }

  const today = todayUK();
  const forced = SEASONS.find((s) => rows.find((r) => r.key === s.key)?.forceNow);
  if (forced) return { season: forced, banner: bannerFor(forced) };
  const scheduled = SEASONS.find((s) => {
    const r = rows.find((x) => x.key === s.key);
    return !!r && r.enabled && inWindow(r, today);
  });
  return scheduled ? { season: scheduled, banner: bannerFor(scheduled) } : null;
}
