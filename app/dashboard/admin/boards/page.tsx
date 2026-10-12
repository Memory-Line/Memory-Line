import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import LoadBoards from "./LoadBoards";

export const dynamic = "force-dynamic";

export default async function AdminBoardsPage() {
  if (!(await requireAdmin())) notFound();
  return (
    <div>
      <h1 className="font-serif text-[26px]">Communication boards</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">Load the approved boards into the website. Only you can see the boards until you switch them on for customers.</p>
      <LoadBoards />
    </div>
  );
}
