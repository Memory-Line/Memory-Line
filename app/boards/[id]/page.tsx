import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getBoard } from "@/lib/boards";
import BoardPlayer from "@/components/BoardPlayer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communication board", robots: { index: false, follow: false } };

export default async function BoardPage({ params }: { params: { id: string } }) {
  if (!(await requireAdmin())) notFound();
  const board = getBoard(params.id);
  if (!board) notFound();
  return <BoardPlayer board={board} />;
}
