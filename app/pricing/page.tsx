"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Flower2 } from "lucide-react";
import { ALL_TEMPLATES } from "@/lib/data";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    if (status !== "authenticated") {
      router.push("/login?next=/pricing");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.url) {
      setError(data.error ?? "Couldn't start checkout. Please try again.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Flower2 size={22} className="text-sageDeep" />
          <span className="font-serif text-xl">Memory-Line</span>
        </Link>

        <div className="rounded-2xl border-2 border-sage bg-card p-8">
          {session?.user && (
            <p className="text-xs text-inkSoft mb-3">Signed in as {session.user.email}</p>
          )}
          <p className="font-serif text-lg text-sageDeep mb-1">Memory-Line Membership</p>
          <p className="font-serif text-5xl mb-1">£29<span className="text-lg text-inkSoft">/month</span></p>
          <p className="text-xs text-inkSoft mb-6">Cancel anytime from your account.</p>

          <ul className="text-sm text-left space-y-2.5 mb-8">
            {[
              `Unlimited access to all ${ALL_TEMPLATES.length}+ activities`, "New activities added every 3 months",
              "New templates added monthly",
              "Professional Services directory access",
              "Downloadable PDFs, no expiry",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Check size={16} className="text-sageDeep mt-0.5 shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full rounded-xl bg-sage text-white py-3 font-semibold hover:bg-sageDeep transition-colors disabled:opacity-60"
          >
            {loading ? "Redirecting to checkout..." : "Continue to payment"}
          </button>
          <p className="text-[11px] text-inkSoft mt-3">
            You'll be taken to Stripe to complete payment securely.
          </p>
        </div>
      </div>
    </main>
  );
}
