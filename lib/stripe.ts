import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is not set — Stripe calls will fail until it is.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20",
});

// Price IDs are per-plan (STRIPE_PRICE_STANDARD / STRIPE_PRICE_PREMIUM) and
// read directly from process.env at request time — see
// app/api/stripe/checkout/route.ts.
