import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { categoryBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { occasionBySlug, THEMEABLE_CATEGORIES } from "@/lib/occasions";
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
      <div className="flex items-center justify-between mt-1 mb-5">
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
        <TemplateList templates={templates} completedIds={done} />
      ) : (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          No {category.key.toLowerCase()} for {occasion.label} yet.
        </p>
      )}
    </div>
  );
}
