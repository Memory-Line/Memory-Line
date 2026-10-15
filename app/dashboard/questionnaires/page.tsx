import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userHasFeature } from "@/lib/features";
import QuestionnaireList from "@/components/QuestionnaireList";

export const dynamic = "force-dynamic";
export const metadata = { title: "Questionnaires | Activity Central" };

// Only for accounts with the Questionnaires feature switched on (admin page).
export default async function QuestionnairesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?next=/dashboard/questionnaires");
  if (!(await userHasFeature(session.user.id, "questionnaires"))) redirect("/dashboard");

  const forms = await prisma.sharedForm.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, token: true, title: true, notifyEmail: true, copyEmail: true },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Questionnaires</h1>
      <p className="text-clay text-sm mt-0.5">
        Put these links on your website, or print a QR code. People fill them in online and the answers are emailed to you.
      </p>
      <div className="mt-5 rounded-xl p-4 border border-line bg-card">
        <p className="text-sm font-semibold">If your answers don&apos;t arrive</p>
        <p className="text-xs text-inkSoft mt-1">
          Answers are emailed from <b>support@activitycentral.co.uk</b> with a PDF attached. Some email systems, especially Microsoft 365 (Outlook),
          can hide an email with an attachment from a sender they don&apos;t know yet. It can end up in <b>Junk</b>, or in a <b>quarantine</b> that only
          your IT team can see.
        </p>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-xs text-inkSoft">
          <li>Check your Junk or Spam folder, and search your whole mailbox for &ldquo;New response&rdquo;.</li>
          <li>
            Ask your IT team to check the quarantine and to allow <b>support@activitycentral.co.uk</b> (mark it as a safe sender).
          </li>
          <li>Still nothing? Email us at support@activitycentral.co.uk and we&apos;ll help.</li>
        </ol>
      </div>
      <QuestionnaireList forms={forms} />
    </div>
  );
}
