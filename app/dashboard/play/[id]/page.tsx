import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";
import { CATEGORIES } from "@/lib/data";
import { displayTitle } from "@/lib/titles";
import { subcategoryBySlug } from "@/lib/subcategories";
import { isSudokuLevel, SUDOKU_LEVELS, sudokuPuzzle } from "@/lib/sudoku";
import { wordSearch } from "@/lib/wordSearch";
import { crossword } from "@/lib/crossword";
import { guessTheWord } from "@/lib/guessTheWord";
import { triviaQuiz } from "@/lib/trivia";
import { snakesAndLaddersBoard } from "@/lib/snakesAndLadders";
import { colouringPage } from "@/lib/colouring";
import { matchingPairsSet } from "@/lib/matchingPairs";
import { spotDifference } from "@/lib/spotDifference";
import SudokuPlayer from "@/components/SudokuPlayer";
import WordSearchPlayer from "@/components/WordSearchPlayer";
import CrosswordPlayer from "@/components/CrosswordPlayer";
import GuessTheWordPlayer from "@/components/GuessTheWordPlayer";
import TriviaPlayer from "@/components/TriviaPlayer";
import SnakesAndLaddersPlayer from "@/components/SnakesAndLaddersPlayer";
import ColouringPlayer from "@/components/ColouringPlayer";
import MatchingPairsPlayer from "@/components/MatchingPairsPlayer";
import SpotDifferencePlayer from "@/components/SpotDifferencePlayer";

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

  // Previous/next within the same shelf (same category, sub-category,
  // occasion and language), ordered by the sheet's own number, so someone
  // finishing one activity can move straight to the next without going back
  // to the list.
  const siblings = await prisma.template.findMany({
    where: {
      category: template.category,
      subcategory: template.subcategory,
      occasion: template.occasion,
      language: template.language,
    },
    select: { id: true, fileName: true },
  });
  const numberOf = (fileName: string) => parseInt(fileName.split(/[\/]/).pop()?.match(/^(\d+)/)?.[1] ?? "", 10);
  siblings.sort((a, b) => numberOf(a.fileName) - numberOf(b.fileName));
  const myIndex = siblings.findIndex((s) => s.id === template.id);
  const prevSibling = myIndex > 0 ? siblings[myIndex - 1] : null;
  const nextSibling = myIndex >= 0 && myIndex < siblings.length - 1 ? siblings[myIndex + 1] : null;

  if (template.category === "Sudoku" && isSudokuLevel(template.subcategory)) {
    const level = template.subcategory;
    const data = sudokuPuzzle(level, number);
    back = {
      href: `/dashboard/sudoku/${level}`,
      label: `All ${subcategoryBySlug("Sudoku", level)?.label ?? level} Sudoku`,
    };
    if (data) {
      player = (
        <SudokuPlayer
          {...common}
          puzzle={data.puzzle}
          solution={data.solution}
          {...SUDOKU_LEVELS[level]}
          maxLives={level === "beginner" ? 2 : 3}
        />
      );
    }
  } else if (template.category === "Word Searches" && !template.occasion) {
    const data = wordSearch(number);
    if (data) player = <WordSearchPlayer {...common} grid={data.grid} words={data.words} />;
  } else if (template.category === "Crosswords" && !template.occasion) {
    const data = crossword(number);
    if (data) {
      player = (
        <CrosswordPlayer
          {...common}
          rows={data.rows}
          cols={data.cols}
          solution={data.solution}
          numbers={data.numbers}
          across={data.across}
          down={data.down}
        />
      );
    }
  } else if (template.category === "Guess the Word" && !template.occasion) {
    const data = guessTheWord(number);
    if (data) player = <GuessTheWordPlayer {...common} clue={data.clue} answer={data.answer} tries={data.tries} />;
  } else if (template.category === "Trivia" && !template.occasion) {
    const data = triviaQuiz(number);
    if (data) player = <TriviaPlayer {...common} questions={data.questions} />;
  } else if (template.category === "Snakes and Ladders" && !template.occasion) {
    const data = snakesAndLaddersBoard(number);
    if (data) player = <SnakesAndLaddersPlayer {...common} moves={data.moves} squares={data.squares} />;
  } else if (template.category === "Colouring Pages" && !template.occasion) {
    const data = colouringPage(number);
    if (data) player = <ColouringPlayer {...common} frame={data.frame} />;
  } else if (template.category === "Matching Pairs" && !template.occasion) {
    const data = matchingPairsSet(number);
    if (data) player = <MatchingPairsPlayer {...common} theme={data.theme} pictures={data.pictures} />;
  } else if (template.category === "Spot the Difference" && !template.occasion) {
    const data = spotDifference(number);
    if (data) {
      player = (
        <SpotDifferencePlayer {...common} pictureA={data.pictureA} pictureB={data.pictureB} />
      );
    }
  }

  const prevNext = (
    <div className="flex gap-2">
      {prevSibling ? (
        <Link
          href={`/dashboard/play/${prevSibling.id}`}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold bg-cardTint"
        >
          <ChevronLeft size={14} /> Previous
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold bg-cardTint opacity-40">
          <ChevronLeft size={14} /> Previous
        </span>
      )}
      {nextSibling ? (
        <Link
          href={`/dashboard/play/${nextSibling.id}`}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold bg-cardTint"
        >
          Next <ChevronRight size={14} />
        </Link>
      ) : (
        <span className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold bg-cardTint opacity-40">
          Next <ChevronRight size={14} />
        </span>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link href={back.href} className="text-xs text-inkSoft">
          ← {back.label}
        </Link>
        {prevNext}
      </div>
      <h1 className="font-serif text-[26px] mt-1 mb-4">{displayTitle(template)}</h1>
      {player ?? (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          This activity can't be played online yet, but you can still download and print it.
        </p>
      )}
      {player && <div className="mt-6">{prevNext}</div>}
    </div>
  );
}
