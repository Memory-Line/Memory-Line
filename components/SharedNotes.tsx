import { parseNoteLines } from "@/lib/noteLines";

// The notes box shown at the bottom of a shared calendar month (public pages, so no client code).
// Each line keeps its own colour.
export default function SharedNotes({ text, colour, large }: { text: string; colour: string; large?: boolean }) {
  const lines = parseNoteLines(text, colour);
  return (
    <div className="sc-notes" style={{ marginTop: 14, border: "1px solid #EAE4D6", borderRadius: 12, background: "#fff", padding: "12px 14px" }}>
      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#B5714A", letterSpacing: 1 }}>NOTES</p>
      <div style={{ fontSize: large ? 17 : 15, lineHeight: 1.4, overflowWrap: "anywhere" }}>
        {lines.map((l, i) =>
          l.text.startsWith("• ") ? (
            <div key={i} className="sc-note-line" style={{ display: "flex", gap: 8, color: l.colour }}>
              <span>•</span>
              <span style={{ flex: 1, minWidth: 0 }}>{l.text.slice(2)}</span>
            </div>
          ) : (
            <div key={i} className="sc-note-line" style={{ color: l.colour, minHeight: l.text === "" ? "1.2em" : undefined }}>{l.text}</div>
          )
        )}
      </div>
    </div>
  );
}
