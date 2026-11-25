import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Activity Central",
  description: "Activity Central was built by Dominik Brygida, a deputy care home manager with 15 years' experience in care.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <Link href="/" className="text-sm text-sageDeep hover:underline">&larr; Activity Central</Link>
      <h1 className="font-serif text-3xl sm:text-4xl mt-4 mb-6">About Activity Central</h1>
      <p className="text-inkSoft text-base sm:text-lg leading-relaxed">
        Activity Central was built by Dominik Brygida, a deputy care home manager with 15 years&rsquo; experience in care.
      </p>

      {/* TO FILL IN: Dominik's photo and own words. Nothing else has been written about him on purpose. */}
      <div className="mt-8 rounded-xl border-2 border-dashed border-line p-5 text-sm text-clay">
        <p className="font-semibold">[Your photo goes here]</p>
        <p className="mt-2 font-semibold">[Your own words go here]</p>
      </div>

      <p className="mt-8 text-sm text-inkSoft">
        Questions? Visit our <Link href="/support" className="underline">support page</Link>.
      </p>
    </main>
  );
}
