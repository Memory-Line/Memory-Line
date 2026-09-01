import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F0E4",
        card: "#FFFFFF",
        cardTint: "#F1E9D8",
        ink: "#2E2B24",
        inkSoft: "#8A8371",
        line: "#E6DDC8",
        sage: "#8BA888",
        sageDeep: "#6D8C6A",
        topbar: "#1F1D19",
        clay: "#B08968",
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
