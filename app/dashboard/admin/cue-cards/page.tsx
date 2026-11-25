import CueCardMaker from "./CueCardMaker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cue card maker (test) | Activity Central" };

// Behind the admin gate in ../layout.tsx. A test version: only admins can open it.
export default function CueCardsPage() {
  return (
    <div className="max-w-5xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Cue card maker (test)</h1>
      <p className="text-clay text-sm mt-0.5">
        Type a word and press Add. Words with a symbol get a printable card. Only you can see this page.
      </p>
      <CueCardMaker />
    </div>
  );
}
