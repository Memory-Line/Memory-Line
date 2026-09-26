/* DRAFT: standard boilerplate terms - have a solicitor review before relying on this,
   especially the liability and IP sections, once the business is registered. */
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Terms & Conditions – Activity Central",
  description: "Terms and conditions for using Activity Central.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-serif text-xl text-ink mb-3">{title}</h2>
      <div className="text-sm text-inkSoft leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <Image src="/activity-central-icon.png" alt="Activity Central" width={40} height={40} />
        <span className="font-serif text-lg text-ink">Activity Central</span>
      </Link>

      <h1 className="font-serif text-3xl text-ink mb-2">Terms &amp; Conditions</h1>
      <p className="text-xs text-inkSoft mb-10">Last updated: 26 September 2026</p>

      <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">
        <Section title="1. Who we are">
          <p>
            Activity Central ("we", "us", "our") provides an online subscription library of
            downloadable and printable activity resources for care home activity teams and
            individuals supporting people living with dementia.
          </p>
          <p>
            [Company name] (company number [XXXXXXX], registered office [address]) — to be
            completed once the business is registered. Until registration is complete, Activity
            Central is operated by Dominik Brygida as a sole trader.
          </p>
        </Section>

        <Section title="2. The service">
          <p>
            Activity Central gives subscribers access to a library of activity packs (word
            searches, trivia, bingo, sing-alongs, communication cards, and similar resources)
            which can be viewed online or downloaded and printed for use in sessions.
          </p>
          <p>
            Titles, descriptions, and linked videos are generated to closely match each activity,
            but may occasionally be inaccurate or mismatched. Staff should always review an
            activity and any linked video before use, and use their professional judgement to
            ensure it is safe and appropriate for the residents or individuals taking part.
          </p>
        </Section>

        <Section title="3. Your account">
          <p>
            To use the service you need to register for an account with an email address and
            password. You're responsible for keeping your login details secure and for all
            activity that happens under your account. Please tell us as soon as possible if you
            think your account has been accessed without your permission.
          </p>
          <p>
            You must provide accurate information when registering, including whether the account
            is for personal use or on behalf of a care home.
          </p>
        </Section>

        <Section title="4. Subscription and billing">
          <p>
            Activity Central is offered on a monthly, rolling subscription, currently offered in
            two tiers, Standard and Premium — see <Link href="/pricing" className="text-sageDeep underline">/pricing</Link> for
            current pricing and what's included in each tier.
          </p>
          <p>
            Payment is taken monthly in advance via our payment processor, Stripe. Your
            subscription renews automatically each month until you cancel. You can cancel at any
            time from your account settings; cancellation stops future billing but we don't
            provide refunds for the current billing period already paid for, unless required by
            law.
          </p>
          <p>
            We may change our prices from time to time. If we do, we'll give you reasonable
            advance notice before the change applies to your next billing period, and you'll be
            able to cancel if you don't want to continue at the new price.
          </p>
        </Section>

        <Section title="5. Acceptable use">
          <p>
            Your subscription is for use within your own care setting or for your own personal
            use. You may print and use the activity packs with the residents, clients, or family
            members you support. You must not redistribute, resell, sub-license, or publish the
            activity packs — or share your account login — outside of that use.
          </p>
          <p>
            You must not use the service in any way that is unlawful, harmful, or that attempts to
            interfere with the proper working of the site.
          </p>
        </Section>

        <Section title="6. Intellectual property">
          <p>
            Activity Central owns (or holds the necessary rights to) all content in the library,
            including the activity packs, artwork, and text. Subscribing gives you a personal,
            non-exclusive, non-transferable licence to use and print the content for the purposes
            described in section 5, for as long as your subscription is active. It does not
            transfer ownership of that content to you.
          </p>
        </Section>

        <Section title="7. Ending your subscription">
          <p>
            You can cancel your subscription at any time from your account. We may suspend or end
            your account if you breach these terms, if payment fails and isn't resolved within a
            reasonable period, or if we decide to stop offering the service, in which case we'll
            give you reasonable notice where possible.
          </p>
        </Section>

        <Section title="8. Liability">
          <p>
            We provide the service as a helpful set of ready-made resources, not as a substitute
            for the professional judgement of activity coordinators, care staff, or medical
            professionals. As set out above, you should always review an activity and its
            suitability before running it with a particular person or group.
          </p>
          <p>
            To the fullest extent permitted by law, we exclude liability for indirect or
            consequential losses arising from use of the service. Nothing in these terms limits
            our liability for death or personal injury caused by our negligence, or for fraud,
            or any other liability which cannot legally be limited or excluded.
          </p>
        </Section>

        <Section title="9. Changes to these terms">
          <p>
            We may update these terms from time to time, for example to reflect changes to the
            service or to the law. We'll post the updated terms on this page with a new "last
            updated" date. If a change materially affects your rights, we'll try to give you
            reasonable notice.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>
            These terms are governed by the laws of England and Wales, and any disputes will be
            handled by the courts of England and Wales.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Questions about these terms can be sent to hello@activitycentral.co.uk.
          </p>
        </Section>
      </div>
    </main>
  );
}
