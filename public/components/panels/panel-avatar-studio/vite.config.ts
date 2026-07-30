// vite.config.ts — build do painel Avatar Studio (Sistema de Avatares Gamer AAA).
// @version 1.0.0  @created 2026-07-29
//
// Espelha panel-ads/vite.config.ts. NÃO é uma SPA: o resultado é um conjunto de
// módulos ES carregados sob demanda pelo adaptador vanilla (index.js).
//
// Build:  npx vite build --config public/components/panels/panel-avatar-studio/vite.config.ts
//   (rodar como www-data OU chown -R www-data:www-data dist depois — senão o painel não monta)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const RAIZ = resolve(__dirname);
const BASE = '/components/panels/panel-avatar-studio/dist/';

export default defineConfig({
  root: RAIZ,
  base: BASE,
  plugins: [react()],

  resolve: {
    alias: { '@': resolve(RAIZ, 'src') },
  },

  css: {
    modules: {
      generateScopedName: '__avst_[local]_[hash:base64:5]',
    },
  },

  build: {
    outDir: resolve(RAIZ, 'dist'),
    emptyOutDir: true,
    manifest: true,
    target: 'es2020',
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      input: resolve(RAIZ, 'src/entry.tsx'),
      // CRÍTICO: o entry é consumido como BIBLIOTECA pelo adaptador (mod.mountReact).
      // Sem isto o Rollup remove o App inteiro (dead-code).
      preserveEntrySignatures: 'strict',
      output: {
        format: 'es',
        entryFileNames: 'avst.[hash].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        manualChunks(id) {
          // O preload-helper do vite é compartilhado entre o entry e chunks
          // dinâmicos — sem isto o Rollup pode alojá-lo no motor3d e transformar
          // o chunk 3D em import estático do entry. SÓ ele: fixar também o
          // commonjsHelpers criaria ciclo vendor↔react-vendor (React fica
          // undefined durante a avaliação do vendor).
          if (id.includes('vite/preload-helper')) {
            return 'vendor';
          }
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'react-vendor';
            }
            // ECharts (e o zrender, que ele usa) ficam num chunk próprio,
            // referenciado SÓ pelo import dinâmico — carrega sob demanda.
            if (/[\\/]node_modules[\\/](echarts|zrender)[\\/]/.test(id)) {
              return 'echarts';
            }
            // Motor 3D (AS4): three + R3F + drei e TODAS as suas dependências
            // num chunk próprio, alcançado só pelo import dinâmico da aba 3D.
            // Nada disso pode vazar p/ o "vendor" (que carrega sempre).
            if (/[\\/]node_modules[\\/](three|@react-three|three-stdlib|three-mesh-bvh|maath|camera-controls|@use-gesture|detect-gpu|glsl-noise|troika-three-text|troika-worker-utils|troika-three-utils|stats-gl|stats\.js|suspend-react|react-use-measure|its-fine|react-reconciler|zustand|@monogrid|hls\.js|meshline|webgl-sdf-generator|bidi-js|utility-types|tunnel-rat|@mediapipe|draco3d|web-worker)[\\/]/.test(id)) {
              return 'motor3d';
            }
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },

  server: { hmr: false },
});
