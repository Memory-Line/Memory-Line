// Kept apart from lib/trainingCourses.ts because the browser uses this and must never receive the quiz answers.
// What is said (and shown as subtitles) for one slide: one short sentence per clip, so each clip can be
// made and cached on its own and the subtitle always matches the voice exactly.
export function narrationFor(slide: { title: string; body: string[]; tip?: string }): string[] {
  const clean = (t: string) => {
    const s = t.replace(/^-\s+/, "").replace(/\s+/g, " ").trim();
    return /[.!?:]$/.test(s) ? s : `${s}.`;
  };
  const out: string[] = [];
  const push = (t: string) => {
    let s = clean(t);
    while (s.length > 280) {
      const cut = s.lastIndexOf(", ", 270) > 60 ? s.lastIndexOf(", ", 270) + 1 : s.lastIndexOf(" ", 270);
      out.push(s.slice(0, cut).trim());
      s = s.slice(cut).trim();
    }
    if (s) out.push(s);
  };
  push(slide.title);
  for (const line of slide.body) push(line);
  if (slide.tip) push(`Tip. ${slide.tip}`);
  return out;
}

