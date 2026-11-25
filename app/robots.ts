import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Tells search engines what they may look at. The public pages are open; the signed-in area, the admin pages, the
// API and the private links sent by email are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/", "/login", "/forgot-password", "/reset-password", "/stop", "/unsubscribe", "/c/", "/f/", "/q/", "/professional-calendar", "/calendar", "/boards", "/sample-board"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
