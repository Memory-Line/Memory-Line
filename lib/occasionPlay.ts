// Occasion Matching Pairs and Colouring Pages are played straight from their own PDF, so the player needs to know
// where the pictures sit on the page. Every occasion pack is made with the same layout (A4 landscape, 841.9 x 595.3),
// so these positions, as fractions of the page measured from the top-left, hold for all of them.
export const PLAY_FROM_PDF = new Set(["Matching Pairs", "Colouring Pages"]);

const W = 841.89;
const H = 595.28;

// Matching Pairs: eight cards, four across and two down. Each picture sits under the card's label strip.
const CARD_W = 168;
const CARD_H = 214;
const GAP = 12;
const X0 = (W - (4 * CARD_W + 3 * GAP)) / 2;
const TOP = 82;

export const OCCASION_MATCHING_PICTURES = Array.from({ length: 8 }, (_, i) => {
  const r = Math.floor(i / 4);
  const k = i % 4;
  const x = X0 + k * (CARD_W + GAP);
  const bottom = H - TOP - (r + 1) * CARD_H - r * GAP - 4; // the card's bottom edge, measured up from the page bottom
  const picTop = bottom + CARD_H - 38; // under the label strip
  const picBottom = bottom + 6;
  return { left: (x + 8) / W, right: (x + CARD_W - 8) / W, top: (H - picTop) / H, bottom: (H - picBottom) / H };
});

// Colouring Pages: one white card holding the picture.
export const OCCASION_COLOURING_FRAME = { x: 80 / W, y: (H - 496) / H, w: (W - 160) / W, h: 440 / H };
