import Link from "next/link";
import Image from "next/image";
import ConfirmButton from "./ConfirmButton";

export const metadata = { title: "Confirm | Activity Central", robots: { index: false, follow: false } };

// The page the link in the "please confirm" email goes to. Nothing happens until the button is pressed, so an email
// security scanner that opens every link can't stop anyone's emails by accident.
export default function StopConfirmPage({ searchParams }: { searchParams: { t?: string } }) {
  const token = typeof searchParams.t === "string" ? searchParams.t : "";
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-xl">Activity Central</span>
        </Link>
        <div className="rounded-2xl border border-line bg-card p-7">
          {token ? (
            <ConfirmButton token={token} />
          ) : (
            <>
              <h1 className="font-serif text-2xl mb-2">This link isn&apos;t complete</h1>
              <p className="text-inkSoft text-sm">
                Open the link from the email again, or go to <Link href="/stop" className="text-sageDeep underline">the stop page</Link>{" "}
                to ask for a new one. You can also write to support@activitycentral.co.uk and we&apos;ll stop the emails.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
