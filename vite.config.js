import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // When testing on your own computer, send /api calls to the local Functions host
      "/api": "http://localhost:7071",
    },
  },
});
