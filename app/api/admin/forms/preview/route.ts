import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { WESTCLIFF_TEMPLATES } from "@/lib/westcliffForms";
import { loadLogo, makeFormPdf, todayInLondon } from "@/lib/formPdf";

export const dynamic = "force-dynamic";

// Admin only: shows what a questionnaire's PDF looks like, made by the real PDF
// code. ?template=resident|relatives|employee and ?sample=1 fills in example
// answers (otherwise the PDF is blank, every question showing "No answer").
export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const url = new URL(req.url);
  const t = WESTCLIFF_TEMPLATES.find((x) => x.key === url.searchParams.get("template")) ?? WESTCLIFF_TEMPLATES[0];
  const sample = url.searchParams.get("sample") === "1";

  const answers: Record<string, string> = {};
  if (sample) {
    t.def.items.forEach((item, i) => {
      if (item.type === "choice") {
        answers[item.id] = item.options[i % Math.min(2, item.options.length)];
        if (item.comment && i % 3 === 0) answers[`${item.id}:comment`] = "An example comment, to show how comments look.";
      } else if (item.type === "text") {
        answers[item.id] = item.id === "name" ? "Sample Person" : "An example answer in the person's own words.";
      }
    });
  }

  const bytes = await makeFormPdf({
    title: t.def.title,
    homeName: "Westcliff Lodge",
    brandLines: t.def.brandLines ?? null,
    logo: await loadLogo(url.origin, t.def.logoPath ?? null),
    items: t.def.items,
    answers,
    date: todayInLondon(),
  });
  return new NextResponse(Buffer.from(bytes), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="preview-${t.key}.pdf"`, "Cache-Control": "no-store" },
  });
}
