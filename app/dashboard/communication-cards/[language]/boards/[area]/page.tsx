import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { categoryBySlug } from "@/lib/data";
import { requireAdmin } from "@/lib/admin";
import { languageBySlug } from "@/lib/languages";
import { BOARDS, BOARD_LANGS, slug } from "@/lib/boards";

export const dynamic = "force-dynamic";

// Step 4: the sub-categories inside an area.
export default async function BoardTopics({ params }: { params: { language: string; area: string } }) {
  const language = languageBySlug(params.language);
  if (!language || !BOARD_LANGS[language.slug] || !(await requireAdmin())) notFound();
  const inArea = BOARDS.filter((b) => slug(b.area) === params.area);
  if (inArea.length === 0) notFound();
  const category = categoryBySlug("communication-cards")!;
  const topics = Array.from(new Set(inArea.map((b) => b.topic)));

  return (
    <div>
      <Link href={`/dashboard/communication-cards/${language.slug}/boards`} className="text-xs text-inkSoft">← All topics</Link>
      <h1 className="font-serif text-[26px] mt-1">{inArea[0].area}</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">{language.label}. Choose a group of cards.</p>
      <div className="rounded-xl p-4 bg-card border border-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {topics.map((t) => (
            <Link key={t} href={`/dashboard/communication-cards/${language.slug}/boards/${params.area}/${slug(t)}`} className="flex items-center gap-2 rounded-lg p-3" style={{ background: category.tint }}>
              <MessageCircle size={16} color={category.color} />
              <span className="text-sm font-semibold">{t}</span>
              <span className="ml-auto text-xs text-inkSoft">{inArea.filter((b) => b.topic === t).length}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
