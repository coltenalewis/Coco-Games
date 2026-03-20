import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coco: {
          brown: "#A0723A",
          cream: "#FFF3E4",
          accent: "#E8944A",
          dark: "#3D2B1A",
          light: "#FFFAF5",
          hover: "#C4813E",
          gold: "#F5B041",
          ember: "#D35400",
          coffee: "#6F4E37",
          midnight: "#1A0F08",
          warm: "#FDE8D0",
        },
      },
      backgroundImage: {
        "coco-gradient":
          "linear-gradient(135deg, #3D2B1A 0%, #6F4E37 40%, #A0723A 70%, #E8944A 100%)",
        "coco-hero":
          "linear-gradient(160deg, #1A0F08 0%, #3D2B1A 30%, #6F4E37 60%, #E8944A 100%)",
        "coco-card":
          "linear-gradient(145deg, #FFFAF5 0%, #FFF3E4 100%)",
        "coco-glow":
          "radial-gradient(circle at 50% 0%, rgba(232,148,74,0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        coco: "0 4px 20px rgba(160, 114, 58, 0.15)",
        "coco-lg": "0 8px 40px rgba(160, 114, 58, 0.2)",
        "coco-glow": "0 0 30px rgba(232, 148, 74, 0.3)",
        "coco-sharp": "4px 4px 0px #3D2B1A",
        "coco-sharp-sm": "2px 2px 0px #3D2B1A",
      },
      fontFamily: {
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
