import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { isPlanKey, type PlanKey } from "@/lib/plans";

// The Price ID for each plan comes from Vercel's env vars, read fresh on
// every request (not baked in at build time), so setting them in Vercel
// takes effect without a redeploy. Dominik creates these Prices himself in
// Stripe; this code never touches the Stripe dashboard.
function priceIdForPlan(plan: PlanKey): string {
  const envVar = plan === "standard" ? "STRIPE_PRICE_STANDARD" : "STRIPE_PRICE_PREMIUM";
  const id = process.env[envVar];
  if (!id) {
    throw new Error(`${envVar} is not set. Add it in Vercel before this plan can be bought.`);
  }
  return id;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = body?.plan;
  if (!isPlanKey(plan)) {
    return NextResponse.json({ error: "Choose Standard or Premium" }, { status: 400 });
  }

  let priceId: string;
  try {
    priceId = priceIdForPlan(plan);
  } catch (err: any) {
    console.error("checkout failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    metadata: { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
