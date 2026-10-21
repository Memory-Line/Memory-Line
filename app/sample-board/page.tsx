import BoardPlayer from "@/components/BoardPlayer";
import { DementiaProvider } from "@/components/EasyView";
import { unstable_cache } from "next/cache";
import { getBoards } from "@/lib/boardsDb";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Free sample communication board", robots: { index: false, follow: false } };

// A free, no-signup taste of the talking boards, linked from the home page. It only ever shows one
// English board (a drink question if there is one), so it cannot be used to open the rest of the boards.
// Every board is read to find the sample, so the choice is kept for an hour rather than made on every visit.
const sampleBoard = unstable_cache(
  async () => {
    const boards = await getBoards();
    return boards.find((b) => /drink/i.test(b.question.en ?? "")) ?? boards[0] ?? null;
  },
  ["sample-board"],
  { revalidate: 3600 }
);

export default async function SampleBoardPage() {
  const board = await sampleBoard().catch(() => null);
  const viewer = await getViewer();
  if (!board) return <main className="max-w-xl mx-auto p-8">No sample board is available yet.</main>;
  return (
    <DementiaProvider initial={viewer.dementiaFriendly}>
      <BoardPlayer board={board} lang="en" back={{ href: "/", label: "← Back to the home page" }} sample />
    </DementiaProvider>
  );
}
