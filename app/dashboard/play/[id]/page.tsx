import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { displayTitle } from "@/lib/titles";
import { subcategoryBySlug } from "@/lib/subcategories";
import { isSudokuLevel, SUDOKU_LEVELS, sudokuPuzzle } from "@/lib/sudoku";
import SudokuPlayer from "@/components/SudokuPlayer";

export const dynamic = "force-dynamic";

// Play one Sudoku on screen (the "play-sudoku" feature). Everyone else can
// still download and print it from the level page.
export default async function PlaySudokuPage({ params }: { params: { id: string } }) {
  const viewer = await getViewer();
  if (!viewer.has("play-sudoku")) redirect("/dashboard/sudoku");

  const template = await prisma.template.findUnique({ where: { id: params.id } });
  if (!template || template.category !== "Sudoku" || !isSudokuLevel(template.subcategory)) notFound();

  const level = template.subcategory;
  const number = parseInt(template.fileName.match(/^(\d+)/)?.[1] ?? "", 10);
  const data = sudokuPuzzle(level, number);
  if (!data) notFound();

  const tracking = viewer.has("completion-tracking");
  const completed =
    tracking && viewer.userId
      ? !!(await prisma.completion.findUnique({
          where: { userId_templateId: { userId: viewer.userId, templateId: template.id } },
        }))
      : false;
  const levelLabel = subcategoryBySlug("Sudoku", level)?.label ?? level;

  return (
    <div>
      <Link href={`/dashboard/sudoku/${level}`} className="text-xs text-inkSoft">
        ← All {levelLabel} Sudoku
      </Link>
      <h1 className="font-serif text-[26px] mt-1 mb-4">{displayTitle(template)}</h1>
      <SudokuPlayer
        templateId={template.id}
        puzzle={data.puzzle}
        solution={data.solution}
        {...SUDOKU_LEVELS[level]}
        tracking={tracking}
        initiallyCompleted={completed}
        hasLargePrint={!!template.largePrintFileUrl}
      />
    </div>
  );
}
