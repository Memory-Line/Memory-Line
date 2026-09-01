import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?next=/dashboard");
  }

  const activeStatuses = ["active", "trialing"];
  if (!activeStatuses.includes(session.user.subscriptionStatus)) {
    redirect("/pricing");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1">
        <TopBar userName={session.user.name ?? session.user.email ?? "there"} />
        <main className="px-6 pb-10 max-w-[980px]">{children}</main>
      </div>
    </div>
  );
}
