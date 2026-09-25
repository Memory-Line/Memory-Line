import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LANGUAGE_CATEGORY, languageBySlug } from "@/lib/languages";
import TemplateList from "@/components/TemplateList";
import { completedIds, getViewer } from "@/lib/viewer";

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

      {cards.length > 0 ? (
        <TemplateList templates={cards} completedIds={done} />
      ) : (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          No {language.label} cards yet.
        </p>
      )}
    </div>
  );
}
