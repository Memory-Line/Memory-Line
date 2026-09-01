# Memory-Line

A subscription platform for care home activity teams: a library of dementia
engagement templates (Reminiscence, Sensory, Music & Movement, Arts & Crafts,
Conversation & Games) plus a Professional Services directory, gated behind a
monthly Stripe subscription.

This is a **real, deployable Next.js app** — accounts, login, Stripe
Checkout + billing portal, and a Postgres/SQLite-backed database. It does not
yet include your actual template PDF files or your final 2,000-item catalog
— see "What's stubbed" below.

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind
- **NextAuth** (credentials/email+password) for accounts
- **Prisma** for the database (SQLite locally, swap to Postgres for production)
- **Stripe** for subscriptions (Checkout + Billing Portal + webhooks)

## 1. Install

```bash
npm install
```

## 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in:

- `DATABASE_URL` — leave as the SQLite default for local dev
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from your
  [Stripe dashboard](https://dashboard.stripe.com/apikeys) (use test keys first)
- `STRIPE_PRICE_ID` — create a recurring monthly Price in Stripe
  (Products → Add product → Recurring), then paste its Price ID here
- `STRIPE_WEBHOOK_SECRET` — see step 4 below

## 3. Set up the database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

This creates `dev.db` (SQLite) locally with the `User` and `Download` tables.

## 4. Run Stripe webhooks locally

Subscription status only updates when Stripe sends a webhook. For local dev,
use the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` in `.env`.

## 5. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`. Sign up → you'll land on `/pricing` → Stripe
Checkout (use Stripe's test card `4242 4242 4242 4242`, any future date/CVC)
→ webhook flips your subscription to active → `/dashboard` unlocks.

## How the pieces fit together

- `app/page.tsx` — public marketing/landing page
- `app/signup`, `app/login` — account creation & sign-in (NextAuth credentials)
- `app/pricing` — shown to signed-in users without an active subscription;
  triggers Stripe Checkout
- `app/api/stripe/checkout` — creates the Stripe Checkout session
- `app/api/stripe/webhook` — Stripe calls this on payment/subscription events;
  this is the *only* place subscription status is written, so it stays in
  sync even if a user closes the tab mid-checkout
- `app/api/stripe/portal` — "Manage subscription" button opens Stripe's
  hosted billing portal (update card, cancel, view invoices)
- `middleware.ts` + `app/dashboard/layout.tsx` — require login *and* an
  active/trialing subscription before any `/dashboard/*` page renders
- `lib/data.ts` — the category/template/services content (currently sample
  data standing in for your real catalog — see below)

## What's stubbed / what to do before launch

- **Real template content**: `lib/data.ts` has ~30 sample templates across
  5 categories, matching your format. Swap this for your real ~2,000, ideally
  loaded from a database table or CMS rather than hardcoded once the catalog
  is that large.
- **Real PDF delivery**: `/api/downloads` currently just logs a download
  event. Wire it up to serve/redirect to your actual PDF files (e.g. signed
  URLs from S3, Vercel Blob, or Cloudflare R2) once you have the real assets.
- **Production database**: SQLite is fine for local dev but doesn't work on
  most serverless hosts (including Vercel). For production, point
  `DATABASE_URL` at Postgres (Vercel Postgres, Supabase, Neon, Railway all
  work) and change `provider = "sqlite"` to `provider = "postgresql"` in
  `prisma/schema.prisma`.
- **Services directory "Get in touch"**: currently a static button. Decide
  whether this should open a contact form, mailto link, or a lead-gen flow.
- **Password reset / email verification**: not included — worth adding
  before real launch (NextAuth supports email magic links as an alternative
  or addition to the password flow already in place).
- **Legal pages**: no terms of service, privacy policy, or refund policy yet
  — required for a live subscription business, especially handling data
  from a care setting.

## Deployment

Not tied to a specific host. The straightforward path:

1. Push this to a GitHub repo
2. Deploy to [Vercel](https://vercel.com) (auto-detects Next.js) or any
   Node host that supports Next.js
3. Add all `.env` variables in your host's environment variable settings
4. Point `DATABASE_URL` at a real Postgres instance
5. In Stripe, add a **production** webhook endpoint pointing at
   `https://yourdomain.com/api/stripe/webhook`, and use the webhook secret
   it gives you (this is different from your local Stripe CLI secret)
6. Switch Stripe keys from test (`sk_test_...`) to live (`sk_live_...`) once
   you're ready to accept real payments
