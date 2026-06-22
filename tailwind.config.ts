import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F4C81",
          50: "#EAF2F9",
          100: "#CDE0F0",
          200: "#9BC1E1",
          300: "#69A2D2",
          400: "#3783C3",
          500: "#0F4C81",
          600: "#0C3D67",
          700: "#092E4D",
          800: "#061F34",
          900: "#03101A",
        },
        secondary: {
          DEFAULT: "#0097A7",
          50: "#E0F7FA",
          100: "#B2EBF2",
          200: "#80DEEA",
          300: "#4DD0E1",
          400: "#26C6DA",
          500: "#0097A7",
          600: "#00838F",
          700: "#006064",
        },
        accent: {
          DEFAULT: "#00BCD4",
          light: "#62EFFF",
          dark: "#008BA3",
        },
        success: "#10B981",
        ink: "#1F2937",
        surface: "#F8FAFC",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-poppins)", "var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(15, 76, 129, 0.08)",
        card: "0 8px 30px -6px rgba(15, 76, 129, 0.12)",
        elevated: "0 20px 50px -12px rgba(15, 76, 129, 0.22)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
