import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { getCourse } from "@/lib/trainingCourses";
import { makeToken } from "@/lib/trainingToken";

export const dynamic = "force-dynamic";

const schema = z.object({
  courseKey: z.string(),
  email: z.string().trim().toLowerCase().email().max(120),
  homeName: z.string().trim().max(80).nullable().optional(),
});

// Makes a course link. For now only the admin can (this is being tested). The link holds the course and
// the address certificates go to, signed so it cannot be changed. Nothing is saved in the database.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the email address." }, { status: 400 });
  if (!getCourse(parsed.data.courseKey)) return NextResponse.json({ error: "Unknown course" }, { status: 400 });

  const token = makeToken({
    k: "link",
    c: parsed.data.courseKey,
    e: parsed.data.email,
    h: parsed.data.homeName || null,
    x: Date.now() + 365 * 24 * 3600 * 1000,
  });
  return NextResponse.json({ token });
}
