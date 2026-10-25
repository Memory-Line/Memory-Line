import refs from "@/lib/data/bslSignRefs.json";

// BSL Tools: 90 everyday signs for care, sorted into groups. Every sign plays its video through SignBSL.com's
// own embed (https://www.signbsl.com), so the videos stay with the people who made them and are credited on the page.
// "file" is the printable card's file name in the BSL Tools category (used to find its print and star).
export type BslGroup = {
  slug: string;
  label: string;
  description: string;
  color: string;
  icon: "food" | "wash" | "health" | "comfort" | "feelings" | "chat" | "activities";
};

export const BSL_GROUPS: BslGroup[] = [
  { slug: "food-and-drink", label: "Food and drink", description: "Tea, coffee, meals and what someone would like", color: "#B5714A", icon: "food" },
  { slug: "washing-and-personal-care", label: "Washing and personal care", description: "Toilet, washing, clothes, glasses and hearing aids", color: "#3E6E96", icon: "wash" },
  { slug: "health-and-pain", label: "Health and pain", description: "Pain, feeling ill, medicine and the doctor", color: "#B5453D", icon: "health" },
  { slug: "comfort-and-moving-about", label: "Comfort and moving about", description: "Warm, cold, sleep, sitting, standing and walking", color: "#2F7A7C", icon: "comfort" },
  { slug: "feelings", label: "Feelings", description: "Happy, sad, worried and everything in between", color: "#6A5A9A", icon: "feelings" },
  { slug: "everyday-chat", label: "Everyday chat", description: "Greetings, offers of help and checking someone is ok", color: "#4F7A45", icon: "chat" },
  { slug: "activities-and-family", label: "Activities and family", description: "Music, the garden, television, family and visitors", color: "#A0507A", icon: "activities" },
];

export type BslSign = { slug: string; title: string; group: string; videos: string[]; file: string };

const F = "food-and-drink";
const W = "washing-and-personal-care";
const H = "health-and-pain";
const C = "comfort-and-moving-about";
const E = "feelings";
const T = "everyday-chat";
const A = "activities-and-family";

// [file number, sign page name on SignBSL.com, title shown, group]
const ROWS: [number, string, string, string][] = [
  [1, "would-you-like-a-drink", "Would you like a drink?", F],
  [2, "would-you-like-tea", "Would you like tea?", F],
  [3, "would-you-like-coffee", "Would you like coffee?", F],
  [4, "would-you-like-water", "Would you like water?", F],
  [5, "would-you-like-milk-sugar", "Would you like milk or sugar?", F],
  [6, "would-you-like-a-snack", "Would you like a snack?", F],
  [7, "would-you-like-some-food", "Would you like some food?", F],
  [8, "what-would-you-like-to-eat", "What would you like to eat?", F],
  [9, "are-you-hungry", "Are you hungry?", F],
  [10, "do-you-need-the-toilet", "Do you need the toilet?", W],
  [11, "are-you-in-pain", "Are you in pain?", H],
  [12, "where-does-it-hurt", "Where does it hurt?", H],
  [13, "are-you-hurt", "Are you hurt?", H],
  [14, "are-you-ok", "Are you ok?", H],
  [15, "do-you-feel-ill", "Do you feel ill?", H],
  [16, "do-you-feel-sick", "Do you feel sick?", H],
  [17, "do-you-feel-better", "Do you feel better?", H],
  [18, "are-you-warm-cold", "Are you warm or cold?", C],
  [19, "have-you-bumped-your-head", "Have you bumped your head?", H],
  [20, "have-you-got-an-appointment", "Have you got an appointment?", H],
  [21, "did-you-wash-your-hands", "Did you wash your hands?", W],
  [22, "would-you-like-a-seat", "Would you like a seat?", C],
  [23, "are-you-ok-to-walk", "Are you ok to walk?", C],
  [24, "are-you-finished", "Are you finished?", T],
  [25, "did-you-enjoy", "Did you enjoy it?", T],
  [26, "do-you-need-support", "Do you need support?", T],
  [27, "can-i-help-you", "Can I help you?", T],
  [28, "how-are-you", "How are you?", T],
  [29, "how-are-you-today", "How are you today?", T],
  [30, "hello-how-are-you", "Hello, how are you?", T],
  [31, "are-you-anxious", "Are you anxious?", E],
  [32, "are-you-worried", "Are you worried?", E],
  [33, "do-you-sign", "Do you sign?", T],
  [34, "do-you-use-bsl", "Do you use BSL?", T],
  [35, "do-you-need-an-interpreter", "Do you need an interpreter?", T],
  [36, "can-you-say-that-again-please", "Can you say that again, please?", T],
  [37, "tea", "Tea", F],
  [38, "coffee", "Coffee", F],
  [39, "water", "Water", F],
  [40, "thirsty", "Thirsty", F],
  [41, "breakfast", "Breakfast", F],
  [42, "lunch", "Lunch", F],
  [43, "dinner", "Dinner", F],
  [44, "milk", "Milk", F],
  [45, "juice", "Juice", F],
  [46, "toilet", "Toilet", W],
  [47, "shower", "Shower", W],
  [48, "bath", "Bath", W],
  [49, "wash", "Wash", W],
  [50, "medicine", "Medicine", H],
  [51, "doctor", "Doctor", H],
  [52, "nurse", "Nurse", H],
  [53, "wash-hair", "Wash hair", W],
  [54, "clothes", "Clothes", W],
  [55, "glasses", "Glasses", W],
  [56, "hearing-aid", "Hearing aid", W],
  [57, "pain", "Pain", H],
  [58, "sleep", "Sleep", C],
  [59, "cold", "Cold", C],
  [60, "hot", "Hot", C],
  [61, "tired", "Tired", C],
  [62, "wheelchair", "Wheelchair", C],
  [63, "bed", "Bed", C],
  [64, "pillow", "Pillow", C],
  [65, "sit", "Sit", C],
  [66, "stand", "Stand", C],
  [67, "outside", "Outside", C],
  [68, "happy", "Happy", E],
  [69, "sad", "Sad", E],
  [70, "worried", "Worried", E],
  [71, "angry", "Angry", E],
  [72, "scared", "Scared", E],
  [73, "lonely", "Lonely", E],
  [74, "confused", "Confused", E],
  [75, "bored", "Bored", E],
  [76, "anxious", "Anxious", E],
  [77, "calm", "Calm", E],
  [78, "music", "Music", A],
  [79, "walk", "Walk", C],
  [80, "garden", "Garden", A],
  [81, "family", "Family", A],
  [82, "help", "Help", T],
  [83, "television", "Television", A],
  [84, "read", "Read", A],
  [85, "book", "Book", A],
  [86, "bingo", "Bingo", A],
  [87, "exercise", "Exercise", A],
  [88, "sing", "Sing", A],
  [89, "visitor", "Visitor", A],
  [90, "telephone", "Telephone", A],
];

export const BSL_SIGNS: BslSign[] = ROWS.map(([n, slug, title, group]) => ({
  slug,
  title,
  group,
  videos: (refs as Record<string, string[]>)[slug] ?? [],
  file: `${String(n).padStart(3, "0")}-${slug}.pdf`,
}));

export function bslGroup(slug: string) {
  return BSL_GROUPS.find((g) => g.slug === slug);
}

export function bslSignsIn(group: string) {
  return BSL_SIGNS.filter((s) => s.group === group);
}

export function bslSign(group: string, slug: string) {
  return BSL_SIGNS.find((s) => s.group === group && s.slug === slug);
}
