// Compilación de la DEMOSTRACIÓN en un único archivo HTML (sin servidores).
import { defineConfig, mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import base from './vite.config';

export default mergeConfig({ ...base, build: {} }, defineConfig({
  mode: 'demo',
  plugins: [viteSingleFile()],
  build: { outDir: 'dist-demo', assetsInlineLimit: 100_000_000, cssCodeSplit: false, copyPublicDir: false },
}));
