import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { categoryBySlug } from "@/lib/data";
import { requireAdmin } from "@/lib/admin";
import { languageBySlug } from "@/lib/languages";
import { BOARDS, BOARD_LANGS, slug } from "@/lib/boards";

export const dynamic = "force-dynamic";

// Step 3: the sub-categories (areas) inside the chosen language. Pilot: admin only.
export default async function BoardAreas({ params }: { params: { language: string } }) {
  const language = languageBySlug(params.language);
  if (!language || !BOARD_LANGS[language.slug] || !(await requireAdmin())) notFound();
  const category = categoryBySlug("communication-cards")!;
  const areas = Array.from(new Set(BOARDS.map((b) => b.area)));

  return (
    <div>
      <Link href={`/dashboard/communication-cards/${language.slug}`} className="text-xs text-inkSoft">← {language.label}</Link>
      <h1 className="font-serif text-[26px] mt-1">Talking boards: {language.label}</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">Choose a topic.</p>
      <div className="rounded-xl p-4 bg-card border border-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {areas.map((a) => (
            <Link key={a} href={`/dashboard/communication-cards/${language.slug}/boards/${slug(a)}`} className="flex items-center gap-2 rounded-lg p-3" style={{ background: category.tint }}>
              <MessageCircle size={16} color={category.color} />
              <span className="text-sm font-semibold">{a}</span>
              <span className="ml-auto text-xs text-inkSoft">{BOARDS.filter((b) => b.area === a).length}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
