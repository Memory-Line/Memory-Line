import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { prisma } from "@/lib/prisma";
import { COURSES } from "@/lib/trainingCourses";
import TrainingLinkMaker from "@/components/TrainingLinkMaker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff training | Activity Central" };

// Being tested: only the admin account can open this for now.
export default async function TrainingPage() {
  const viewer = await getViewer();
  if (!viewer.userId) redirect("/login?next=/dashboard/training");
  if (!viewer.isAdmin) redirect("/dashboard");
  const me = await prisma.user.findUnique({ where: { id: viewer.userId }, select: { email: true, name: true, accountType: true } });

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Staff training (test)</h1>
      <p className="text-clay text-sm mt-0.5">
        Make a link for a course and send it to your staff. They watch the slide show, take the quiz and fill in their details. The
        certificate is emailed to the address you choose. Only you can see this page while it is being tested.
      </p>
      <TrainingLinkMaker
        courses={COURSES.map((c) => ({ key: c.key, title: c.title, subtitle: c.subtitle, minutes: c.minutes, passPercent: c.passPercent }))}
        defaultEmail={me?.email ?? ""}
        defaultHome={me?.accountType === "care-home" ? me.name : ""}
      />
    </div>
  );
}
