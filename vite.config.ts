import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  base: process.env.BASE_PATH || "/pokemaths/",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) {
            return 'react-core';
          }
          if (id.includes('/node_modules/firebase/auth/') || id.includes('/node_modules/@firebase/auth/')) {
            return 'firebase-auth';
          }
          if (id.includes('/node_modules/firebase/firestore/') || id.includes('/node_modules/@firebase/firestore/') || id.includes('/node_modules/@grpc/') || id.includes('/node_modules/protobufjs/') || id.includes('/node_modules/@firebase/webchannel-wrapper/')) {
            return 'firebase-firestore';
          }
          if (id.includes('/node_modules/firebase/app/') || id.includes('/node_modules/@firebase/app/') || id.includes('/node_modules/@firebase/component/') || id.includes('/node_modules/@firebase/logger/') || id.includes('/node_modules/@firebase/util/')) {
            return 'firebase-core';
          }
        },
      },
    },
  },
  server: { port: 3000, strictPort: false, host: true },
});
