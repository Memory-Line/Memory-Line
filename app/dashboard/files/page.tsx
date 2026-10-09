import FilesManager from "@/components/FilesManager";
import UpgradePrompt from "@/components/UpgradePrompt";
import { getViewer } from "@/lib/viewer";
import { SHARED_FILES_PREMIUM_MESSAGE } from "@/lib/sharedFilesAccess";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shared files | Activity Central" };

export default async function SharedFilesPage() {
  const viewer = await getViewer();
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Shared files</h1>
      <p className="text-clay text-sm mt-0.5">
        Upload a menu, newsletter or photos and get a link or QR code to put on your own website. Each link can hold up
        to 10 files of up to 25MB each, and you can add, replace or delete them whenever you like. Use folders to keep
        your links tidy.
      </p>
      {viewer.isPremium ? (
        <FilesManager />
      ) : (
        <div className="mt-6">
          <UpgradePrompt message={SHARED_FILES_PREMIUM_MESSAGE} />
        </div>
      )}
    </div>
  );
}
