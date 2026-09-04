import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#E8871E",
        ink: {
          DEFAULT: "#18171F",
          950: "#18171F",
        },
        muted: "#6B6875",
        surface: {
          bg: "#FAF9F6",
          card: "#FFFFFF",
          border: "#E8E4DC",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(24,23,34,0.06)",
      },
      keyframes: {
        wave: {
          "0%": { height: "4px" },
          "100%": { height: "16px" },
        },
      },
      animation: {
        wave: "wave 0.9s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};

export default config;
