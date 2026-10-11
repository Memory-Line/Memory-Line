import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { languageBySlug } from "@/lib/languages";
import { BOARDS, BOARD_LANGS, slug } from "@/lib/boards";

export const dynamic = "force-dynamic";

// Topic page: every card in the topic, with the groups as headings. Pilot: admin only.
export default async function BoardTopic({ params }: { params: { language: string; area: string } }) {
  const language = languageBySlug(params.language);
  if (!language || !BOARD_LANGS[language.slug] || !(await requireAdmin())) notFound();
  const inArea = BOARDS.filter((b) => slug(b.area) === params.area);
  if (inArea.length === 0) notFound();
  const code = BOARD_LANGS[language.slug];
  const groups = Array.from(new Set(inArea.map((b) => b.topic)));
  const here = `/dashboard/communication-cards/${language.slug}/boards/${params.area}`;

  return (
    <div>
      <Link href={`/dashboard/communication-cards/${language.slug}`} className="text-xs text-inkSoft">← {language.label}</Link>
      <h1 className="font-serif text-[26px] mt-1">{inArea[0].area}</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">{language.label} · {inArea.length} cards</p>
      {groups.map((g) => (
        <section key={g} className="mb-6">
          <h2 className="font-serif text-[18px] mb-2">{g}</h2>
          <div className="grid gap-3">
            {inArea.filter((b) => b.topic === g).map((b) => (
              <Link key={b.id} href={`/boards/${b.id}?lang=${code}&back=${encodeURIComponent(here)}`} className="rounded-xl p-4 bg-card border border-line block">
                <span className="text-[11px] font-bold text-clay">{b.code}</span>
                <div className="font-serif text-[20px]">{b.question.en}</div>
                {code !== "en" && <div className="text-sm text-inkSoft" dir={code === "ur" ? "rtl" : "ltr"}>{b.question[code]}</div>}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
