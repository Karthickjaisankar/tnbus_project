/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface scale for the light theme (keeping the `ink` name for
        // backward compatibility — values are now light, not dark).
        ink: {
          900: "#f8fafc", // page background
          800: "#ffffff", // cards / panels
          700: "#f1f5f9", // subtle backgrounds, hover
          600: "#e2e8f0", // borders, dividers
          500: "#cbd5e1", // strong dividers
        },
        // Accents — using Tailwind's *-600 family so they hit ~4.5:1
        // contrast on white (WCAG AA).
        accent: {
          cyan: "#0891b2",
          orange: "#ea580c",
          rose: "#e11d48",
          amber: "#d97706",
          emerald: "#059669",
          violet: "#7c3aed",
        },
        // Soft tints used for highlight backgrounds (cards, banners)
        tint: {
          cyan: "#ecfeff",
          orange: "#fff7ed",
          rose: "#fff1f2",
          amber: "#fffbeb",
          emerald: "#ecfdf5",
          violet: "#f5f3ff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
        cardHover: "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)",
        "ring-rose": "0 0 0 1px #e11d48, 0 4px 12px rgba(225, 29, 72, 0.12)",
      },
    },
  },
  plugins: [],
};
