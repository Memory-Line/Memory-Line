// Sample word list for the cue card maker (admin test only). Each word points to one of our own drawn symbols.
// Food and drink reuse the board symbols; the rest live in /public/cue-symbols.
export type CueWord = { word: string; src: string; also?: string[] };

const B = "/boards/icons/";
const C = "/cue-symbols/";

export const CUE_WORDS: CueWord[] = [
  { word: "Tea", src: B + "tea.svg", also: ["cup of tea", "brew"] },
  { word: "Coffee", src: B + "coffee.svg" },
  { word: "Water", src: B + "water.svg", also: ["drink of water"] },
  { word: "Milk", src: B + "milk.svg" },
  { word: "Juice", src: B + "juice.svg", also: ["orange juice"] },
  { word: "Squash", src: B + "squash.svg" },
  { word: "Hot chocolate", src: B + "hot-chocolate.svg" },
  { word: "Toast", src: B + "toast.svg" },
  { word: "Egg", src: B + "egg.svg", also: ["eggs"] },
  { word: "Porridge", src: B + "porridge.svg" },
  { word: "Cereal", src: B + "cereal.svg" },
  { word: "Fruit", src: B + "fruit.svg" },
  { word: "Sugar", src: B + "sugar.svg" },
  { word: "Toilet", src: C + "toilet.svg", also: ["loo", "bathroom"] },
  { word: "Bed", src: C + "bed.svg", also: ["sleep", "rest"] },
  { word: "Shower", src: C + "shower.svg", also: ["wash"] },
  { word: "Chair", src: C + "chair.svg", also: ["sit", "sit down"] },
  { word: "Happy", src: C + "happy.svg", also: ["smile", "good"] },
  { word: "Sad", src: C + "sad.svg", also: ["upset", "unhappy"] },
  { word: "Pain", src: C + "pain.svg", also: ["hurt", "ouch", "sore"] },
  { word: "Yes", src: C + "yes.svg", also: ["please"] },
  { word: "No", src: C + "no.svg", also: ["stop"] },
  { word: "Music", src: C + "music.svg", also: ["song", "singing", "sing"] },
];

function clean(s: string): string {
  return s.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

// Finds the symbol for what staff typed: an exact word or alias first, then a whole word inside a longer phrase.
export function findCueWord(typed: string): CueWord | null {
  const t = clean(typed);
  if (!t) return null;
  for (const w of CUE_WORDS) {
    if (clean(w.word) === t || (w.also ?? []).some((a) => clean(a) === t)) return w;
  }
  const padded = " " + t + " ";
  for (const w of CUE_WORDS) {
    const names = [w.word, ...(w.also ?? [])].map(clean);
    if (names.some((n) => padded.includes(" " + n + " "))) return w;
  }
  return null;
}
