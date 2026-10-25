import Link from "next/link";
import { Armchair, HeartPulse, MessageCircle, Music, ShowerHead, Smile, TreePine, Utensils } from "lucide-react";
import { getViewer } from "@/lib/viewer";
import { BSL_GROUPS, BSL_SIGNS, bslSignsIn } from "@/lib/bslSigns";
import { bslFavouriteIds, bslTemplateIds, toItems } from "@/lib/bslData";
import BslList from "@/components/BslList";
import UpgradePrompt from "@/components/UpgradePrompt";

export const dynamic = "force-dynamic";

const ICONS = { food: Utensils, wash: ShowerHead, health: HeartPulse, comfort: Armchair, feelings: Smile, chat: MessageCircle, activities: Music, out: TreePine };

// BSL Tools: pick a group first, then a sign. (This static route takes over from /dashboard/[category].)
export default async function BslToolsPage() {
  const viewer = await getViewer();
  const byFile = await bslTemplateIds();
  const items = toItems(BSL_SIGNS, byFile);
  const ids = items.map((i) => i.templateId).filter((x): x is string => !!x);
  const favouriteIds = await bslFavouriteIds(viewer.userId, ids);
  const starred = items.filter((i) => i.templateId && favouriteIds.includes(i.templateId));
  const locked = !viewer.isPremium;

  return (
    <div>
      <h1 className="font-serif text-[26px]">BSL Tools</h1>
      <p className="text-clay text-[13px] mt-0.5 mb-5">Choose a group. Every sign has a video, and a card you can print.</p>
      {locked && (
        <div className="mb-5">
          <UpgradePrompt message="BSL Tools are part of the Premium plan." />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {BSL_GROUPS.map((g) => {
          const Icon = ICONS[g.icon];
          return (
            <Link
              key={g.slug}
              href={`/dashboard/bsl-tools/${g.slug}`}
              className="ac-tile ac-tile-tall rounded-xl p-4 text-white block"
              style={{ background: g.color }}
            >
              <Icon size={26} aria-hidden="true" />
              <p className="font-serif text-xl mt-2">{g.label}</p>
              <p className="text-sm mt-1 opacity-95">{g.description}</p>
              <p className="text-xs font-semibold mt-3">{bslSignsIn(g.slug).length} signs</p>
            </Link>
          );
        })}
      </div>
      {starred.length > 0 && !locked && (
        <section className="mt-8">
          <h2 className="font-serif text-[20px] mb-3">Your favourite signs</h2>
          <BslList items={starred} favouriteIds={favouriteIds} locked={false} showGroup searchable={false} />
        </section>
      )}
    </div>
  );
}
