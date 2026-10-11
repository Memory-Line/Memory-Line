import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { languageBySlug } from "@/lib/languages";
import { BOARDS, BOARD_LANGS, slug } from "@/lib/boards";

export const dynamic = "force-dynamic";

// Step 5: the list of cards. Each opens the talking board in the chosen language.
export default async function BoardList({ params }: { params: { language: string; area: string; topic: string } }) {
  const language = languageBySlug(params.language);
  if (!language || !BOARD_LANGS[language.slug] || !(await requireAdmin())) notFound();
  const list = BOARDS.filter((b) => slug(b.area) === params.area && slug(b.topic) === params.topic);
  if (list.length === 0) notFound();
  const code = BOARD_LANGS[language.slug];
  const here = `/dashboard/communication-cards/${language.slug}/boards/${params.area}/${params.topic}`;

  return (
    <div>
      <Link href={`/dashboard/communication-cards/${language.slug}/boards/${params.area}`} className="text-xs text-inkSoft">← {list[0].area}</Link>
      <h1 className="font-serif text-[26px] mt-1">{list[0].topic}</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">{language.label} · {list.length} cards</p>
      <div className="grid gap-3">
        {list.map((b) => (
          <Link key={b.id} href={`/boards/${b.id}?lang=${code}&back=${encodeURIComponent(here)}`} className="rounded-xl p-4 bg-card border border-line block">
            <span className="text-[11px] font-bold text-clay">{b.code}</span>
            <div className="font-serif text-[20px]">{b.question.en}</div>
            {code !== "en" && <div className="text-sm text-inkSoft" dir={code === "ur" ? "rtl" : "ltr"}>{b.question[code]}</div>}
          </Link>
        ))}
      </div>
    </div>
  );
}
