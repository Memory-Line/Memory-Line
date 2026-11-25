// Word list for the cue card maker (admin test only).
// Each word has a picture: one of our own drawn symbols (src), or one of the line icons the site already uses (icon).
import { ICON_WORDS } from "./cueWords";
import { TABLER_WORDS } from "./cueWordsTabler";
import { EMOJI_WORDS } from "./cueWordsEmoji";
import { PHOSPHOR_WORDS } from "./cueWordsPhosphor";

export type CueGroupKey = "food" | "wash" | "health" | "comfort" | "feelings" | "chat" | "activities" | "out";
export type CueWord = { word: string; group: CueGroupKey; src?: string; icon?: string; tabler?: string; phosphor?: string; emoji?: string; also?: string[] };

// Same group names and colours as the BSL cards.
export const CUE_GROUPS: Record<CueGroupKey, { label: string; colour: string }> = {
  food: { label: "Food and drink", colour: "#B5714A" },
  wash: { label: "Washing and personal care", colour: "#3E6E96" },
  health: { label: "Health and pain", colour: "#B5453D" },
  comfort: { label: "Comfort and moving about", colour: "#2F7A7C" },
  feelings: { label: "Feelings", colour: "#6A5A9A" },
  chat: { label: "Everyday chat", colour: "#4F7A45" },
  activities: { label: "Activities and family", colour: "#A0507A" },
  out: { label: "Out and about", colour: "#8A6D1F" },
};

const B = "/boards/icons/";
const C = "/cue-symbols/";

// Hand-drawn symbols first: they win over a line icon when both could fit.
const DRAWN: CueWord[] = [
  { word: "Tea", group: "food", src: B + "tea.svg", also: ["cup of tea", "brew"] },
  { word: "Coffee", group: "food", src: B + "coffee.svg" },
  { word: "Water", group: "food", src: B + "water.svg", also: ["drink of water"] },
  { word: "Milk", group: "food", src: B + "milk.svg" },
  { word: "Juice", group: "food", src: B + "juice.svg", also: ["orange juice"] },
  { word: "Squash", group: "food", src: B + "squash.svg" },
  { word: "Hot chocolate", group: "food", src: B + "hot-chocolate.svg" },
  { word: "Toast", group: "food", src: B + "toast.svg" },
  { word: "Egg", group: "food", src: B + "egg.svg", also: ["eggs"] },
  { word: "Porridge", group: "food", src: B + "porridge.svg" },
  { word: "Cereal", group: "food", src: B + "cereal.svg" },
  { word: "Fruit", group: "food", src: B + "fruit.svg" },
  { word: "Sugar", group: "food", src: B + "sugar.svg" },
  { word: "Toilet", group: "wash", src: C + "toilet.svg", also: ["loo", "bathroom"] },
  { word: "Shower", group: "wash", src: C + "shower.svg", also: ["wash"] },
  { word: "Bed", group: "comfort", src: C + "bed.svg", also: ["sleep", "rest"] },
  { word: "Chair", group: "comfort", src: C + "chair.svg", also: ["sit", "sit down"] },
  { word: "Happy", group: "feelings", src: C + "happy.svg", also: ["smile", "good"] },
  { word: "Sad", group: "feelings", src: C + "sad.svg", also: ["upset", "unhappy"] },
  { word: "Pain", group: "health", src: C + "pain.svg", also: ["hurt", "ouch", "sore"] },
  { word: "Yes", group: "chat", src: C + "yes.svg", also: ["please"] },
  { word: "No", group: "chat", src: C + "no.svg", also: ["stop"] },
  { word: "Music", group: "activities", src: C + "music.svg", also: ["song", "singing", "sing"] },
  // Batch 1 of our own drawings for things the line icons do not cover.
  { word: "Pillow", group: "comfort", src: C + "pillow.svg", also: ["cushion", "pillows"] },
  { word: "Blanket", group: "comfort", src: C + "blanket.svg", also: ["blankets", "duvet", "throw"] },
  { word: "Walking stick", group: "comfort", src: C + "walking-stick.svg", also: ["stick", "cane"] },
  { word: "Walking frame", group: "comfort", src: C + "walking-frame.svg", also: ["frame", "zimmer", "walker", "rollator"] },
  { word: "Wheelchair", group: "comfort", src: C + "wheelchair.svg", also: ["chair user"] },
  { word: "Spoon", group: "food", src: C + "spoon.svg", also: ["spoons"] },
  { word: "Fork", group: "food", src: C + "fork.svg", also: ["forks"] },
  { word: "Knife", group: "food", src: C + "knife.svg", also: ["knives"] },
  { word: "Plate", group: "food", src: C + "plate.svg", also: ["plates"] },
  { word: "Bowl", group: "food", src: C + "bowl.svg", also: ["bowls"] },
  { word: "Mug", group: "food", src: C + "mug.svg", also: ["cup", "mugs", "cups"] },
  { word: "Towel", group: "wash", src: C + "towel.svg", also: ["towels", "dry"] },
  { word: "Soap", group: "wash", src: C + "soap.svg", also: ["bubbles"] },
  { word: "Toothbrush", group: "wash", src: C + "toothbrush.svg", also: ["brush teeth", "teeth", "clean teeth"] },
  { word: "Toothpaste", group: "wash", src: C + "toothpaste.svg" },
  { word: "Comb", group: "wash", src: C + "comb.svg", also: ["brush hair", "hairbrush"] },
  { word: "Mirror", group: "wash", src: C + "mirror.svg", also: ["looking glass"] },
  { word: "Slippers", group: "wash", src: C + "slippers.svg", also: ["slipper"] },
  { word: "Shoes", group: "wash", src: C + "shoes.svg", also: ["shoe", "boots", "boot"] },
  { word: "Socks", group: "wash", src: C + "socks.svg", also: ["sock"] },
  { word: "Coat", group: "wash", src: C + "coat.svg", also: ["jacket", "cardigan", "jumper"] },
  { word: "Hat", group: "wash", src: C + "hat.svg", also: ["bonnet", "cap"] },
  { word: "Scarf", group: "wash", src: C + "scarf.svg" },
  { word: "Gloves", group: "wash", src: C + "gloves.svg", also: ["glove", "mittens"] },
  { word: "Handbag", group: "chat", src: C + "handbag.svg", also: ["bag", "purse", "handbags"] },
  { word: "Remote control", group: "activities", src: C + "remote-control.svg", also: ["remote", "tv remote", "clicker"] },
  { word: "Candle", group: "activities", src: C + "candle.svg", also: ["candles"] },
];

export const CUE_WORDS: CueWord[] = [
  ...DRAWN,
  ...ICON_WORDS.map(([word, icon, group, also]) => ({ word, icon, group, also })),
  ...TABLER_WORDS.map(([word, tabler, group, also]) => ({ word, tabler, group, also })),
  ...EMOJI_WORDS.map(([word, emoji, group, also]) => ({ word, emoji, group, also })),
  ...PHOSPHOR_WORDS.map(([word, phosphor, group, also]) => ({ word, phosphor, group, also })),
];

function clean(s: string): string {
  return s.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
}

// Finds the card for what staff typed: an exact word or alias first, then a whole word inside a longer phrase.
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
