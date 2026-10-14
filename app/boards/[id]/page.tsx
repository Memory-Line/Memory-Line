import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { canUseBoardCode } from "@/lib/boardsAccess";
import { getBoard, hasLanguage } from "@/lib/boardsDb";
import BoardPlayer from "@/components/BoardPlayer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communication board", robots: { index: false, follow: false } };

export default async function BoardPage({ params, searchParams }: { params: { id: string }; searchParams: { lang?: string; back?: string } }) {
  const isAdmin = !!(await requireAdmin());
  const board = await getBoard(params.id);
  if (!board) notFound();
  const lang = (["pl", "ur", "ro", "pt", "es", "fr", "hi", "pa", "bn", "gu", "ar", "fa", "tr", "zh", "yue", "tl", "ta", "ml", "uk", "lt"] as const).find((c) => c === searchParams.lang) ?? "en";
  // Everyone but the admin can only open a board in a language that has been opened up.
  if (!isAdmin && (lang === "en" || !(await canUseBoardCode(lang)))) notFound();
  // If this board has not been translated yet, show it in English only.
  const shown = lang !== "en" && !hasLanguage(board, lang) ? "en" : lang;
  const back = searchParams.back?.startsWith("/dashboard/communication-cards/") ? { href: searchParams.back, label: "← Back to the list" } : undefined;
  return <BoardPlayer board={board} lang={shown} back={back} />;
}
