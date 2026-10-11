import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getBoard } from "@/lib/boards";
import BoardPlayer from "@/components/BoardPlayer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communication board", robots: { index: false, follow: false } };

export default async function BoardPage({ params, searchParams }: { params: { id: string }; searchParams: { lang?: string; back?: string } }) {
  if (!(await requireAdmin())) notFound();
  const board = getBoard(params.id);
  if (!board) notFound();
  const back = searchParams.back?.startsWith("/dashboard/communication-cards/") ? { href: searchParams.back, label: "← Back to the list" } : undefined;
  return <BoardPlayer board={board} lang={searchParams.lang} back={back} />;
}
