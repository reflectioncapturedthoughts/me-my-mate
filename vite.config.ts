import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// MeMyMate — Vite config
// The dev server binds to 0.0.0.0 and accepts any host so it works behind
// preview proxies (e.g. https://{port}-{sandbox}.e2b.app) as well as locally.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
