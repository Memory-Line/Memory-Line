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
      <p className="text-xs text-inkSoft mb-10">Last updated: 19 October 2026</p>

      <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">
        <Section title="1. Who we are">
          <p>
            This policy explains how Activity Central collects and uses personal data when you
            use our website and subscription service. The data controller is Activity Central
            Ltd, a company registered in England and Wales (company number 17510590), whose
            registered office is 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ.
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
            <li>
              <span className="font-medium text-ink">Email list</span> — if you tick the box to
              hear from us, your name, email address, the date you agreed and where you joined, so
              we can send news and offers. You can leave the list at any time.
            </li>
            <li>
              <span className="font-medium text-ink">Files, links and questionnaires</span> — files
              you upload to a shared link are stored so the link works. Answers to an online
              questionnaire are emailed to the care home that set it up and are not kept by us.
            </li>
            <li>
              <span className="font-medium text-ink">Messages to us</span> — what you write when you
              contact us through the support form or by email.
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
            override your own rights and interests. We send news and offers by email to account holders and
            subscribers only if you have agreed (your consent), and you can withdraw that at any
            time. Emails to care home businesses are covered in section 6.
          </p>
        </Section>

        <Section title="4. How long we keep data">
          <p>
            We keep your account data for as long as your account is active, and for a reasonable
            period afterwards in case you wish to reactivate it or as needed to meet our legal and
            accounting obligations. If you ask us to delete your account, we'll remove your
            personal data except where we're required to keep limited records (for example,
            billing records) for legal reasons. If you leave our email list we keep a note of that
            so we never email you again by mistake.
          </p>
        </Section>

        <Section title="5. Who we share data with">
          <p>We share personal data with the following types of service providers, who process it on our behalf:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Our payment processor (Stripe), to take subscription payments and manage billing.</li>
            <li>Our hosting provider (Vercel) and our database provider, to run the website and store account data securely.</li>
            <li>Our file storage provider (Vercel), to store files you upload to shared links.</li>
            <li>Our email provider (Resend), to send account emails, support replies and, if you agreed, news and offers.</li>
            <li>Our business email provider (Microsoft Outlook, supplied through GoDaddy), which carries our support mailbox and the personal emails we send to care home businesses.</li>
          </ul>
          <p>
            We don't sell your personal data, and we don't share it with anyone for their own
            marketing purposes.
          </p>
        </Section>

        <Section title="6. Emails to care home businesses">
          <p>
            We may email care homes and care providers (limited companies and similar
            organisations) to tell them about Activity Central.
          </p>
          <p>
            <strong>Whose details we use.</strong> We use general business contact details that
            organisations publish themselves, such as the contact email address on a care home&apos;s
            own website, and public registers such as the Care Quality Commission&apos;s directory of
            services. We don&apos;t use personal email addresses, and we don&apos;t send this kind of email to
            sole traders or partnerships.
          </p>
          <p>
            <strong>What we send.</strong> A small number of personal emails, sent from our own
            business mailbox and not through an automated mailing service. Each one says who we are,
            where we found the contact details, and how to opt out. If we don&apos;t hear back, we may send
            one follow-up.
          </p>
          <p>
            <strong>Why we&apos;re allowed to.</strong> Our legitimate interest in telling relevant
            businesses about a service that is relevant to their work (UK GDPR), together with the
            electronic marketing rules, which allow us to email the business addresses of companies.
            You can object at any time.
          </p>
          <p>
            <strong>How to unsubscribe.</strong> Reply &ldquo;stop&rdquo; or &ldquo;no thanks&rdquo; to any of our emails, use our
            unsubscribe page at{" "}
            <a href="https://activitycentral.co.uk/stop" className="text-sageDeep underline">https://activitycentral.co.uk/stop</a>, or
            write to support@activitycentral.co.uk. We&apos;ll stop straight away and keep your email
            address on a do-not-contact list so that we don&apos;t contact you again. We keep it only for
            that reason. If you have also signed up for our news and offers, each of those emails has
            an unsubscribe link.
          </p>
          <p>
            We keep a business&apos;s contact details only for as long as we need them for this, and we
            keep opt-out requests so that we can honour them. To ask where we found your details, to
            have them removed, or to use any of your other rights, see &ldquo;Your rights&rdquo; below.
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>
            We use a small number of cookies to keep you signed in and to support secure payment.
            See our <Link href="/cookies" className="text-sageDeep underline">Cookie Policy</Link> for
            details.
          </p>
        </Section>

        <Section title="8. Your rights">
          <p>Under UK GDPR, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Access the personal data we hold about you.</li>
            <li>Ask us to correct inaccurate data.</li>
            <li>Ask us to delete your data, in certain circumstances.</li>
            <li>Ask us to provide your data in a portable format.</li>
            <li>Object to certain processing based on legitimate interest.</li>
            <li>Withdraw your consent to news and offers emails at any time, using the unsubscribe link in every email or the choice in My account.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at support@activitycentral.co.uk. You
            also have the right to complain to the UK's data protection regulator, the
            Information Commissioner's Office (ICO), at ico.org.uk.
          </p>
        </Section>

        <Section title="9. Children's data">
          <p>
            Activity Central is intended for use by care home staff and adults supporting people
            living with dementia. It is not intended for use by children, and we do not knowingly
            collect personal data from children.
          </p>
        </Section>

        <Section title="10. International transfers">
          <p>
            Some of our hosting and infrastructure providers may process data on servers located
            outside the UK. Where this happens, we rely on providers who put appropriate
            safeguards in place to protect your data to a standard consistent with UK data
            protection law.
          </p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>
            We may update this policy from time to time. We'll post any changes on this page with
            a new "last updated" date.
          </p>
        </Section>

        <Section title="12. Contact us">
          <p>
            If you have questions about this policy or how we handle your data, contact us at
            support@activitycentral.co.uk.
          </p>
        </Section>
      </div>
    </main>
  );
}
