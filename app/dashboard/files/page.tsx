import FilesManager from "@/components/FilesManager";

export const metadata = { title: "Shared files | Activity Central" };

export default function SharedFilesPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Shared files</h1>
      <p className="text-clay text-sm mt-0.5">
        Upload a menu, newsletter or photos and get a link to put on your own website. Each link can hold up to 5 files, and you can add, replace or delete them whenever you like.
      </p>
      <FilesManager />
    </div>
  );
}
