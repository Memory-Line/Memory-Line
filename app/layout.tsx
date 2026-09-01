import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Memory-Line — Engagement templates for care home staff",
  description:
    "A subscription library of dementia engagement templates for care home activity teams — reminiscence, sensory, music, arts & crafts, and conversation resources, ready to download.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:wght@500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-ink font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
