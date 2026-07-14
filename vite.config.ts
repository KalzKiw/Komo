import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const demoMode =
  process.env.VITE_DEMO_MODE ?? (process.env.VERCEL ? "true" : "false");

// https://vite.dev/config/
export default defineConfig({
  root: "client",
  envDir: "..",
  define: {
    "import.meta.env.VITE_DEMO_MODE": JSON.stringify(demoMode),
  },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../client-dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.PORT ?? "3001"}`,
        changeOrigin: true,
      },
    },
  },
});
