import Link from "next/link";
import Image from "next/image";
import {
  Footprints, Grid3x3, Grid2x2, Search, HelpCircle, Brain, Hash, Dices, Heart,
  Palette, MessageCircle, Copy, Eye, Music, Languages, Hand, Check, PlayCircle,
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { PLAYABLE_CATEGORIES } from "@/lib/play";
import { PREMIUM_ONLY_CATEGORIES as PREMIUM_ONLY_CATEGORIES_SET } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { displayTitle } from "@/lib/titles";

// The free samples come from the database, but they change rarely (only
// when a new category's first upload changes), so the page is cached and
// rebuilt at most every 10 minutes rather than hitting the database on
// every single visit — the main thing making the homepage feel slow.
export const revalidate = 600;

// One free sample per category, offered on the homepage before sign-up:
// the first activity (lowest number) in each of these categories. Every
// category gets one, so people can see exactly what they'd be getting
// across the whole library, not just a handful of categories.
const FREE_SAMPLE_CATEGORIES = CATEGORIES.map((c) => c.key);

// Same source of truth the site's own Standard/Premium gating uses
// (lib/plans.ts), so the pricing section can never drift out of sync with
// what Standard accounts actually get.
const PREMIUM_ONLY_CATEGORIES = Array.from(PREMIUM_ONLY_CATEGORIES_SET);
const STANDARD_CATEGORIES = CATEGORIES.map((c) => c.key).filter((k) => !PREMIUM_ONLY_CATEGORIES_SET.has(k));

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
          where: {
            category,
            occasion: null,
            language: null,
            // A gentle first taste for Sudoku, rather than whichever level
            // happens to sort first by file name.
            ...(category === "Sudoku" ? { subcategory: "beginner" } : {}),
          },
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
          <Image src="/activity-central-icon.png" alt="Activity Central" width={60} height={60} className="w-10 h-10 sm:w-[60px] sm:h-[60px]" />
          <span className="font-serif text-base sm:text-xl leading-tight">Activity Central</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
          <a href="#pricing" className="hidden sm:inline text-inkSoft hover:text-ink">Pricing</a>
          <Link href="/login" className="whitespace-nowrap text-inkSoft hover:text-ink">Log in</Link>
          <Link
            href="/signup"
            className="whitespace-nowrap rounded-lg bg-sage text-white px-3 sm:px-4 py-2 font-semibold hover:bg-sageDeep transition-colors"
          >
            Sign up
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
            Sign up
          </Link>
          <a href="#pricing" className="rounded-xl border border-line px-6 py-3 font-semibold text-ink hover:bg-card transition-colors">
            See pricing
          </a>
        </div>
        <p className="text-xs text-inkSoft mt-4">Try samples from every category free, no card or signup needed.</p>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20">
        <h2 className="font-serif text-2xl text-center mb-2">{CATEGORIES.length} categories, every session covered</h2>
        <p className="text-inkSoft text-center mb-10">
          Every activity is a ready-to-print sheet, and the puzzles and games can be played on screen too.
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
      <section id="samples" className="max-w-5xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20">
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
                  {PLAYABLE_CATEGORIES.has(t.category) && (
                    <Link href={`/play/${t.id}`} className={SAMPLE_LINK} style={{ background: "#D6EBE3", color: "#2F7A63" }}>
                      <PlayCircle size={15} className="mr-1.5" /> Play online, free
                    </Link>
                  )}
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
        <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">
          <p className="text-clay font-semibold text-xs tracking-wide uppercase mb-2">Coming soon</p>
          <h3 className="font-serif text-xl mb-2">Need more than activities?</h3>
          <p className="text-inkSoft text-sm max-w-md">
            We're building a Professional Services directory — vetted activity coaches, music and
            reminiscence therapists, and sensory design consultants for the care sector.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-4xl mx-auto px-5 sm:px-8 pb-16 sm:pb-24">
        <h2 className="font-serif text-2xl text-center mb-2">Simple, two-tier pricing</h2>
        <p className="text-inkSoft text-center mb-10">Choose Standard or Premium. Cancel anytime.</p>

        <div className="flex flex-col sm:flex-row items-start gap-6">

          {/* Standard */}
          <div className="flex-1 w-full flex flex-col rounded-2xl border-2 border-line bg-card p-6 sm:p-8 sm:mt-7">
            <p className="font-serif text-lg text-sageDeep mb-1">Standard</p>
            <p className="font-serif text-5xl text-ink mb-1">
              £18<span className="text-lg text-inkSoft">/month</span>
            </p>
            <p className="text-xs text-inkSoft mb-6">per account, billed monthly, cancel anytime</p>

            <p className="text-xs font-bold tracking-wide uppercase text-inkSoft mb-2">13 of 16 categories</p>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {STANDARD_CATEGORIES.map((c) => (
                <span key={c} className="rounded-full px-3 py-1.5 text-xs font-semibold bg-cardTint text-ink">
                  {c}
                </span>
              ))}
            </div>

            <Link
              href="/signup"
              className="mt-auto inline-block text-center rounded-xl bg-cardTint text-ink px-8 py-3 font-semibold hover:bg-line transition-colors"
            >
              Sign up
            </Link>
          </div>

          {/* Premium */}
          <div className="flex-1 w-full relative flex flex-col rounded-2xl border-[3px] border-clay bg-card p-6 sm:p-8 shadow-[0_18px_36px_-14px_rgba(176,137,104,0.4)]">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-clay px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Recommended for care homes
            </span>

            <p className="font-serif text-lg text-sageDeep mb-1 mt-1">Premium</p>
            <p className="font-serif text-5xl text-ink mb-1">
              £28<span className="text-lg text-inkSoft">/month</span>
            </p>
            <p className="text-xs text-inkSoft mb-2">per account, billed monthly, cancel anytime</p>
            <p className="inline-block w-fit text-xs font-bold rounded-lg px-2.5 py-1 mb-6" style={{ background: "#E4EEE2", color: "#6D8C6A" }}>
              Just £10/month more for the full experience
            </p>

            <p className="text-xs font-bold tracking-wide uppercase text-inkSoft mb-2">Everything a care home actually needs</p>
            <ul className="text-sm text-left space-y-2.5 mb-6">
              <li className="flex items-start gap-2">
                <Check size={16} className="text-sageDeep mt-0.5 shrink-0" />
                <span>
                  <b>Large Print (A3)</b> sheets on most activities — easier for residents with low vision. Not
                  every activity has a large print version.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-sageDeep mt-0.5 shrink-0" />
                <span>
                  The <b>Holidays &amp; Celebrations calendar</b> — nearly 60 dates a year already filled in
                  (Christmas, Halloween, Remembrance Sunday, Chinese New Year and more). Add your own events on
                  top and remove them any time, so it becomes your activity coordinator. Themed activities for
                  each date are being made and will be added soon.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-sageDeep mt-0.5 shrink-0" />
                <span>
                  <b>Play {PLAYABLE_CATEGORIES.size} of the {CATEGORIES.length} categories on screen</b> — the
                  puzzles and games, no printer needed for a spontaneous session
                </span>
              </li>
            </ul>

            <p className="text-xs font-bold tracking-wide uppercase text-inkSoft mb-2">All 16 categories</p>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {STANDARD_CATEGORIES.map((c) => (
                <span key={c} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "#E4EEE2", color: "#4C6B4A" }}>
                  {c}
                </span>
              ))}
              {PREMIUM_ONLY_CATEGORIES.map((c) => (
                <span
                  key={c}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold border"
                  style={{ background: "#FCEFE7", color: "#B5714A", borderColor: "#E9C4AA" }}
                >
                  + {c}
                </span>
              ))}
            </div>

            <Link
              href="/signup"
              className="mt-auto inline-block text-center rounded-xl bg-clay text-white px-8 py-3 font-semibold hover:opacity-90 transition-opacity"
            >
              Sign up
            </Link>
          </div>

        </div>
      </section>

      <footer className="border-t border-line py-8 px-5 sm:px-8 text-center text-xs text-inkSoft max-w-3xl mx-auto">
        <p>© {new Date().getFullYear()} Activity Central. Built for care home activity teams. <Link href="/support" className="underline hover:text-ink">Support</Link></p>
        <p className="mt-3 text-[11px] leading-relaxed">Titles, descriptions, and linked videos are generated to closely match each activity, but may occasionally be inaccurate or mismatched. Staff should always review an activity and any linked video before use, and use their professional judgement to ensure it is safe and appropriate for the residents taking part.</p>
      </footer>
    </main>
  );
}
