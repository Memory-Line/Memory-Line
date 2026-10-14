import { redirect } from "next/navigation";
import { getSession, getViewer } from "@/lib/viewer";
import Sidebar from "@/components/Sidebar";
import { getCategories } from "@/lib/categories";
import TopBar from "@/components/TopBar";
import { DementiaProvider } from "@/components/EasyView";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login?next=/dashboard");
  }

  // "free" = access given by the admin without a Stripe subscription.
  const activeStatuses = ["active", "trialing", "free"];
  if (!activeStatuses.includes(session.user.subscriptionStatus)) {
    redirect("/pricing");
  }

  // The checks below used to run one after another (five separate database trips); now at once, and shared with the page.
  const [viewer, siteCategories] = await Promise.all([getViewer(), getCategories()]);
  const professionalCalendar = viewer.ownFeatures.includes("professional-calendar");
  const questionnaires = viewer.ownFeatures.includes("questionnaires");
  const categories = siteCategories.map((c) => ({ key: c.key, slug: c.slug, icon: c.icon }));

  return (
    <DementiaProvider initial={viewer.dementiaFriendly} className="flex flex-col md:flex-row min-h-screen bg-bg">
      <Sidebar categories={categories} isAdmin={viewer.isAdmin} professionalCalendar={professionalCalendar} questionnaires={questionnaires} />
      <div className="flex-1 min-w-0">
        <TopBar
          userName={session.user.name ?? session.user.email ?? "there"}
          isAdmin={viewer.isAdmin}
          previewPlan={viewer.previewPlan}
        />
        <main className="px-4 sm:px-6 pb-10 max-w-[980px]">{children}</main>
        <p className="px-4 sm:px-6 pb-10 max-w-[980px] text-[11px] text-inkSoft leading-relaxed border-t border-line pt-4 mt-6">
          Titles, descriptions, and linked videos are generated to closely match each activity, but may occasionally be inaccurate or mismatched. Staff should always review an activity and any linked video before use, and use their professional judgement to ensure it is safe and appropriate for the residents taking part.
        </p>
      </div>
    </DementiaProvider>
  );
}
