// Colours borrowed from the dashboard tiles, in the order the topic tiles use them.
export const TOPIC_COLOURS = [
  { color: "#4A7FB5", tint: "#DCE7F2" },
  { color: "#C98B2E", tint: "#F5EBD2" },
  { color: "#2F7A63", tint: "#D6EBE3" },
  { color: "#B05F6C", tint: "#F1DEDE" },
  { color: "#8B6FB0", tint: "#E5DEEF" },
  { color: "#C97B5A", tint: "#EFDCCB" },
  { color: "#5B9AA0", tint: "#D9E7E6" },
  { color: "#7A9B5E", tint: "#E5EDDD" },
  { color: "#6E56A0", tint: "#E0D7EE" },
  { color: "#B5453D", tint: "#F3DAD8" },
];

// Categories whose activities are shown as multi-coloured tiles (with tick boxes to print several at
// once) instead of plain rows.
export const TILE_CATEGORIES = new Set(["Physical & Exercise", "Sing-Alongs", "Snakes and Ladders", "Bingo", "BSL Tools"]);

// The most activities that can be printed in one go.
export const MAX_PRINT_PACK = 50;
