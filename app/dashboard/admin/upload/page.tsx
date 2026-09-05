"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/data";

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
  const [isAnswer, setIsAnswer] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [uploading, setUploading] = useState(false);

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

      try {
        const res = await fetch("/api/admin/upload-template", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Upload failed");
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
        automatically from each filename. Sing-Along uploads get a YouTube search
        link attached automatically.
      </p>

      <label className="block text-xs font-semibold text-inkSoft mb-1">Category</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-4"
      >
        {CATEGORIES.map((c) => (
          <option key={c.slug} value={c.key}>
            {c.key}
          </option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-sm mb-4">
        <input
          type="checkbox"
          checked={isAnswer}
          onChange={(e) => setIsAnswer(e.target.checked)}
        />
        These are answer sheets (will be matched to already-uploaded question files by filename)
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
