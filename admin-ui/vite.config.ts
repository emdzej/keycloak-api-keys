import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const outputDir = path.resolve(
  __dirname,
  "../spi/src/main/resources/theme/api-keys/admin/resources"
);

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: outputDir,
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/index.tsx"),
      formats: ["es"],
      fileName: () => "api-keys-admin.js"
    },
    rollupOptions: {
      output: {
        entryFileNames: "api-keys-admin.js",
        chunkFileNames: "api-keys-admin-[name]-[hash].js",
        assetFileNames: "api-keys-admin-[name]-[hash][extname]"
      }
    }
  }
});
