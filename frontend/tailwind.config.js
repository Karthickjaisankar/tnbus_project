/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#070b14",
          800: "#0d1322",
          700: "#141d33",
          600: "#1c2742",
          500: "#28344f",
        },
        accent: {
          cyan: "#22d3ee",
          orange: "#fb923c",
          rose: "#fb7185",
          amber: "#fbbf24",
          emerald: "#34d399",
          violet: "#a78bfa",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        glow: "0 0 24px rgba(34, 211, 238, 0.25)",
      },
    },
  },
  plugins: [],
};
