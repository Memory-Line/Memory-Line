import { NextResponse } from "next/server";
import { cleanAnswers } from "@/lib/forms";
import { getFormByToken } from "@/lib/formsDb";
import { formSubmissionEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Best-effort limit per address and form: a home may enter many paper responses
// from one computer, so it's generous (60 an hour) but still stops a flood.
const recent = new Map<string, number[]>();

// Public. Checks the answers, then emails them to the form's own address
// (set by the admin). Nothing is kept on our side.
export async function POST(req: Request, { params }: { params: { token: string } }) {
  const body = await req.json().catch(() => null);
  const form = await getFormByToken(params.token);
  if (!form) return NextResponse.json({ error: "This form isn't available." }, { status: 404 });

  // A hidden field only bots fill in: pretend it worked so they learn nothing.
  if (body && typeof body.website === "string" && body.website) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${ip}:${form.id}`;
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < 60 * 60_000);
  if (hits.length >= 60) {
    return NextResponse.json({ error: "Too many responses were sent just now. Please try again in a little while." }, { status: 429 });
  }

  const checked = cleanAnswers(form.items, body?.answers);
  if ("error" in checked) return NextResponse.json({ error: checked.error }, { status: 400 });

  recent.set(key, [...hits, now]);
  const sent = await sendEmail(
    formSubmissionEmail({ to: form.notifyEmail, formTitle: form.title, homeName: form.homeName, items: form.items, answers: checked.answers })
  );
  if (!sent) {
    return NextResponse.json({ error: "We couldn't send your answers just now. Please try again in a few minutes." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
