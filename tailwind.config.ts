import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: {
          50: "#FAFAF9",
          100: "#F4F4F2",
          200: "#E7E6E2",
          300: "#D3D1CB",
          800: "#3A372F",
          900: "#211F1A"
        },
        caramel: {
          50: "#EFF6FA",
          100: "#DCEBF2",
          400: "#86AFC7",
          500: "#5B84A3",
          600: "#46697F"
        },
        sage: {
          100: "#E4EEDF",
          500: "#4F7942",
          600: "#3E5F34"
        },
        brick: {
          100: "#F4E1DD",
          500: "#B33A3A",
          600: "#932F2F"
        },
        slate2: {
          100: "#E9EEF3",
          500: "#4A6178",
          600: "#3A4E62"
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      borderRadius: {
        card: "10px"
      }
    }
  },
  plugins: []
};

export default config;
