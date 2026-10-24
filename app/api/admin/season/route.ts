import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { SEASONS, seasonByKey } from "@/lib/seasons";
import { PREVIEW_COOKIE, getActiveSeason } from "@/lib/seasonDb";
import { withErrors } from "@/lib/apiHandler";

export const dynamic = "force-dynamic";

// Admin only. The seasonal looks, which one is on, and any banner messages you've written.
async function GET_() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const rows = await prisma.siteSeason.findMany();
  const active = await getActiveSeason();
  return NextResponse.json({
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
        bannerText: r?.bannerText ?? "",
        on: r?.forceNow ?? false,
      };
    }),
  });
}

// Admin only. Turn a look on or off, and/or change its banner message:
// { key, on?, bannerText? }. Only one look can be on at a time.
async function PUT_(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  if (!seasonByKey(b.key)) return NextResponse.json({ error: "Unknown look" }, { status: 400 });
  const data: { forceNow?: boolean; bannerText?: string | null } = {};
  if (typeof b.on === "boolean") data.forceNow = b.on;
  if (typeof b.bannerText === "string") data.bannerText = b.bannerText.trim() ? b.bannerText.trim().slice(0, 160) : null;
  await prisma.siteSeason.upsert({ where: { key: b.key }, create: { key: b.key, ...data }, update: data });
  if (data.forceNow) await prisma.siteSeason.updateMany({ where: { key: { not: b.key } }, data: { forceNow: false } });
  revalidateTag("seasons");
  return NextResponse.json({ ok: true });
}

// Admin only. Preview a look on your own browser only ({ key }), or stop previewing ({ key: null }).
async function POST_(req: Request) {
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

export const GET = withErrors(GET_, "api/admin/season:GET");
export const PUT = withErrors(PUT_, "api/admin/season:PUT");
export const POST = withErrors(POST_, "api/admin/season:POST");
