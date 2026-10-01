import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { isPlanKey } from "@/lib/plans";
import { PREVIEW_PLAN_COOKIE } from "@/lib/viewer";

// Lets the admin see the site as a Standard or Premium account would,
// without changing any real account's plan — just a cookie on the admin's
// own browser (lib/viewer.ts reads it, and only for the admin).
export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { plan } = await req.json().catch(() => ({ plan: null }));
  const res = NextResponse.json({ ok: true });

  if (plan === null) {
    res.cookies.delete(PREVIEW_PLAN_COOKIE);
    return res;
  }
  if (!isPlanKey(plan)) {
    return NextResponse.json({ error: "Choose Standard, Premium, or clear the preview" }, { status: 400 });
  }
  res.cookies.set(PREVIEW_PLAN_COOKIE, plan, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
