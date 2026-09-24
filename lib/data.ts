export type Category = {
  key: string;
  slug: string;
  color: string;
  tint: string;
};

export const CATEGORIES: Category[] = [
  { key: "Physical & Exercise", slug: "physical-exercise", color: "#4A7FB5", tint: "#DCE7F2" },
  { key: "Crosswords", slug: "crosswords", color: "#A6822C", tint: "#F1E4C4" },
  { key: "Word Searches", slug: "word-searches", color: "#5B9AA0", tint: "#D9E7E6" },
  { key: "Guess the Word", slug: "guess-the-word", color: "#8B6FB0", tint: "#E5DEEF" },
  { key: "Trivia", slug: "trivia", color: "#3E7CAA", tint: "#D7E4EF" },
  { key: "Bingo", slug: "bingo", color: "#B05F6C", tint: "#F1DEDE" },
  { key: "Snakes and Ladders", slug: "snakes-and-ladders", color: "#7A9B5E", tint: "#E5EDDD" },
  { key: "Remembrance Cards", slug: "remembrance-cards", color: "#6B7D99", tint: "#E1E5EC" },
  { key: "Colouring Pages", slug: "colouring-pages", color: "#C98B2E", tint: "#F5EBD2" },
  { key: "Conversation Starters", slug: "conversation-starters", color: "#8CA88A", tint: "#E1EBE0" },
  { key: "Matching Pairs", slug: "matching-pairs", color: "#C97B5A", tint: "#EFDCCB" },
  { key: "Spot the Difference", slug: "spot-the-difference", color: "#6E56A0", tint: "#E0D7EE" },
  { key: "Sing-Alongs", slug: "sing-alongs", color: "#A78BB5", tint: "#E7DEEC" },
  { key: "Communication Cards", slug: "communication-cards", color: "#B5453D", tint: "#F3DAD8" },
  { key: "BSL Tools", slug: "bsl-tools", color: "#5A8A44", tint: "#DCEAD5" },
];

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export type ServiceProvider = {
  name: string;
  tag: string;
  desc: string;
  location: string;
  lang: string;
  vip: boolean;
};

export const SERVICES: ServiceProvider[] = [
  { name: "Claire's Activity Coaching", tag: "Activity coordination & training", desc: "1-to-1 coaching for care home activity programs — improving engagement and carer confidence. Specializes in supporting international carers adapting to UK care standards.", location: "UK-wide (remote)", lang: "English & Spanish", vip: true },
  { name: "Reminiscence Therapy Ltd", tag: "Specialist consultancy", desc: "Expert training in person-centered reminiscence work for dementia care settings. Training adapted for multi-cultural care teams and diverse resident backgrounds.", location: "London & South East", lang: "Multiple languages available", vip: true },
  { name: "Music Therapy Associates", tag: "Music & wellbeing", desc: "Professional music therapy sessions and training for care settings. Experience with residents from diverse cultural backgrounds and music traditions.", location: "Nationwide", lang: "English, Punjabi", vip: false },
  { name: "Sensory Spaces", tag: "Sensory environment design", desc: "Consultation on creating therapeutic sensory spaces and choosing equipment. Designs culturally sensitive sensory environments for diverse groups.", location: "UK-wide", lang: "English, Urdu, Polish", vip: false },
  { name: "Dementia Care Training Hub", tag: "Training & accreditation", desc: "Accredited training programs for care workers. Bilingual training programs designed for international staff integrating into UK care environments.", location: "Online & in-person", lang: "10+ languages", vip: false },
  { name: "Cultural Heritage & Memory", tag: "Specialist consultation", desc: "Expert guidance on creating culturally sensitive activities and reminiscence work. Supports care homes in serving diverse resident and carer communities.", location: "UK-wide", lang: "English, Mandarin, Arabic", vip: false },
];
