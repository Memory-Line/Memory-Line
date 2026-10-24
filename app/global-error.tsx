"use client";

// Last safety net: shown only if the whole page frame fails. It has to bring its own html and body.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#f5f1ea", color: "#2c2c2a", fontFamily: "Georgia, serif", margin: 0 }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "96px 20px", textAlign: "center" }}>
          <h1 style={{ fontSize: 30, marginBottom: 12 }}>That did not load</h1>
          <p style={{ fontFamily: "Arial, sans-serif", color: "#5f5e5a", marginBottom: 28 }}>
            Something went wrong on our side. Please try again, and if it keeps happening, tell us at support@activitycentral.co.uk.
          </p>
          <button
            onClick={() => reset()}
            style={{ background: "#5b7a5e", color: "#fff", border: 0, borderRadius: 12, padding: "12px 24px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
          {error.digest && <p style={{ fontFamily: "Arial, sans-serif", fontSize: 12, color: "#5f5e5a", marginTop: 32 }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
