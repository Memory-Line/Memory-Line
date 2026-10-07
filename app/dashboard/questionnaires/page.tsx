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
    select: { id: true, token: true, title: true, notifyEmail: true },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Questionnaires</h1>
      <p className="text-clay text-sm mt-0.5">
        Put these links on your website, or print a QR code. People fill them in online and the answers are emailed to you.
      </p>
      <QuestionnaireList forms={forms} />
    </div>
  );
}
