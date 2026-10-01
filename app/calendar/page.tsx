import CalendarView from "@/components/CalendarView";
import UpgradePrompt from "@/components/UpgradePrompt";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const viewer = await getViewer();
  if (!viewer.isPremium) {
    return (
      <div>
        <h1 className="font-serif text-[26px] mb-4">Holidays &amp; Celebrations</h1>
        <UpgradePrompt message="The Holidays & Celebrations calendar is part of the Premium plan." />
      </div>
    );
  }
  return <CalendarView variant="activity" />;
}
