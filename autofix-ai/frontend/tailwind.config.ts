import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#121215",
          panel: "#18181d",
          card: "#1e1e24",
          border: "#2b2b36",
          hover: "#25252e",
        },
        accent: {
          yellow: "#eab308",
          red: "#ef4444",
          green: "#22c55e",
          blue: "#3b82f6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
