import type { Template } from "@prisma/client";
import { displayTitle } from "@/lib/titles";
import { themeWords } from "@/lib/themes";
import TemplateRows, { type TemplateRow } from "@/components/TemplateRows";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { PREMIUM_ONLY_CATEGORIES } from "@/lib/plans";

// The number a file name starts with ("001-…", "23. …"), ignoring any
// folder path in front; files without one sort after numbered ones.
// A file name as people see it: without any folder it was uploaded from (a folder upload
// stores the whole path, e.g. "Some Folder/A4 Standard/001-name.pdf").
function shownName(fileName: string): string {
  return fileName.split(/[\/]/).pop() || fileName;
}

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
  tiles = false,
}: {
  templates: Template[];
  completedIds?: string[];
  playable?: boolean;
  // Standard accounts: false. Defaults to true so callers that haven't been
  // updated yet (there shouldn't be any) don't accidentally lock everyone out.
  isPremium?: boolean;
  // Show the activities as multi-coloured tiles with tick boxes for printing several at once.
  tiles?: boolean;
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
  // Only the facts about each activity go to the browser; components/TemplateRows.tsx draws the rows
  // (the first few dozen at first) with the search box, themes and Favourites tab.
  const rows: TemplateRow[] = sorted.map((t, i) => ({
    id: t.id,
    title: titles[i],
    fileName: shownName(t.fileName),
    search: `${titles[i]} ${shownName(t.fileName)}`.toLowerCase(),
    locked: !isPremium && PREMIUM_ONLY_CATEGORIES.has(t.category),
    hasLargePrint: !!t.largePrintFileUrl,
    hasAnswers: !!t.answerFileUrl,
    video: t.videoUrl ?? null,
    completed: !!done?.has(t.id),
    starred: starred.has(t.id),
  }));
  return (
    <TemplateRows
      rows={rows}
      themes={filterable ? themeWords(titles) : []}
      filterable={filterable}
      loggedIn={!!viewer.userId}
      showComplete={!!done}
      playable={playable}
      isPremium={isPremium}
      tiles={tiles}
    />
  );
}
