import Link from "next/link";
import { categoryLabel } from "@/lib/data";
import Image from "next/image";
import { PlayCircle, CalendarDays, QrCode, Files, MessageSquareText, Play, Volume2, ALargeSmall, Printer } from "lucide-react";
import { StandardFeatures, PremiumFeatures } from "@/components/PlanFeatures";
import { getCategories } from "@/lib/categories";
import { customIcon, CATEGORY_ICONS as ICONS } from "@/lib/categoryIcons";
import { PLAYABLE_CATEGORIES } from "@/lib/play";
import { PREMIUM_ONLY_CATEGORIES as PREMIUM_ONLY_CATEGORIES_SET } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { COMING_SOON } from "@/lib/launch";
import { displayTitle } from "@/lib/titles";
import { unstable_cache } from "next/cache";

// The free samples come from the database, but they change rarely (only
// when a new category's first upload changes), so the page is cached and
// rebuilt at most every 10 minutes rather than hitting the database on
// every single visit — the main thing making the homepage feel slow.
export const revalidate = 600;

// One free sample per category, offered on the homepage before sign-up:
// the first activity (lowest number) in each of these categories. Every
// category gets one, so people can see exactly what they'd be getting
// across the whole library, not just a handful of categories.

// Same source of truth the site's own Standard/Premium gating uses
// (lib/plans.ts), so the pricing section can never drift out of sync with
// what Standard accounts actually get.

const SAMPLE_LINK =
  "flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold";


async function findFreeSamples(categories: string[]) {
  const sampleFor = (category: string) =>
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
    });
  let found: Awaited<ReturnType<typeof sampleFor>>[] = [];
  for (let i = 0; i < categories.length; i += 4) {
    found = found.concat(await Promise.all(categories.slice(i, i + 4).map(sampleFor)));
  }
  return found.filter((t): t is NonNullable<typeof t> => t !== null);
}

const keptSamples = unstable_cache(findFreeSamples, ["home-free-samples"], { revalidate: 600 });

