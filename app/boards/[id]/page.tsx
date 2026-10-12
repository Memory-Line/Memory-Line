import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getBoard, hasLanguage } from "@/lib/boardsDb";
import BoardPlayer from "@/components/BoardPlayer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communication board", robots: { index: false, follow: false } };

export default async function BoardPage({ params, searchParams }: { params: { id: string }; searchParams: { lang?: string; back?: string } }) {
  if (!(await requireAdmin())) notFound();
  const board = await getBoard(params.id);
  if (!board) notFound();
  const lang = searchParams.lang === "pl" || searchParams.lang === "ur" ? searchParams.lang : "en";
  // If this board has not been translated yet, show it in English only.
  const shown = lang !== "en" && !hasLanguage(board, lang) ? "en" : lang;
  const back = searchParams.back?.startsWith("/dashboard/communication-cards/") ? { href: searchParams.back, label: "← Back to the list" } : undefined;
  return <BoardPlayer board={board} lang={shown} back={back} />;
}
