import { notFound } from "next/navigation";
import { categoryBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import TemplateList from "@/components/TemplateList";

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
  ];
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = categoryBySlug(params.category);
  if (!category) notFound();

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
