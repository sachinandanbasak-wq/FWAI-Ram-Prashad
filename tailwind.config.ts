import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Workspace (dark) surfaces
        page: "#0a0e17",
        panel: "#0f1523",
        panel2: "#131a2a",
        edge: "#1e2635",
        muted: "#94a3b8",
        accent: "#7c5cff",
        // Status language from the PRD: green on track, amber at risk,
        // red late/blocked, grey indication only.
        track: "#22c55e",
        risk: "#f59e0b",
        late: "#ef4444",
        indication: "#6b7280",
      },
    },
  },
  plugins: [],
};

export default config;
