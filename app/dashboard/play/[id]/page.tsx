import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { CATEGORIES } from "@/lib/data";
import { displayTitle } from "@/lib/titles";
import { subcategoryBySlug } from "@/lib/subcategories";
import { isSudokuLevel, SUDOKU_LEVELS, sudokuPuzzle } from "@/lib/sudoku";
import { wordSearch } from "@/lib/wordSearch";
import SudokuPlayer from "@/components/SudokuPlayer";
import WordSearchPlayer from "@/components/WordSearchPlayer";

export const dynamic = "force-dynamic";

// Play one activity on screen (everyone can, as well as printing it). Each
// playable category (lib/play.ts) has its own player.
export default async function PlayPage({ params }: { params: { id: string } }) {
  const template = await prisma.template.findUnique({ where: { id: params.id } });
  if (!template) notFound();

  const viewer = await getViewer();
  const tracking = viewer.has("completion-tracking");
  const completed =
    tracking && viewer.userId
      ? !!(await prisma.completion.findUnique({
          where: { userId_templateId: { userId: viewer.userId, templateId: template.id } },
        }))
      : false;
  const number = parseInt(template.fileName.split(/[\/]/).pop()?.match(/^(\d+)/)?.[1] ?? "", 10);
  const category = CATEGORIES.find((c) => c.key === template.category);
  const common = {
    templateId: template.id,
    tracking,
    initiallyCompleted: completed,
    hasLargePrint: !!template.largePrintFileUrl,
  };

  let back = { href: `/dashboard/${category?.slug ?? ""}`, label: `All ${template.category}` };
  let player: React.ReactNode = null;

  if (template.category === "Sudoku" && isSudokuLevel(template.subcategory)) {
    const level = template.subcategory;
    const data = sudokuPuzzle(level, number);
    back = {
      href: `/dashboard/sudoku/${level}`,
      label: `All ${subcategoryBySlug("Sudoku", level)?.label ?? level} Sudoku`,
    };
    if (data) {
      player = (
        <SudokuPlayer {...common} puzzle={data.puzzle} solution={data.solution} {...SUDOKU_LEVELS[level]} />
      );
    }
  } else if (template.category === "Word Searches" && !template.occasion) {
    const data = wordSearch(number);
    if (data) player = <WordSearchPlayer {...common} grid={data.grid} words={data.words} />;
  }

  return (
    <div>
      <Link href={back.href} className="text-xs text-inkSoft">
        ← {back.label}
      </Link>
      <h1 className="font-serif text-[26px] mt-1 mb-4">{displayTitle(template)}</h1>
      {player ?? (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          This activity can't be played online yet, but you can still download and print it.
        </p>
      )}
    </div>
  );
}
