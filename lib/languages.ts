// Written-language editions of the Communication Cards. English is the
// original set; every other edition is bilingual (English beside the
// translation). Uploads for this category are tagged with a language slug
// (Template.language), which matches the pack's folder names, e.g.
// "02-polish" → "polish".
export const LANGUAGE_CATEGORY = "Communication Cards";

export const LANGUAGES: { slug: string; label: string }[] = [
  { slug: "english", label: "English" },
  { slug: "polish", label: "Polish" },
  { slug: "romanian", label: "Romanian" },
  { slug: "punjabi", label: "Punjabi" },
  { slug: "urdu", label: "Urdu" },
  { slug: "bengali", label: "Bengali" },
  { slug: "gujarati", label: "Gujarati" },
  { slug: "arabic", label: "Arabic" },
  { slug: "portuguese", label: "Portuguese" },
  { slug: "spanish", label: "Spanish" },
  { slug: "hindi", label: "Hindi" },
  { slug: "mandarin-chinese", label: "Mandarin Chinese" },
  { slug: "cantonese-chinese", label: "Cantonese Chinese" },
  { slug: "french", label: "French" },
  { slug: "somali", label: "Somali" },
  { slug: "tamil", label: "Tamil" },
  { slug: "malayalam", label: "Malayalam" },
  { slug: "tagalog-filipino", label: "Tagalog (Filipino)" },
  { slug: "ukrainian", label: "Ukrainian" },
  { slug: "lithuanian", label: "Lithuanian" },
  { slug: "turkish", label: "Turkish" },
  { slug: "farsi-persian", label: "Farsi (Persian)" },
  { slug: "russian", label: "Russian" },
  { slug: "welsh", label: "Welsh" },
];

export function languageBySlug(slug: string) {
  return LANGUAGES.find((l) => l.slug === slug);
}

// Finds a language from a folder path like
// "Languages/02-polish/A3 Large Print/001-….pdf" (a numbered folder
// named after the language). Returns null if no folder names one.
export function languageFromPath(path: string): string | null {
  for (const part of path.split("/")) {
    const slug = part.toLowerCase().replace(/^\d+[-_\s]*/, "").replace(/[\s_]+/g, "-");
    if (languageBySlug(slug)) return slug;
  }
  return null;
}
