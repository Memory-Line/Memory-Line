import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

// The signed-in account's current choice, so a page that was kept from earlier (the browser's
// back button, a cached screen) can check it is showing the right thing.
export async function GET() {
  const viewer = await getViewer();
  if (!viewer.userId) return NextResponse.json({ on: false }, { headers: { "Cache-Control": "no-store" } });
  return NextResponse.json({ on: viewer.dementiaFriendly }, { headers: { "Cache-Control": "no-store" } });
}

// Saves the signed-in account's Dementia friendly choice. JSON: { on }.
export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer.userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { on } = await req.json().catch(() => ({}));
  if (typeof on !== "boolean") return NextResponse.json({ error: "Missing on" }, { status: 400 });
  await prisma.user.update({ where: { id: viewer.userId }, data: { dementiaFriendly: on } });
  return NextResponse.json({ ok: true, on });
}
