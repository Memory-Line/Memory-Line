import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Stripe needs the raw request body to verify the signature, so this route
// must not be JSON-parsed by anything upstream. App Router route handlers
// don't parse bodies automatically, so req.text() below gives us the raw body.
export const runtime = "nodejs";

// Which plan a subscription is for, by comparing its Price ID against the
// two env vars (not the checkout session's metadata), so this stays correct
// even for a subscription changed directly in the Stripe dashboard. Returns
// null if it doesn't match either (e.g. the env vars aren't set yet, or an
// unrelated price) — callers should leave the account's existing plan alone.
function planFromSubscription(subscription: Stripe.Subscription): "standard" | "premium" | null {
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_STANDARD) return "standard";
  if (priceId === process.env.STRIPE_PRICE_PREMIUM) return "premium";
  return null;
}

async function upsertSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const status = subscription.status; // active | past_due | canceled | ...
  const renewsAt = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;
  const plan = planFromSubscription(subscription);

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: status,
      subscriptionRenewsAt: renewsAt,
      ...(plan && { plan }),
    },
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription && typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await upsertSubscriptionFromStripe(subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      await upsertSubscriptionFromStripe(subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionStatus: "canceled" },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
