// vite.config.ts — build do painel Ads Intelligence (React) para dentro do app-shell.
// @version 1.0.0  @created 2026-07-21
//
// Espelha panel-outlook/vite.config.ts. NÃO é uma SPA: o resultado é um conjunto de
// módulos ES carregados sob demanda pelo adaptador vanilla (index.js).
//
// Build:  npx vite build --config public/components/panels/panel-ads/vite.config.ts
//   (rodar como www-data OU chown -R www-data:www-data dist depois — senão o painel não monta)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const RAIZ = resolve(__dirname);
const BASE = '/components/panels/panel-ads/dist/';

export default defineConfig({
  root: RAIZ,
  base: BASE,
  plugins: [react()],

  resolve: {
    alias: { '@': resolve(RAIZ, 'src') },
  },

  css: {
    modules: {
      generateScopedName: '__ads_[local]_[hash:base64:5]',
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
        entryFileNames: 'ads.[hash].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'react-vendor';
            }
            // ECharts (+ zrender), D3 e topojson são pesados e usados SOB DEMANDA:
            // ficam fora do vendor eager → viram chunk assíncrono que só baixa quando
            // a tela com o gráfico monta (import dinâmico em EChart/d3/*).
            if (/[\\/]node_modules[\\/](echarts|zrender|d3-[a-z]+|topojson-client)[\\/]/.test(id)) {
              return undefined;
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
