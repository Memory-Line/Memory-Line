import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrors } from "@/lib/apiHandler";

// Switches a link off for good: the page stops working straight away.
async function DELETE_(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  await prisma.sharedCalendar.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}

export const DELETE = withErrors(DELETE_, "api/shared-calendar/[id]:DELETE");
