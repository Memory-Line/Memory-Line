import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SupportForm from "./SupportForm";

export const metadata = { title: "Support | Activity Central" };

const HELP = [
  {
    q: "How do I change plan, update my card or cancel?",
    a: "Log in and press Manage subscription on your dashboard. It opens our payment provider's secure page, where you can change plan, update your card, download receipts or cancel any time.",
  },
  {
    q: "I forgot my password",
    a: "Use the Forgot your password? link on the log in page and we'll email you a link. It can take a couple of minutes, so check your junk folder too.",
  },
  {
    q: "Why can't I see some categories or play on screen?",
    a: "Communication Cards, BSL Tools and Physical & Exercise come with the Premium plan, and so do large print sheets and the professional calendar. You can upgrade from the Manage subscription button.",
  },
  {
    q: "An activity looks wrong or won't open",
    a: "Tell us the activity's name and category below and we'll look at it. Staff should always check an activity before using it with residents.",
  },
];

export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="w-full max-w-xl mx-auto">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-xl">Activity Central</span>
        </Link>

        <h1 className="font-serif text-3xl mb-2 text-center">How can we help?</h1>
        <p className="text-inkSoft text-sm text-center mb-8">
          Send us a message and we'll reply by email, usually within one working day. You can also write to{" "}
          <a href="mailto:support@activitycentral.co.uk" className="text-sageDeep font-semibold">
            support@activitycentral.co.uk
          </a>
          .
        </p>

        <SupportForm defaultName={session?.user?.name ?? ""} defaultEmail={session?.user?.email ?? ""} />

        <h2 className="font-serif text-xl mt-10 mb-3">Quick answers</h2>
        <div className="space-y-3">
          {HELP.map((h) => (
            <details key={h.q} className="rounded-xl border border-line bg-card px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold">{h.q}</summary>
              <p className="text-sm text-inkSoft mt-2">{h.a}</p>
            </details>
          ))}
        </div>

        <p className="text-xs text-center mt-8">
          <Link href={session ? "/dashboard" : "/"} className="text-sageDeep font-semibold">
            {session ? "Back to your dashboard" : "Back to the home page"}
          </Link>
        </p>
      </div>
    </main>
  );
}
