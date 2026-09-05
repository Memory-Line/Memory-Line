import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { categoryBySlug, TEMPLATES } from "@/lib/data";
import DownloadButton from "@/components/DownloadButton";

export function generateStaticParams() {
  return [
    { category: "reminiscence" },
    { category: "sing-along" },
    { category: "physical-exercise" },
    { category: "arts-crafts" },
    { category: "word-games" },
    { category: "trivia-quizzes" },
    { category: "card-board-games" },
    { category: "conversation-starters" },
    { category: "christmas" },
    { category: "four-seasons" },
  ];
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = categoryBySlug(params.category);
  if (!category) notFound();

  const templates = TEMPLATES[category.key] ?? [];

  return (
    <div>
      <h1 className="font-serif text-[26px]">{category.key} Activities</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">
        {templates.length} downloadable activities — choose from memory boxes, conversation prompts,
        photo collections, and more
      </p>

      <div className="space-y-3">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-xl p-4 bg-card border border-line"
          >
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
    </div>
  );
}
