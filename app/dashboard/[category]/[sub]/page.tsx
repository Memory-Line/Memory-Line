import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { subcategoryBySlug } from "@/lib/subcategories";
import { completedIds, getViewer } from "@/lib/viewer";
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

  const viewer = await getViewer();
  const done = viewer.has("completion-tracking")
    ? await completedIds(viewer.userId, templates.map((t) => t.id))
    : undefined;
  const playable = category.key === "Sudoku" && viewer.has("play-sudoku");

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
        {done && (
          <span className="ml-2 font-semibold" style={{ color: "#2F7A63" }}>
            · {done.length} of {templates.length} completed
          </span>
        )}
      </p>

      {templates.length > 0 ? (
        <TemplateList templates={templates} completedIds={done} playable={playable} />
      ) : (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          No {sub.label.toLowerCase()} activities yet.
        </p>
      )}
    </div>
  );
}
