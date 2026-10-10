import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#081610",
        deep: "#0d2017",
        paper: "#edf1df",
        volt: "#c7ff91",
        mint: "#7de6ab",
        ember: "#e6a97f",
      },
    },
  },
  plugins: [],
};
export default config;
