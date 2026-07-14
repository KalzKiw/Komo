import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// En Vercel, activar demo por defecto si no hay VITE_DEMO_MODE explícito.
if (!process.env.VITE_DEMO_MODE && process.env.VERCEL) {
  process.env.VITE_DEMO_MODE = "true";
}

// https://vite.dev/config/
export default defineConfig({  root: "client",
  envDir: "..",
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
