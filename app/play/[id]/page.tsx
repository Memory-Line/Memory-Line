import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { displayTitle } from "@/lib/titles";
import { PLAYABLE_CATEGORIES } from "@/lib/play";
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

// A free, public, no-signup taste of one activity per playable category —
// linked from the homepage's free-samples section. Not a general "play any
// activity without an account" route: it only ever renders whichever
// activity is *currently* that category's official free sample (the same
// lookup the homepage uses), so it can't be used to play the rest of the
// library for free by guessing an id.
export default async function PublicSamplePlayPage({ params }: { params: { id: string } }) {
  const template = await prisma.template.findUnique({ where: { id: params.id } });
  if (!template || !PLAYABLE_CATEGORIES.has(template.category)) notFound();

  const officialSample = await prisma.template.findFirst({
    where: {
      category: template.category,
      occasion: null,
      language: null,
      ...(template.category === "Sudoku" ? { subcategory: "beginner" } : {}),
    },
    orderBy: { fileName: "asc" },
    select: { id: true },
  });
  if (officialSample?.id !== template.id) notFound();

  const number = parseInt(template.fileName.split(/[\/]/).pop()?.match(/^(\d+)/)?.[1] ?? "", 10);
  const common = {
    templateId: template.id,
    tracking: false,
    initiallyCompleted: false,
    hasLargePrint: false,
    isPremium: false,
  };

  let player: React.ReactNode = null;

  if (template.category === "Sudoku" && isSudokuLevel(template.subcategory)) {
    const level = template.subcategory;
    const data = sudokuPuzzle(level, number);
    if (data) {
      player = (
        <SudokuPlayer {...common} puzzle={data.puzzle} solution={data.solution} {...SUDOKU_LEVELS[level]} maxLives={2} />
      );
    }
  } else if (template.category === "Word Searches") {
    const data = wordSearch(number);
    if (data) player = <WordSearchPlayer {...common} grid={data.grid} words={data.words} />;
  } else if (template.category === "Crosswords") {
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
  } else if (template.category === "Guess the Word") {
    const data = guessTheWord(number);
    if (data) player = <GuessTheWordPlayer {...common} clue={data.clue} answer={data.answer} tries={data.tries} />;
  } else if (template.category === "Trivia") {
    const data = triviaQuiz(number);
    if (data) player = <TriviaPlayer {...common} questions={data.questions} />;
  } else if (template.category === "Snakes and Ladders") {
    const data = snakesAndLaddersBoard(number);
    if (data) player = <SnakesAndLaddersPlayer {...common} moves={data.moves} squares={data.squares} />;
  } else if (template.category === "Colouring Pages") {
    const data = colouringPage(number);
    if (data) player = <ColouringPlayer {...common} frame={data.frame} />;
  } else if (template.category === "Matching Pairs") {
    const data = matchingPairsSet(number);
    if (data) player = <MatchingPairsPlayer {...common} theme={data.theme} pictures={data.pictures} />;
  } else if (template.category === "Spot the Difference") {
    const data = spotDifference(number);
    if (data) player = <SpotDifferencePlayer {...common} pictureA={data.pictureA} pictureB={data.pictureB} />;
  }

  if (!player) notFound();

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
      <Link href="/" className="text-xs text-inkSoft">
        ← Activity Central
      </Link>
      <p className="text-clay font-semibold text-xs tracking-wide uppercase mt-3 mb-1">
        Free sample — {template.category}
      </p>
      <h1 className="font-serif text-[26px] mb-4">{displayTitle(template)}</h1>
      {player}

      <div className="mt-8 rounded-2xl border border-sage bg-card p-5 sm:p-6 text-center">
        <p className="font-serif text-lg mb-1">Like what you see?</p>
        <p className="text-sm text-inkSoft mb-4">
          This is one of {template.category} — there are hundreds more like it across 16 categories.
        </p>
        <Link
          href="/signup"
          className="inline-block rounded-xl bg-sage text-white px-6 py-3 font-semibold hover:bg-sageDeep transition-colors"
        >
          Start your free trial
        </Link>
      </div>
    </div>
  );
}
