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
          50: "#F0F6F2",
          100: "#E0ECE4",
          200: "#C1D6CA",
          300: "#9ABDAA",
          400: "#709B86",
          500: "#4F7E69",
          600: "#3B6554",
          700: "#2D5146",
          800: "#23483F",
          900: "#183E3B",
          950: "#102F2E",
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
