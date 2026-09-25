import cards from "@/lib/data/bingoCards.json";

// The numbers on each printed Bingo card, for checking a winning card. Read
// out of the PDFs by scripts/bingo/extract_bingo.py; card n is the sheet
// whose file name starts with n. Each grid is 5 rows of B-I-N-G-O, with 0
// for the FREE middle square.
export type BingoCard = { n: number; grid: number[][] };

export const BINGO_CARDS = cards as BingoCard[];

export function bingoLetter(n: number): string {
  return "BINGO"[Math.min(4, Math.floor((n - 1) / 15))];
}

// Traditional bingo calls for 1-75, the gentler versions.
export const BINGO_CALLS: Record<number, string> = {
  1: "Kelly's eye", 2: "One little duck", 3: "Cup of tea", 4: "Knock at the door", 5: "Man alive",
  6: "Half a dozen", 7: "Lucky seven", 8: "Garden gate", 9: "Doctor's orders", 10: "Cock and hen",
  11: "Legs eleven", 12: "One dozen", 13: "Unlucky for some", 14: "Valentine's Day", 15: "Young and keen",
  16: "Sweet sixteen", 17: "Dancing queen", 18: "Coming of age", 19: "Goodbye teens", 20: "One score",
  21: "Key of the door", 22: "Two little ducks", 23: "Thee and me", 24: "Two dozen", 25: "Duck and dive",
  26: "Pick and mix", 27: "Gateway to heaven", 28: "In a state", 29: "Rise and shine", 30: "Burlington Bertie",
  31: "Get up and run", 32: "Buckle my shoe", 33: "All the threes", 34: "Ask for more", 35: "Jump and jive",
  36: "Three dozen", 37: "More than eleven", 38: "Christmas cake", 39: "Thirty-nine steps", 40: "Life begins",
  41: "Time for fun", 42: "Winnie the Pooh", 43: "Down on your knees", 44: "All the fours", 45: "Halfway there",
  46: "Up to tricks", 47: "Four and seven", 48: "Four dozen", 49: "Nick nick", 50: "Half a century",
  51: "Tweak of the thumb", 52: "Weeks in a year", 53: "Stuck in the tree", 54: "Clean the floor", 55: "Snakes alive",
  56: "Five and six", 57: "Heinz varieties", 58: "Make them wait", 59: "Brighton line", 60: "Five dozen",
  61: "Baker's bun", 62: "Tickety-boo", 63: "Tickle me", 64: "Red raw", 65: "Old age pension",
  66: "Clickety click", 67: "Stairway to heaven", 68: "Saving grace", 69: "Either way up", 70: "Three score and ten",
  71: "Bang on the drum", 72: "Six dozen", 73: "Queen bee", 74: "Candy store", 75: "Strive and strive",
};
