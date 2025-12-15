/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#f6f8f7",
          dark: "#050a07",
        },
        card: {
          light: "#FFFFFF",
          dark: "#1A1F26",
        },
        primary: "#36e27b",
        accent: "#FF6B6B",
        "glass-surface": "rgba(255, 255, 255, 0.03)",
        "glass-border": "rgba(255, 255, 255, 0.08)",
        "glass-highlight": "rgba(255, 255, 255, 0.1)",
        text: {
          primary: "#0F1419",
          secondary: "#6B7280",
          dark: "#FAFAF8",
        }
      },
      fontFamily: {
        display: ["Syne", "System"],
        body: ["Manrope", "System"],
        mono: ["SpaceMono", "JetBrains Mono", "System"],
      }
    },
  },
  plugins: [],
};
