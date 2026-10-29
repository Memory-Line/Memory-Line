"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Back to the page the person came from.
export default function BackButton() {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.back()} className="shrink-0 flex items-center gap-1 rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold">
      <ChevronLeft size={16} /> Back
    </button>
  );
}
