"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/data";
import { OCCASIONS, THEMEABLE_CATEGORIES } from "@/lib/occasions";

function titleFromFilename(name: string): string {
  const withoutExt = name.replace(/\.[^/.]+$/, "");
  const withoutLeadingNumber = withoutExt.replace(/^\d+[-_.\s]*/, "");
  const spaced = withoutLeadingNumber.replace(/[-_]+/g, " ").trim();
  return spaced
    .split(" ")
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

type FileStatus = {
  name: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

export default function AdminUploadPage() {
  const [category, setCategory] = useState(CATEGORIES[0].key);
  // "" = the regular category library; otherwise a calendar occasion slug.
  const [occasion, setOccasion] = useState("");
  const [isAnswer, setIsAnswer] = useState(false);
  const [isLargePrint, setIsLargePrint] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [uploading, setUploading] = useState(false);

  // The occasion pages link here with ?occasion=…&category=… so the
  // upload lands in the right place without re-picking both.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const o = params.get("occasion");
    const c = params.get("category");
    if (o && OCCASIONS.some((x) => x.slug === o)) setOccasion(o);
    if (c && CATEGORIES.some((x) => x.key === c)) setCategory(c);
  }, []);

  const categoryOptions = occasion ? THEMEABLE_CATEGORIES : CATEGORIES;

  function handleOccasionChange(value: string) {
    setOccasion(value);
    if (value && !THEMEABLE_CATEGORIES.some((c) => c.key === category)) {
      setCategory(THEMEABLE_CATEGORIES[0].key);
    }
  }

  function handleAnswerToggle(checked: boolean) {
    setIsAnswer(checked);
    if (checked) setIsLargePrint(false);
  }

  function handleLargePrintToggle(checked: boolean) {
    setIsLargePrint(checked);
    if (checked) setIsAnswer(false);
  }

  async function handleUpload() {
    if (!files || files.length === 0) return;
    setUploading(true);

    const initial: FileStatus[] = Array.from(files).map((f) => ({
      name: f.name,
      status: "pending",
    }));
    setStatuses(initial);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "uploading" } : s))
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("title", titleFromFilename(file.name));
      formData.append("isAnswer", String(isAnswer));
      formData.append("isLargePrint", String(isLargePrint));
      formData.append("occasion", occasion);

      try {
        const res = await fetch("/api/admin/upload-template", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          // Normally the API always returns JSON with an `error` field.
          // If it doesn't (a platform-level error page rather than our
          // own route code, e.g. a size or rate limit), fall back to the
          // status code and a snippet of the raw body instead of a bare
          // "Upload failed" with no way to diagnose it.
          const cloned = res.clone();
          let message = `Upload failed (${res.status})`;
          try {
            const data = await res.json();
            if (data?.error) message = data.error;
          } catch {
            try {
              const text = (await cloned.text()).trim();
              if (text) message = `Upload failed (${res.status}): ${text.slice(0, 200)}`;
            } catch {
              // no body to read; keep the status-only message
            }
          }
          throw new Error(message);
        }
        setStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: "done" } : s))
        );
      } catch (err: any) {
        setStatuses((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: "error", error: err.message } : s
          )
        );
      }
    }

    setUploading(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl mb-1">Upload Activities</h1>
      <p className="text-sm text-inkSoft mb-6">
        Select a category, then choose one or more PDF files. Titles are generated
        automatically from each filename. Worksheets listed in the video
        index (lib/videoLinksByFile.ts) get their video link attached automatically (Sing-Alongs, BSL Tools).
      </p>

      <label className="block text-xs font-semibold text-inkSoft mb-1">Occasion</label>
      <select
        value={occasion}
        onChange={(e) => handleOccasionChange(e.target.value)}
        className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-1"
      >
        <option value="">None — regular activity library</option>
        {OCCASIONS.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-inkSoft mb-4">
        Occasion uploads only appear on that calendar event's page, not in the regular library.
      </p>

      <label className="block text-xs font-semibold text-inkSoft mb-1">Category</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-4"
      >
        {categoryOptions.map((c) => (
          <option key={c.slug} value={c.key}>
            {c.key}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm mb-2">
        <input
          type="checkbox"
          checked={isAnswer}
          onChange={(e) => handleAnswerToggle(e.target.checked)}
        />
        These are answer sheets (will be matched to an already-uploaded worksheet by filename)
      </label>

      <label className="flex items-center gap-2 text-sm mb-4">
        <input
          type="checkbox"
          checked={isLargePrint}
          onChange={(e) => handleLargePrintToggle(e.target.checked)}
        />
        These are large print files (will be matched to an already-uploaded worksheet by filename)
      </label>

      <label className="block text-xs font-semibold text-inkSoft mb-1">Files</label>
      <input
        type="file"
        accept=".pdf"
        multiple
        onChange={(e) => setFiles(e.target.files)}
        className="w-full text-sm mb-4"
      />

      <button
        onClick={handleUpload}
        disabled={!files || files.length === 0 || uploading}
        className="rounded-lg bg-sage text-white px-5 py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload files"}
      </button>

      {statuses.length > 0 && (
        <div className="mt-6 space-y-1.5">
          {statuses.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm"
            >
              <span>{s.name}</span>
              <span
                className={
                  s.status === "done"
                    ? "text-sageDeep font-semibold"
                    : s.status === "error"
                    ? "text-red-600 font-semibold"
                    : "text-inkSoft"
                }
              >
                {s.status === "done" && "✓ Uploaded"}
                {s.status === "error" && `✕ ${s.error}`}
                {s.status === "uploading" && "Uploading..."}
                {s.status === "pending" && "Waiting..."}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
