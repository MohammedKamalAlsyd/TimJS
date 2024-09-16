import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from "vite-jsconfig-paths";
import { crx } from "@crxjs/vite-plugin";
import manifestJson from "./manifest.json";
import { resolve } from 'path';

const manifest = manifestJson;
const outDir = resolve(__dirname, 'dist')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),crx({ manifest }), jsconfigPaths()],
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve('src', 'popup' ,'popup.html'),
        about: resolve('src', 'homepage', 'homepage.html'),
      }
    }
  }
})
