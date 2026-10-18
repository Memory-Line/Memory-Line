import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import TemplateList from "@/components/TemplateList";
import { subcategoriesFor } from "@/lib/subcategories";
import { completedIds, getViewer } from "@/lib/viewer";
import { PLAYABLE_CATEGORIES } from "@/lib/play";
import BingoCaller from "@/components/BingoCaller";

export function generateStaticParams() {
  return [
    { category: "physical-exercise" },
    { category: "crosswords" },
    { category: "word-searches" },
    { category: "guess-the-word" },
    { category: "trivia" },
    { category: "bingo" },
    { category: "snakes-and-ladders" },
    { category: "remembrance-cards" },
    { category: "colouring-pages" },
    { category: "conversation-starters" },
    { category: "matching-pairs" },
    { category: "spot-the-difference" },
    { category: "sing-alongs" },
    { category: "bsl-tools" },
    { category: "sudoku" },
  ];
}

export const dynamic = "force-dynamic";

// Colours borrowed from the dashboard tiles, one per Newsletter topic.
const TOPIC_COLOURS = [
  { color: "#4A7FB5", tint: "#DCE7F2" },
  { color: "#C98B2E", tint: "#F5EBD2" },
  { color: "#2F7A63", tint: "#D6EBE3" },
  { color: "#B05F6C", tint: "#F1DEDE" },
  { color: "#8B6FB0", tint: "#E5DEEF" },
  { color: "#C97B5A", tint: "#EFDCCB" },
  { color: "#5B9AA0", tint: "#D9E7E6" },
  { color: "#7A9B5E", tint: "#E5EDDD" },
  { color: "#6E56A0", tint: "#E0D7EE" },
  { color: "#B5453D", tint: "#F3DAD8" },
];

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = await getCategoryBySlug(params.category);
  if (!category) notFound();

  // Categories split into sub-categories (e.g. Sudoku levels): pick one first.
  const viewer = await getViewer();
  const tracking = viewer.has("completion-tracking");

  const subcategories = subcategoriesFor(category.key);
  if (subcategories) {
    const counts = await prisma.template.groupBy({
      by: ["subcategory"],
      where: { category: category.key, occasion: null },
      _count: { _all: true },
    });
    const countFor = (slug: string) => counts.find((c) => c.subcategory === slug)?._count._all ?? 0;
    // With completion tracking, how many of each level this account has done.
    const doneCounts =
      tracking && viewer.userId
        ? await Promise.all(
            subcategories.map((s) =>
              prisma.completion.count({
                where: {
                  userId: viewer.userId,
                  template: { category: category.key, occasion: null, subcategory: s.slug },
                },
              })
            )
          )
        : null;
    return (
      <div>
        <h1 className="font-serif text-[26px]">{category.key} Activities</h1>
        <p className="text-clay text-[13px] mt-0.5 mb-5">{category.key === "Newsletters" ? "Choose a topic." : "Choose a level."}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {subcategories.map((s, i) => {
            // Newsletter topics each get their own dashboard-style colour.
            const mix = category.key === "Newsletters" ? TOPIC_COLOURS[i % TOPIC_COLOURS.length] : null;
            const tint = mix?.tint ?? category.tint;
            const color = mix?.color ?? category.color;
            return (
            <Link
              key={s.slug}
              href={`/dashboard/${category.slug}/${s.slug}`}
              className="ac-tile ac-tile-tall rounded-xl p-4 border border-line"
              style={{ background: tint }}
            >
              <p className="font-serif text-lg" style={{ color }}>
                {s.label}
              </p>
              <p className="text-xs text-inkSoft mt-1">{s.description}</p>
              <p className="text-xs font-semibold mt-3">
                {countFor(s.slug)} activities
                {doneCounts && (
                  <span style={{ color: "#2F7A63" }}> · {doneCounts[subcategories.indexOf(s)]} completed</span>
                )}
              </p>
            </Link>
            );
          })}
        </div>
      </div>
    );
  }

  const realUploads = await prisma.template.findMany({
    // Occasion-themed uploads live on their calendar event's page instead.
    where: { category: category.key, occasion: null },
    orderBy: { createdAt: "desc" },
  });

  const done = tracking ? await completedIds(viewer.userId, realUploads.map((t) => t.id)) : undefined;

  return (
    <div>
      <h1 className="font-serif text-[26px]">{category.key} Activities</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">
        {realUploads.length} downloadable activities — choose from memory boxes, conversation prompts, photo collections, and more
        {done && (
          <span className="ml-2 font-semibold" style={{ color: "#2F7A63" }}>
            · {done.length} of {realUploads.length} completed
          </span>
        )}
      </p>

      {/* Bingo: a caller for playing on the printed cards, above the cards. */}
      {category.key === "Bingo" && <BingoCaller />}

      {realUploads.length > 0 ? (
        <TemplateList
          templates={realUploads}
          completedIds={done}
          playable={PLAYABLE_CATEGORIES.has(category.key)}
          isPremium={viewer.isPremium}
        />
      ) : (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          No activities here yet.
        </p>
      )}
    </div>
  );
}
