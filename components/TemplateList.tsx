import Link from "next/link";
import { Download, Play } from "lucide-react";
import type { Template } from "@prisma/client";
import { displayTitle } from "@/lib/titles";
import { themeWords } from "@/lib/themes";
import TemplateFilter from "@/components/TemplateFilter";
import CompleteButton from "@/components/CompleteButton";
import UpgradePrompt from "@/components/UpgradePrompt";
import FavouriteStar from "@/components/FavouriteStar";
import FavouriteTabs from "@/components/FavouriteTabs";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { PREMIUM_ONLY_CATEGORIES } from "@/lib/plans";

// The number a file name starts with ("001-…", "23. …"), ignoring any
// folder path in front; files without one sort after numbered ones.
function leadingNumber(fileName: string): number {
  const m = (fileName.split(/[\/]/).pop() ?? fileName).match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
}

// Rows of uploaded activities with their Standard / Large Print / Answers
// / video links, in number order (1, 2 … 200). PDF links go through
// /api/download so each download is recorded. Shared by the regular
// category pages, the calendar occasion pages and the language pages.
// For accounts with those features, rows also get "Play online" (Sudoku)
// and a Completed button (pass the ids already completed to switch it on).
export default async function TemplateList({
  templates,
  completedIds,
  playable = false,
  isPremium = true,
}: {
  templates: Template[];
  completedIds?: string[];
  playable?: boolean;
  // Standard accounts: false. Defaults to true so callers that haven't been
  // updated yet (there shouldn't be any) don't accidentally lock everyone out.
  isPremium?: boolean;
}) {
  const done = completedIds ? new Set(completedIds) : null;
  // Which of these the signed-in person has starred.
  const viewer = await getViewer();
  const starred = new Set(
    viewer.userId
      ? (await prisma.favourite.findMany({ where: { userId: viewer.userId, templateId: { in: templates.map((t) => t.id) } }, select: { templateId: true } })).map((f) => f.templateId)
      : []
  );
  const sorted = [...templates].sort(
    (a, b) => leadingNumber(a.fileName) - leadingNumber(b.fileName) || a.title.localeCompare(b.title)
  );
  // Long lists get a search box and theme buttons; short ones don't need them.
  const titles = sorted.map((t) => displayTitle(t));
  const filterable = sorted.length >= 12;
  return (
    <div data-fav-scope data-fav-view="all">
    {viewer.userId && <FavouriteTabs />}
    {filterable && <TemplateFilter themes={themeWords(titles)} total={sorted.length} />}
    <div className="space-y-3">
      {sorted.map((t, i) => {
        const categoryLocked = !isPremium && PREMIUM_ONLY_CATEGORIES.has(t.category);
        return (
        <div key={t.id} data-template-row data-fav={starred.has(t.id) ? "1" : "0"} data-search={`${titles[i]} ${t.fileName}`.toLowerCase()} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-4 bg-card border border-line [content-visibility:auto] [contain-intrinsic-size:auto_96px]">
          <div className="flex items-start gap-2 min-w-0">
            {viewer.userId && <FavouriteStar templateId={t.id} initially={starred.has(t.id)} />}
            <div className="min-w-0">
              <p className="text-[15px] font-bold">{displayTitle(t)}</p>
              <p className="text-[11px] text-inkSoft mt-0.5 break-all">{t.fileName}</p>
            </div>
          </div>
          <div className="flex flex-wrap sm:justify-end gap-2 shrink-0 sm:max-w-[65%]">
            {categoryLocked ? (
              <UpgradePrompt compact />
            ) : (
              <>
                {playable && (
                  <Link href={`/dashboard/play/${t.id}`} prefetch={false} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#2F7A63", color: "#fff" }}>
                    <Play size={14} />
                    Play online
                  </Link>
                )}
                <a href={`/api/download/${t.id}?file=standard`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#E4EEE2", color: "#6D8C6A" }}>
                  <Download size={14} />
                  Standard
                </a>
                {t.largePrintFileUrl && (
                  isPremium ? (
                    <a href={`/api/download/${t.id}?file=large-print`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#FCEFE7", color: "#B5714A" }}>
                      Large Print
                    </a>
                  ) : (
                    <UpgradePrompt compact />
                  )
                )}
                {t.answerFileUrl && (
                  <a href={`/api/download/${t.id}?file=answers`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#E7ECFA", color: "#4C5FA8" }}>
                    Answers
                  </a>
                )}
                {t.videoUrl && (
                  <a href={t.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#F3DAD8", color: "#B5453D" }}>
                    {/youtube\.com|youtu\.be/.test(t.videoUrl) ? "Watch on YouTube" : "Watch sign video"}
                  </a>
                )}
              </>
            )}
            {done && <CompleteButton templateId={t.id} initiallyCompleted={done.has(t.id)} />}
          </div>
        </div>
        );
      })}
    </div>
    </div>
  );
}
