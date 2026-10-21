import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { canUseBoardCode } from "@/lib/boardsAccess";
import { getBoard, hasLanguage } from "@/lib/boardsDb";
import BoardPlayer from "@/components/BoardPlayer";
import { DementiaProvider } from "@/components/EasyView";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Communication board", robots: { index: false, follow: false } };

export default async function BoardPage({ params, searchParams }: { params: { id: string }; searchParams: { lang?: string; back?: string } }) {
  const isAdmin = !!(await requireAdmin());
  const board = await getBoard(params.id);
  if (!board) notFound();
  const lang = (["pl", "ur", "ro", "pt", "es", "fr", "hi", "pa", "bn", "gu", "ar", "fa", "tr", "zh", "yue", "tl", "ta", "ml", "uk", "lt", "ru", "so", "cy"] as const).find((c) => c === searchParams.lang) ?? "en";
  // Someone scanning a printed board's QR code on a phone is not signed in yet: send them to sign in, then back here.
  const viewer = await getViewer();
  if (!isAdmin && !viewer.userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/boards/${params.id}${lang === "en" ? "" : `?lang=${lang}`}`)}`);
  }
  // Everyone but the admin needs a Premium account, and can only open a board in a language that has been opened up
  // (English is open: the board list already offers it).
  if (!isAdmin && !(await canUseBoardCode(lang))) notFound();
  // If this board has not been translated yet, show it in English only.
  const shown = lang !== "en" && !hasLanguage(board, lang) ? "en" : lang;
  const back = searchParams.back?.startsWith("/dashboard/communication-cards/") ? { href: searchParams.back, label: "← Back to the list" } : undefined;
  // The Dementia friendly choice belongs to the account, so it follows the person to this page too.
  return (
    <DementiaProvider initial={viewer.dementiaFriendly}>
      <BoardPlayer board={board} lang={shown} back={back} />
    </DementiaProvider>
  );
}
