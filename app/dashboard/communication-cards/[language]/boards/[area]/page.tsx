import Link from "next/link";
import { notFound } from "next/navigation";
import { canSeeBoards } from "@/lib/boardsAccess";
import { languageBySlug } from "@/lib/languages";
import { BOARD_LANGS } from "@/lib/boards";
import { boardListFor } from "@/lib/boardsDb";
import BoardList from "./BoardList";

export const dynamic = "force-dynamic";

// Topic page: every card in the topic, with a search box. Admin, plus Premium accounts for the languages listed in lib/boardsAccess.ts.
export default async function BoardTopic({ params }: { params: { language: string; area: string } }) {
  const language = languageBySlug(params.language);
  if (!language || !BOARD_LANGS[language.slug] || !(await canSeeBoards(language.slug))) notFound();
  const code = BOARD_LANGS[language.slug];
  const inArea = await boardListFor(code, params.area);
  if (inArea.length === 0) notFound();
  const here = `/dashboard/communication-cards/${language.slug}/boards/${params.area}`;
  const items = inArea.map((b) => ({ id: b.id, code: b.code, priority: b.priority, signOff: b.signOff, en: b.question.en, other: code !== "en" ? b.question[code] ?? "" : "" }));

  return (
    <div>
      <Link href={`/dashboard/communication-cards/${language.slug}`} className="text-xs text-inkSoft">← {language.label}</Link>
      <h1 className="font-serif text-[26px] mt-1">{inArea[0].area}</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-4">{language.label} · {inArea.length} cards</p>
      <BoardList items={items} lang={code} back={here} />
    </div>
  );
}
