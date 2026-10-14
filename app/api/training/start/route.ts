import { NextResponse } from "next/server";
import { readToken, makeToken } from "@/lib/trainingToken";

export const dynamic = "force-dynamic";

// The person pressed Start. Gives back a signed time stamp so the quiz can check the course was given
// roughly enough time (the quiz is locked in the browser until the slides finish, and checked again here).
export async function POST(req: Request) {
  const { link } = await req.json().catch(() => ({}));
  const l = readToken<{ c: string }>(link, "link");
  if (!l) return NextResponse.json({ error: "This link is not valid" }, { status: 404 });
  return NextResponse.json({ start: makeToken({ k: "start", c: l.c, t: Date.now(), x: Date.now() + 6 * 3600 * 1000 }) });
}
