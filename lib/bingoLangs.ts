// Languages the Bingo caller can say each number in, after English. The codes match the
// voices in app/api/boards/speak/route.ts; locale is used only if that voice cannot be loaded
// and the device's own voice has to step in.
export const BINGO_LANGS: { code: string; name: string; locale: string }[] = [
  { code: "pl", name: "Polish", locale: "pl-PL" },
  { code: "ro", name: "Romanian", locale: "ro-RO" },
  { code: "pt", name: "Portuguese", locale: "pt-PT" },
  { code: "es", name: "Spanish", locale: "es-ES" },
  { code: "fr", name: "French", locale: "fr-FR" },
  { code: "ur", name: "Urdu", locale: "ur-PK" },
  { code: "ar", name: "Arabic", locale: "ar-SA" },
  { code: "hi", name: "Hindi", locale: "hi-IN" },
  { code: "bn", name: "Bengali", locale: "bn-IN" },
  { code: "gu", name: "Gujarati", locale: "gu-IN" },
  { code: "pa", name: "Punjabi", locale: "pa-IN" },
  { code: "zh", name: "Mandarin Chinese", locale: "zh-CN" },
  { code: "yue", name: "Cantonese Chinese", locale: "zh-HK" },
  { code: "so", name: "Somali", locale: "so-SO" },
  { code: "ta", name: "Tamil", locale: "ta-IN" },
  { code: "ml", name: "Malayalam", locale: "ml-IN" },
  { code: "tl", name: "Tagalog (Filipino)", locale: "fil-PH" },
  { code: "uk", name: "Ukrainian", locale: "uk-UA" },
  { code: "lt", name: "Lithuanian", locale: "lt-LT" },
  { code: "tr", name: "Turkish", locale: "tr-TR" },
  { code: "fa", name: "Farsi (Persian)", locale: "fa-IR" },
  { code: "ru", name: "Russian", locale: "ru-RU" },
  { code: "cy", name: "Welsh", locale: "cy-GB" },
];

export const MAX_BINGO_LANGS = 5;
