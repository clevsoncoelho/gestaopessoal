import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        panel: "#171717",
        mint: "#e5e5e5",
        violet: "#a3a3a3",
        coral: "#f87171"
      },
      boxShadow: {
        glow: "0 0 70px rgba(255,255,255,.10)"
      }
    }
  },
  plugins: []
};

export default config;
