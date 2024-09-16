import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import jsconfigPaths from "vite-jsconfig-paths";
import { crx } from "@crxjs/vite-plugin";
import manifestJson from "./public/manifest.json";

const manifest = manifestJson;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),crx({ manifest }), jsconfigPaths()],
})
