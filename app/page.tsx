import Link from "next/link";
import { Camera, Sparkles, Music, Grid3x3, MessageCircle, Flower2, Check } from "lucide-react";
import { CATEGORIES, ALL_TEMPLATES } from "@/lib/data";

const ICONS: Record<string, any> = {
  Reminiscence: Camera,
  Sensory: Sparkles,
  "Music & Movement": Music,
  "Arts & Crafts": Grid3x3,
  "Conversation & Games": MessageCircle,
};

export default function LandingPage() {
  return (
    <main>
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Flower2 size={22} className="text-sageDeep" />
          <span className="font-serif text-xl">Memory-Line</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <a href="#pricing" className="text-inkSoft hover:text-ink">Pricing</a>
          <Link href="/login" className="text-inkSoft hover:text-ink">Log in</Link>
          <Link
            href="/signup"
            className="rounded-lg bg-sage text-white px-4 py-2 font-semibold hover:bg-sageDeep transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-16 pb-20 text-center">
        <p className="text-clay font-semibold text-sm tracking-wide uppercase mb-4">
          For care home activity teams
        </p>
        <h1 className="font-serif text-5xl leading-tight text-ink mb-6">
          A ready-made library of dementia engagement activities
        </h1>
        <p className="text-inkSoft text-lg max-w-2xl mx-auto mb-9">
          {ALL_TEMPLATES.length}+ downloadable templates across reminiscence, sensory, music,
          arts & crafts, and conversation — built for carers who need something meaningful ready
          to run in minutes, not hours.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-sage text-white px-6 py-3 font-semibold hover:bg-sageDeep transition-colors"
          >
            Start your free trial
          </Link>
          <a
            href="#pricing"
            className="rounded-xl border border-line px-6 py-3 font-semibold text-ink hover:bg-card transition-colors"
          >
            See pricing
          </a>
        </div>
        <p className="text-xs text-inkSoft mt-4">No card required to browse the library preview.</p>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <h2 className="font-serif text-2xl text-center mb-2">Five categories, every session covered</h2>
        <p className="text-inkSoft text-center mb-10">
          Each template includes step-by-step facilitator notes, duration, and group size.
        </p>
        <div className="grid grid-cols-5 gap-4">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.key];
            return (
              <div
                key={c.key}
                className="rounded-2xl p-5 text-center border border-line bg-card"
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

      {/* Services teaser */}
      <section className="max-w-5xl mx-auto px-8 pb-20">
        <div className="rounded-2xl border border-line bg-card p-8 flex items-center justify-between gap-8">
          <div>
            <h3 className="font-serif text-xl mb-2">Need more than templates?</h3>
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
      <section id="pricing" className="max-w-3xl mx-auto px-8 pb-24">
        <h2 className="font-serif text-2xl text-center mb-2">Simple, single-tier pricing</h2>
        <p className="text-inkSoft text-center mb-10">One subscription. Every template. Cancel anytime.</p>

        <div className="rounded-2xl border-2 border-sage bg-card p-8 text-center">
          <p className="font-serif text-lg text-sageDeep mb-1">Memory-Line Membership</p>
          <p className="font-serif text-5xl text-ink mb-1">£29<span className="text-lg text-inkSoft">/month</span></p>
          <p className="text-xs text-inkSoft mb-6">per care home, billed monthly, cancel anytime</p>

          <ul className="text-sm text-left max-w-xs mx-auto space-y-2.5 mb-8">
            {[
              `Unlimited access to all ${ALL_TEMPLATES.length}+ templates`,
              "New templates added monthly",
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

      <footer className="border-t border-line py-8 text-center text-xs text-inkSoft">
        © {new Date().getFullYear()} Memory-Line. Built for care home activity teams.
      </footer>
    </main>
  );
}
