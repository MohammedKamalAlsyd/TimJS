import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from "vite-jsconfig-paths";
import { crx } from "@crxjs/vite-plugin";
import manifestJson from "./manifest.json";
import { resolve } from 'path';

const manifest = manifestJson;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),crx({ manifest }), jsconfigPaths()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        homepage: resolve(__dirname, 'src/homepage/homepage.html')
      },
      output: {
        // Ensure output settings as needed
        // For example, to output all HTML files in the root of dist
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
