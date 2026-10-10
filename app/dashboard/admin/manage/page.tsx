import ManageContent from "./ManageContent";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage activities | Activity Central" };

// Behind the admin gate in ../layout.tsx.
export default function ManagePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Manage activities and categories</h1>
      <p className="text-clay text-sm mt-0.5">
        Make new categories, remove categories, and remove activities. Removing is permanent and deletes the files too.
      </p>
      <ManageContent />
    </div>
  );
}
