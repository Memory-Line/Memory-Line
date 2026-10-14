"use client";

import { useState } from "react";

type CourseInfo = { key: string; title: string; subtitle: string; minutes: number; passPercent: number };

// Makes a private course link (nothing about staff is kept; the link holds the course and the email for certificates).
export default function TrainingLinkMaker({ courses, defaultEmail, defaultHome }: { courses: CourseInfo[]; defaultEmail: string; defaultHome: string }) {
  const [courseKey, setCourseKey] = useState(courses[0]?.key ?? "");
  const [email, setEmail] = useState(defaultEmail);
  const [home, setHome] = useState(defaultHome);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const course = courses.find((c) => c.key === courseKey);

  async function make() {
    setError(null);
    setUrl(null);
    setBusy(true);
    const res = await fetch("/api/training/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseKey, email, homeName: home || null }),
    }).catch(() => null);
    setBusy(false);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setError(data?.error ?? "Something went wrong. Please try again.");
      return;
    }
    setUrl(`${window.location.origin}/t/${data.token}`);
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-6 rounded-xl p-4 bg-card border border-line">
      <label className="block text-xs font-semibold text-inkSoft mb-1">Course</label>
      <select value={courseKey} onChange={(e) => setCourseKey(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm mb-1">
        {courses.map((c) => (
          <option key={c.key} value={c.key}>
            {c.title}
          </option>
        ))}
      </select>
      {course && (
        <p className="text-xs text-inkSoft mb-3">
          {course.subtitle}. About {course.minutes} minutes. Pass mark {course.passPercent}%.
        </p>
      )}
      <label className="block text-xs font-semibold text-inkSoft mb-1">Email address to send certificates to</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm mb-3"
      />
      <label className="block text-xs font-semibold text-inkSoft mb-1">Name of your home (shown on the certificate, optional)</label>
      <input value={home} onChange={(e) => setHome(e.target.value)} maxLength={80} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm mb-4" />
      <button onClick={make} disabled={busy} className="rounded-lg bg-sage text-white px-5 py-2.5 font-semibold text-sm hover:bg-sageDeep disabled:opacity-60">
        {busy ? "Making…" : "Make the link"}
      </button>
      {error && <p className="text-sm mt-3 font-semibold text-red-600">{error}</p>}
      {url && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-inkSoft mb-1">Your link</p>
          <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs mb-2" />
          <div className="flex gap-4 text-xs font-bold">
            <button onClick={copy} className="text-sageDeep underline">
              {copied ? "Copied" : "Copy link"}
            </button>
            <a href={url} target="_blank" rel="noreferrer" className="text-sageDeep underline">
              Open it to try the course
            </a>
          </div>
          <p className="text-xs text-inkSoft mt-3">
            Anyone with this link can take the course and send a certificate to that email address. The link works for a year. Nothing about the staff is kept by Activity Central.
          </p>
        </div>
      )}
    </div>
  );
}
