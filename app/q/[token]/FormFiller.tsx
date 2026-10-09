"use client";

import { useState, type CSSProperties } from "react";
import type { FormItem } from "@/lib/forms";

const textStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #D9CFB8",
  fontSize: 16,
  fontFamily: "inherit",
  color: "#3F3237",
  background: "#FBF9F4",
};

// The form people fill in. Big text and large tap targets, since it is used by
// residents, families and staff. Nothing is required; answers are sent by email.
export default function FormFiller({
  token,
  items,
  thanks,
  homeName,
}: {
  token: string;
  items: FormItem[];
  thanks: string;
  homeName: string | null;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [website, setWebsite] = useState(""); // hidden; only bots fill it in
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const res = await fetch(`/api/q/${token}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: values, website }),
    }).catch(() => null);
    setSending(false);
    const data = await res?.json().catch(() => ({}));
    if (!res || !res.ok) {
      setError(data?.error ?? "Something went wrong. Your answers are still here, so please try again.");
      return;
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (done) {
    return (
      <div style={{ padding: "10px 0" }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 400, margin: "0 0 8px" }}>Thank you</h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0 }}>
          {thanks || "Your answers have been sent."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {items.map((item, i) => {
        if (item.type === "section") {
          return (
            <div key={i} style={{ margin: "26px 0 6px", borderTop: "1px solid #EAE4D6", paddingTop: 16 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 21, fontWeight: 400, margin: 0, color: "#657A68" }}>{item.title}</h2>
              {item.text && <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: "6px 0 0", color: "#6B5F57" }}>{item.text}</p>}
            </div>
          );
        }
        if (item.type === "choice") {
          return (
            <fieldset key={item.id} style={{ border: "none", padding: 0, margin: "18px 0 0" }}>
              <legend style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.45, marginBottom: 8 }}>{item.text}</legend>
              <div style={{ display: "grid", gap: 6 }}>
                {item.options.map((opt) => {
                  const checked = values[item.id] === opt;
                  return (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 12px",
                        borderRadius: 10,
                        border: `1px solid ${checked ? "#6D8C6A" : "#E6DDC8"}`,
                        background: checked ? "#EAF1E8" : "#fff",
                        fontSize: 16,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={item.id}
                        checked={checked}
                        onChange={() => set(item.id, opt)}
                        style={{ width: 20, height: 20 }}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
              {item.comment && (
                <div style={{ marginTop: 8 }}>
                  <label htmlFor={`${item.id}-c`} style={{ fontSize: 14, color: "#6B5F57", display: "block", marginBottom: 4 }}>
                    {item.comment}
                  </label>
                  <textarea
                    id={`${item.id}-c`}
                    rows={2}
                    maxLength={1500}
                    value={values[`${item.id}:comment`] ?? ""}
                    onChange={(e) => set(`${item.id}:comment`, e.target.value)}
                    style={textStyle}
                  />
                </div>
              )}
            </fieldset>
          );
        }
        return (
          <div key={item.id} style={{ margin: "18px 0 0" }}>
            <label htmlFor={item.id} style={{ fontSize: 16.5, fontWeight: 600, lineHeight: 1.45, display: "block" }}>
              {item.text}
            </label>
            {item.hint && <p style={{ fontSize: 14, color: "#6B5F57", margin: "2px 0 6px" }}>{item.hint}</p>}
            {item.long ? (
              <textarea
                id={item.id}
                rows={4}
                maxLength={3000}
                value={values[item.id] ?? ""}
                onChange={(e) => set(item.id, e.target.value)}
                style={{ ...textStyle, marginTop: item.hint ? 0 : 6 }}
              />
            ) : (
              <input
                id={item.id}
                value={values[item.id] ?? ""}
                maxLength={300}
                onChange={(e) => set(item.id, e.target.value)}
                style={{ ...textStyle, marginTop: item.hint ? 0 : 6 }}
              />
            )}
          </div>
        );
      })}

      {/* Hidden from people; bots fill it in. */}
      <div style={{ display: "none" }} aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <p style={{ fontSize: 13, color: "#6B5F57", margin: "26px 0 10px" }}>
        When you press Send, your answers are emailed to {homeName ?? "the home"}. Nothing else is kept.
      </p>
      {error && <p style={{ color: "#B5453D", fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>{error}</p>}
      <button
        type="submit"
        disabled={sending}
        style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "#6D8C6A", color: "#fff", fontSize: 17, fontWeight: 700, cursor: sending ? "default" : "pointer", opacity: sending ? 0.7 : 1 }}
      >
        {sending ? "Sending…" : "Send my answers"}
      </button>
    </form>
  );
}
