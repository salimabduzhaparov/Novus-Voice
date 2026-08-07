import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#F2F5FA",
          200: "#A9B4C9",
          300: "#75829C",
          400: "#55617B",
          500: "#38445C",
          600: "#26324A",
          700: "#1B2536",
          800: "#16223A",
          850: "#111A2C",
          900: "#0C1220",
          950: "#070B14",
        },
        arc: {
          100: "#E4F0FF",
          200: "#C4DFFF",
          300: "#97C4FF",
          400: "#6FAEFF",
          500: "#4191F4",
          600: "#2D77DB",
          700: "#1F5CB5",
        },
        navy: {
          400: "#3B66B8",
          500: "#2E529B",
          600: "#24417E",
          700: "#1B3263",
          800: "#14264C",
          900: "#0E1B38",
        },
        good: { 300: "#7BE3B1", 400: "#3DD68C" },
        warn: { 300: "#F7BE6D", 400: "#F2A33C" },
        bad: { 300: "#F9A79F", 400: "#F2655C", 600: "#D33F42", 700: "#C93A3E" },
        viz: {
          green: "#07AC6C",
          "green-400": "#2FBD7C",
          "green-300": "#7BE3B1",
          amber: "#BF8305",
          "amber-400": "#D99C33",
          "amber-300": "#EFC26D",
          teal: "#08A798",
          "teal-400": "#29B3A4",
          "teal-300": "#6ED9CC",
          violet: "#8F7FE5",
          "violet-400": "#9C8CF4",
          "violet-300": "#C0B5FA",
          rose: "#D56691",
          other: "#55617B",
          none: "#38445C",
        },
        edge: {
          faint: "rgba(199,214,240,0.07)",
          DEFAULT: "rgba(199,214,240,0.10)",
          strong: "rgba(199,214,240,0.16)",
        },
      },
      borderRadius: {
        sm: "6px",
        lg: "8px",
        md: "10px",
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        overlay:
          "0 16px 40px -12px rgba(2,6,16,0.75), 0 4px 16px -4px rgba(2,6,16,0.5)",
        "focus-orbit":
          "0 0 0 2px #070B14, 0 0 0 4px #6FAEFF, 0 0 0 8px rgba(111,174,255,0.18)",
        sheen: "inset 0 1px 0 rgba(255,255,255,0.22)",
        "edge-glow": "inset 0 1px 0 rgba(199,214,240,0.05)",
      },
      backgroundImage: {
        meridian:
          "linear-gradient(135deg,#1B3263 0%,#2E529B 45%,#6FAEFF 100%)",
        horizon:
          "linear-gradient(90deg,rgba(65,145,244,0) 0%,rgba(65,145,244,0.45) 50%,rgba(65,145,244,0) 100%)",
      },
      fontSize: {
        "page-title": [
          "1.375rem",
          { lineHeight: "1.75rem", letterSpacing: "-0.015em", fontWeight: "600" },
        ],
        section: [
          "1rem",
          { lineHeight: "1.5rem", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        overline: [
          "0.6875rem",
          { lineHeight: "1rem", letterSpacing: "0.08em", fontWeight: "600" },
        ],
        "card-title": [
          "0.8125rem",
          { lineHeight: "1.25rem", letterSpacing: "0.01em", fontWeight: "500" },
        ],
        body: ["0.875rem", { lineHeight: "1.25rem" }],
        caption: [
          "0.75rem",
          { lineHeight: "1rem", letterSpacing: "0.01em" },
        ],
        stat: [
          "1.875rem",
          { lineHeight: "2.25rem", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "stat-hero": [
          "3rem",
          { lineHeight: "3.25rem", letterSpacing: "-0.025em", fontWeight: "650" },
        ],
        num: ["0.8125rem", { lineHeight: "1.25rem", fontWeight: "450" }],
      },
    },
  },
  plugins: [],
};

export default config;
