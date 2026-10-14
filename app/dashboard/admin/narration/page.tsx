import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { NARRATION_SCRIPTS } from "@/lib/narrationScripts";
import NarrationStudio from "@/components/NarrationStudio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Narration studio | Activity Central" };

// TEMPORARY: admin only, to be removed once the video is made.
export default async function NarrationPage() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect("/dashboard");
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Narration studio (temporary)</h1>
      <p className="text-clay text-sm mt-0.5">
        Makes the voiceover for the Holding Minds Steady video in the Bella voice. Press &ldquo;Make all audio&rdquo;, listen, edit any slide&apos;s words if you like
        and remake just that one, then &ldquo;Download all audio&rdquo;. Nothing is saved on the website.
      </p>
      <NarrationStudio scripts={NARRATION_SCRIPTS} />
    </div>
  );
}
