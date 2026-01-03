import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Dentrak Development Ports:
 * - Vite Dev Server: 5174
 *
 * JBook Development Ports:
 * - Vite Dev Server: 5173
 * - API Server (Electron): 47832 (for Dentrak sync)
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true, // Fail if port is in use
  },
});
