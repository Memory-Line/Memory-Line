"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/data";
import { OCCASIONS, THEMEABLE_CATEGORIES } from "@/lib/occasions";
import { LANGUAGE_CATEGORY, LANGUAGES, languageFromPath } from "@/lib/languages";
import { FEATURES } from "@/lib/featureList";
import { titleFromFilename } from "@/lib/titles";
import { subcategoriesFor, subcategoryFromPath } from "@/lib/subcategories";

// Files picked as part of a folder count as large print when any folder
// in their path says so (e.g. "A3 Large Print/"), and as answer sheets when
// inside a folder named "Answers" (or "Answer Key" / "Answer Sheets").
const LARGE_PRINT_FOLDER = /large[-_\s]?print/i;
const ANSWERS_FOLDER = /^answers?(\s*(key|sheets?))?$/i;

type FileStatus = {
  name: string;
  status: "pending" | "uploading" | "done" | "skipped" | "error";
  error?: string;
};

export default function AdminUploadPage() {
  const [category, setCategory] = useState(CATEGORIES[0].key);
  // "" = the regular category library; otherwise a calendar occasion slug.
  const [occasion, setOccasion] = useState("");
  // Communication Cards only; files inside a language folder override it.
  const [language, setLanguage] = useState(LANGUAGES[0].slug);
  // Level for categories split into sub-categories (e.g. Sudoku); files inside
  // a level folder (e.g. "Beginner") use that level instead.
  const [level, setLevel] = useState("");
  const [isAnswer, setIsAnswer] = useState(false);
  const [isLargePrint, setIsLargePrint] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [statuses, setStatuses] = useState<FileStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  // Leave out files already on the site, so a stopped upload can carry on.
  const [skipExisting, setSkipExisting] = useState(true);

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
  const isLanguageCategory = category === LANGUAGE_CATEGORY && !occasion;
  const levels = occasion ? undefined : subcategoriesFor(category);

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

    // A picked folder gives each file its path inside that folder, e.g.
    // "Languages/02-polish/A3 Large Print/001-….pdf" or
    // "Sudoku/Beginner/Answers/0001-….pdf". The path tells us the language
    // or level, and whether it's large print or an answer sheet, so a whole
    // pack can go up in one go. Worksheets go first so the large print and
    // answer files have something to attach to.
    const jobs = Array.from(files)
      .filter((f) => /\.pdf$/i.test(f.name))
      .map((file) => {
        const path = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
        const answers = isAnswer || path.split("/").slice(0, -1).some((p) => ANSWERS_FOLDER.test(p.trim()));
        return {
          file,
          path,
          answers,
          largePrint: !answers && (isLargePrint || LARGE_PRINT_FOLDER.test(path)),
          language: isLanguageCategory ? languageFromPath(path) ?? language : "",
          subcategory: levels ? subcategoryFromPath(category, path) ?? (level || levels[0].slug) : "",
        };
      })
      .sort(
        (a, b) =>
          Number(a.largePrint || a.answers) - Number(b.largePrint || b.answers) || a.path.localeCompare(b.path)
      );

    // Which of these are already on the site: worksheets by file name, and
    // large print / answers by whether their worksheet (same number, same
    // language/level/occasion) already has one attached.
    const skip = new Set<number>();
    if (skipExisting) {
      try {
        const res = await fetch(`/api/admin/upload-template?category=${encodeURIComponent(category)}`);
        const data = await res.json();
        if (res.ok && data?.ok) {
          const worksheets = new Set<string>();
          const variants = new Map<string, { largePrint: boolean; answers: boolean }>();
          for (const e of data.existing as { fileName: string; number: string | null; scope: string; largePrint: boolean; answers: boolean }[]) {
            worksheets.add(`${e.scope}|${e.fileName}`);
            if (e.number) variants.set(`${e.scope}|${e.number}`, e);
          }
          jobs.forEach((j, i) => {
            const scope = occasion || j.language || j.subcategory || "";
            const number = j.file.name.match(/^(\d+)/)?.[1];
            const worksheet = number ? variants.get(`${scope}|${parseInt(number, 10)}`) : undefined;
            if (j.answers ? worksheet?.answers : j.largePrint ? worksheet?.largePrint : worksheets.has(`${scope}|${j.file.name}`)) {
              skip.add(i);
            }
          });
        }
      } catch {
        // couldn't check; upload everything
      }
    }

    setStatuses(jobs.map((j, i) => ({ name: j.path, status: skip.has(i) ? "skipped" : "pending" })));

    const uploadOne = async (i: number) => {
      const { file, largePrint, answers, language: jobLanguage, subcategory: jobLevel } = jobs[i];
      setStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: "uploading" } : s))
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("title", titleFromFilename(file.name));
      formData.append("isAnswer", String(answers));
      formData.append("isLargePrint", String(largePrint));
      formData.append("occasion", occasion);
      formData.append("language", jobLanguage);
      formData.append("subcategory", jobLevel);

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
    };

    // Two at a time: quicker than one by one, but gentle on the database (four
    // at a time for 9,000 files used up its connections).
    const runAll = async (indexes: number[]) => {
      let next = 0;
      const worker = async () => {
        while (next < indexes.length) await uploadOne(indexes[next++]);
      };
      await Promise.all(Array.from({ length: Math.min(2, indexes.length) }, worker));
    };
    const all = jobs.map((_, i) => i).filter((i) => !skip.has(i));
    await runAll(all.filter((i) => !jobs[i].largePrint && !jobs[i].answers));
    await runAll(all.filter((i) => jobs[i].largePrint || jobs[i].answers));

    setUploading(false);
  }

  const doneCount = statuses.filter((s) => s.status === "done").length;
  const errorCount = statuses.filter((s) => s.status === "error").length;
  const skippedCount = statuses.filter((s) => s.status === "skipped").length;
  // Listing thousands of rows would make the page crawl; for big uploads
  // show the totals plus anything that failed or is in progress.
  const shownStatuses =
    statuses.length > 300
      ? statuses.filter((s) => s.status === "error" || s.status === "uploading")
      : statuses;

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

      {isLanguageCategory && (
        <>
          <label className="block text-xs font-semibold text-inkSoft mb-1">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-1"
          >
            {LANGUAGES.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-inkSoft mb-4">
            When you upload a folder, files inside a language folder (e.g. "02-polish") use
            that language instead.
          </p>
        </>
      )}

      {levels && (
        <>
          <label className="block text-xs font-semibold text-inkSoft mb-1">Level</label>
          <select
            value={level || levels[0].slug}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-1"
          >
            {levels.map((l) => (
              <option key={l.slug} value={l.slug}>
                {l.label} — {l.description}
              </option>
            ))}
          </select>
          <p className="text-xs text-inkSoft mb-4">
            When you upload a folder, files inside a level folder (e.g. "Beginner") use that
            level instead.
          </p>
        </>
      )}

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
        className="w-full text-sm mb-3"
      />

      <label className="block text-xs font-semibold text-inkSoft mb-1">…or a whole folder</label>
      <input
        type="file"
        multiple
        // Not in React's typings, but supported by every current browser.
        {...{ webkitdirectory: "" }}
        onChange={(e) => setFiles(e.target.files)}
        className="w-full text-sm mb-1"
      />
      <p className="text-xs text-inkSoft mb-4">
        Everything inside is uploaded. Files in a folder with "Large Print" in its name, or in
        an "Answers" folder, are attached after the standard files have gone up.
      </p>

      <label className="flex items-center gap-2 text-sm mb-3">
        <input type="checkbox" checked={skipExisting} onChange={(e) => setSkipExisting(e.target.checked)} />
        Skip files that are already uploaded (to carry on an upload that stopped)
      </label>

      <button
        onClick={handleUpload}
        disabled={!files || files.length === 0 || uploading}
        className="rounded-lg bg-sage text-white px-5 py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload files"}
      </button>

      {statuses.length > 0 && (
        <p className="mt-6 text-sm font-semibold">
          {doneCount} of {statuses.length - skippedCount} uploaded
          {skippedCount > 0 && <span className="text-inkSoft"> · {skippedCount} already on the site, skipped</span>}
          {errorCount > 0 && <span className="text-red-600"> · {errorCount} failed</span>}
        </p>
      )}

      {shownStatuses.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {shownStatuses.map((s) => (
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
                {s.status === "skipped" && "Already uploaded"}
              </span>
            </div>
          ))}
        </div>
      )}

      <RenumberSection />
      <FreeAccessSection />
    </div>
  );
}

