import { NextResponse } from "next/server";
import { templateById } from "@/lib/data";

// Public route — intentionally has NO getServerSession/auth check, since
// this powers the free preview samples on the landing page that anyone
// can download before creating an account.
//
// TODO: once real PDF storage is wired up, return a signed URL to the
// actual file here instead of just acknowledging the request.
export async function POST(req: Request) {
  const { templateId } = await req.json().catch(() => ({}));
  const template = templateById(templateId);

  if (!template) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, title: template.title });
}
