import { notFound } from "next/navigation";
import { Clock, Download } from "lucide-react";
import { categoryBySlug, TEMPLATES } from "@/lib/data";
import { prisma } from "@/lib/prisma";
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

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = categoryBySlug(params.category);
  if (!category) notFound();

  const realUploads = await prisma.template.findMany({
    where: { category: category.key },
    orderBy: { createdAt: "desc" },
  });

  const sampleTemplates = TEMPLATES[category.key] ?? [];

  return (
    <div>
      <h1 className="font-serif text-[26px]">{category.key} Activities</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">
        {realUploads.length + sampleTemplates.length} downloadable activities — choose from memory boxes, conversation prompts, photo collections, and more
      </p>

      {realUploads.length > 0 && (
        <>
          <p className="text-xs font-semibold text-sageDeep mb-2 uppercase tracking-wide">From your library</p>
          <div className="space-y-3 mb-6">
            {realUploads.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl p-4 bg-card border border-line">
                <div>
                  <p className="text-[15px] font-bold">{t.title}</p>
                  <p className="text-[11px] text-inkSoft mt-0.5">{t.fileName}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#E4EEE2", color: "#6D8C6A" }}>
                    <Download size={14} />
                    Download PDF
                  </a>
                  {t.answerFileUrl && (
                    <a href={t.answerFileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#E1E6ED", color: "#3E5876" }}>
                      Download Answers
                    </a>
                  )}
                  {t.videoUrl && (
                    <a href={t.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#F3DAD8", color: "#B5453D" }}>
                      Watch on YouTube
                    </a>
                  )}
                </div>
              </div>
            ))}
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
