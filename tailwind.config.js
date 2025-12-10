/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#FAFAF8",
          dark: "#0F1419",
        },
        card: {
          light: "#FFFFFF",
          dark: "#1A1F26",
        },
        primary: "#2ECC71",
        accent: "#FF6B6B",
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
