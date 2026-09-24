import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// Renumbers a category's activities 1, 2, 3 … in their current order, so
// gaps (e.g. 12, 14 … 20, 23) close up. Only the number at the start of
// each file name changes, keeping its zero padding ("09" stays two digits);
// any folder path left in a name from a folder upload is dropped too.
// With apply=false it only reports what would change.
export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { category, language = null, apply = false } = await req.json();
    if (typeof category !== "string" || !category) {
      return NextResponse.json({ error: "Missing category" }, { status: 400 });
    }

    const rows = await prisma.template.findMany({
      where: { category, occasion: null, language },
    });
    const numbered = rows
      .map((t) => {
        const name = t.fileName.split(/[\/]/).pop() || t.fileName;
        const m = name.match(/^(\d+)/);
        return m ? { t, name, digits: m[1], number: parseInt(m[1], 10) } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.number - b.number || a.t.title.localeCompare(b.t.title));

    const changes = numbered
      .map(({ t, name, digits }, i) => {
        const to = name.replace(/^\d+/, String(i + 1).padStart(digits.length, "0"));
        return { id: t.id, from: t.fileName, to };
      })
      .filter((c) => c.from !== c.to);

    if (apply && changes.length > 0) {
      await prisma.$transaction(
        changes.map((c) => prisma.template.update({ where: { id: c.id }, data: { fileName: c.to } }))
      );
    }

    return NextResponse.json({ ok: true, applied: apply, total: numbered.length, changes });
  } catch (err: any) {
    console.error("renumber failed:", err);
    const message = typeof err?.message === "string" ? err.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
