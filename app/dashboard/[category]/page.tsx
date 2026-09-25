import Link from "next/link";
import { notFound } from "next/navigation";
import { categoryBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import TemplateList from "@/components/TemplateList";
import { subcategoriesFor } from "@/lib/subcategories";

export function generateStaticParams() {
  return [
    { category: "physical-exercise" },
    { category: "crosswords" },
    { category: "word-searches" },
    { category: "guess-the-word" },
    { category: "trivia" },
    { category: "bingo" },
    { category: "snakes-and-ladders" },
    { category: "remembrance-cards" },
    { category: "colouring-pages" },
    { category: "conversation-starters" },
    { category: "matching-pairs" },
    { category: "spot-the-difference" },
    { category: "sing-alongs" },
    { category: "bsl-tools" },
    { category: "sudoku" },
  ];
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = categoryBySlug(params.category);
  if (!category) notFound();

  // Categories split into sub-categories (e.g. Sudoku levels): pick one first.
  const subcategories = subcategoriesFor(category.key);
  if (subcategories) {
    const counts = await prisma.template.groupBy({
      by: ["subcategory"],
      where: { category: category.key, occasion: null },
      _count: { _all: true },
    });
    const countFor = (slug: string) => counts.find((c) => c.subcategory === slug)?._count._all ?? 0;
    return (
      <div>
        <h1 className="font-serif text-[26px]">{category.key} Activities</h1>
        <p className="text-clay text-[13px] mt-0.5 mb-5">Choose a level.</p>
        <div className="grid grid-cols-3 gap-3">
          {subcategories.map((s) => (
            <Link
              key={s.slug}
              href={`/dashboard/${category.slug}/${s.slug}`}
              className="rounded-xl p-4 border border-line"
              style={{ background: category.tint }}
            >
              <p className="font-serif text-lg" style={{ color: category.color }}>
                {s.label}
              </p>
              <p className="text-xs text-inkSoft mt-1">{s.description}</p>
              <p className="text-xs font-semibold mt-3">{countFor(s.slug)} activities</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const realUploads = await prisma.template.findMany({
    // Occasion-themed uploads live on their calendar event's page instead.
    where: { category: category.key, occasion: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-serif text-[26px]">{category.key} Activities</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">
        {realUploads.length} downloadable activities — choose from memory boxes, conversation prompts, photo collections, and more
      </p>

      {realUploads.length > 0 ? (
        <TemplateList templates={realUploads} />
      ) : (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          No activities here yet.
        </p>
      )}
    </div>
  );
}
