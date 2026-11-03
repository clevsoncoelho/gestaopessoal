import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090d18",
        panel: "#111827",
        mint: "#8df5c5",
        violet: "#a78bfa",
        coral: "#ff8f8f"
      },
      boxShadow: {
        glow: "0 0 70px rgba(141,245,197,.13)"
      }
    }
  },
  plugins: []
};

export default config;
