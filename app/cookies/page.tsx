import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Cookie Policy – Activity Central",
  description: "Which cookies Activity Central uses and why.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-serif text-xl text-ink mb-3">{title}</h2>
      <div className="text-sm text-inkSoft leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function CookiesPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <Image src="/activity-central-icon.png" alt="Activity Central" width={40} height={40} />
        <span className="font-serif text-lg text-ink">Activity Central</span>
      </Link>

      <h1 className="font-serif text-3xl text-ink mb-2">Cookie Policy</h1>
      <p className="text-xs text-inkSoft mb-10">Last updated: 26 September 2026</p>

      <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">
        <Section title="1. What are cookies?">
          <p>
            Cookies are small text files that a website stores on your device. They're widely used
            to make websites work, or work more efficiently, as well as for reporting and
            advertising. This policy explains which cookies Activity Central uses.
          </p>
        </Section>

        <Section title="2. The cookies we use">
          <p>
            Activity Central only uses cookies that are strictly necessary for the site to work.
            We do not currently use any advertising or analytics tracking cookies.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-medium text-ink">Session cookie</span> — a cookie set when you
              log in, which keeps you signed in as you move around the site. Without it you'd be
              asked to log in again on every page.
            </li>
            <li>
              <span className="font-medium text-ink">Stripe checkout cookies</span> — when you go
              through the payment step to subscribe, our payment processor, Stripe, sets its own
              cookies on its checkout pages to process your payment securely and prevent fraud.
              These are set and controlled by Stripe, not by us.
            </li>
          </ul>
          <p>
            Because we only use these strictly necessary cookies, and no advertising or analytics
            tracking, we don't show a cookie consent pop-up — UK cookie law only requires consent
            for non-essential cookies. We do show a small notice with a link to this page so it's
            clear what's happening.
          </p>
        </Section>

        <Section title="3. Controlling cookies">
          <p>
            Most web browsers let you control cookies through their settings, including blocking
            or deleting them. Bear in mind that blocking the session cookie will stop you from
            being able to stay signed in to your account, and blocking Stripe's checkout cookies
            may prevent you from completing payment.
          </p>
        </Section>

        <Section title="4. Changes to this policy">
          <p>
            If we ever add analytics or advertising cookies in future, we'll update this policy
            and put a proper cookie consent option in place before doing so.
          </p>
        </Section>

        <Section title="5. Contact us">
          <p>
            Questions about this policy can be sent to privacy@activitycentral.co.uk (to be set
            up). See also our <Link href="/privacy" className="text-sageDeep underline">Privacy Policy</Link>.
          </p>
        </Section>
      </div>
    </main>
  );
}
