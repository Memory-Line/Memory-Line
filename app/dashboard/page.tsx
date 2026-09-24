import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, SERVICES } from "@/lib/data";
import {
  Footprints, Grid3x3, Search, HelpCircle, Brain, Hash, Dices, Heart,
  Palette, MessageCircle, Copy, Eye, Music, Languages, Hand,
} from "lucide-react";

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
};

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const recentDownloads = await prisma.download.findMany({
    where: { userId },
    orderBy: { downloadedAt: "desc" },
    take: 3,
  });

  const activityCount = await prisma.template.count({ where: { occasion: null } });

  const firstName = (session!.user.name ?? session!.user.email ?? "there").split(" ")[0];
  const renewsAt = session!.user.subscriptionRenewsAt
    ? new Date(session!.user.subscriptionRenewsAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      })
    : null;

  // The four most-downloaded activities this calendar month, across all
  // users (hidden until there have been downloads this month). Downloads
  // of the old sample activities, which no longer exist, are skipped.
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const topDownloads = await prisma.download.groupBy({
    by: ["templateId", "templateName", "category"],
    where: { downloadedAt: { gte: monthStart } },
    _count: { _all: true },
    orderBy: { _count: { templateId: "desc" } },
    take: 10,
  });
  const stillThere = new Set(
    (
      await prisma.template.findMany({
        where: { id: { in: topDownloads.map((d) => d.templateId) } },
        select: { id: true },
      })
    ).map((t) => t.id)
  );
  const popular = topDownloads
    .filter((d) => stillThere.has(d.templateId))
    .slice(0, 4)
    .map((d) => ({ id: d.templateId, title: d.templateName, category: d.category }));

  return (
    <div>
      <h1 className="font-serif text-3xl">Welcome back, {firstName}</h1>
      <p className="text-clay text-sm mt-0.5">Your library of engagement activities is ready to use</p>

      <div className="flex items-center justify-between rounded-xl px-5 py-3 mt-5 bg-card border border-line">
        <div>
          <p className="text-sm font-bold text-sageDeep">✓ Subscription Active</p>
          <p className="text-xs text-inkSoft mt-0.5">
            {renewsAt ? `Renews ${renewsAt}` : "Active"} — all {activityCount.toLocaleString("en-GB")} activities available
          </p>
        </div>
        <form action="/api/stripe/portal" method="POST">
          <button
            formAction="/api/stripe/portal"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-cardTint hover:bg-line transition-colors"
          >
            Manage subscription
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-5">
        <div className="rounded-xl p-4 bg-card border border-line">
          <p className="font-serif text-[15px] mb-2.5">Recently downloaded</p>
          <div className="space-y-2">
            {recentDownloads.length === 0 && (
              <p className="text-xs text-inkSoft">Nothing downloaded yet — browse a category to get started.</p>
            )}
            {recentDownloads.map((d) => {
              const cat = CATEGORIES.find((c) => c.key === d.category);
              const Icon = ICONS[d.category] ?? Footprints;
              return (
                <div key={d.id} className="flex items-center gap-3 rounded-lg p-2 bg-bg">
                  <div
                    className="rounded-md flex items-center justify-center shrink-0"
                    style={{ width: 30, height: 30, background: cat?.tint }}
                  >
                    <Icon size={14} color={cat?.color} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">{d.templateName}</p>
                    <p className="text-[11px] text-inkSoft">Downloaded · {d.category}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {popular.length > 0 && (
        <div className="rounded-xl p-4 bg-card border border-line">
          <p className="font-serif text-[15px] mb-2.5">Popular this month</p>
          <div className="grid grid-cols-2 gap-2">
            {popular.map((t) => {
              const cat = CATEGORIES.find((c) => c.key === t.category);
              const Icon = ICONS[t.category] ?? Footprints;
              return (
                <div key={t.id} className="rounded-lg p-2.5" style={{ background: cat?.tint }}>
                  <Icon size={14} color={cat?.color} />
                  <p className="text-xs font-semibold mt-1.5">{t.title}</p>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </div>

      <div className="rounded-xl p-4 mt-5 bg-card border border-line">
        <p className="font-serif text-[15px] mb-2.5">Browse by category</p>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.key];
            return (
              <Link
                key={c.slug}
                href={`/dashboard/${c.slug}`}
                className="flex items-center gap-2 rounded-lg p-3"
                style={{ background: c.tint }}
              >
                <Icon size={16} color={c.color} />
                <span className="text-sm font-semibold">{c.key}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl p-4 mt-5 bg-card border border-line">
        <div className="flex items-center justify-between mb-3">
          <p className="font-serif text-[15px]">Professional Services — Featured</p>
          <Link href="/dashboard/services" className="text-xs font-semibold text-sageDeep">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.slice(0, 4).map((s) => (
            <div key={s.name} className="rounded-lg p-3 bg-bg">
              <p className="text-[13px] font-bold">{s.name}</p>
              <p className="text-[11px] text-sageDeep">{s.tag}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
