import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import TemplateList from "@/components/TemplateList";
import { subcategoriesFor, usesTopics, EARLIER } from "@/lib/subcategories";
import { completedIds, getViewer } from "@/lib/viewer";
import { PLAYABLE_CATEGORIES } from "@/lib/play";
import BingoCaller from "@/components/BingoCaller";
import { TOPIC_COLOURS, TILE_CATEGORIES } from "@/lib/tiles";
import CategoryHome from "@/components/CategoryHome";

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

// The line under the heading on a category's page. Categories not listed here keep the general line below.
const SUBTITLES: Record<string, string> = {
  Bingo: "Bingo cards and a built-in caller for fun, inclusive group games.",
  "Sing-Alongs": "Song words for much-loved classics, ready to print and sing together.",
  "Physical & Exercise": "Gentle seated and standing exercises to keep residents moving safely.",
};

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = await getCategoryBySlug(params.category);
  if (!category) notFound();

  // Categories split into sub-categories (e.g. Sudoku levels): pick one first.
  const viewer = await getViewer();
  const tracking = viewer.has("completion-tracking");

  const subcategories = subcategoriesFor(category.key);
  const topics = usesTopics(category.key);
  const counts = subcategories
    ? await prisma.template.groupBy({
        by: ["subcategory"],
        where: { category: category.key, occasion: null },
        _count: { _all: true },
      })
    : [];
  const countFor = (slug: string) => counts.find((c) => c.subcategory === slug)?._count._all ?? 0;
  // A category sorted into topics shows its plain list, as before, until something is in a topic.
  const showTiles = !!subcategories && (!topics || subcategories.some((s) => countFor(s.slug) > 0));
  if (subcategories && showTiles) {
    // Activities made before this category was sorted into topics (no sub-category yet).
    const earlierCount = topics ? counts.find((c) => c.subcategory === null)?._count._all ?? 0 : 0;
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
    // Everything starred in this category, from any topic or level, for the Favourites tab beside the tiles.
    const favTemplates = viewer.userId
      ? await prisma.template.findMany({
          where: { category: category.key, occasion: null, favourites: { some: { userId: viewer.userId } } },
          orderBy: { createdAt: "desc" },
        })
      : [];
    const favDone = tracking && favTemplates.length > 0 ? await completedIds(viewer.userId, favTemplates.map((t) => t.id)) : undefined;
    const tileGrid = (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {subcategories.map((s, i) => {
            // Topics with nothing in them yet are left out.
            if (topics && countFor(s.slug) === 0) return null;
            // Topics each get their own dashboard-style colour.
            const mix = topics ? TOPIC_COLOURS[i % TOPIC_COLOURS.length] : null;
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
          {earlierCount > 0 && (
            <Link
              href={`/dashboard/${category.slug}/${EARLIER.slug}`}
              className="rounded-xl p-4 border border-line"
              style={{ background: category.tint }}
            >
              <p className="font-serif text-lg" style={{ color: category.color }}>
                {EARLIER.label}
              </p>
              <p className="text-xs text-inkSoft mt-1">{EARLIER.description}</p>
              <p className="text-xs font-semibold mt-3">{earlierCount} activities</p>
            </Link>
          )}
        </div>
    );
    return (
      <div>
        <h1 className="font-serif text-[26px]">{category.key} Activities</h1>
        <p className="text-clay text-[13px] mt-0.5 mb-5">{topics ? "Choose a topic." : "Choose a level."}</p>
        {viewer.userId ? (
          <CategoryHome
            tilesLabel={topics ? "Topics" : "Levels"}
            count={favTemplates.length}
            tiles={tileGrid}
            favourites={
              <TemplateList
                templates={favTemplates}
                completedIds={favDone}
                playable={PLAYABLE_CATEGORIES.has(category.key)}
                isPremium={viewer.isPremium}
                tiles={TILE_CATEGORIES.has(category.key)}
                favouritesOnly
              />
            }
          />
        ) : (
          tileGrid
        )}
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
        {SUBTITLES[category.key] ?? `${realUploads.length} downloadable activities — choose from memory boxes, conversation prompts, photo collections, and more`}
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
          tiles={TILE_CATEGORIES.has(category.key)}
        />
      ) : (
        <p className="text-sm text-inkSoft rounded-xl p-4 bg-card border border-line">
          No activities here yet.
        </p>
      )}
    </div>
  );
}
