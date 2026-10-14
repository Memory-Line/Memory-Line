"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { narrationFor } from "@/lib/trainingNarration";

type Slide = { title: string; body: string[]; tip?: string };
type Course = {
  key: string;
  title: string;
  subtitle: string;
  minutes: number;
  passPercent: number;
  intro: string;
  slides: Slide[];
  questions: { q: string; options: string[] }[];
};

type Stage = "intro" | "slides" | "quiz" | "details" | "done";

const INK = "#3F3237";
const BTN = { padding: "12px 22px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 16, cursor: "pointer" } as const;
const clipUrl = (text: string) => `/api/boards/speak?use=training&lang=en&voice=female&text=${encodeURIComponent(text)}`;

// The staff course: a slide show with a voice and subtitles that cannot be skipped, a transcript, then a quiz
// that stays locked until the last slide has finished, then a form for the details on the certificate.
export default function TrainingPlayer({ link, course }: { link: string; course: Course }) {
  const [stage, setStage] = useState<Stage>("intro");
  const [slideIdx, setSlideIdx] = useState(0);
  const [clipIdx, setClipIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [captions, setCaptions] = useState(true);
  const [transcript, setTranscript] = useState(false);
  const [startToken, setStartToken] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [finishedHere, setFinishedHere] = useState<number | null>(null);

  const [answers, setAnswers] = useState<number[]>(() => course.questions.map(() => -1));
  const [quizBusy, setQuizBusy] = useState(false);
  const [quizResult, setQuizResult] = useState<null | { passed: boolean; score: number; total: number; needed: number; wrong: number[]; explanations: string[] | null }>(null);
  const [passToken, setPassToken] = useState<string | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [job, setJob] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [cert, setCert] = useState<null | { emailed: boolean; filename: string; pdf: string }>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runId = useRef(0);

  const slide = course.slides[slideIdx];
  const clips = narrationFor(slide);
  const lastSlide = slideIdx === course.slides.length - 1;
  const allDone = done.size === course.slides.length;

  const stopAll = useCallback(() => {
    runId.current++;
    if (timerRef.current) clearTimeout(timerRef.current);
    const a = audioRef.current;
    if (a) {
      a.onended = null;
      a.onerror = null;
      a.pause();
    }
  }, []);

  // Moves on when a clip has finished: the next sentence, or the slide is finished.
  const clipFinished = useCallback(
    (id: number) => {
      if (id !== runId.current) return;
      if (clipIdx < clips.length - 1) {
        setClipIdx(clipIdx + 1);
      } else {
        setDone((prev) => new Set(prev).add(slideIdx));
        setFinishedHere(slideIdx);
      }
    },
    [clipIdx, clips.length, slideIdx]
  );

  // Plays the current sentence.
  useEffect(() => {
    if (stage !== "slides" || paused) return;
    const a = audioRef.current;
    if (!a) return;
    const id = ++runId.current;
    const text = clips[clipIdx];
    const fallback = () => {
      if (id !== runId.current) return;
      timerRef.current = setTimeout(() => clipFinished(id), Math.max(1800, text.length * 70));
    };
    a.onended = () => clipFinished(id);
    a.onerror = fallback;
    a.src = clipUrl(text);
    a.play().catch(fallback);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      a.onended = null;
      a.onerror = null;
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, slideIdx, clipIdx, paused, replayKey]);

  // A finished slide moves on by itself after a short pause (the person can also press Next).
  useEffect(() => {
    if (stage !== "slides" || paused || finishedHere !== slideIdx || lastSlide) return;
    const t = setTimeout(() => goTo(slideIdx + 1), 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, paused, finishedHere, slideIdx]);

  useEffect(() => () => stopAll(), [stopAll]);

  function goTo(i: number) {
    if (i < 0 || i >= course.slides.length) return;
    // Cannot jump ahead: only to a slide after one that has finished.
    if (i > slideIdx && !done.has(slideIdx)) return;
    setClipIdx(0);
    setFinishedHere(null);
    setSlideIdx(i);
    setPaused(false);
    setReplayKey((k) => k + 1);
  }

  async function begin() {
    // One audio element, started by this click, so the browser allows the voice for the rest of the course.
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    a.muted = false;
    // A silent clip played inside the click, which unlocks sound on phones and tablets.
    a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    a.play().catch(() => {});
    const res = await fetch("/api/training/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setStartToken(data?.start ?? null);
    setSlideIdx(0);
    setClipIdx(0);
    setPaused(false);
    setStage("slides");
  }

  function replaySlide() {
    stopAll();
    setClipIdx(0);
    setFinishedHere(null);
    setPaused(false);
    setReplayKey((k) => k + 1);
  }

  function togglePause() {
    const a = audioRef.current;
    if (!paused) {
      a?.pause();
      if (timerRef.current) clearTimeout(timerRef.current);
      runId.current++;
      setPaused(true);
    } else {
      setPaused(false);
    }
  }

  async function submitQuiz() {
    setQuizError(null);
    if (answers.some((a) => a < 0)) {
      setQuizError("Please answer every question.");
      return;
    }
    setQuizBusy(true);
    const res = await fetch("/api/training/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link, start: startToken, answers }),
    }).catch(() => null);
    setQuizBusy(false);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setQuizError(data?.error ?? "Something went wrong. Please try again.");
      return;
    }
    setQuizResult(data);
    if (data.passed) setPassToken(data.pass);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function sendCertificate() {
    setSendError(null);
    if (!name.trim() || !job.trim()) {
      setSendError("Please fill in your name and job title.");
      return;
    }
    setSending(true);
    const res = await fetch("/api/training/certificate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link, pass: passToken, name, job }),
    }).catch(() => null);
    setSending(false);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setSendError(data?.error ?? "Something went wrong. Please try again.");
      return;
    }
    setCert(data);
    setStage("done");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function downloadCert() {
    if (!cert) return;
    const bytes = Uint8Array.from(atob(cert.pdf), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = cert.filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  const card = { background: "#fff", border: "1px solid #EAE4D6", borderRadius: 18, padding: "22px 20px", boxShadow: "0 1px 3px rgba(63,50,55,0.06)" } as const;
  const hideWhenPrinting = transcript ? "tp-hide-print" : undefined;

  const transcriptPanel = transcript && (
    <section id="tp-transcript" style={{ ...card, marginTop: 16 }}>
      <div className="tp-hide-print" style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, margin: 0, flex: 1 }}>Transcript</h2>
        <button onClick={() => window.print()} style={{ ...BTN, padding: "8px 14px", fontSize: 14, background: "#fff", border: `2px solid ${INK}`, color: INK }}>
          Print
        </button>
        <button onClick={() => setTranscript(false)} style={{ ...BTN, padding: "8px 14px", fontSize: 14, background: INK, color: "#fff" }}>
          Close
        </button>
      </div>
      <h2 className="tp-print-title" style={{ display: "none", fontFamily: "Georgia, serif" }}>{course.title}: transcript</h2>
      {course.slides.map((s, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: "#B5714A" }}>
            Slide {i + 1}: {s.title}
          </p>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55 }}>{narrationFor(s).join(" ")}</p>
        </div>
      ))}
    </section>
  );

  return (
    <div>
      <style>{`
        @media print {
          .tp-hide-print { display: none !important; }
          .tp-print-title { display: block !important; }
          main { background: #fff !important; padding: 0 !important; }
        }
      `}</style>

      <div className={hideWhenPrinting}>
        {stage === "intro" && (
          <section style={card}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 400, margin: "0 0 4px" }}>{course.title}</h1>
            <p style={{ margin: "0 0 14px", color: "#8A5A2A", fontWeight: 700 }}>{course.subtitle}</p>
            <p style={{ fontSize: 18, lineHeight: 1.55, margin: "0 0 14px" }}>{course.intro}</p>
            <ul style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 18px", paddingLeft: 20 }}>
              <li>About {course.minutes} minutes: a slide show with a voice and subtitles.</li>
              <li>The quiz opens when the last slide has finished. You can pause and replay a slide, but you cannot skip ahead.</li>
              <li>You need {course.passPercent}% to pass, and you can retry.</li>
              <li>When you pass you fill in your name and job title. A certificate is sent to your manager and you can download it too.</li>
              <li>You can read the full words any time with the Transcript button.</li>
            </ul>
            <p style={{ fontSize: 13, color: "#6B5F57", margin: "0 0 18px" }}>
              Activity Central does not keep your name or job title. They are used to make your certificate and email it to your manager, and are not saved by us.
              Our email service provider may keep a record of the email for a short time.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button onClick={begin} style={{ ...BTN, background: INK, color: "#fff" }}>
                Start the course
              </button>
              <button onClick={() => setTranscript((v) => !v)} style={{ ...BTN, background: "#fff", border: `2px solid ${INK}`, color: INK }}>
                Transcript
              </button>
            </div>
          </section>
        )}

        {stage === "slides" && (
          <section style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#6B5F57" }}>
                Slide {slideIdx + 1} of {course.slides.length}
              </span>
              <div style={{ flex: 1, height: 8, background: "#EEE9DC", borderRadius: 99 }} aria-hidden="true">
                <div style={{ width: `${(done.size / course.slides.length) * 100}%`, height: 8, background: "#B5714A", borderRadius: 99, transition: "width 0.3s" }} />
              </div>
            </div>

            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 400, margin: "6px 0 12px" }}>{slide.title}</h2>
            <div style={{ fontSize: 20, lineHeight: 1.6 }}>
              {slide.body.map((line, i) =>
                line.startsWith("- ") ? (
                  <div key={i} style={{ display: "flex", gap: 10, margin: "4px 0" }}>
                    <span>•</span>
                    <span style={{ flex: 1 }}>{line.slice(2)}</span>
                  </div>
                ) : (
                  <p key={i} style={{ margin: "8px 0" }}>{line}</p>
                )
              )}
              {slide.tip && (
                <p style={{ margin: "14px 0 0", padding: "10px 14px", background: "#FFF1C2", borderRadius: 12, fontSize: 18, fontWeight: 600 }}>
                  Tip: {slide.tip}
                </p>
              )}
            </div>

            {captions && (
              <div
                aria-live="polite"
                style={{ marginTop: 18, background: "#1a1a1a", color: "#fff", borderRadius: 12, padding: "14px 16px", fontSize: 21, lineHeight: 1.45, minHeight: 64, textAlign: "center" }}
              >
                {clips[clipIdx]}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16, alignItems: "center" }}>
              <button onClick={togglePause} style={{ ...BTN, background: INK, color: "#fff" }}>
                {paused ? "Play" : "Pause"}
              </button>
              <button onClick={replaySlide} style={{ ...BTN, background: "#fff", border: `2px solid ${INK}`, color: INK }}>
                Replay slide
              </button>
              <button
                onClick={() => goTo(slideIdx - 1)}
                disabled={slideIdx === 0}
                style={{ ...BTN, background: "#fff", border: `2px solid ${INK}`, color: INK, opacity: slideIdx === 0 ? 0.4 : 1 }}
              >
                Back
              </button>
              {!lastSlide && (
                <button
                  onClick={() => goTo(slideIdx + 1)}
                  disabled={!done.has(slideIdx)}
                  title={done.has(slideIdx) ? "" : "Available when this slide has finished"}
                  style={{ ...BTN, background: "#B5714A", color: "#fff", opacity: done.has(slideIdx) ? 1 : 0.4 }}
                >
                  Next
                </button>
              )}
              <span style={{ flex: 1 }} />
              <button onClick={() => setCaptions((v) => !v)} aria-pressed={captions} style={{ ...BTN, padding: "10px 14px", fontSize: 14, background: captions ? "#FFD23F" : "#fff", border: `2px solid ${INK}`, color: INK }}>
                Subtitles: {captions ? "On" : "Off"}
              </button>
              <button onClick={() => setTranscript((v) => !v)} aria-pressed={transcript} style={{ ...BTN, padding: "10px 14px", fontSize: 14, background: transcript ? "#FFD23F" : "#fff", border: `2px solid ${INK}`, color: INK }}>
                Transcript
              </button>
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #EAE4D6" }}>
              {allDone ? (
                <button onClick={() => { stopAll(); setStage("quiz"); window.scrollTo({ top: 0 }); }} style={{ ...BTN, background: "#2F7A4B", color: "#fff", fontSize: 18 }}>
                  Start the quiz
                </button>
              ) : (
                <p style={{ margin: 0, fontSize: 15, color: "#6B5F57" }}>
                  The quiz opens when the last slide has finished ({done.size} of {course.slides.length} slides watched).
                </p>
              )}
            </div>
          </section>
        )}

        {stage === "quiz" && (
          <section style={card}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 400, margin: "0 0 4px" }}>Quiz</h2>
            <p style={{ margin: "0 0 16px", fontSize: 16, color: "#6B5F57" }}>
              Choose one answer for each question. You need {course.passPercent}% to pass.
            </p>

            {quizResult && !quizResult.passed && (
              <div style={{ background: "#F6D4D0", color: "#8A2A22", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 17, fontWeight: 600 }}>
                You got {quizResult.score} out of {quizResult.total}. You need {quizResult.needed} to pass. The questions to look at again are marked below. Change
                your answers and try again, or go back through the slides.
              </div>
            )}

            {quizResult?.passed ? (
              <div>
                <div style={{ background: "#D8EBD2", color: "#2F5A2A", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
                  Well done! You passed with {quizResult.score} out of {quizResult.total}.
                </div>
                {course.questions.map((q, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 17 }}>
                      {i + 1}. {q.q}
                    </p>
                    <p style={{ margin: 0, fontSize: 16, color: "#2F5A2A" }}>
                      {q.options[answers[i]]}. {quizResult.explanations?.[i]}
                    </p>
                  </div>
                ))}
                <button onClick={() => setStage("details")} style={{ ...BTN, background: "#2F7A4B", color: "#fff", fontSize: 18 }}>
                  Get my certificate
                </button>
              </div>
            ) : (
              <div>
                {course.questions.map((q, i) => {
                  const bad = quizResult?.wrong.includes(i);
                  return (
                    <fieldset key={i} style={{ border: bad ? "2px solid #C0392B" : "1px solid #EAE4D6", borderRadius: 14, padding: "12px 14px", margin: "0 0 14px" }}>
                      <legend style={{ fontWeight: 700, fontSize: 18, padding: "0 6px" }}>
                        {i + 1}. {q.q}
                      </legend>
                      {q.options.map((o, k) => (
                        <label key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 4px", fontSize: 17, cursor: "pointer" }}>
                          <input
                            type="radio"
                            name={`q${i}`}
                            checked={answers[i] === k}
                            onChange={() => setAnswers((prev) => prev.map((v, j) => (j === i ? k : v)))}
                            style={{ marginTop: 5, width: 20, height: 20 }}
                          />
                          <span>{o}</span>
                        </label>
                      ))}
                    </fieldset>
                  );
                })}
                {quizError && <p style={{ color: "#C0392B", fontWeight: 700, fontSize: 16 }}>{quizError}</p>}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={submitQuiz} disabled={quizBusy} style={{ ...BTN, background: INK, color: "#fff", opacity: quizBusy ? 0.6 : 1 }}>
                    {quizBusy ? "Marking…" : "Submit my answers"}
                  </button>
                  <button onClick={() => { setStage("slides"); setSlideIdx(0); setClipIdx(0); setPaused(true); }} style={{ ...BTN, background: "#fff", border: `2px solid ${INK}`, color: INK }}>
                    Look at the slides again
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {stage === "details" && (
          <section style={card}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 400, margin: "0 0 6px" }}>Your certificate</h2>
            <p style={{ margin: "0 0 14px", fontSize: 17 }}>
              Type your details exactly as you want them on the certificate. It will be emailed to your manager and you can download it too.
            </p>
            <label style={{ display: "block", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Your full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #D9D2C0", fontSize: 18, marginBottom: 14 }} />
            <label style={{ display: "block", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Your job title</label>
            <input value={job} onChange={(e) => setJob(e.target.value)} maxLength={80} autoComplete="organization-title" style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #D9D2C0", fontSize: 18, marginBottom: 14 }} />
            <p style={{ fontSize: 13, color: "#6B5F57", margin: "0 0 14px" }}>
              Activity Central does not keep your name or job title. They are used to make your certificate and email it to your manager, and are not saved by us.
              Our email service provider may keep a record of the email for a short time.
            </p>
            {sendError && <p style={{ color: "#C0392B", fontWeight: 700 }}>{sendError}</p>}
            <button onClick={sendCertificate} disabled={sending} style={{ ...BTN, background: "#2F7A4B", color: "#fff", fontSize: 18, opacity: sending ? 0.6 : 1 }}>
              {sending ? "Sending…" : "Send my certificate"}
            </button>
          </section>
        )}

        {stage === "done" && cert && (
          <section style={card}>
            <h2 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 400, margin: "0 0 8px" }}>All done, well done!</h2>
            <p style={{ fontSize: 18, margin: "0 0 14px" }}>
              {cert.emailed
                ? "Your certificate has been emailed to your manager."
                : "We could not email your certificate to your manager. Please download it and give it to them."}
            </p>
            <button onClick={downloadCert} style={{ ...BTN, background: INK, color: "#fff", fontSize: 18 }}>
              Download my certificate
            </button>
            <p style={{ fontSize: 13, color: "#6B5F57", marginTop: 16 }}>
              Please download it now. We do not keep a copy, so this page cannot make it again once you leave.
            </p>
          </section>
        )}
      </div>

      {transcriptPanel}
    </div>
  );
}