type RenumberChange = { id: string; from: string; to: string };

// Closes gaps in a category's numbering (e.g. 12, 14 … 20, 23 → 1 … 20),
// keeping the current order. Shows the changes first; nothing is saved
// until "Apply" is clicked.
function RenumberSection() {
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [preview, setPreview] = useState<RenumberChange[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function run(apply: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/renumber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, apply }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? `Failed (${res.status})`);
      if (apply) {
        setPreview(null);
        setMessage(`✓ Renumbered ${data.changes.length} of ${data.total} activities in ${category}.`);
      } else {
        setPreview(data.changes);
        if (data.changes.length === 0) setMessage(`${category} is already numbered 1–${data.total} with no gaps.`);
      }
    } catch (err: any) {
      setMessage(`✕ ${err.message}`);
    }
    setBusy(false);
  }

  return (
    <div className="mt-10 pt-6 border-t border-line">
      <h2 className="font-serif text-xl mb-1">Renumber activities</h2>
      <p className="text-sm text-inkSoft mb-4">
        Closes gaps in a category's numbering (1, 2, 3 …) and keeps the current order. Only the
        number at the start of each file name changes. Upload any large print or answer files
        before renumbering, as they're matched to worksheets by number.
      </p>
      <div className="flex gap-2 mb-3">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPreview(null);
            setMessage("");
          }}
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm"
        >
          {CATEGORIES.filter((c) => c.key !== LANGUAGE_CATEGORY && !subcategoriesFor(c.key)).map((c) => (
            <option key={c.slug} value={c.key}>
              {c.key}
            </option>
          ))}
        </select>
        <button
          onClick={() => run(false)}
          disabled={busy}
          className="rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint hover:bg-line transition-colors disabled:opacity-50"
        >
          Preview
        </button>
      </div>

      {preview && preview.length > 0 && (
        <>
          <div className="space-y-1 mb-3 max-h-80 overflow-y-auto">
            {preview.map((c) => (
              <p key={c.id} className="text-xs rounded-lg border border-line px-3 py-1.5">
                {c.from} → <span className="font-semibold">{c.to}</span>
              </p>
            ))}
          </div>
          <button
            onClick={() => run(true)}
            disabled={busy}
            className="rounded-lg bg-sage text-white px-5 py-2.5 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-50"
          >
            Apply {preview.length} changes
          </button>
        </>
      )}

      {message && <p className="text-sm mt-3">{message}</p>}
    </div>
  );
}

