import type { MetadataRoute } from "next";

// What a browser or phone uses when someone adds Activity Central to their
// desktop, taskbar or home screen: the name, the icon and the colours.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Activity Central",
    short_name: "Activity Central",
    description: "Activities for care home teams",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F5F0E4",
    theme_color: "#F5F0E4",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
