import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrors } from "@/lib/apiHandler";

export const dynamic = "force-dynamic";

// Saves the account's "Print this box" choice for the calendar notes. JSON: { include }.
async function POST_(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { include } = await req.json().catch(() => ({}));
  if (typeof include !== "boolean") return NextResponse.json({ error: "Missing include" }, { status: 400 });
  await prisma.user.update({ where: { id: session.user.id }, data: { calendarNotesPrint: include } });
  return NextResponse.json({ ok: true });
}

export const POST = withErrors(POST_, "api/calendar-notes/settings:POST");
