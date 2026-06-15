import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0b0b12",
          soft: "#15151f",
        },
        haze: "rgba(255,255,255,0.06)",
      },
      backgroundImage: {
        iridescent:
          "linear-gradient(120deg, #7aa6ff 0%, #b794ff 45%, #ff9ed2 100%)",
        "iridescent-soft":
          "linear-gradient(120deg, rgba(122,166,255,0.18) 0%, rgba(183,148,255,0.18) 50%, rgba(255,158,210,0.18) 100%)",
      },
      boxShadow: {
        soft: "0 20px 60px -20px rgba(20, 20, 40, 0.45)",
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 12px 40px -12px rgba(143,128,255,0.55)",
      },
      borderRadius: {
        xl2: "1.5rem",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
