import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      "@vladmandic/face-api": path.resolve(__dirname, "node_modules/@vladmandic/face-api/dist/face-api.js"),
    },
  },
  optimizeDeps: {
    exclude: ["html5-qrcode", "@vladmandic/face-api"],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@vladmandic/face-api")) {
              return "vendor-faceapi";
            }
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            if (id.includes("html5-qrcode") || id.includes("jsqr")) {
              return "vendor-qrcode";
            }
          }
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      host: "localhost",
      port: 5173,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/public": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      "/public": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
