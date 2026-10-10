import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { SEASONS, seasonByKey } from "@/lib/seasons";
import { PREVIEW_COOKIE, getActiveSeason, todayUK } from "@/lib/seasonDb";

export const dynamic = "force-dynamic";

const DATE_YEARLY = /^\d{2}-\d{2}$/;
const DATE_FULL = /^\d{4}-\d{2}-\d{2}$/;

// Admin only. The seasonal looks with their saved settings, and which one is on now.
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const rows = await prisma.siteSeason.findMany();
  const active = await getActiveSeason();
  return NextResponse.json({
    today: todayUK(),
    activeKey: active?.season.key ?? null,
    preview: cookies().get(PREVIEW_COOKIE)?.value ?? null,
    seasons: SEASONS.map((s) => {
      const r = rows.find((x) => x.key === s.key);
      return {
        key: s.key,
        label: s.label,
        defaultBanner: s.defaultBanner,
        icons: s.icons,
        palette: s.palette,
        suggested: s.suggested ?? null,
        enabled: r?.enabled ?? false,
        bannerText: r?.bannerText ?? "",
        startDate: r?.startDate ?? s.suggested?.start ?? "",
        endDate: r?.endDate ?? s.suggested?.end ?? "",
        yearly: r?.yearly ?? !!s.suggested?.yearly,
        forceNow: r?.forceNow ?? false,
      };
    }),
  });
}

// Admin only. Save one look's settings:
// { key, enabled, bannerText, startDate, endDate, yearly, forceNow }
export async function PUT(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!seasonByKey(b.key)) return NextResponse.json({ error: "Unknown look" }, { status: 400 });
  const yearly = b.yearly !== false;
  const startDate = typeof b.startDate === "string" ? b.startDate.trim() : "";
  const endDate = typeof b.endDate === "string" ? b.endDate.trim() : "";
  const re = yearly ? DATE_YEARLY : DATE_FULL;
  if (b.enabled === true && (!re.test(startDate) || !re.test(endDate))) {
    return NextResponse.json({ error: "Set a start and end date to switch it on automatically." }, { status: 400 });
  }
  const data = {
    enabled: b.enabled === true,
    bannerText: typeof b.bannerText === "string" && b.bannerText.trim() ? b.bannerText.trim().slice(0, 160) : null,
    startDate: re.test(startDate) ? startDate : null,
    endDate: re.test(endDate) ? endDate : null,
    yearly,
    forceNow: b.forceNow === true,
  };
  await prisma.siteSeason.upsert({ where: { key: b.key }, create: { key: b.key, ...data }, update: data });
  // Only one look can be "shown now" at a time.
  if (data.forceNow) await prisma.siteSeason.updateMany({ where: { key: { not: b.key } }, data: { forceNow: false } });
  revalidateTag("seasons");
  return NextResponse.json({ ok: true });
}

// Admin only. Preview a look on your own browser only ({ key }), or stop previewing ({ key: null }).
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const res = NextResponse.json({ ok: true });
  if (b.key && seasonByKey(b.key)) {
    res.cookies.set(PREVIEW_COOKIE, b.key, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 3 });
  } else {
    res.cookies.set(PREVIEW_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return res;
}
