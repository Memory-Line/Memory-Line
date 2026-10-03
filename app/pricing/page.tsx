"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";
import Image from "next/image";
import { CATEGORIES } from "@/lib/data";
import { PLAYABLE_CATEGORIES } from "@/lib/play";
import { PREMIUM_ONLY_CATEGORIES as PREMIUM_ONLY_CATEGORIES_SET, type PlanKey } from "@/lib/plans";

// Same source of truth the site's own Standard/Premium gating uses, so this
// page can't drift out of sync with what Standard accounts actually get.
const PREMIUM_ONLY_CATEGORIES = Array.from(PREMIUM_ONLY_CATEGORIES_SET);
const STANDARD_CATEGORIES = CATEGORIES.map((c) => c.key).filter((k) => !PREMIUM_ONLY_CATEGORIES_SET.has(k));

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
    <main className="min-h-screen px-6 py-16">
      <div className="w-full max-w-4xl mx-auto text-center">
        <Link href="/" className="flex items-center gap-2 justify-center mb-6">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-xl">Activity Central</span>
        </Link>

        <h1 className="font-serif text-2xl mb-2">Choose your plan</h1>
        <p className="text-inkSoft mb-8">Choose Standard or Premium. Cancel anytime.</p>

        {session?.user && (
          <p className="text-xs text-inkSoft mb-6">Signed in as {session.user.email}</p>
        )}

        {error && <p className="text-xs text-red-600 mb-4">{error}</p>}

        <div className="flex flex-col sm:flex-row items-start gap-6 text-left">

          {/* Standard */}
          <div className="flex-1 w-full flex flex-col rounded-2xl border-2 border-line bg-card p-6 sm:p-8 sm:mt-7">
            <p className="font-serif text-lg text-sageDeep mb-1">Standard</p>
            <p className="font-serif text-5xl text-ink mb-1">
              £18<span className="text-lg text-inkSoft">/month + VAT</span>
            </p>
            <p className="text-xs text-inkSoft mb-6">per account, billed monthly, cancel anytime</p>

            <p className="text-xs font-bold tracking-wide uppercase text-inkSoft mb-2">13 of 16 categories</p>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {STANDARD_CATEGORIES.map((c) => (
                <span key={c} className="rounded-full px-3 py-1.5 text-xs font-semibold bg-cardTint text-ink">
                  {c}
                </span>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe("standard")}
              disabled={loadingPlan !== null}
              className="mt-auto w-full rounded-xl bg-cardTint text-ink py-3 font-semibold hover:bg-line transition-colors disabled:opacity-60"
            >
              {loadingPlan === "standard" ? "Redirecting to checkout..." : "Choose Standard"}
            </button>
          </div>

          {/* Premium */}
          <div className="flex-1 w-full relative flex flex-col rounded-2xl border-[3px] border-clay bg-card p-6 sm:p-8 shadow-[0_18px_36px_-14px_rgba(176,137,104,0.4)]">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-clay px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Recommended for care homes
            </span>

            <p className="font-serif text-lg text-sageDeep mb-1 mt-1">Premium</p>
            <p className="font-serif text-5xl text-ink mb-1">
              £28<span className="text-lg text-inkSoft">/month + VAT</span>
            </p>
            <p className="text-xs text-inkSoft mb-2">per account, billed monthly, cancel anytime</p>
            <p className="inline-block w-fit text-xs font-bold rounded-lg px-2.5 py-1 mb-6" style={{ background: "#E4EEE2", color: "#6D8C6A" }}>
              Just £10/month more for the full experience
            </p>

            <p className="text-xs font-bold tracking-wide uppercase text-inkSoft mb-2">Everything a care home actually needs</p>
            <ul className="text-sm text-left space-y-2.5 mb-6">
              <li className="flex items-start gap-2">
                <Check size={16} className="text-sageDeep mt-0.5 shrink-0" />
                <span>
                  <b>Large Print (A3)</b> sheets on most activities — easier for residents with low vision. Not
                  every activity has a large print version.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-sageDeep mt-0.5 shrink-0" />
                <span>
                  The <b>Holidays &amp; Celebrations calendar</b> — nearly 60 dates a year already filled in
                  (Christmas, Halloween, Remembrance Sunday, Chinese New Year and more). Add your own events on
                  top and remove them any time, so it becomes your activity coordinator. Themed activities for
                  each date are being made and will be added soon.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-sageDeep mt-0.5 shrink-0" />
                <span>
                  <b>Play {PLAYABLE_CATEGORIES.size} of the {CATEGORIES.length} categories on screen</b> — the
                  puzzles and games, no printer needed for a spontaneous session
                </span>
              </li>
            </ul>

            <p className="text-xs font-bold tracking-wide uppercase text-inkSoft mb-2">All 16 categories</p>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {STANDARD_CATEGORIES.map((c) => (
                <span key={c} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "#E4EEE2", color: "#4C6B4A" }}>
                  {c}
                </span>
              ))}
              {PREMIUM_ONLY_CATEGORIES.map((c) => (
                <span
                  key={c}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold border"
                  style={{ background: "#FCEFE7", color: "#B5714A", borderColor: "#E9C4AA" }}
                >
                  + {c}
                </span>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe("premium")}
              disabled={loadingPlan !== null}
              className="mt-auto w-full rounded-xl bg-clay text-white py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loadingPlan === "premium" ? "Redirecting to checkout..." : "Choose Premium"}
            </button>
          </div>

        </div>

        <p className="text-[11px] text-inkSoft mt-6">
          You'll be taken to Stripe to complete payment securely.
        </p>
      </div>
    </main>
  );
}
