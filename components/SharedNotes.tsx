// The notes box shown at the bottom of a shared calendar month (public pages, so no client code).
export default function SharedNotes({ text, colour, large }: { text: string; colour: string; large?: boolean }) {
  return (
    <div className="sc-notes" style={{ marginTop: 14, border: "1px solid #EAE4D6", borderRadius: 12, background: "#fff", padding: "12px 14px" }}>
      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#B5714A", letterSpacing: 1 }}>NOTES</p>
      <div style={{ color: colour, fontSize: large ? 17 : 15, lineHeight: 1.4, overflowWrap: "anywhere" }}>
        {text.split("\n").map((line, i) =>
          line.startsWith("• ") ? (
            <div key={i} style={{ display: "flex", gap: 8 }}>
              <span>•</span>
              <span style={{ flex: 1, minWidth: 0 }}>{line.slice(2)}</span>
            </div>
          ) : (
            <div key={i} style={{ minHeight: line === "" ? "1.2em" : undefined }}>{line}</div>
          )
        )}
      </div>
    </div>
  );
}
