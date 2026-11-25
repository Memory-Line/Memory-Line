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
      <section className="mt-10 pt-4 border-t border-line text-xs text-clay max-w-3xl">
        <h2 className="font-semibold text-sm text-ink mb-1">Picture credits</h2>
        <p>
          Some pictures are drawn by Activity Central. Others come from free, open-source sets that we are allowed to use in a paid service:
          Tabler Icons (MIT licence, tabler.io/icons), Phosphor Icons (MIT licence, phosphoricons.com), Lucide icons (ISC licence, lucide.dev),
          and Google Noto Emoji (Apache License 2.0, github.com/googlefonts/noto-emoji). Emoji names and search words are from Emojibase (MIT).
          Licence files are kept in the folders that hold the pictures.
        </p>
      </section>
    </div>
  );
}
