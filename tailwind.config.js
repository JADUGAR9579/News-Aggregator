/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#b9d0ff",
          300: "#8cb0ff",
          400: "#5c88ff",
          500: "#3660ff",
          600: "#1f3fef",
          700: "#182fc4",
          800: "#18299b",
          900: "#19277a",
        },
        surface: {
          light: "#ffffff",
          dark: "#0f1115",
        },
        muted: {
          light: "#f4f5f7",
          dark: "#1a1d24",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: ["Merriweather", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 2px 10px rgba(15, 17, 21, 0.06)",
        "card-hover": "0 8px 24px rgba(15, 17, 21, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
