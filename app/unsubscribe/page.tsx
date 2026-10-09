import Link from "next/link";
import Image from "next/image";
import UnsubscribeButton from "./UnsubscribeButton";

export const metadata = { title: "Unsubscribe | Activity Central" };

// The button is a real click (not done just by opening the link) so email
// security scanners that open every link can't unsubscribe people by accident.
export default function UnsubscribePage({ searchParams }: { searchParams: { t?: string } }) {
  const token = searchParams.t ?? "";
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-xl">Activity Central</span>
        </Link>
        <div className="rounded-2xl border border-line bg-card p-7">
          {token ? (
            <UnsubscribeButton token={token} />
          ) : (
            <>
              <h1 className="font-serif text-2xl mb-2">This link isn't complete</h1>
              <p className="text-inkSoft text-sm">
                Open the unsubscribe link from the email again, or write to{" "}
                <a href="mailto:support@activitycentral.co.uk" className="text-sageDeep font-semibold">
                  support@activitycentral.co.uk
                </a>{" "}
                and we'll remove you.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
