export type Category = {
  key: string;
  slug: string;
  color: string;
  tint: string;
};

export const CATEGORIES: Category[] = [
  { key: "Reminiscence", slug: "reminiscence", color: "#C97B5A", tint: "#EFDCCB" },
  { key: "Seasonal", slug: "seasonal", color: "#B5652E", tint: "#F2E1CC" },
  { key: "Music & Movement", slug: "music-movement", color: "#A78BB5", tint: "#E7DEEC" },
  { key: "Arts & Crafts", slug: "arts-crafts", color: "#D4A94B", tint: "#F1E4C4" },
  { key: "Conversation & Games", slug: "conversation-games", color: "#7B93AB", tint: "#E1E6ED" },
];

export function categoryBySlug(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export type Template = {
  id: string;
  title: string;
  desc: string;
  duration: string;
  category: string;
};

const RAW: Record<string, [string, string, string][]> = {
  Reminiscence: [
    ["Photograph Memory Box", "A guided activity using old photographs to stimulate memories and conversation", "30 min"],
    ["Childhood Favorite Foods Memory Circle", "Facilitated discussion about favorite childhood foods and meal memories — includes cultural sensitivity notes", "25 min"],
    ["Decades Music Timeline", "Interactive music-based reminiscence activity with hits from the 1940s–1980s — includes facilitator notes for different music genres and cultural backgrounds", "Quick (15 min)"],
    ["Family Tree Storytelling", "Guided conversation prompts for sharing family history and relationships — supports various family structures", "35 min"],
    ["Postcard Journey Around the World", "Reminiscence using travel postcards and travel memories — includes prompts for international residents and carers", "20 min"],
    ["Profession & Achievements Memory Sharing", "Celebrate work history and life achievements with guided conversation starters", "40 min"],
    ["School Days & Friendship Circle", "Reminiscence of school memories, friendships, and formative years — includes adaptations for different education systems", "Quick (15 min)"],
    ["Wedding & Love Story Sharing", "Guided prompts for sharing wedding memories and love stories across cultures", "30 min"],
  ],
    Seasonal: [
    ["Spring Woodland Animals Pack", "A seasonal activity pack exploring woodland animals seen in springtime", "30 min"],
    ["Christmas Memories & Carols", "A festive reminiscence and sing-along pack for the Christmas season", "30 min"],
    ["Halloween Fun & Games", "A lighthearted Halloween-themed activity pack for group sessions", "25 min"],
  ],
  "Music & Movement": [
    ["Sing-Along Classics", "A printable lyric sheet set for a seated sing-along session of well-loved classics", "30 min"],
    ["Seated Dance Routine", "A gentle, fully seated dance routine set to popular music", "20 min"],
    ["Rhythm Circle Plan", "Facilitator plan for a hand-percussion rhythm circle", "25 min"],
    ["Hand-Clap Song Set", "A set of traditional hand-clap songs adapted for group participation", "15 min"],
    ["Gentle Stretch & Music Guide", "A seated stretch routine paired with calming background music", "20 min"],
  ],
  "Arts & Crafts": [
    ["Pressed Flower Card Making", "Step-by-step guide for making pressed-flower greetings cards", "40 min"],
    ["Watercolour Prompt Cards", "A set of simple watercolour prompts suited to all skill levels", "30 min"],
    ["Paper Flower Garden", "Guide for making paper flowers as a small-group activity", "35 min"],
    ["Seasonal Collage Kit", "A ready-to-use collage kit themed around the current season", "25 min"],
    ["Clay Modelling Basics", "An accessible clay modelling session with adaptive tool suggestions", "30 min"],
  ],
  "Conversation & Games": [
    ["Classic Board Games", "A curated set of simplified classic board games for group play", "30 min"],
    ["Would-You-Rather Deck", "A conversation card deck of gentle would-you-rather prompts", "15 min"],
    ["Proverb Finisher", "A word-completion game using well-known proverbs and sayings", "20 min"],
    ["Picture Matching Game", "A simple picture-matching game suited to varying cognitive levels", "20 min"],
    ["Word Association Cards", "A card-based word association game for small groups", "15 min"],
  ],
};

export const TEMPLATES: Record<string, Template[]> = Object.fromEntries(
  Object.entries(RAW).map(([category, rows]) => [
    category,
    rows.map(([title, desc, duration], i) => ({
      id: `${category}-${i}`,
      title,
      desc,
      duration,
      category,
    })),
  ])
);

export const ALL_TEMPLATES: Template[] = Object.values(TEMPLATES).flat();

export function templateById(id: string) {
  return ALL_TEMPLATES.find((t) => t.id === id);
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
