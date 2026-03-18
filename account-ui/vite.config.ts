import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

const outputDir = path.resolve(
  __dirname,
  "../spi/src/main/resources/theme/api-keys/account/resources/content"
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
      fileName: () => "api-keys.js"
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        entryFileNames: "api-keys.js",
        chunkFileNames: "api-keys-[name]-[hash].js",
        assetFileNames: "api-keys-[name]-[hash][extname]",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime"
        }
      }
    }
  }
});
