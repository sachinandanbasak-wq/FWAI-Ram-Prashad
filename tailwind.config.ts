import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        track: "#0f7b4f",
        risk: "#b45309",
        late: "#b91c1c",
        indication: "#6b7280",
      },
    },
  },
  plugins: [],
};

export default config;
