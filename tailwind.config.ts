import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        indigo: {
          DEFAULT: "#6366f1",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        violet: {
          DEFAULT: "#8b5cf6",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        emerald: {
          DEFAULT: "#10b981",
          400: "#34d399",
          500: "#10b981",
        },
        amber: {
          DEFAULT: "#f59e0b",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
        },
        rose: {
          DEFAULT: "#f43f5e",
          400: "#fb7185",
          500: "#f43f5e",
        },
        coral: "#f43f5e",
        mint: "#10b981",
        slate: {
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          900: "#0f172a",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(99,102,241,0.25)",
        "glow-emerald": "0 0 30px rgba(16,185,129,0.2)",
        "glow-violet": "0 0 40px rgba(139,92,246,0.25)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
