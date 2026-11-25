import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Every public page, so Google knows what is on the site. Signed-in and admin pages are left out on purpose.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/pricing", priority: 0.8 },
    { path: "/signup", priority: 0.7 },
    { path: "/support", priority: 0.6 },
    { path: "/about", priority: 0.6 },
    { path: "/terms", priority: 0.3 },
    { path: "/privacy", priority: 0.3 },
    { path: "/cookies", priority: 0.3 },
  ];
  return pages.map((p) => ({ url: `${SITE_URL}${p.path}`, priority: p.priority }));
}
