import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { bslGroup, bslSignsIn } from "@/lib/bslSigns";
import { bslFavouriteIds, bslTemplateIds, toItems } from "@/lib/bslData";
import BslList from "@/components/BslList";
import UpgradePrompt from "@/components/UpgradePrompt";

export const dynamic = "force-dynamic";

// One group of signs (for example Food and drink): every sign in it, with a search box.
export default async function BslGroupPage({ params }: { params: { group: string } }) {
  const group = bslGroup(params.group);
  if (!group) notFound();
  const viewer = await getViewer();
  const signs = bslSignsIn(group.slug);
  const items = toItems(signs, await bslTemplateIds());
  const ids = items.map((i) => i.templateId).filter((x): x is string => !!x);
  const favouriteIds = await bslFavouriteIds(viewer.userId, ids);
  const locked = !viewer.isPremium;

  return (
    <div>
      <Link href="/dashboard/bsl-tools" className="text-xs text-inkSoft">
        ← BSL Tools
      </Link>
      <h1 className="font-serif text-[26px] mt-1" style={{ color: group.color }}>
        {group.label}
      </h1>
      <p className="text-clay text-[13px] mt-0.5 mb-4">
        {group.description} · {signs.length} signs
      </p>
      {locked && (
        <div className="mb-4">
          <UpgradePrompt message="BSL Tools are part of the Premium plan." />
        </div>
      )}
      <BslList items={items} favouriteIds={favouriteIds} locked={locked} />
    </div>
  );
}
