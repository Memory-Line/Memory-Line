"use client";

import * as Lucide from "lucide-react";

// A board answer's picture: either one of our own drawings ("svg:tea") or a
// Lucide line icon ("L:Coffee") drawn in the card's colour.
export default function BoardIcon({ icon, colour, size = 96 }: { icon?: string; colour: string; size?: number }) {
  if (icon?.startsWith("svg:")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/boards/icons/${icon.slice(4)}.svg`} alt="" width={size} height={size} style={{ display: "block", margin: "0 auto" }} />;
  }
  const name = icon?.startsWith("L:") ? icon.slice(2) : "Circle";
  const Cmp = ((Lucide as unknown as Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>>)[name]) ?? Lucide.Circle;
  return (
    <div style={{ width: size, height: size, margin: "0 auto", borderRadius: "50%", background: colour + "1F", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Cmp size={Math.round(size * 0.55)} color={colour} strokeWidth={1.8} />
    </div>
  );
}
