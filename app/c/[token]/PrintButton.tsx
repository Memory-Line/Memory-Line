"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #B5714A", background: "#fff", color: "#B5714A", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}
    >
      Print
    </button>
  );
}
