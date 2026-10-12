import { prisma } from "@/lib/prisma";
import type { Board, BoardAnswer, LangCode, Text3 } from "@/lib/boards";

type Row = { id: string; code: string; area: string; areaSlug: string; priority: number; signOff: boolean; note: string; position: number; question: unknown; answers: unknown };

const toBoard = (r: Row): Board => ({
  id: r.id,
  code: r.code,
  area: r.area,
  areaSlug: r.areaSlug,
  priority: r.priority,
  signOff: r.signOff,
  question: r.question as Text3,
  answers: r.answers as BoardAnswer[],
});

// Every board that can be shown in this language: English boards always, other
// languages only where the whole board (question and every answer) has been translated.
export function hasLanguage(b: Board, lang: LangCode) {
  if (lang === "en") return true;
  return !!b.question[lang] && b.answers.every((a) => !!a.label[lang] && !!a.say[lang]);
}

export async function getBoard(id: string): Promise<Board | null> {
  const r = await prisma.board.findUnique({ where: { id } });
  return r ? toBoard(r as Row) : null;
}

export async function getBoards(): Promise<Board[]> {
  const rows = await prisma.board.findMany({ orderBy: { position: "asc" } });
  return (rows as Row[]).map(toBoard);
}

export async function getBoardsFor(lang: LangCode): Promise<Board[]> {
  return (await getBoards()).filter((b) => hasLanguage(b, lang));
}

export async function boardCount() {
  return prisma.board.count();
}
