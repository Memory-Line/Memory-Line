import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { getViewer } from "@/lib/viewer";
import { bslGroup, bslSign, bslSignsIn } from "@/lib/bslSigns";
import { bslTemplateIds } from "@/lib/bslData";
import SignEmbed from "@/components/SignEmbed";
import UpgradePrompt from "@/components/UpgradePrompt";

export const dynamic = "force-dynamic";

// One sign: its video (from SignBSL.com), a card to print, and previous / next within the group.
export default async function BslSignPage({ params }: { params: { group: string; sign: string } }) {
  const group = bslGroup(params.group);
  const sign = group ? bslSign(group.slug, params.sign) : undefined;
  if (!group || !sign) notFound();
  const viewer = await getViewer();
  const locked = !viewer.isPremium;
  const list = bslSignsIn(group.slug);
  const at = list.findIndex((s) => s.slug === sign.slug);
  const prev = at > 0 ? list[at - 1] : null;
  const next = at < list.length - 1 ? list[at + 1] : null;
  const templateId = (await bslTemplateIds()).get(sign.file.toLowerCase()) ?? null;

  return (
    <div className="max-w-[720px]">
      <Link href={`/dashboard/bsl-tools/${group.slug}`} className="text-xs text-inkSoft">
        ← {group.label}
      </Link>
      <h1 className="font-serif text-[30px] sm:text-[36px] mt-1 mb-4" style={{ color: group.color }}>
        {sign.title}
      </h1>
      {locked ? (
        <UpgradePrompt message="Watching the signs is part of the Premium plan." />
      ) : (
        <SignEmbed slug={sign.slug} title={sign.title} videos={sign.videos} />
      )}
      <div className="flex flex-wrap gap-3 mt-4">
        {templateId && !locked && (
          <a
            href={`/api/download/${templateId}?file=standard`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: "#E4EEE2", color: "#6D8C6A" }}
          >
            <Printer size={16} /> Print the card
          </a>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 mt-8">
        {prev ? (
          <Link href={`/dashboard/bsl-tools/${group.slug}/${prev.slug}`} className="flex items-center gap-1 rounded-lg bg-cardTint px-4 py-2 text-sm font-semibold">
            <ChevronLeft size={16} /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/dashboard/bsl-tools/${group.slug}/${next.slug}`} className="flex items-center gap-1 rounded-lg bg-cardTint px-4 py-2 text-sm font-semibold">
            {next.title} <ChevronRight size={16} />
          </Link>
        ) : (
          <span />
        )}
      </div>
      <p className="text-xs text-inkSoft mt-8 leading-relaxed">
        Sign videos are shown with thanks from SignBSL.com. Signs can differ between regions and between people, so check which sign the person
        prefers, and use the signer buttons to see another version.
      </p>
    </div>
  );
}
