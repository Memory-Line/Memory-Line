import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { categoryBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { occasionBySlug, THEMEABLE_CATEGORIES } from "@/lib/occasions";
import { PLAY_FROM_PDF } from "@/lib/occasionPlay";
import TemplateList from "@/components/TemplateList";
import { completedIds, getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function OccasionCategoryPage({
  params,
}: {
  params: { occasion: string; category: string };
}) {
  const occasion = occasionBySlug(params.occasion);
  const category = categoryBySlug(params.category);
  if (!occasion || !category || !THEMEABLE_CATEGORIES.includes(category)) notFound();

  const templates = await prisma.template.findMany({
    where: { category: category.key, occasion: occasion.slug },
    orderBy: { createdAt: "desc" },
  });
  // Word searches, crosswords and guess-the-word are playable once their puzzle has been loaded; matching pairs and
  // colouring pages are read straight from their own PDF, whose layout is the same for every occasion.
  const stored = await prisma.playData.findMany({ where: { templateId: { in: templates.map((t) => t.id) } }, select: { templateId: true } });
  const playableIds = PLAY_FROM_PDF.has(category.key) ? templates.map((t) => t.id) : stored.map((p) => p.templateId);
  const viewer = await getViewer();
  const done = viewer.has("completion-tracking")
    ? await completedIds(viewer.userId, templates.map((t) => t.id))
    : undefined;

  const session = await getServerSession(authOptions);
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const isAdmin =
    !!session?.user?.email && !!adminEmail && session.user.email.toLowerCase() === adminEmail;
  const uploadHref = `/dashboard/admin/upload?${new URLSearchParams({
    occasion: occasion.slug,
    category: category.key,
  })}`;

  return (
    <div>
      <Link href={`/dashboard/occasions/${occasion.slug}`} className="text-xs text-inkSoft">
        ← {occasion.label}
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1 mb-5">
        <h1 className="font-serif text-[26px]">
          {occasion.label}: {category.key}
        </h1>
        {isAdmin && (
          <Link
            href={uploadHref}
            className="rounded-lg bg-sage text-white px-4 py-2 text-sm font-semibold hover:bg-sageDeep transition-colors"
          >
            Upload for {occasion.label}
          </Link>
        )}
      </div>

      {templates.length > 0 ? (
        <TemplateList templates={templates} completedIds={done} isPremium={viewer.isPremium} playableIds={playableIds} />
      ) : (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          No {category.key.toLowerCase()} for {occasion.label} yet.
        </p>
      )}
    </div>
  );
}
