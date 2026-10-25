import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { BSL_SIGNS, bslGroup } from "@/lib/bslSigns";
import { buildBslPdf, type PrintSign } from "@/lib/bslPrint";
import { BSL_LOGO_PNG_BASE64 } from "@/lib/data/bslLogo";
import { withErrors } from "@/lib/apiHandler";

const MAX_CARDS = 80;

// The chosen BSL cards as one PDF, four to a page (see lib/bslPrint.ts for how a short last page is laid out).
// /api/bsl/print?signs=would-you-like-tea,happy,bed   Premium only, like the rest of BSL Tools.
async function GET_(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.redirect(new URL("/login?next=/dashboard/bsl-tools", req.url));
  const viewer = await getViewer();
  if (!viewer.isPremium) return NextResponse.redirect(new URL("/pricing", req.url));

  const wanted = (new URL(req.url).searchParams.get("signs") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const signs: PrintSign[] = [];
  for (const slug of wanted) {
    if (seen.has(slug) || signs.length >= MAX_CARDS) continue;
    seen.add(slug);
    const s = BSL_SIGNS.find((x) => x.slug === slug);
    const g = s ? bslGroup(s.group) : undefined;
    if (s && g) signs.push({ slug: s.slug, title: s.title, label: g.label, color: g.color });
  }
  if (signs.length === 0) return NextResponse.json({ error: "Choose at least one sign" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } });
  const whoFor = user?.name || user?.email || "Activity Central";
  const logo = new Uint8Array(Buffer.from(BSL_LOGO_PNG_BASE64, "base64"));

  const bytes = await buildBslPdf(signs, logo, whoFor);
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="bsl-cards.pdf"' },
  });
}

export const GET = withErrors(GET_, "api/bsl/print:GET");
