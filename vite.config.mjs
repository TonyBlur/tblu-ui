import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({ root:fileURLToPath(new URL('./demo',import.meta.url)), base:process.env.PAGES_BASE || './', build:{outDir:'../demo-dist',emptyOutDir:true},server:{host:'127.0.0.1',port:8190,strictPort:true} });
