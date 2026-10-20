import {
  Star, Heart, Music, Palette, BookOpen, Sun, Gift, Smile, Camera, Coffee, Flower2, Leaf, Home, Puzzle, Footprints,
  PersonStanding, LayoutGrid, Grid3x3, Search, CircleHelp, Lightbulb, Hash, Dices, MessagesSquare, Layers, Eye, Mic,
  Megaphone, Hand, Newspaper,
} from "lucide-react";

// Icons (and colours) the admin can pick for a category they make themselves.
export const ICON_BY_NAME: Record<string, any> = {
  Star, Heart, Music, Palette, BookOpen, Sun, Gift, Smile, Camera, Coffee, Flower2, Leaf, Home, Puzzle,
};
export const ICON_CHOICES = Object.keys(ICON_BY_NAME);

export const COLOUR_CHOICES = [
  { name: "Terracotta", color: "#B5714A", tint: "#F3E3D6" },
  { name: "Green", color: "#2F7A63", tint: "#D6EBE3" },
  { name: "Blue", color: "#4A7FB5", tint: "#DCE7F2" },
  { name: "Purple", color: "#8B6FB0", tint: "#E5DEEF" },
  { name: "Gold", color: "#A6822C", tint: "#F1E4C4" },
  { name: "Rose", color: "#B05F6C", tint: "#F1DEDE" },
  { name: "Teal", color: "#5B9AA0", tint: "#D9E7E6" },
  { name: "Slate", color: "#6B7D99", tint: "#E1E5EC" },
];

// The icon for a category made by the admin (the built-in ones keep their own).
export function customIcon(name: string | undefined) {
  return (name && ICON_BY_NAME[name]) || Footprints;
}

// The symbol for each built-in category, shown in a solid coloured circle on the home page, the
// dashboard and the menu.
export const CATEGORY_ICONS: Record<string, any> = {
  "Physical & Exercise": PersonStanding,
  Crosswords: LayoutGrid,
  Sudoku: Grid3x3,
  "Word Searches": Search,
  "Guess the Word": CircleHelp,
  Trivia: Lightbulb,
  Bingo: Hash,
  "Snakes and Ladders": Dices,
  "Remembrance Cards": Heart,
  "Colouring Pages": Palette,
  "Conversation Starters": MessagesSquare,
  "Matching Pairs": Layers,
  "Spot the Difference": Eye,
  "Sing-Alongs": Mic,
  "Communication Cards": Megaphone,
  "BSL Tools": Hand,
  Newsletters: Newspaper,
};
