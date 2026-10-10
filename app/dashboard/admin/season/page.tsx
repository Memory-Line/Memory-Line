import SeasonAdmin from "./SeasonAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seasonal looks | Activity Central" };

// Behind the admin gate in ../layout.tsx.
export default function SeasonPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Seasonal looks</h1>
      <p className="text-clay text-sm mt-0.5">
        Dress the whole site for Christmas, Halloween, Remembrance, VE Day and Easter. Nothing changes until you switch one on.
        Printed activities and PDFs never change.
      </p>
      <SeasonAdmin />
    </div>
  );
}
