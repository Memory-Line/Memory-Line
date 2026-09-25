import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { subcategoryBySlug } from "@/lib/subcategories";
import TemplateList from "@/components/TemplateList";

export const dynamic = "force-dynamic";

// One sub-category's activities, e.g. /dashboard/sudoku/beginner.
export default async function SubcategoryPage({
  params,
}: {
  params: { category: string; sub: string };
}) {
  const category = categoryBySlug(params.category);
  const sub = category && subcategoryBySlug(category.key, params.sub);
  if (!category || !sub) notFound();

  const templates = await prisma.template.findMany({
    where: { category: category.key, occasion: null, subcategory: sub.slug },
  });

  return (
    <div>
      <Link href={`/dashboard/${category.slug}`} className="text-xs text-inkSoft">
        ← All {category.key} levels
      </Link>
      <h1 className="font-serif text-[26px] mt-1">
        {sub.label} {category.key}
      </h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">
        {templates.length} downloadable activities · {sub.description}
      </p>

      {templates.length > 0 ? (
        <TemplateList templates={templates} />
      ) : (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          No {sub.label.toLowerCase()} activities yet.
        </p>
      )}
    </div>
  );
}
