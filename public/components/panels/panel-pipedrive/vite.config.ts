// vite.config.ts — build do painel Pipedrive Analytics (React) para dentro do app-shell.
// @version 1.0.0  @created 2026-07-21
//
// Espelha panel-datatables/vite.config.ts. NAO e uma SPA: o resultado e um
// conjunto de modulos ES carregados sob demanda pelo adaptador vanilla (index.js).
//
// Build:  npx vite build --config public/components/panels/panel-pipedrive/vite.config.ts
//   (rodar como www-data OU chown -R www-data:www-data dist depois — senao o painel nao monta)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const RAIZ = resolve(__dirname);
const BASE = '/components/panels/panel-pipedrive/dist/';

export default defineConfig({
  root: RAIZ,
  base: BASE,
  plugins: [react()],

  resolve: {
    alias: { '@': resolve(RAIZ, 'src') },
  },

  css: {
    modules: {
      generateScopedName: '__pp_[local]_[hash:base64:5]',
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
      // CRITICO: o entry e consumido como BIBLIOTECA pelo adaptador
      // (mod.mountReact). Sem isto o Rollup remove o App inteiro (dead-code).
      preserveEntrySignatures: 'strict',
      output: {
        format: 'es',
        entryFileNames: 'pipedrive.[hash].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'react-vendor';
            }
            // ECharts (+ zrender) pesado: fora do vendor eager, carga sob demanda (Fase 2).
            if (/[\\/]node_modules[\\/](echarts|zrender)[\\/]/.test(id)) {
              return undefined;
            }
            // FullCalendar (Agenda, Fase 3): idem — so baixa para quem abre a agenda.
            if (/[\\/]node_modules[\\/]@fullcalendar[\\/]/.test(id)) {
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
