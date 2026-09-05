export type Category = {
  key: string;
  slug: string;
  color: string;
  tint: string;
};

export const CATEGORIES: Category[] = [
  { key: "Reminiscence", slug: "reminiscence", color: "#C97B5A", tint: "#EFDCCB" },
  { key: "Sing-Along", slug: "sing-along", color: "#A78BB5", tint: "#E7DEEC" },
  { key: "Physical & Exercise", slug: "physical-exercise", color: "#4A7FB5", tint: "#DCE7F2" },
  { key: "Arts & Crafts", slug: "arts-crafts", color: "#D4A94B", tint: "#F1E4C4" },
  { key: "Word Games", slug: "word-games", color: "#5B9AA0", tint: "#D9E7E6" },
  { key: "Trivia & Quizzes", slug: "trivia-quizzes", color: "#7B93AB", tint: "#E1E6ED" },
  { key: "Card & Board Games", slug: "card-board-games", color: "#C98686", tint: "#F1DEDE" },
  { key: "Conversation Starters", slug: "conversation-starters", color: "#8CA88A", tint: "#E1EBE0" },
  { key: "Christmas", slug: "christmas", color: "#B5453D", tint: "#F3DAD8" },
  { key: "Four Seasons", slug: "four-seasons", color: "#7A9B5E", tint: "#E5EDDD" },
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
  "Sing-Along": [
    ["Sing-Along Classics", "A printable lyric sheet set for a seated sing-along session of well-loved classics", "30 min"],
    ["Seated Dance Routine", "A gentle, fully seated dance routine set to popular music", "20 min"],
    ["Rhythm Circle Plan", "Facilitator plan for a hand-percussion rhythm circle", "25 min"],
    ["Hand-Clap Song Set", "A set of traditional hand-clap songs adapted for group participation", "15 min"],
    ["Gentle Stretch & Music Guide", "A seated stretch routine paired with calming background music", "20 min"],
  ],
  "Physical & Exercise": [
    ["Seated Chair Yoga Routine", "A gentle chair-based yoga sequence suited to limited mobility", "20 min"],
    ["Balance & Coordination Basics", "A short seated exercise routine focused on balance and coordination", "15 min"],
    ["Morning Stretch Routine", "A simple full-body stretch sequence to start the day", "15 min"],
  ],
  "Arts & Crafts": [
    ["Pressed Flower Card Making", "Step-by-step guide for making pressed-flower greetings cards", "40 min"],
    ["Watercolour Prompt Cards", "A set of simple watercolour prompts suited to all skill levels", "30 min"],
    ["Paper Flower Garden", "Guide for making paper flowers as a small-group activity", "35 min"],
    ["Golden Retriever Colouring Sheet", "A dementia-friendly colouring page featuring a golden retriever", "20 min"],
    ["Clay Modelling Basics", "An accessible clay modelling session with adaptive tool suggestions", "30 min"],
  ],
  "Word Games": [
    ["Classic Crossword", "A themed crossword puzzle with a matching answer sheet", "25 min"],
    ["Wordsearch Puzzle", "A themed wordsearch puzzle suited to small groups or 1:1", "20 min"],
    ["Word Scramble Challenge", "A themed set of scrambled words with an answer key", "15 min"],
    ["Finish the Saying", "A classic saying or proverb with the ending left blank to complete", "15 min"],
  ],
  "Trivia & Quizzes": [
    ["School Days Trivia", "A themed trivia sheet about school days and classroom memories", "25 min"],
    ["True or False Quiz", "A simple true-or-false quiz suited to varying cognitive levels", "20 min"],
    ["Who Am I? Guessing Game", "A guessing game based on a well-known figure, with an answer key", "20 min"],
  ],
  "Card & Board Games": [
    ["Bingo Card Set", "A themed bingo card set for group play", "30 min"],
    ["Matching Pairs Game", "A memory-matching pairs game suited to small groups", "20 min"],
    ["Number Card Activity", "A number-based card activity with an accompanying answer sheet", "20 min"],
  ],
  "Conversation Starters": [
    ["Fruits Conversation Prompts", "A themed set of conversation prompts about fruits and gardens", "20 min"],
    ["Spot the Difference", "A picture-based spot-the-difference activity", "15 min"],
    ["Odd One Out", "A simple picture-based odd-one-out game", "15 min"],
  ],
  Christmas: [
    ["Christmas Trivia", "A Christmas-themed trivia sheet with a facilitator answer sheet", "25 min"],
    ["Christmas Bingo", "A Christmas-themed bingo set for group play", "30 min"],
    ["Christmas Sing-Along", "A festive sing-along lyric sheet for the Christmas season", "30 min"],
    ["Christmas Colouring Page", "A Christmas-themed colouring page", "20 min"],
  ],
  "Four Seasons": [
    ["Spring Woodland Animals Pack", "A seasonal activity pack exploring woodland animals seen in springtime", "30 min"],
    ["Summer Garden Activity Pack", "A seasonal activity pack themed around summer gardens", "30 min"],
    ["Autumn Leaves Activity Pack", "A seasonal activity pack themed around autumn and falling leaves", "25 min"],
    ["Winter Wildlife Activity Pack", "A seasonal activity pack themed around winter wildlife", "25 min"],
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
