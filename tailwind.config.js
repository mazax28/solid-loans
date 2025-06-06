/** @type {import('tailwindcss').Config} */
const defaultConfig = require("shadcn/ui/tailwind.config")

module.exports = {
  ...defaultConfig,
  darkMode: "class",
  content: [...defaultConfig.content, "./pages/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    ...defaultConfig.theme,
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      ...defaultConfig.theme.extend,
      colors: {
        ...defaultConfig.theme.extend.colors,
        // Custom futuristic colors
        neon: {
          cyan: "#00ffff",
          purple: "#8b5cf6",
          pink: "#ec4899",
          green: "#10b981",
          orange: "#f59e0b",
        },
      },
      keyframes: {
        ...defaultConfig.theme.extend.keyframes,
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(34, 211, 238, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(34, 211, 238, 0.6)",
          },
        },
        "slide-in-from-right": {
          from: {
            transform: "translateX(100%)",
            opacity: "0",
          },
          to: {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
      },
      animation: {
        ...defaultConfig.theme.extend.animation,
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",
      },
      backgroundImage: {
        ...defaultConfig.theme.extend.backgroundImage,
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [...defaultConfig.plugins, require("tailwindcss-animate")],
}
