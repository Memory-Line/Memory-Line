import AdminForms from "./AdminForms";

export const metadata = { title: "Questionnaires (admin) | Activity Central" };

// Behind the admin gate in ../layout.tsx.
export default function AdminFormsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Questionnaires</h1>
      <p className="text-clay text-sm mt-0.5">
        Set up the Westcliff Lodge questionnaires for an account. Answers are emailed to the address you choose here, and nothing is stored.
      </p>
      <AdminForms />
    </div>
  );
}
