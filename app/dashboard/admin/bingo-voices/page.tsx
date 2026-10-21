import BingoVoicesAdmin from "./BingoVoicesAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bingo voices | Activity Central" };

// Behind the admin gate in ../layout.tsx.
export default function BingoVoicesPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl sm:text-3xl">Bingo voices</h1>
      <p className="text-clay text-sm mt-0.5">
        Makes every recording the Bingo caller can say, in every language and both voices, so no number ever waits or goes quiet during a game.
      </p>
      <BingoVoicesAdmin />
    </div>
  );
}
