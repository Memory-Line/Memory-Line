import Link from "next/link";
import { Lock } from "lucide-react";

// Shown to Standard accounts in place of something that's Premium-only
// (a category's action buttons, the calendar, online play). `compact` fits
// inline among a row's other buttons (TemplateList); the default is a
// stand-alone panel for a whole page or section.
export default function UpgradePrompt({
  message = "This is part of the Premium plan.",
  compact = false,
}: {
  message?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        href="/pricing"
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
        style={{ background: "#FCEFE7", color: "#B5714A" }}
      >
        <Lock size={14} /> Upgrade to Premium
      </Link>
    );
  }

  return (
    <div className="rounded-xl p-4 bg-card border border-line flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-inkSoft flex items-center gap-2">
        <Lock size={14} className="shrink-0" /> {message}
      </p>
      <Link
        href="/pricing"
        className="shrink-0 rounded-lg bg-sage text-white px-4 py-2 text-sm font-semibold hover:bg-sageDeep transition-colors whitespace-nowrap"
      >
        Upgrade to Premium
      </Link>
    </div>
  );
}
