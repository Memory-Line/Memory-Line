import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// "Manage subscription" on the dashboard is a plain form post, so this
// answers with a redirect (to Stripe's billing page, or back to the
// dashboard with a message if something's wrong) rather than raw data, which
// the browser would just show as a blank page.
export async function POST(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const back = (reason: string) =>
    NextResponse.redirect(`${appUrl}/dashboard?billing=${reason}`, 303);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(`${appUrl}/login?next=/dashboard`, 303);
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) return back("none");

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });
    return NextResponse.redirect(portalSession.url, 303);
  } catch (err) {
    console.error("billing portal failed:", err);
    return back("error");
  }
}
