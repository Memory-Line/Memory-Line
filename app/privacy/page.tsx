/* DRAFT: standard boilerplate privacy policy - have a solicitor review before relying on this,
   especially the liability and IP sections, once the business is registered. */
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Privacy Policy – Activity Central",
  description: "How Activity Central collects, uses, and protects your personal data.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-serif text-xl text-ink mb-3">{title}</h2>
      <div className="text-sm text-inkSoft leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <Image src="/activity-central-icon.png" alt="Activity Central" width={40} height={40} />
        <span className="font-serif text-lg text-ink">Activity Central</span>
      </Link>

      <h1 className="font-serif text-3xl text-ink mb-2">Privacy Policy</h1>
      <p className="text-xs text-inkSoft mb-10">Last updated: 26 September 2026</p>

      <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">
        <Section title="1. Who we are">
          <p>
            This policy explains how Activity Central collects and uses personal data when you
            use our website and subscription service. The data controller is [Company name]
            (company number [XXXXXXX], registered office [address]) — to be completed once the
            business is registered. Until registration is complete, Activity Central is operated
            by Dominik Brygida as a sole trader.
          </p>
        </Section>

        <Section title="2. What we collect and why">
          <p>We collect the following personal data:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <span className="font-medium text-ink">Account details</span> — your name (or your
              care home's name), email address, whether you've registered as a personal or
              care-home account, and a password. Your password is stored as a one-way hash and is
              never stored or visible in plain text.
            </li>
            <li>
              <span className="font-medium text-ink">Billing details</span> — your Stripe customer
              and subscription IDs and subscription status (e.g. active, past due, cancelled).
              Card numbers and other payment details are never seen or stored by us — they're
              handled entirely by our payment processor, Stripe.
            </li>
            <li>
              <span className="font-medium text-ink">Calendar entries</span> — any events you add
              to your activity or professional calendar (date, title, time).
            </li>
            <li>
              <span className="font-medium text-ink">Usage records</span> — which activities
              you've downloaded and which you've marked as completed, so the service can show your
              download and completion history.
            </li>
          </ul>
          <p>
            We use this data to run your account, provide the subscription and the activity
            library, process billing, and keep basic records of what's been used.
          </p>
        </Section>

        <Section title="3. Our legal basis for processing">
          <p>
            We process account, billing, and calendar data because it's necessary to perform our
            contract with you (providing the subscription you've signed up for). We process basic
            usage records (downloads and completions) on the basis of our legitimate interest in
            understanding how the library is used and keeping it useful, in a way that doesn't
            override your own rights and interests.
          </p>
        </Section>

        <Section title="4. How long we keep data">
          <p>
            We keep your account data for as long as your account is active, and for a reasonable
            period afterwards in case you wish to reactivate it or as needed to meet our legal and
            accounting obligations. If you ask us to delete your account, we'll remove your
            personal data except where we're required to keep limited records (for example,
            billing records) for legal reasons.
          </p>
        </Section>

        <Section title="5. Who we share data with">
          <p>We share personal data with the following types of service providers, who process it on our behalf:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Our payment processor (Stripe), to take subscription payments and manage billing.</li>
            <li>Our hosting provider (Vercel) and our database provider, to run the website and store account data securely.</li>
          </ul>
          <p>
            We don't sell your personal data, and we don't share it with anyone for their own
            marketing purposes.
          </p>
        </Section>

        <Section title="6. Cookies">
          <p>
            We use a small number of cookies to keep you signed in and to support secure payment.
            See our <Link href="/cookies" className="text-sageDeep underline">Cookie Policy</Link> for
            details.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>Under UK GDPR, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Access the personal data we hold about you.</li>
            <li>Ask us to correct inaccurate data.</li>
            <li>Ask us to delete your data, in certain circumstances.</li>
            <li>Ask us to provide your data in a portable format.</li>
            <li>Object to certain processing based on legitimate interest.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at privacy@activitycentral.co.uk (to be
            set up). You also have the right to complain to the UK's data protection regulator,
            the Information Commissioner's Office (ICO), at ico.org.uk.
          </p>
        </Section>

        <Section title="8. Children's data">
          <p>
            Activity Central is intended for use by care home staff and adults supporting people
            living with dementia. It is not intended for use by children, and we do not knowingly
            collect personal data from children.
          </p>
        </Section>

        <Section title="9. International transfers">
          <p>
            Some of our hosting and infrastructure providers may process data on servers located
            outside the UK. Where this happens, we rely on providers who put appropriate
            safeguards in place to protect your data to a standard consistent with UK data
            protection law.
          </p>
        </Section>

        <Section title="10. Changes to this policy">
          <p>
            We may update this policy from time to time. We'll post any changes on this page with
            a new "last updated" date.
          </p>
        </Section>

        <Section title="11. Contact us">
          <p>
            If you have questions about this policy or how we handle your data, contact us at
            privacy@activitycentral.co.uk (to be set up).
          </p>
        </Section>
      </div>
    </main>
  );
}
