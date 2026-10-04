import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { joinMailingList, leaveMailingList } from "@/lib/mailing";

const schema = z.object({ subscribe: z.boolean() });

// A logged-in person turns promotional emails on or off for their own address.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Please log in" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (parsed.data.subscribe) {
    await joinMailingList(session.user.email, session.user.name ?? null, "dashboard");
  } else {
    await leaveMailingList(session.user.email);
  }
  return NextResponse.json({ ok: true, subscribed: parsed.data.subscribe });
}
