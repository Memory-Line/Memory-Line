import Link from "next/link";
import Image from "next/image";
import { COMING_SOON } from "@/lib/launch";
import SignupForm from "./SignupForm";

export const metadata = { title: "Sign up | Activity Central" };

// While COMING_SOON is on (lib/launch.ts) nobody can create an account; the sign-up form is kept
// exactly as it was in SignupForm.tsx and comes straight back when the switch is turned off.
export default function SignupPage() {
  if (!COMING_SOON) return <SignupForm />;
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-xl">Activity Central</span>
        </Link>
        <div className="rounded-2xl border border-line bg-card p-7 text-center">
          <p className="inline-block rounded-full bg-cardTint text-sageDeep font-semibold text-xs px-3 py-1 mb-3">Coming soon</p>
          <h1 className="font-serif text-2xl mb-2">New sign-ups aren&apos;t open yet</h1>
          <p className="text-inkSoft text-sm mb-5">
            We&apos;re getting ready to open to new members. If you already have an account, you can log in as usual.
          </p>
          <Link href="/login" className="block w-full rounded-lg bg-sage text-white py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors">
            Log in
          </Link>
          <Link href="/#samples" className="block mt-3 text-sageDeep font-semibold text-sm">
            Try the free samples
          </Link>
          <p className="text-xs text-inkSoft mt-5">
            Questions? Write to{" "}
            <a href="mailto:support@activitycentral.co.uk" className="text-sageDeep font-semibold">support@activitycentral.co.uk</a>
          </p>
        </div>
      </div>
    </main>
  );
}
