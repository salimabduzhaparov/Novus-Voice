import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f1115",
        panel: "#171a21",
        edge: "#252a34",
        muted: "#8b93a3",
        accent: "#4f8cff",
        good: "#3fb98a",
        warn: "#e0a458",
        bad: "#e06c75",
      },
    },
  },
  plugins: [],
};

export default config;
