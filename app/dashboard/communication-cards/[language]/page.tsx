import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { categoryLabel } from "@/lib/data";
import { HIDDEN_OLD_CARDS, LANGUAGE_CATEGORY, languageBySlug } from "@/lib/languages";
import TemplateList from "@/components/TemplateList";
import { completedIds, getViewer } from "@/lib/viewer";
import { canSeeBoards, PUBLIC_BOARD_LANGS } from "@/lib/boardsAccess";
import { BOARD_LANGS } from "@/lib/boards";
import { boardAreasFor, favouriteBoardsFor } from "@/lib/boardsDb";
import BoardsHome from "./BoardsHome";
import TopicTile from "@/components/TopicTile";

export const dynamic = "force-dynamic";

export default async function CommunicationCardsLanguagePage({
  params,
}: {
  params: { language: string };
}) {
  const language = languageBySlug(params.language);
  if (!language) notFound();

  // Numbered 001-090, so file name order is card order.
  const oldHidden = HIDDEN_OLD_CARDS.includes(language.slug);
  const boardsPublic = PUBLIC_BOARD_LANGS.includes(language.slug);
  const cards = oldHidden
    ? []
    : await prisma.template.findMany({
        where: { category: LANGUAGE_CATEGORY, occasion: null, language: language.slug },
        orderBy: { fileName: "asc" },
      });
  const showBoards = !!BOARD_LANGS[language.slug] && await canSeeBoards(language.slug);
  const areas = showBoards ? await boardAreasFor(BOARD_LANGS[language.slug]) : [];
  const viewer = await getViewer();
  const code = BOARD_LANGS[language.slug];
  const favBoards = showBoards && viewer.userId ? await favouriteBoardsFor(viewer.userId, code) : [];
  const favItems = favBoards.map((b) => ({ id: b.id, code: b.code, priority: b.priority, signOff: b.signOff, en: b.question.en, other: code !== "en" ? b.question[code] ?? "" : "" }));
  const done = viewer.has("completion-tracking")
    ? await completedIds(viewer.userId, cards.map((t) => t.id))
    : undefined;

  return (
    <div>
      <Link href="/dashboard/communication-cards" className="text-xs text-inkSoft">
        ← All languages
      </Link>
      <h1 className="font-serif text-[26px] mt-1">
        {categoryLabel(LANGUAGE_CATEGORY)}: {language.label}
      </h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">
        {oldHidden ? "New talking boards" : `${cards.length} cards${language.slug !== "english" ? ", with English beside each translation" : ""}`}
      </p>

      {showBoards && (
        <div className="rounded-xl p-4 mb-5 bg-card border border-line">
          <div className="text-[11px] font-bold tracking-wide text-clay mb-2">{boardsPublic ? "TALKING BOARDS" : "NEW TALKING BOARDS · ONLY YOU CAN SEE THIS"}</div>
          <BoardsHome
            lang={code}
            back={`/dashboard/communication-cards/${language.slug}`}
            favourites={favItems}
            topics={
              <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {areas.map((a, i) => (
              <TopicTile key={a.slug} href={`/dashboard/communication-cards/${language.slug}/boards/${a.slug}`} slug={a.slug} name={a.name} count={a.count} index={i} />
            ))}
          </div>
              </>
            }
          />
          {areas.length === 0 && <p className="text-sm text-inkSoft">No boards loaded yet. Load them from Communication boards in the admin menu.</p>}
        </div>
      )}

      {cards.length > 0 ? (
        <TemplateList templates={cards} completedIds={done} isPremium={viewer.isPremium} />
      ) : oldHidden && boardsPublic ? (
        // The talking boards are live for this language. Anyone who can't open them (not on
        // Premium) is told why, rather than seeing a "coming soon" line that isn't true.
        !showBoards && (
          <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
            The {language.label} talking boards come with the Premium plan.{" "}
            <Link href="/pricing" className="text-sageDeep font-semibold underline">See the plans</Link>
          </p>
        )
      ) : (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          {oldHidden ? `New ${language.label} talking boards are on their way.` : `No ${language.label} cards yet.`}
        </p>
      )}
    </div>
  );
}
