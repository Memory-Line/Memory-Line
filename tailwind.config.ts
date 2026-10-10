import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // These read CSS variables (defaults in app/globals.css) so a seasonal look can
        // recolour the site; see lib/seasons.ts.
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        card: "rgb(var(--c-card) / <alpha-value>)",
        cardTint: "rgb(var(--c-cardTint) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        inkSoft: "rgb(var(--c-inkSoft) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        sage: "rgb(var(--c-sage) / <alpha-value>)",
        sageDeep: "rgb(var(--c-sageDeep) / <alpha-value>)",
        topbar: "rgb(var(--c-topbar) / <alpha-value>)",
        clay: "rgb(var(--c-clay) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["Lora", "serif"],
        sans: ["Work Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
