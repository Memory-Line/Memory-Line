import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userHasFeature } from "@/lib/features";
import CalendarView from "@/components/CalendarView";

export const dynamic = "force-dynamic";

// A blank calendar for the home's own events. Only accounts with the
// "professional-calendar" feature switched on (admin page → Accounts) can
// open it; anyone else goes back to their dashboard.
export default async function ProfessionalCalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?next=/professional-calendar");
  }
  if (!(await userHasFeature(session.user.id, "professional-calendar"))) {
    redirect("/dashboard");
  }
  return <CalendarView variant="professional" />;
}
