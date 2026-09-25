import Link from "next/link";
import Image from "next/image";
import {
  Footprints, Grid3x3, Grid2x2, Search, HelpCircle, Brain, Hash, Dices, Heart,
  Palette, MessageCircle, Copy, Eye, Music, Languages, Hand, Check,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { displayTitle } from "@/lib/titles";

// The free samples come from the database, so render on each request.
export const dynamic = "force-dynamic";

// One free sample per category, offered on the homepage before sign-up:
// the first activity (lowest number) in each of these categories.
const FREE_SAMPLE_CATEGORIES = [
  "Word Searches",
  "Remembrance Cards",
  "BSL Tools",
  "Conversation Starters",
  "Trivia",
];

const SAMPLE_LINK =
  "flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold";

const ICONS: Record<string, any> = {
  "Physical & Exercise": Footprints,
  Crosswords: Grid3x3,
  "Word Searches": Search,
  "Guess the Word": HelpCircle,
  Trivia: Brain,
  Bingo: Hash,
  "Snakes and Ladders": Dices,
  "Remembrance Cards": Heart,
  "Colouring Pages": Palette,
  "Conversation Starters": MessageCircle,
  "Matching Pairs": Copy,
  "Spot the Difference": Eye,
  "Sing-Alongs": Music,
  "Communication Cards": Languages,
  "BSL Tools": Hand,
  Sudoku: Grid2x2,
};

export default async function LandingPage() {
  const freeSamples = (
    await Promise.all(
      FREE_SAMPLE_CATEGORIES.map((category) =>
        prisma.template.findFirst({
          where: { category, occasion: null, language: null },
          orderBy: { fileName: "asc" },
        })
      )
    )
  ).filter((t): t is NonNullable<typeof t> => t !== null);

  return (
    <main>
      {/* Nav */}
      <header className="flex items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 shrink-0">
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} />
          <span className="font-serif text-lg sm:text-xl leading-tight">Activity Central</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
          <a href="#pricing" className="hidden sm:inline text-inkSoft hover:text-ink">Pricing</a>
          <Link href="/login" className="whitespace-nowrap text-inkSoft hover:text-ink">Log in</Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-lg bg-sage text-white px-3 sm:px-4 py-2 font-semibold hover:bg-sageDeep transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-8 sm:pt-16 pb-14 sm:pb-20 text-center">
        <p className="text-clay font-semibold text-sm tracking-wide uppercase mb-4">
          For care home activity teams
        </p>
        <h1 className="font-serif text-[34px] sm:text-5xl leading-tight text-ink mb-5 sm:mb-6">
          A ready-made library of dementia engagement activities
        </h1>
        <p className="text-inkSoft text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-9">
          1000+ downloadable activities across physical &amp; exercise, word puzzles, trivia
          and games, colouring, communication tools, and more — built for carers who need
          something meaningful ready to run in minutes, not hours.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-sage text-white px-6 py-3 font-semibold hover:bg-sageDeep transition-colors"
          >
            Start your free trial
          </Link>
          <a href="#pricing" className="rounded-xl border border-line px-6 py-3 font-semibold text-ink hover:bg-card transition-colors">
            See pricing
          </a>
        </div>
        <p className="text-xs text-inkSoft mt-4">No card required to browse the library preview.</p>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20">
        <h2 className="font-serif text-2xl text-center mb-2">{CATEGORIES.length} categories, every session covered</h2>
        <p className="text-inkSoft text-center mb-10">
          Each activity includes step-by-step facilitator notes, duration, and group size.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.key];
            return (
              <div
                key={c.key}
                className="rounded-2xl p-4 sm:p-5 text-center border border-line bg-card"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: c.tint }}
                >
                  <Icon size={20} color={c.color} />
                </div>
                <p className="font-semibold text-sm">{c.key}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Free samples (hidden if none of their categories has uploads yet) */}
      {freeSamples.length > 0 && (
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20">
        <h2 className="font-serif text-2xl text-center mb-2">Try a few, free — no signup needed</h2>
        <p className="text-inkSoft text-center mb-10">A small taste of the library, ready to download right now.</p>
        <div className="flex flex-wrap justify-center gap-4">
          {freeSamples.map((t) => {
            const cat = CATEGORIES.find((c) => c.key === t.category);
            const Icon = ICONS[t.category];
            return (
              <div
                key={t.id}
                className="w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] rounded-2xl p-5 border border-line bg-card flex flex-col justify-between"
              >
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: cat?.color }}>
                    {Icon && <Icon size={14} />} {t.category}
                  </p>
                  <p className="font-serif text-base">{displayTitle(t)}</p>
                </div>
                <div className="mt-4 grid gap-2">
                  <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className={SAMPLE_LINK} style={{ background: "#E4EEE2", color: "#6D8C6A" }}>
                    Download free sample
                  </a>
                  {t.largePrintFileUrl && (
                    <a href={t.largePrintFileUrl} target="_blank" rel="noopener noreferrer" className={SAMPLE_LINK} style={{ background: "#FCEFE7", color: "#B5714A" }}>
                      Large Print
                    </a>
                  )}
                  {t.answerFileUrl && (
                    <a href={t.answerFileUrl} target="_blank" rel="noopener noreferrer" className={SAMPLE_LINK} style={{ background: "#E7ECFA", color: "#4C5FA8" }}>
                      Answers
                    </a>
                  )}
                  {t.videoUrl && (
                    <a href={t.videoUrl} target="_blank" rel="noopener noreferrer" className={SAMPLE_LINK} style={{ background: "#F3DAD8", color: "#B5453D" }}>
                      {/youtube\.com|youtu\.be/.test(t.videoUrl) ? "Watch on YouTube" : "Watch sign video"}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* Services teaser */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20">
        <div className="rounded-2xl border border-line bg-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-8">
          <div>
            <h3 className="font-serif text-xl mb-2">Need more than activities?</h3>
            <p className="text-inkSoft text-sm max-w-md">
              Every subscription includes access to our Professional Services directory —
              vetted activity coaches, music and reminiscence therapists, and sensory design
              consultants for the care sector.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 rounded-lg bg-cardTint px-5 py-2.5 font-semibold text-sm hover:bg-line transition-colors"
          >
            Explore services
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-3xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
        <h2 className="font-serif text-2xl text-center mb-2">Simple, single-tier pricing</h2>
        <p className="text-inkSoft text-center mb-10">One subscription. Every activity. Cancel anytime.</p>

        <div className="rounded-2xl border-2 border-sage bg-card p-6 sm:p-8 text-center">
          <p className="font-serif text-lg text-sageDeep mb-1">Activity Central Membership</p>
          <p className="font-serif text-5xl text-ink mb-1">£28<span className="text-lg text-inkSoft">/month</span></p>
          <p className="text-xs text-inkSoft mb-6">per care home, billed monthly, cancel anytime</p>

          <ul className="text-sm text-left max-w-xs mx-auto space-y-2.5 mb-8">
            {[
              "Unlimited access to all 1000+ activities",
              "New activities added regularly — you'll be notified",
              "Professional Services directory access",
              "Downloadable PDFs, no expiry",
              "Cancel anytime from your account",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <Check size={16} className="text-sageDeep mt-0.5 shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="inline-block rounded-xl bg-sage text-white px-8 py-3 font-semibold hover:bg-sageDeep transition-colors"
          >
            Start your free trial
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 px-5 sm:px-8 text-center text-xs text-inkSoft max-w-3xl mx-auto">
        <p>© {new Date().getFullYear()} Activity Central. Built for care home activity teams.</p>
        <p className="mt-3 text-[11px] leading-relaxed">Titles, descriptions, and linked videos are generated to closely match each activity, but may occasionally be inaccurate or mismatched. Staff should always review an activity and any linked video before use, and use their professional judgement to ensure it is safe and appropriate for the residents taking part.</p>
      </footer>
    </main>
  );
}
