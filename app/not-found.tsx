import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-5 py-20 text-center">
      <h1 className="font-serif text-3xl mb-3">We cannot find that page</h1>
      <p className="text-inkSoft mb-8">It may have moved, or the link may be wrong. Let us take you somewhere useful.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/dashboard" className="rounded-xl bg-sage text-white px-6 py-3 font-semibold hover:bg-sageDeep transition-colors">
          Go to your dashboard
        </Link>
        <Link href="/" className="rounded-xl bg-cardTint px-6 py-3 font-semibold">
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
