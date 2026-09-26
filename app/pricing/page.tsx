"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import Image from "next/image";
import type { PlanKey } from "@/lib/plans";

const TIERS: {
  key: PlanKey;
  label: string;
  price: string;
  features: string[];
}[] = [
  {
    key: "standard",
    label: "Standard",
    price: "£18",
    features: [
      "Unlimited access to most of the library",
      "New activities added every 3 months",
      "New templates added monthly",
      "Professional Services directory access",
      "Downloadable PDFs, no expiry",
      "Print activities from the site",
    ],
  },
  {
    key: "premium",
    label: "Premium",
    price: "£28",
    features: [
      "Everything in Standard, plus:",
      "Communication Cards, BSL Tools and Physical & Exercise",
      "Large Print (A3) for every activity",
      "The Holidays & Celebrations calendar",
      "Play every activity online, not just print",
    ],
  },
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(plan: PlanKey) {
    if (status !== "authenticated") {
      router.push("/login?next=/pricing");
      return;
    }
    setLoadingPlan(plan);
    setError(null);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.url) {
      setError(data.error ?? "Couldn't start checkout. Please try again.");
      setLoadingPlan(null);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl text-center">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-xl">Activity Central</span>
        </Link>

        {session?.user && (
          <p className="text-xs text-inkSoft mb-6">Signed in as {session.user.email}</p>
        )}

        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

        <div className="grid gap-6 sm:grid-cols-2">
          {TIERS.map((tier) => (
            <div key={tier.key} className="rounded-2xl border-2 border-sage bg-card p-8 flex flex-col">
              <p className="font-serif text-lg text-sageDeep mb-1">{tier.label}</p>
              <p className="font-serif text-5xl mb-1">
                {tier.price}
                <span className="text-lg text-inkSoft">/month</span>
              </p>
              <p className="text-xs text-inkSoft mb-6">
                per care home, billed monthly, cancel anytime
              </p>

              <ul className="text-sm text-left space-y-2.5 mb-8 flex-1">
                {tier.features.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check size={16} className="text-sageDeep mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(tier.key)}
                disabled={loadingPlan !== null}
                className="w-full rounded-xl bg-sage text-white py-3 font-semibold hover:bg-sageDeep transition-colors disabled:opacity-60"
              >
                {loadingPlan === tier.key ? "Redirecting to checkout..." : `Choose ${tier.label}`}
              </button>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-inkSoft mt-6">
          You'll be taken to Stripe to complete payment securely.
        </p>
      </div>
    </main>
  );
}
