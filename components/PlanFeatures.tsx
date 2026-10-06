import { Check } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { PLAYABLE_CATEGORIES } from "@/lib/play";

// What each plan includes, written once and shown on both the home page and the
// pricing page so the two can't disagree. Matches what the site really does:
// Standard can browse and download the 13 non-Premium categories and use Shared
// files; Premium adds large print, the calendar and its tools, on-screen play
// and the three Premium-only categories (lib/plans.ts).

function Tick({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check size={16} className="text-sageDeep mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export function StandardFeatures() {
  return (
    <>
      <p className="text-xs font-bold tracking-wide uppercase text-inkSoft mb-2">What's included</p>
      <ul className="text-sm text-left space-y-2.5 mb-6">
        <Tick>
          <b>Ready-to-print activities</b>, with answer sheets where they apply
        </Tick>
        <Tick>
          Your own <b>account area</b> to manage your subscription, email choices and suggestions
        </Tick>
        <Tick>Help by email</Tick>
      </ul>
    </>
  );
}

export function PremiumFeatures() {
  return (
    <>
      <p className="text-xs font-bold tracking-wide uppercase text-inkSoft mb-2">Everything in Standard, plus</p>
      <ul className="text-sm text-left space-y-2.5 mb-6">
        <Tick>
          <b>Large Print (A3)</b> sheets on most activities — easier for residents with low vision. Not every activity
          has a large print version.
        </Tick>
        <Tick>
          The <b>Holidays &amp; Celebrations calendar</b> — nearly 60 dates a year already filled in (Christmas, Halloween,
          Remembrance Sunday, Chinese New Year and more). Add your own events and edit or remove them any time. Themed
          activities for each date are being made and will be added soon.
        </Tick>
        <Tick>
          <b>Print the calendar your way</b> — a whole month, or any week (up to 7 days) with bigger boxes and writing
          lines, on A4 or A3, plus a notes box with colours and bullet points
        </Tick>
        <Tick>
          <b>Share your calendar</b> — a link or QR code for your website, newsletter or noticeboard, so families can see
          what's coming up
        </Tick>
        <Tick>
          <b>Shared files and QR codes</b> — upload a menu, newsletter or room photos and get a link or QR code for your
          website or noticeboard. Up to 5 files on each link, and you can swap them without changing the link.
        </Tick>
        <Tick>
          <b>
            Play {PLAYABLE_CATEGORIES.size} of the {CATEGORIES.length} categories on screen
          </b>{" "}
          — the puzzles and games, no printer needed for a spontaneous session
        </Tick>
      </ul>
    </>
  );
}
