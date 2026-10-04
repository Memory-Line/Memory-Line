import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmailUpdatesCard from "@/components/EmailUpdatesCard";
import SuggestionForm from "@/components/SuggestionForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account | Activity Central" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl mb-3">{title}</h2>
      {children}
    </section>
  );
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      name: true,
      email: true,
      accountType: true,
      plan: true,
      subscriptionStatus: true,
      subscriptionRenewsAt: true,
    },
  });
  if (!user) return null;

  const contact = await prisma.mailingContact.findUnique({ where: { email: user.email.toLowerCase() } });
  const onMailingList = !!contact && !contact.unsubscribedAt;

  const freeAccess = user.subscriptionStatus === "free";
  const planLabel = user.plan === "standard" ? "Standard" : "Premium";
  const renews = user.subscriptionRenewsAt
    ? user.subscriptionRenewsAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl sm:text-3xl">My account</h1>
      <p className="text-clay text-sm mt-0.5">Your details, subscription and email choices in one place.</p>

      <Section title="Your details">
        <div className="rounded-xl p-4 bg-card border border-line text-sm space-y-1.5">
          <p>
            <span className="text-inkSoft">{user.accountType === "care-home" ? "Care home: " : "Name: "}</span>
            {user.name}
          </p>
          <p>
            <span className="text-inkSoft">Email: </span>
            {user.email}
          </p>
          <p className="text-xs text-inkSoft pt-1">
            To change these, send us a message from Help &amp; support and we'll update them for you.
          </p>
        </div>
      </Section>

      <Section title="Your subscription">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl p-4 bg-card border border-line">
          <div>
            <p className="text-sm font-bold text-sageDeep">
              {freeAccess ? "Free access" : `${planLabel} plan`}
            </p>
            <p className="text-xs text-inkSoft mt-0.5">
              {freeAccess
                ? "Given by Activity Central, so there's no payment to manage."
                : renews
                ? `Renews on ${renews}`
                : "Active"}
            </p>
            {!freeAccess && (
              <p className="text-xs text-inkSoft mt-2">
                Change plan, update your card, download receipts or cancel on our payment provider's secure page.
              </p>
            )}
          </div>
          {!freeAccess && (
            <form action="/api/stripe/portal" method="POST">
              <button
                formAction="/api/stripe/portal"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-cardTint hover:bg-line transition-colors whitespace-nowrap"
              >
                Manage subscription
              </button>
            </form>
          )}
        </div>
      </Section>

      <Section title="Email choices">
        <EmailUpdatesCard initiallySubscribed={onMailingList} />
      </Section>

      <Section title="Suggestions">
        <p className="text-sm text-inkSoft mb-3">
          Got an idea for an activity, a category or something that would make the site better? Tell us. We read
          every one.
        </p>
        <SuggestionForm defaultName={user.name ?? ""} defaultEmail={user.email} />
      </Section>
    </div>
  );
}
