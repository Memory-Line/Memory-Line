import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LANGUAGE_CATEGORY, languageBySlug } from "@/lib/languages";
import TemplateList from "@/components/TemplateList";
import { completedIds, getViewer } from "@/lib/viewer";
import { requireAdmin } from "@/lib/admin";
import { BOARD_LANGS } from "@/lib/boards";
import { getBoardsFor } from "@/lib/boardsDb";
import { categoryBySlug } from "@/lib/data";
import { MessageCircle } from "lucide-react";

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
  const areaMap = new Map<string, { slug: string; name: string; count: number }>();
  if (showBoards) {
    for (const b of await getBoardsFor(BOARD_LANGS[language.slug])) {
      const e = areaMap.get(b.areaSlug) ?? { slug: b.areaSlug, name: b.area, count: 0 };
      e.count++;
      areaMap.set(b.areaSlug, e);
    }
  }
  const areas = Array.from(areaMap.values());
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
        <div className="rounded-xl p-4 mb-5 bg-card border border-line">
          <div className="text-[11px] font-bold tracking-wide text-clay mb-2">NEW TALKING BOARDS · ONLY YOU CAN SEE THIS</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {areas.map((a) => (
              <Link key={a.slug} href={`/dashboard/communication-cards/${language.slug}/boards/${a.slug}`} className="flex items-center gap-2 rounded-lg p-3" style={{ background: categoryBySlug("communication-cards")!.tint }}>
                <MessageCircle size={16} color={categoryBySlug("communication-cards")!.color} />
                <span className="text-sm font-semibold">{a.name}</span>
                <span className="ml-auto text-xs text-inkSoft">{a.count}</span>
              </Link>
            ))}
          </div>
          {areas.length === 0 && <p className="text-sm text-inkSoft">No boards loaded yet. Load them from Communication boards in the admin menu.</p>}
        </div>
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
