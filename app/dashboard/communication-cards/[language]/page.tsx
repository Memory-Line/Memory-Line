import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LANGUAGE_CATEGORY, languageBySlug } from "@/lib/languages";
import TemplateList from "@/components/TemplateList";
import { completedIds, getViewer } from "@/lib/viewer";
import { requireAdmin } from "@/lib/admin";
import { BOARD_LANGS, BOARDS } from "@/lib/boards";

export const dynamic = "force-dynamic";

export default async function CommunicationCardsLanguagePage({
  params,
}: {
  params: { language: string };
}) {
  const language = languageBySlug(params.language);
  if (!language) notFound();

  // Numbered 001-090, so file name order is card order.
  const cards = await prisma.template.findMany({
    where: { category: LANGUAGE_CATEGORY, occasion: null, language: language.slug },
    orderBy: { fileName: "asc" },
  });
  const showBoards = !!BOARD_LANGS[language.slug] && !!(await requireAdmin());
  const viewer = await getViewer();
  const done = viewer.has("completion-tracking")
    ? await completedIds(viewer.userId, cards.map((t) => t.id))
    : undefined;

  return (
    <div>
      <Link href="/dashboard/communication-cards" className="text-xs text-inkSoft">
        ← All languages
      </Link>
      <h1 className="font-serif text-[26px] mt-1">
        {LANGUAGE_CATEGORY}: {language.label}
      </h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">
        {cards.length} cards{language.slug !== "english" && ", with English beside each translation"}
      </p>

      {showBoards && (
        <Link href={`/dashboard/communication-cards/${language.slug}/boards`} className="block rounded-xl p-4 mb-5 bg-card border border-line">
          <span className="text-[11px] font-bold tracking-wide text-clay">NEW · ONLY YOU CAN SEE THIS</span>
          <div className="font-serif text-[20px]">Talking boards (tap to answer, read aloud)</div>
          <div className="text-xs text-inkSoft">{BOARDS.length} boards so far</div>
        </Link>
      )}

      {cards.length > 0 ? (
        <TemplateList templates={cards} completedIds={done} isPremium={viewer.isPremium} />
      ) : (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          No {language.label} cards yet.
        </p>
      )}
    </div>
  );
}
