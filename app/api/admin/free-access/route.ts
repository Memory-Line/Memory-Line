import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isFeatureKey } from "@/lib/features";

// Admin tools for other accounts: GET lists them, POST gives an account
// full access without a Stripe subscription (status "free") or takes it
// away again, and PUT sets its type, name and extra features. Paid
// subscriptions are never changed here; Stripe manages those.

// Always read fresh: new sign-ups should appear straight away.
export const dynamic = "force-dynamic";

// Every account except the admin's own, newest first, for the admin
// page's picker.
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const users = await prisma.user.findMany({
    select: { email: true, name: true, accountType: true, subscriptionStatus: true, features: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    ok: true,
    users: users.filter((u) => u.email.toLowerCase() !== adminEmail),
  });
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { email, grant } = await req.json();
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Enter an email address" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
    });
    if (!user) {
      return NextResponse.json(
        { error: `No account found for ${email.trim()}. They need to sign up first.` },
        { status: 404 }
      );
    }

    const paid = ["active", "trialing", "past_due"].includes(user.subscriptionStatus);
    if (paid) {
      return NextResponse.json(
        { error: `${user.email} has a paid subscription (${user.subscriptionStatus}); it's managed in Stripe.` },
        { status: 400 }
      );
    }

    if (grant) {
      await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: "free" } });
      return NextResponse.json({ ok: true, message: `✓ ${user.email} now has free access.` });
    }
    if (user.subscriptionStatus !== "free") {
      return NextResponse.json({ ok: true, message: `${user.email} didn't have free access.` });
    }
    await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: "inactive" } });
    return NextResponse.json({ ok: true, message: `✓ Free access removed from ${user.email}.` });
  } catch (err: any) {
    console.error("free-access failed:", err);
    const message = typeof err?.message === "string" ? err.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Sets an account's type (care home or personal), name and extra features:
// for accounts made before sign-up asked, to correct a care home's name, or
// to switch features like the professional calendar on or off.
export async function PUT(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { email, accountType, name, features } = await req.json();
    if (accountType !== "care-home" && accountType !== "personal") {
      return NextResponse.json({ error: "Choose care home or personal" }, { status: 400 });
    }
    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      return NextResponse.json({ error: "Enter a name (up to 100 characters)" }, { status: 400 });
    }
    if (features !== undefined && !Array.isArray(features)) {
      return NextResponse.json({ error: "Features must be a list" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: String(email ?? "").trim(), mode: "insensitive" } },
    });
    if (!user) {
      return NextResponse.json({ error: `No account found for ${email}` }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        accountType,
        name: name.trim(),
        // Unknown or retired features (e.g. "play-sudoku", now for everyone)
        // are dropped rather than refused.
        ...(features !== undefined && { features: Array.from(new Set((features as unknown[]).filter(isFeatureKey))) }),
      },
    });
    return NextResponse.json({
      ok: true,
      message: `✓ Saved details for ${name.trim()} (${user.email}).`,
    });
  } catch (err: any) {
    console.error("account update failed:", err);
    const message = typeof err?.message === "string" ? err.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
