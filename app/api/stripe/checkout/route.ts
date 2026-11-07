import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { isPlanKey, type PlanKey } from "@/lib/plans";
import { withErrors } from "@/lib/apiHandler";

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

async function POST_(req: Request) {
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

  try {
    const newCustomer = async () => {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });
      return customer.id;
    };
    let customerId = user.stripeCustomerId ?? (await newCustomer());

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const startCheckout = (customer: string) =>
      stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/dashboard?checkout=success`,
        cancel_url: `${appUrl}/pricing?checkout=cancelled`,
        metadata: { userId: user.id, plan },
        subscription_data: { metadata: { userId: user.id, plan } },
      });

    let checkoutSession;
    try {
      checkoutSession = await startCheckout(customerId);
    } catch (err: any) {
      // A customer saved while Stripe was in test mode doesn't exist once the site is on live keys
      // ("No such customer"). Make a fresh one for this person and try again.
      if (err?.code === "resource_missing" && err?.param === "customer") {
        customerId = await newCustomer();
        checkoutSession = await startCheckout(customerId);
      } else {
        throw err;
      }
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    // Surface Stripe's own message (e.g. "No such price", an invalid/expired
    // key) instead of a bare 500 with no explanation.
    console.error("checkout failed:", err);
    const message = typeof err?.message === "string" ? err.message : "Couldn't start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withErrors(POST_, "api/stripe/checkout:POST");