// Admin tools for accounts that have signed up: give or remove free
// access (full access without paying, e.g. a care home trialling the
// site), and set whether it's a care home or personal account.
// Admin access is separate: only the ADMIN_EMAIL account ever has it.
type Account = {
  email: string;
  name: string | null;
  accountType: string;
  subscriptionStatus: string;
  features: string[];
};

const ACCESS_LABELS: Record<string, string> = {
  free: "free access",
  active: "paid",
  trialing: "paid (trial)",
  past_due: "paid (payment overdue)",
};

function FreeAccessSection() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [email, setEmail] = useState("");
  const [editType, setEditType] = useState<"care-home" | "personal">("personal");
  const [editName, setEditName] = useState("");
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function selectAccount(value: string) {
    setEmail(value);
    setMessage("");
    const account = accounts?.find((a) => a.email === value);
    setEditType(account?.accountType === "care-home" ? "care-home" : "personal");
    setEditName(account?.name ?? "");
    setEditFeatures(account?.features ?? []);
  }

  async function saveDetails() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/free-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accountType: editType, name: editName, features: editFeatures }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? `Failed (${res.status})`);
      setMessage(data.message);
      await loadAccounts();
    } catch (err: any) {
      setMessage(`✕ ${err.message}`);
    }
    setBusy(false);
  }

  async function loadAccounts() {
    try {
      const res = await fetch("/api/admin/free-access");
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? `Failed (${res.status})`);
      setAccounts(data.users);
    } catch (err: any) {
      setMessage(`✕ Couldn't load accounts: ${err.message}`);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function run(grant: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/free-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, grant }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? `Failed (${res.status})`);
      setMessage(data.message);
      await loadAccounts();
    } catch (err: any) {
      setMessage(`✕ ${err.message}`);
    }
    setBusy(false);
  }

  return (
    <div className="mt-10 pt-6 border-t border-line">
      <h2 className="font-serif text-xl mb-1">Accounts</h2>
      <p className="text-sm text-inkSoft mb-4">
        Choose an account that has signed up. You can give it full access to the library
        without paying (this never gives admin access), set whether it's a care home or
        personal account, and switch on extra features like the professional calendar.
      </p>
      <div className="flex gap-2">
        <select
          value={email}
          onChange={(e) => selectAccount(e.target.value)}
          className="flex-1 min-w-0 rounded-lg border border-line px-3 py-2 text-sm"
        >
          <option value="">
            {accounts === null ? "Loading accounts…" : `Choose an account (${accounts.length})`}
          </option>
          {accounts?.map((a) => (
            <option key={a.email} value={a.email}>
              {`${a.email}${a.name ? ` — ${a.name}` : ""}${
                a.accountType === "care-home" ? " (care home)" : ""
              } · ${ACCESS_LABELS[a.subscriptionStatus] ?? "no access"}`}
            </option>
          ))}
        </select>
        <button
          onClick={() => run(true)}
          disabled={busy || !email.trim()}
          className="rounded-lg bg-sage text-white px-4 py-2 font-semibold text-sm hover:bg-sageDeep transition-colors disabled:opacity-50"
        >
          Give free access
        </button>
        <button
          onClick={() => run(false)}
          disabled={busy || !email.trim()}
          className="rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint hover:bg-line transition-colors disabled:opacity-50"
        >
          Remove
        </button>
      </div>

      {email && (
        <div className="mt-4 rounded-xl p-4 bg-card border border-line">
          <p className="text-xs font-semibold text-inkSoft mb-2">Account details</p>
          <div className="flex gap-4 mb-3 text-sm">
            {(
              [
                ["care-home", "Care home"],
                ["personal", "Personal"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="editAccountType"
                  checked={editType === value}
                  onChange={() => setEditType(value)}
                />
                {label}
              </label>
            ))}
          </div>
          <p className="text-xs font-semibold text-inkSoft mb-1.5">Extra features</p>
          <div className="space-y-1.5 mb-3">
            {FEATURES.map((f) => (
              <label key={f.key} className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={editFeatures.includes(f.key)}
                  onChange={(e) =>
                    setEditFeatures((prev) =>
                      e.target.checked ? [...prev, f.key] : prev.filter((k) => k !== f.key)
                    )
                  }
                />
                <span>
                  {f.label}
                  <span className="block text-xs text-inkSoft">{f.description}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={editType === "care-home" ? "Care home name, e.g. Westcliff Lodge" : "Their name"}
              className="flex-1 min-w-0 rounded-lg border border-line px-3 py-2 text-sm"
            />
            <button
              onClick={saveDetails}
              disabled={busy || !editName.trim()}
              className="rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint hover:bg-line transition-colors disabled:opacity-50"
            >
              Save details
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-sm mt-3">{message}</p>}
    </div>
  );
}
