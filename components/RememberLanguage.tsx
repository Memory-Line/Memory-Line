"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const KEY = "cc-language";

// On a language page: remember it. On the main Communication Cards page: jump straight to the remembered language.
export default function RememberLanguage({ slug, jump }: { slug?: string; jump?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    try {
      if (slug) localStorage.setItem(KEY, slug);
      else if (jump) {
        const saved = localStorage.getItem(KEY);
        if (saved) router.replace(`/dashboard/communication-cards/${saved}`);
      }
    } catch {}
  }, [slug, jump, router]);
  return null;
}
