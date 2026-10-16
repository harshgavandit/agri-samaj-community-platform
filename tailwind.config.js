/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F0F4F8",
          100: "#D9E2EC",
          200: "#BCCCDC",
          300: "#9FB3C8",
          400: "#829AB1",
          500: "#627D98",
          600: "#486581",
          700: "#334E68",
          800: "#1E293B",
          900: "#0F172A",
          950: "#0A0F1D",
        },
        copper: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#D97706",
          600: "#B45309",
          700: "#92400E",
          800: "#78350F",
          900: "#451A03",
        },
        ivory: {
          50: "#FAF8F5",
          100: "#F4EFEA",
          200: "#EAE1D7",
          300: "#DCCEC0",
          DEFAULT: "#FAF8F5",
        },
        heritage: {
          green: "#047857",
          gold: "#C27803",
          navy: "#0F172A",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "var(--font-noto-devanagari)",
          "system-ui",
          "sans-serif",
        ],
        devanagari: ["var(--font-noto-devanagari)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
