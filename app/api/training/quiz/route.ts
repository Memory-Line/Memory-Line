import { NextResponse } from "next/server";
import { getCourse, courseNarrationChars } from "@/lib/trainingCourses";
import { readToken, makeToken } from "@/lib/trainingToken";

export const dynamic = "force-dynamic";

// Marks the quiz on the server (the right answers never reach the browser). On a pass it gives back a
// signed pass slip, which is needed to get the certificate. Nothing is stored.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const link = readToken<{ c: string }>(body.link, "link");
  const start = readToken<{ c: string; t: number }>(body.start, "start");
  if (!link || !start || start.c !== link.c) return NextResponse.json({ error: "This link is not valid" }, { status: 404 });
  const course = getCourse(link.c);
  if (!course) return NextResponse.json({ error: "Unknown course" }, { status: 404 });

  // The slides are spoken at about 14 characters a second; allow for someone being a little quicker.
  const minSeconds = Math.floor((courseNarrationChars(course) / 14) * 0.6);
  if ((Date.now() - start.t) / 1000 < minSeconds) {
    return NextResponse.json({ error: "Please watch the whole course before the quiz." }, { status: 400 });
  }

  const answers = body.answers;
  if (!Array.isArray(answers) || answers.length !== course.questions.length || answers.some((x) => !Number.isInteger(x) || x < 0 || x > 10)) {
    return NextResponse.json({ error: "Please answer every question." }, { status: 400 });
  }
  const total = course.questions.length;
  const wrong: number[] = [];
  (answers as number[]).forEach((x, i) => {
    if (x !== course.questions[i].answer) wrong.push(i);
  });
  const score = total - wrong.length;
  const needed = Math.ceil((course.passPercent / 100) * total);
  const passed = score >= needed;

  return NextResponse.json({
    passed,
    score,
    total,
    needed,
    wrong: passed ? [] : wrong,
    // Explanations only after a pass (on a retry they would give the answers away).
    explanations: passed ? course.questions.map((q) => q.why) : null,
    pass: passed ? makeToken({ k: "pass", c: course.key, s: score, n: total, x: Date.now() + 2 * 3600 * 1000 }) : null,
  });
}