export default async function LandingPage() {
  // The categories come from the database (so ones made or removed on the admin page show here
  // within a few minutes, see revalidate above); the Premium-only list is lib/plans.ts.
  const categories = await getCategories();
  const FREE_SAMPLE_CATEGORIES = categories.map((c) => c.key);
  const PREMIUM_ONLY_CATEGORIES = categories.map((c) => c.key).filter((k) => PREMIUM_ONLY_CATEGORIES_SET.has(k));
  const STANDARD_CATEGORIES = categories.map((c) => c.key).filter((k) => !PREMIUM_ONLY_CATEGORIES_SET.has(k));
  // The samples are looked up once and kept for ten minutes (the whole site is built fresh on every visit, so
  // without this each visitor made the database answer seventeen questions). If the database is busy or
  // refusing connections the page still opens, without samples, and nothing is kept.
  let freeSamples: Awaited<ReturnType<typeof findFreeSamples>> = [];
  try {
    freeSamples = await keptSamples(FREE_SAMPLE_CATEGORIES);
  } catch (err) {
    console.error("Home page samples could not be loaded:", err);
  }

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
          <Link href="/support" className="hidden sm:inline text-inkSoft hover:text-ink">Support</Link>
          <Link href="/login" className="whitespace-nowrap text-inkSoft hover:text-ink">Log in</Link>
          {!COMING_SOON && (
            <Link
              href="/signup"
              className="whitespace-nowrap rounded-lg bg-sage text-white px-3 sm:px-4 py-2 font-semibold hover:bg-sageDeep transition-colors"
            >
              Sign up
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-8 sm:pt-16 pb-14 sm:pb-20 text-center">
        {COMING_SOON && (
          <p className="inline-block rounded-full bg-cardTint text-sageDeep font-semibold text-sm px-4 py-1.5 mb-5">Opening soon</p>
        )}
        <p className="text-clay font-semibold text-sm tracking-wide uppercase mb-4">
          For care home activity teams
        </p>
        <h1 className="font-serif text-[34px] sm:text-5xl leading-tight text-ink mb-5 sm:mb-6">
          A ready-made library of engagement activities for care homes
        </h1>
        <p className="text-inkSoft text-base sm:text-lg max-w-2xl mx-auto mb-8 sm:mb-9">
          Ready-to-run downloadable activities across physical &amp; exercise, word puzzles, trivia
          and games, colouring, communication tools, and more — built for carers who need
          something meaningful ready to run in minutes, not hours.
        </p>
        {COMING_SOON ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <a href="#samples" className="rounded-xl bg-sage text-white px-6 py-3 font-semibold hover:bg-sageDeep transition-colors">
              Try the free samples
            </a>
            <a href="#pricing" className="rounded-xl border border-line px-6 py-3 font-semibold text-ink hover:bg-card transition-colors">
              See pricing
            </a>
            <Link href="/login" className="rounded-xl border border-line px-6 py-3 font-semibold text-ink hover:bg-card transition-colors">
              Members: log in
            </Link>
          </div>
        ) : (
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
        )}
        <p className="text-xs text-inkSoft mt-4">
          {COMING_SOON ? "We're opening to new members soon. Try samples from every category free, no card or signup needed." : "Try samples from every category free, no card or signup needed."}
        </p>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20">
        <h2 className="font-serif text-2xl text-center mb-2">{categories.length} categories, every session covered</h2>
        <p className="text-inkSoft text-center mb-10">
          Every activity is a ready-to-print sheet, and the puzzles and games can be played on screen too.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((c) => {
            const Icon = ICONS[c.key] ?? customIcon(c.icon);
            return (
              <div
                key={c.key}
                className="rounded-2xl p-4 sm:p-5 text-center border border-line bg-card"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: c.color }}
                >
                  <Icon size={24} color="#fff" aria-hidden="true" />
                </div>
                <p className="font-semibold text-sm">{categoryLabel(c.key)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tools beyond the library */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20">
        <h2 className="font-serif text-2xl text-center mb-2">More than a library</h2>
        <p className="text-inkSoft text-center mb-10">Tools that make planning, printing and sharing easier.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              Icon: CalendarDays,
              colour: "#4A7FB5",
              title: "Holidays & Celebrations calendar",
              plan: "Premium",
              text: "Nearly 60 dates a year already filled in. Add your own events, then print a whole month or any week on A4 or A3, with a notes box and space to write.",
            },
            {
              Icon: QrCode,
              colour: "#2F7A63",
              title: "Share your calendar",
              plan: "Premium",
              text: "Get a link or QR code for your website, newsletter or noticeboard, so families can see what's coming up.",
            },
            {
              Icon: Files,
              colour: "#C98B2E",
              title: "Shared files",
              plan: "Premium",
              text: "Upload your menu, newsletter or room photos and get a link or QR code. Swap in next week's menu and the link stays the same.",
            },
            {
              Icon: MessageSquareText,
              colour: "#B5453D",
              title: "Talking communication boards",
              plan: "Premium",
              text: "Tap an answer and it is read aloud, in 24 languages, so residents and carers can understand each other.",
            },
            {
              Icon: Play,
              colour: "#7A9B5E",
              title: "Play online",
              plan: "Premium",
              text: "Puzzles and games on screen, so you can run a spontaneous session with no printer needed.",
            },
            {
              Icon: Volume2,
              colour: "#B05F6C",
              title: "Bingo caller",
              plan: "Every plan",
              text: "Reads each number aloud, and can say it in other languages too.",
            },
            {
              Icon: ALargeSmall,
              colour: "#E0A82E",
              dark: true,
              title: "Dementia friendly view",
              plan: "Every plan",
              text: "One switch turns the site into big yellow boxes with black writing, easier to see and use.",
            },
            {
              Icon: Printer,
              colour: "#6E56A0",
              title: "Print several at once",
              plan: "Every plan",
              text: "Tick up to 50 sheets and print them together in one go, or print any single sheet with one button.",
            },
          ].map(({ Icon, colour, dark, title, plan, text }) => (
            <div key={title} className="rounded-2xl border border-line bg-card p-5 sm:p-6">
              <div className="w-11 h-11 rounded-full flex items-center justify-center mb-3" style={{ background: colour }}>
                <Icon size={22} color={dark ? "#2C2C2A" : "#fff"} aria-hidden="true" />
              </div>
              <p className="text-clay font-semibold text-[11px] tracking-wide uppercase mb-1">{plan}</p>
              <h3 className="font-serif text-lg mb-1.5">{title}</h3>
              <p className="text-inkSoft text-sm">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Free samples (hidden if none of their categories has uploads yet) */}
      {freeSamples.length > 0 && (
      <section id="samples" className="max-w-5xl mx-auto px-5 sm:px-8 pb-14 sm:pb-20">
        <h2 className="font-serif text-2xl text-center mb-2">Try a few, free — no signup needed</h2>
        <p className="text-inkSoft text-center mb-10">A small taste of the library, ready to download right now.</p>
        <div className="flex flex-wrap justify-center gap-4">
          {freeSamples.map((t) => {
            const cat = categories.find((c) => c.key === t.category);
            const Icon = ICONS[t.category] ?? customIcon(cat?.icon);
            return (
              <div
                key={t.id}
                className="w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] rounded-2xl p-5 border-2 flex flex-col justify-between"
                style={{ background: cat?.tint ?? "#F5F1EA", borderColor: cat?.color ?? "#E5DFD3" }}
              >
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-bold mb-2" style={{ color: "#1F2A2E" }}>
                    {Icon && <Icon size={14} />} {categoryLabel(t.category)}
                  </p>
                  <p className="font-serif text-base">{displayTitle(t)}</p>
                </div>
                <div className="mt-4 grid gap-2">
                  {PLAYABLE_CATEGORIES.has(t.category) && (
                    <Link href={`/play/${t.id}`} className={SAMPLE_LINK} style={{ background: cat?.color ?? "#2F7A63", color: "#FFFFFF" }}>
                      <PlayCircle size={15} className="mr-1.5" /> Play online, free
                    </Link>
                  )}
                  <a href={t.fileUrl} target="_blank" rel="noopener noreferrer" className={SAMPLE_LINK} style={{ background: "#FFFFFF", color: "#1F2A2E", border: `2px solid ${cat?.color ?? "#6D8C6A"}` }}>
                    Download free sample
                  </a>
                  {t.largePrintFileUrl && (
                    <a href={t.largePrintFileUrl} target="_blank" rel="noopener noreferrer" className={SAMPLE_LINK} style={{ background: "#FFFFFF", color: "#1F2A2E", border: `2px solid ${cat?.color ?? "#6D8C6A"}` }}>
                      Large Print
                    </a>
                  )}
                  {t.answerFileUrl && (
                    <a href={t.answerFileUrl} target="_blank" rel="noopener noreferrer" className={SAMPLE_LINK} style={{ background: "#FFFFFF", color: "#1F2A2E", border: `2px solid ${cat?.color ?? "#6D8C6A"}` }}>
                      Answers
                    </a>
                  )}
                  {t.videoUrl && (
                    <a href={t.videoUrl} target="_blank" rel="noopener noreferrer" className={SAMPLE_LINK} style={{ background: "#FFFFFF", color: "#1F2A2E", border: `2px solid ${cat?.color ?? "#6D8C6A"}` }}>
                      {/youtube\.com|youtu\.be/.test(t.videoUrl) ? "Watch on YouTube" : "Watch sign video"}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          <div
            className="w-full sm:w-[calc(50%-0.5rem)] md:w-[calc(33.333%-0.75rem)] rounded-2xl p-5 border-2 flex flex-col justify-between"
            style={{ background: "#E4EEE2", borderColor: "#6D8C6A" }}
          >
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold mb-2" style={{ color: "#1F2A2E" }}>
                <MessageSquareText size={14} /> Communication Boards
              </p>
              <p className="font-serif text-base">A talking board: tap an answer and it is read aloud</p>
            </div>
            <div className="mt-4 grid gap-2">
              <Link href="/sample-board" className={SAMPLE_LINK} style={{ background: "#2F7A63", color: "#FFFFFF" }}>
                <PlayCircle size={15} className="mr-1.5" /> Try a board, free
              </Link>
            </div>
          </div>
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

      {true && (
        <>
        {/* Pricing (shown while sign-ups are closed too; the Sign up buttons become "Opening soon") */}
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

              <StandardFeatures />

              <p className="text-xs font-bold tracking-wide uppercase text-inkSoft mb-2">{STANDARD_CATEGORIES.length} of {categories.length} categories</p>
              <div className="flex flex-wrap gap-1.5 mb-8">
                {STANDARD_CATEGORIES.map((c) => (
                  <span key={c} className="rounded-full px-3 py-1.5 text-xs font-semibold bg-cardTint text-ink">
                    {categoryLabel(c)}
                  </span>
                ))}
              </div>

              {COMING_SOON ? (
                <p className="mt-auto text-center rounded-xl bg-cardTint text-sageDeep px-8 py-3 font-semibold">Opening soon</p>
              ) : (
              <Link
                href="/signup"
                className="mt-auto inline-block text-center rounded-xl bg-cardTint text-ink px-8 py-3 font-semibold hover:bg-line transition-colors"
              >
                Sign up
              </Link>
              )}
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

              <PremiumFeatures total={categories.length} />

              <p className="text-xs font-bold tracking-wide uppercase text-inkSoft mb-2">All {categories.length} categories</p>
              <div className="flex flex-wrap gap-1.5 mb-8">
                {STANDARD_CATEGORIES.map((c) => (
                  <span key={c} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "#E4EEE2", color: "#4C6B4A" }}>
                    {categoryLabel(c)}
                  </span>
                ))}
                {PREMIUM_ONLY_CATEGORIES.map((c) => (
                  <span
                    key={c}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold border"
                    style={{ background: "#FCEFE7", color: "#B5714A", borderColor: "#E9C4AA" }}
                  >
                    + {categoryLabel(c)}
                  </span>
                ))}
              </div>

              {COMING_SOON ? (
                <p className="mt-auto text-center rounded-xl bg-clay text-white px-8 py-3 font-semibold">Opening soon</p>
              ) : (
              <Link
                href="/signup"
                className="mt-auto inline-block text-center rounded-xl bg-clay text-white px-8 py-3 font-semibold hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
              )}
            </div>

          </div>
        </section>
        </>
      )}

      <footer className="border-t border-line py-8 px-5 sm:px-8 text-center text-xs text-inkSoft max-w-3xl mx-auto">
        <p>© {new Date().getFullYear()} Activity Central. Built for care home activity teams. <Link href="/support" className="underline hover:text-ink">Support</Link></p>
        <p className="mt-3 text-[11px] leading-relaxed">Titles, descriptions, and linked videos are generated to closely match each activity, but may occasionally be inaccurate or mismatched. Staff should always review an activity and any linked video before use, and use their professional judgement to ensure it is safe and appropriate for the residents taking part.</p>
        <p className="mt-3 text-[11px]">Activity Central Ltd · Registered in England and Wales, company number 17510590 · 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ</p>
        <p className="mt-4 flex items-center justify-center gap-2">
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link href="/cookies" className="hover:text-ink">Cookies</Link>
        </p>
      </footer>
    </main>
  );
}
