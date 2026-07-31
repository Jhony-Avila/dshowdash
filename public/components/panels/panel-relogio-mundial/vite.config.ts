// vite.config.ts — build do painel Relógio Mundial (React) para dentro do app-shell.
// @version 3.0.0  @created 2026-07-30
//
// Espelha panel-ads/vite.config.ts. NÃO é uma SPA: o resultado é um conjunto de
// módulos ES carregados sob demanda pelo adaptador vanilla (index.js).
//
// Build:  npx vite build --config public/components/panels/panel-relogio-mundial/vite.config.ts
//   (rodar como www-data OU chown -R www-data:www-data dist depois — senão o painel não monta)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const RAIZ = resolve(__dirname);
const BASE = '/components/panels/panel-relogio-mundial/dist/';

export default defineConfig({
  root: RAIZ,
  base: BASE,
  plugins: [react()],

  resolve: {
    alias: { '@': resolve(RAIZ, 'src') },
  },

  build: {
    outDir: resolve(RAIZ, 'dist'),
    emptyOutDir: true,
    manifest: true,
    target: 'es2022',
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 700,
    // public/geo/* é copiado para dist/geo/* (geometria Natural Earth + luzes).
    copyPublicDir: true,

    rollupOptions: {
      input: resolve(RAIZ, 'src/entry.tsx'),
      // CRÍTICO: o entry é consumido como BIBLIOTECA pelo adaptador (mod.mountReact).
      // Sem isto o Rollup remove o App inteiro (dead-code).
      preserveEntrySignatures: 'strict',
      output: {
        format: 'es',
        entryFileNames: 'wcm.[hash].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'react-vendor';
            }
            // d3-geo/topojson formam o motor cartográfico: chunk próprio, carregado
            // junto com o mapa (que é o coração do painel, não é opcional).
            if (/[\\/]node_modules[\\/](d3-[a-z]+|topojson-client|internmap|delaunator|robust-predicates)[\\/]/.test(id)) {
              return 'geo-vendor';
            }
            // motion (animações) é usado em toda a casca: fica no vendor comum.
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },

  server: { hmr: false },
});
