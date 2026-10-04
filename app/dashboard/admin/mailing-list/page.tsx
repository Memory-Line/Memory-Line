import { prisma } from "@/lib/prisma";
import AddFriendsForm from "./AddFriendsForm";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Behind the admin gate in ../layout.tsx.
export default async function MailingListPage() {
  const contacts = await prisma.mailingContact.findMany({ orderBy: { createdAt: "desc" } });
  const subscribed = contacts.filter((c) => !c.unsubscribedAt).length;

  // Free-access accounts not yet on the list (unsubscribed people count as "on" so they're never offered again).
  const onList = new Set(contacts.map((c) => c.email));
  const friends = (
    await prisma.user.findMany({
      where: { subscriptionStatus: "free" },
      select: { email: true, name: true },
      orderBy: { createdAt: "asc" },
    })
  ).filter((u) => !onList.has(u.email.toLowerCase()));

  return (
    <div>
      <h1 className="font-serif text-2xl sm:text-3xl">Mailing list</h1>
      <p className="text-clay text-sm mt-0.5">
        People who ticked the box to get news and offers. Only the subscribed ones can be emailed.
      </p>

      <div className="flex flex-wrap items-center gap-3 mt-5">
        <span className="rounded-lg bg-card border border-line px-3 py-2 text-sm">
          <b>{subscribed}</b> subscribed
        </span>
        <span className="rounded-lg bg-card border border-line px-3 py-2 text-sm">
          <b>{contacts.length - subscribed}</b> unsubscribed
        </span>
        <a
          href="/api/admin/mailing-list"
          className="rounded-lg bg-sage text-white px-4 py-2 text-sm font-semibold hover:bg-sageDeep transition-colors"
        >
          Download as spreadsheet
        </a>
      </div>

      {friends.length > 0 && <AddFriendsForm people={friends} />}

      {contacts.length === 0 ? (
        <p className="mt-6 text-sm text-inkSoft">
          Nobody is on the list yet. People join when they tick the box on the sign-up page.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-inkSoft border-b border-line">
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Agreed</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2">{c.name ?? ""}</td>
                  <td className="px-4 py-2">{c.email}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{fmt(c.consentAt)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {c.unsubscribedAt ? (
                      <span className="text-inkSoft">Unsubscribed {fmt(c.unsubscribedAt)}</span>
                    ) : (
                      <span className="text-sageDeep font-semibold">Subscribed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
