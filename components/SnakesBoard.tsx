"use client";

import type { SnakesAndLaddersMove } from "@/lib/snakesAndLadders";

// The Snakes and Ladders board, drawn by the site (not a picture of the printed sheet): ten rows of ten squares
// numbered 1 at the bottom left and snaking up to 100 at the top, with each ladder and snake placed from the
// board's own list of moves. It scales to any width, so it can be as big as the screen allows. In the Dementia
// friendly view the squares are yellow and white with thick black lines and bigger numbers.
const N = 10;
const S = 10; // one square, in the drawing's own units (the whole board is 100 x 100)

// Centre of square n as a fraction of the board (0 to 1 across and down), for placing the counters.
export function squareCentre(n: number): [number, number] {
  const row = Math.floor((n - 1) / N);
  let col = (n - 1) % N;
  if (row % 2 === 1) col = N - 1 - col;
  return [(col + 0.5) / N, (N - 1 - row + 0.5) / N];
}

export const NATIVE_SQUARES: Record<string, [number, number]> = Object.fromEntries(
  Array.from({ length: 100 }, (_, i) => [String(i + 1), squareCentre(i + 1)])
);

const SNAKE_COLOURS = ["#6f9a54", "#c0566a", "#8b6fb0", "#3e9aa6", "#d08a2e"];

function centre(n: number): [number, number] {
  const [fx, fy] = squareCentre(n);
  return [fx * 100, fy * 100];
}

function Ladder({ from, to, dem }: { from: number; to: number; dem: boolean }) {
  const [x1, y1] = centre(from);
  const [x2, y2] = centre(to);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const off = 1.7;
  const ox = (-dy / len) * off;
  const oy = (dx / len) * off;
  const rungs = Math.max(3, Math.round(len / 4.6));
  const colour = dem ? "#1a1a1a" : "#8a5a2b";
  const w = dem ? 1.1 : 0.8;
  return (
    <g stroke={colour} strokeWidth={w} strokeLinecap="round">
      <line x1={x1 + ox} y1={y1 + oy} x2={x2 + ox} y2={y2 + oy} />
      <line x1={x1 - ox} y1={y1 - oy} x2={x2 - ox} y2={y2 - oy} />
      {Array.from({ length: rungs - 1 }, (_, i) => {
        const t = (i + 1) / rungs;
        const cx = x1 + dx * t;
        const cy = y1 + dy * t;
        return <line key={i} x1={cx + ox} y1={cy + oy} x2={cx - ox} y2={cy - oy} />;
      })}
    </g>
  );
}

function Snake({ from, to, index, dem }: { from: number; to: number; index: number; dem: boolean }) {
  const [hx, hy] = centre(from);
  const [tx, ty] = centre(to);
  const dx = tx - hx;
  const dy = ty - hy;
  const len = Math.hypot(dx, dy) || 1;
  const k = Math.min(9, len * 0.2) * (index % 2 === 0 ? 1 : -1);
  const nx = (-dy / len) * k;
  const ny = (dx / len) * k;
  const colour = dem ? "#1a1a1a" : SNAKE_COLOURS[index % SNAKE_COLOURS.length];
  const d = `M ${hx} ${hy} C ${hx + dx * 0.25 + nx} ${hy + dy * 0.25 + ny}, ${hx + dx * 0.75 - nx} ${hy + dy * 0.75 - ny}, ${tx} ${ty}`;
  return (
    <g>
      {dem && <path d={d} fill="none" stroke="#ffffff" strokeWidth={3.8} strokeLinecap="round" />}
      <path d={d} fill="none" stroke={colour} strokeWidth={dem ? 2.4 : 1.9} strokeLinecap="round" opacity={dem ? 1 : 0.8} />
      <circle cx={hx} cy={hy} r={dem ? 2.6 : 2.3} fill={colour} />
      <circle cx={hx - 0.8} cy={hy - 0.7} r={0.5} fill="#fff" />
      <circle cx={hx + 0.8} cy={hy - 0.7} r={0.5} fill="#fff" />
    </g>
  );
}

export default function SnakesBoard({ moves, dem }: { moves: SnakesAndLaddersMove[]; dem: boolean }) {
  const squares = [];
  const numbers = [];
  for (let n = 1; n <= 100; n++) {
    const row = Math.floor((n - 1) / N);
    let col = (n - 1) % N;
    if (row % 2 === 1) col = N - 1 - col;
    const x = col * S;
    const y = (N - 1 - row) * S;
    const shaded = (row + col) % 2 === 0;
    squares.push(
      <rect
        key={n}
        x={x}
        y={y}
        width={S}
        height={S}
        fill={dem ? (shaded ? "#FFD23F" : "#ffffff") : shaded ? "#f7f3ea" : "#ffffff"}
        stroke={dem ? "#1a1a1a" : "#e6dfd0"}
        strokeWidth={dem ? 0.5 : 0.25}
      />
    );
    // Drawn last, with a pale edge, so a snake or ladder never hides a number.
    numbers.push(
      <text
        key={n}
        x={x + 0.9}
        y={y + (dem ? 3.9 : 3.1)}
        fontSize={dem ? 3.5 : 2.7}
        fontWeight={dem ? 800 : 700}
        fill={dem ? "#1a1a1a" : "#6f6253"}
        stroke={dem ? (shaded ? "#FFD23F" : "#ffffff") : shaded ? "#f7f3ea" : "#ffffff"}
        strokeWidth={0.9}
        paintOrder="stroke"
        fontFamily="Arial, sans-serif"
      >
        {n}
      </text>
    );
  }
  const ladders = moves.filter((m) => m.type === "ladder");
  const snakes = moves.filter((m) => m.type === "snake");
  return (
    <svg viewBox="0 0 100 100" className="block h-full w-full" role="img" aria-label="Snakes and ladders board">
      {squares}
      {ladders.map((m, i) => (
        <Ladder key={`l${i}`} from={m.from} to={m.to} dem={dem} />
      ))}
      {snakes.map((m, i) => (
        <Snake key={`s${i}`} from={m.from} to={m.to} index={i} dem={dem} />
      ))}
      {numbers}
    </svg>
  );
}
