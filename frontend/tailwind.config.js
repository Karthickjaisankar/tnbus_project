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
        alarm: "0 6px 24px rgba(220, 38, 38, 0.18), 0 2px 6px rgba(220, 38, 38, 0.12)",
        warn: "0 6px 24px rgba(234, 88, 12, 0.16), 0 2px 6px rgba(234, 88, 12, 0.10)",
      },
      keyframes: {
        "alarm-pulse": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(220, 38, 38, 0.6)" },
          "50%":      { transform: "scale(1.04)", boxShadow: "0 0 0 8px rgba(220, 38, 38, 0)" },
        },
        "soft-pulse": {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(234, 88, 12, 0.5)" },
          "50%":      { transform: "scale(1.03)", boxShadow: "0 0 0 6px rgba(234, 88, 12, 0)" },
        },
        // Whole-card siren glow — expanding ring of color + drop-shadow swell
        "siren-red": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(220, 38, 38, 0.55), 0 6px 20px rgba(220, 38, 38, 0.18)",
          },
          "50%": {
            boxShadow:
              "0 0 0 14px rgba(220, 38, 38, 0), 0 12px 38px rgba(220, 38, 38, 0.42)",
          },
        },
        "siren-orange": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(234, 88, 12, 0.45), 0 6px 20px rgba(234, 88, 12, 0.16)",
          },
          "50%": {
            boxShadow:
              "0 0 0 12px rgba(234, 88, 12, 0), 0 10px 32px rgba(234, 88, 12, 0.32)",
          },
        },
      },
      animation: {
        "alarm-pulse": "alarm-pulse 1.6s ease-in-out infinite",
        "soft-pulse":  "soft-pulse 2.4s ease-in-out infinite",
        "siren-red":    "siren-red 1.4s ease-in-out infinite",
        "siren-orange": "siren-orange 1.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
