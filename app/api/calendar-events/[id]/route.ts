import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function loadOwnedEvent(id: string, userId: string) {
  const event = await prisma.calendarEvent.findUnique({ where: { id } });
  if (!event || event.userId !== userId) return null;
  return event;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const existing = await loadOwnedEvent(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { day, title, time } = body ?? {};

  const data: { day?: number; title?: string; time?: string | null } = {};
  if (day !== undefined) {
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }
    data.day = day;
  }
  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }
    data.title = title.trim().slice(0, 120);
  }
  if (time !== undefined) {
    data.time = typeof time === "string" && time.trim() ? time.trim().slice(0, 40) : null;
  }

  const event = await prisma.calendarEvent.update({ where: { id: params.id }, data });
  return NextResponse.json({ event });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const existing = await loadOwnedEvent(params.id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await prisma.calendarEvent.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

