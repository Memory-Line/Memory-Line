"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Printer, RotateCcw } from "lucide-react";
import type { TriviaQuestion } from "@/lib/trivia";

// Colours from the printed sheets.
const INK = "#3f3237";
const ANSWER = "#2f7a63";
const CHOICES = ["#cfe3f2", "#c9e6dd", "#f1d2be", "#dfd5ec"];

// Trivia on screen, one question at a time. In the spirit of the sheet
// ("there are no wrong answers; the aim is conversation, not a test") a
// different choice is never shown in red: the right answer is simply
// highlighted, with a nudge to talk about it. Progress is kept on this device.
export default function TriviaPlayer({
  templateId,
  questions,
  tracking,
  initiallyCompleted,
  hasLargePrint,
  isPremium,
}: {
  templateId: string;
  questions: TriviaQuestion[];
  tracking: boolean;
  initiallyCompleted: boolean;
  hasLargePrint: boolean;
  isPremium: boolean;
}) {
  const storageKey = `trivia:${templateId}`;
  // The choice made for each question (null = not answered yet).
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [completed, setCompleted] = useState(initiallyCompleted);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "null");
      if (saved && Array.isArray(saved.picked) && saved.picked.length === questions.length) {
        setPicked(saved.picked);
        setIndex(Math.min(saved.index ?? 0, questions.length - 1));
        setFinished(!!saved.finished);
      }
    } catch {
      // nothing saved, or storage unavailable
    }
  }, [storageKey, questions.length]);

  function save(next: { picked?: (number | null)[]; index?: number; finished?: boolean }) {
    const state = { picked: next.picked ?? picked, index: next.index ?? index, finished: next.finished ?? finished };
    setPicked(state.picked);
    setIndex(state.index);
    setFinished(state.finished);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // storage unavailable: progress just isn't kept
    }
  }

  async function markCompleted() {
    if (!tracking || completed) return;
    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, completed: true }),
      });
      if (res.ok) setCompleted(true);
    } catch {
      // not marked; they can still use the Completed button on the list
    }
  }

  function choose(k: number) {
    if (picked[index] !== null) return;
    const next = [...picked];
    next[index] = k;
    save({ picked: next });
  }

  function goNext() {
    if (index + 1 < questions.length) save({ index: index + 1 });
    else {
      save({ finished: true });
      markCompleted();
    }
  }

  const q = questions[index];
  const choice = picked[index];
  const rightCount = picked.filter((p, i) => p === questions[i].answer).length;

  return (
    <div className="max-w-[640px]">
      {/* Progress: one dot per question. */}
      <div className="flex flex-wrap gap-1.5 mb-4" aria-label={`Question ${index + 1} of ${questions.length}`}>
        {questions.map((qq, i) => (
          <button
            key={i}
            onClick={() => save({ index: i, finished: false })}
            aria-label={`Question ${i + 1}`}
            className="rounded-full text-xs font-bold"
            style={{
              width: 30,
              height: 30,
              background: i === index && !finished ? "#b5714a" : picked[i] === null ? "#fff" : "#e4eee2",
              color: i === index && !finished ? "#fff" : INK,
              border: "1px solid #d9cfc1",
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {finished ? (
        <div className="rounded-xl bg-white border border-line p-6 text-center">
          <p className="font-serif text-2xl mb-2">You've been through all {questions.length} questions</p>
          <p className="text-inkSoft mb-5">
            {rightCount} of {questions.length} matched the answer sheet — but the best part is the
            chatting along the way.
          </p>
          <button
            onClick={() => save({ picked: questions.map(() => null), index: 0, finished: false })}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint"
          >
            <RotateCcw size={14} /> Start again
          </button>
          {tracking && completed && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold" style={{ color: ANSWER }}>
              <Check size={14} /> Marked as completed
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-line p-5">
          <p className="text-xs font-bold tracking-wide mb-2" style={{ color: "#b5714a" }}>
            QUESTION {index + 1} OF {questions.length}
          </p>
          <p className="text-xl font-semibold mb-5" style={{ color: INK }}>
            {q.q}
          </p>
          <div className="grid gap-3">
            {q.options.map((opt, k) => {
              const isRight = k === q.answer;
              const shown = choice !== null;
              return (
                <button
                  key={k}
                  onClick={() => choose(k)}
                  disabled={shown}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-lg font-semibold"
                  style={{
                    background: shown ? (isRight ? "#e4eee2" : "#f7f3ea") : CHOICES[k % CHOICES.length],
                    border: `2px solid ${shown && isRight ? ANSWER : "transparent"}`,
                    color: shown && !isRight ? "#8a7a6b" : INK,
                  }}
                >
                  {opt}
                  {shown && isRight && <Check size={20} color={ANSWER} />}
                </button>
              );
            })}
          </div>

          {choice !== null && (
            <p className="mt-4 rounded-lg px-3 py-2 text-sm" style={{ background: "#fcefe7", color: INK }}>
              {choice === q.answer ? (
                <span className="font-semibold" style={{ color: ANSWER }}>That's right! </span>
              ) : (
                <span className="font-semibold">The answer on the sheet is {q.options[q.answer]}. </span>
              )}
              Take a moment to talk about it together.
            </p>
          )}

          <div className="flex justify-between mt-5">
            <button
              onClick={() => save({ index: Math.max(0, index - 1) })}
              disabled={index === 0}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold bg-cardTint disabled:opacity-40"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={goNext}
              disabled={choice === null}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: ANSWER }}
            >
              {index + 1 < questions.length ? "Next question" : "Finish"} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-line">
        <p className="text-xs font-semibold text-inkSoft mb-2">Prefer paper?</p>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/download/${templateId}?file=standard`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#E4EEE2", color: "#6D8C6A" }}>
            <Printer size={14} /> Print
          </a>
          {hasLargePrint && isPremium && (
            <a href={`/api/download/${templateId}?file=large-print`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold" style={{ background: "#FCEFE7", color: "#B5714A" }}>
              <Printer size={14} /> Print Large (A3)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
