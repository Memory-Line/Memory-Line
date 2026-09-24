import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { categoryBySlug, TEMPLATES } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import DownloadButton from "@/components/DownloadButton";
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
    { category: "communication-cards" },
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

  const sampleTemplates = TEMPLATES[category.key] ?? [];

  return (
    <div>
      <h1 className="font-serif text-[26px]">{category.key} Activities</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">
        {realUploads.length + sampleTemplates.length} downloadable activities — choose from memory boxes, conversation prompts, photo collections, and more
      </p>

      {category.slug === "communication-cards" && (
        <p className="text-xs text-inkSoft mb-5 rounded-lg px-3 py-2 bg-cardTint">
          Available in 25 languages — a language picker for this category is coming soon.
        </p>
      )}

      {realUploads.length > 0 && (
        <>
          <p className="text-xs font-semibold text-sageDeep mb-2 uppercase tracking-wide">From your library</p>
          <div className="mb-6">
            <TemplateList templates={realUploads} />
          </div>
        </>
      )}

      {sampleTemplates.length > 0 && (
        <>
          {realUploads.length > 0 && (
            <p className="text-xs font-semibold text-inkSoft mb-2 uppercase tracking-wide">Sample activities</p>
          )}
          <div className="space-y-3">
            {sampleTemplates.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl p-4 bg-card border border-line">
                <div>
                  <p className="text-[15px] font-bold">{t.title}</p>
                  <p className="text-[13px] text-inkSoft mt-0.5 max-w-[560px]">{t.desc}</p>
                  <p className="flex items-center gap-1 text-xs text-clay mt-1.5">
                    <Clock size={11} /> {t.duration}
                  </p>
                </div>
                <DownloadButton templateId={t.id} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
