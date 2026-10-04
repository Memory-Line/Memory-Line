import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { sendEmail, supportMessageEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(200),
  message: z.string().trim().min(10, "Please write a little more so we can help").max(3000),
  kind: z.enum(["support", "suggestion"]).default("support"),
  // Hidden field real people never fill in; bots usually do.
  website: z.string().optional(),
});

// Best-effort limit of 3 messages per 10 minutes from one address. It only
// lives as long as the server instance, which is enough to stop casual floods.
const recent = new Map<string, number[]>();

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  // Pretend it worked so bots learn nothing.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (hits.length >= 3) {
    return NextResponse.json(
      { error: "You've sent a few messages already. Please wait a few minutes, or email support@activitycentral.co.uk." },
      { status: 429 }
    );
  }
  recent.set(ip, [...hits, now]);

  const session = await getServerSession(authOptions);
  const sent = await sendEmail(
    supportMessageEmail({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      account: session?.user?.email ?? null,
      kind: parsed.data.kind,
    })
  );
  if (!sent) {
    return NextResponse.json(
      { error: "We couldn't send that just now. Please email support@activitycentral.co.uk instead." },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true });
}
