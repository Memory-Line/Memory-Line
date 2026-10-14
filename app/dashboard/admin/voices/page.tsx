import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import VoiceSamples from "@/components/VoiceSamples";

export const dynamic = "force-dynamic";
export const metadata = { title: "Voice samples | Activity Central" };

export default async function VoicesPage() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect("/dashboard");
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Voice samples</h1>
      <p className="text-clay text-sm mt-0.5">
        The same short script read by different Azure voices, so you can choose the one for the staff training. The first play of each voice takes a few
        seconds. If a voice says it is not available, it is not on our Azure account.
      </p>
      <VoiceSamples />
    </div>
  );
}
