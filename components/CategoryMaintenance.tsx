import Link from "next/link";

// Shown instead of "page not found" while an admin has a category hidden to update it.
export default function CategoryMaintenance({ name }: { name: string }) {
  return (
    <div className="max-w-xl mx-auto px-5 py-16 text-center">
      <h1 className="font-serif text-3xl mb-3">{name} is being updated</h1>
      <p className="text-inkSoft mb-8">
        This category is in maintenance while we update it. We apologise for the inconvenience and it will be back soon.
      </p>
      <Link href="/dashboard" className="inline-block rounded-xl bg-sage text-white px-6 py-3 font-semibold hover:bg-sageDeep transition-colors">
        Go to your dashboard
      </Link>
    </div>
  );
}
