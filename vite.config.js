import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Accept the classic CRA-style REACT_APP_* variable names (and VITE_* too).
  build: { chunkSizeWarningLimit: 1000 },
  envPrefix: ["REACT_APP_", "VITE_"],
});
