import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Audit trail | Activity Central" };
export const dynamic = "force-dynamic";

const PAGE = 100;

const GROUPS: { label: string; prefix: string }[] = [
  { label: "Everything", prefix: "" },
  { label: "Admin actions", prefix: "admin." },
  { label: "Sign-ups and passwords", prefix: "account." },
  { label: "Billing", prefix: "billing." },
  { label: "Logins", prefix: "auth." },
];

// Plain-English names for what was done.
const NAMES: Record<string, string> = {
  "admin.free-access.grant": "Gave free access",
  "admin.free-access.remove": "Removed free access",
  "admin.account.update": "Changed an account (plan, type, name or features)",
  "admin.category.create": "Made a category",
  "admin.category.delete": "Deleted a category and its activities",
  "admin.category.restore": "Brought a category back",
  "admin.activities.delete": "Deleted activities",
  "admin.activities.rename": "Renamed activities",
  "admin.activity.upload": "Uploaded an activity file",
  "admin.boards.reload": "Reloaded the communication boards",
  "admin.renumber": "Renumbered a category",
  "admin.mailing.send": "Sent a batch of the mailing list email",
  "admin.season.update": "Changed a seasonal look",
  "admin.questionnaire.create": "Made questionnaires for an account",
  "admin.questionnaire.delete": "Deleted a questionnaire",
  "account.register": "New account signed up",
  "account.password.reset": "Password reset with an emailed link",
  "account.shared-link.delete": "Deleted a shared files link",
  "billing.subscription.updated": "Subscription started or changed (from Stripe)",
  "billing.subscription.cancelled": "Subscription ended (from Stripe)",
  "auth.login.failed": "Failed login",
  "auth.admin.login": "Admin logged in",
};

const when = (d: Date) =>
  d.toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });

// Behind the admin gate in ../layout.tsx. Newest first. ?group=admin.&q=someone@example.com&page=2
export default async function AuditPage({ searchParams }: { searchParams: { group?: string; q?: string; page?: string } }) {
  const prefix = GROUPS.some((g) => g.prefix === (searchParams.group ?? "")) ? searchParams.group ?? "" : "";
  const q = (searchParams.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(searchParams.page) || 1);
  const where = {
    ...(prefix ? { action: { startsWith: prefix } } : {}),
    ...(q
      ? {
          OR: [
            { actorEmail: { contains: q, mode: "insensitive" as const } },
            { target: { contains: q, mode: "insensitive" as const } },
            { detail: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { at: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: number, g = prefix) => `/dashboard/admin/audit?${new URLSearchParams({ ...(g ? { group: g } : {}), ...(q ? { q } : {}), ...(p > 1 ? { page: String(p) } : {}) }).toString()}`;

  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Audit trail</h1>
      <p className="text-clay text-sm mt-0.5">
        A record of sensitive things on the site: who did what, to what, and when. Newest first. Times are UK time.
      </p>

      <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label="Show">
        {GROUPS.map((g) => (
          <Link
            key={g.label}
            href={link(1, g.prefix)}
            className={`rounded-full px-4 py-2 text-sm font-semibold border-2 ${prefix === g.prefix ? "bg-sage text-white border-sage" : "bg-white text-sageDeep border-line"}`}
          >
            {g.label}
          </Link>
        ))}
      </div>
      <form className="mt-3 flex gap-2" action="/dashboard/admin/audit">
        {prefix && <input type="hidden" name="group" value={prefix} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by email, what it was done to, or the details"
          aria-label="Search the audit trail"
          className="w-full max-w-md rounded-lg border border-line px-3 py-2 text-sm bg-white"
        />
        <button type="submit" className="rounded-lg bg-sage text-white px-4 py-2 text-sm font-semibold">Search</button>
      </form>

      <p className="text-xs text-inkSoft mt-3">{total} {total === 1 ? "entry" : "entries"}</p>
      <div className="mt-2 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-cardTint text-inkSoft">
            <tr>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">When</th>
              <th className="px-3 py-2 font-semibold">Who</th>
              <th className="px-3 py-2 font-semibold">What happened</th>
              <th className="px-3 py-2 font-semibold">To what</th>
              <th className="px-3 py-2 font-semibold">Details</th>
              <th className="px-3 py-2 font-semibold whitespace-nowrap">From</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line align-top">
                <td className="px-3 py-2 whitespace-nowrap">{when(r.at)}</td>
                <td className="px-3 py-2 break-all">{r.actorEmail ?? <span className="text-inkSoft">not signed in</span>}</td>
                <td className="px-3 py-2">
                  {NAMES[r.action] ?? r.action}
                  {r.env && r.env !== "production" && <span className="ml-1 rounded bg-red-100 text-red-700 px-1.5 py-0.5 font-semibold">test site</span>}
                </td>
                <td className="px-3 py-2 break-words">{r.target ?? ""}</td>
                <td className="px-3 py-2 break-words">{r.detail ?? ""}</td>
                <td className="px-3 py-2 whitespace-nowrap text-inkSoft">{r.ip ?? ""}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-inkSoft">Nothing recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-3 mt-4 text-sm font-semibold">
          {page > 1 && <Link href={link(page - 1)} className="text-sageDeep underline">← Newer</Link>}
          <span className="text-inkSoft font-normal">Page {page} of {pages}</span>
          {page < pages && <Link href={link(page + 1)} className="text-sageDeep underline">Older →</Link>}
        </div>
      )}
    </div>
  );
}
