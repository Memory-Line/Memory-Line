import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, SERVICES, TEMPLATES, categoryBySlug } from "@/lib/data";
import { Camera, Sparkles,Leaf, Music, Grid3x3, MessageCircle } from "lucide-react";

const ICONS: Record<string, any> = {
  Reminiscence: Camera,
    Seasonal: Leaf,
  "Music & Movement": Music,
  "Arts & Crafts": Grid3x3,
  "Conversation & Games": MessageCircle,
};

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const recentDownloads = await prisma.download.findMany({
    where: { userId },
    orderBy: { downloadedAt: "desc" },
    take: 3,
  });

  const firstName = (session!.user.name ?? session!.user.email ?? "there").split(" ")[0];
  const renewsAt = session!.user.subscriptionRenewsAt
    ? new Date(session!.user.subscriptionRenewsAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      })
    : null;

  // "Popular" is a static illustrative sample for the prototype stage —
  // swap for a real download-count aggregation once there's usage data.
  const popular = [
    TEMPLATES["Reminiscence"][0],
    TEMPLATES["Conversation & Games"][0],
    TEMPLATES["Music & Movement"][0],
    TEMPLATES["Sensory"][2],
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl">Welcome back, {firstName}</h1>
      <p className="text-clay text-sm mt-0.5">Your library of engagement templates is ready to use</p>

      <div className="flex items-center justify-between rounded-xl px-5 py-3 mt-5 bg-card border border-line">
        <div>
          <p className="text-sm font-bold text-sageDeep">✓ Subscription Active</p>
          <p className="text-xs text-inkSoft mt-0.5">
            {renewsAt ? `Renews ${renewsAt}` : "Active"} — all {Object.values(TEMPLATES).flat().length} templates available
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
              const Icon = ICONS[d.category] ?? Camera;
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

        <div className="rounded-xl p-4 bg-card border border-line">
          <p className="font-serif text-[15px] mb-2.5">Popular this month</p>
          <div className="grid grid-cols-2 gap-2">
            {popular.map((t) => {
              const cat = CATEGORIES.find((c) => c.key === t.category);
              const Icon = ICONS[t.category] ?? Camera;
              return (
                <div key={t.id} className="rounded-lg p-2.5" style={{ background: cat?.tint }}>
                  <Icon size={14} color={cat?.color} />
                  <p className="text-xs font-semibold mt-1.5">{t.title}</p>
                </div>
              );
            })}
          </div>
        </div>
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
