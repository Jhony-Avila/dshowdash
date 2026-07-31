// vite.config.ts — build do painel Bling (React) para dentro do app-shell.
// @version 1.0.0  @created 2026-07-30
//
// Espelha panel-google-calendar/vite.config.ts. NÃO é uma SPA: o resultado é um
// conjunto de módulos ES carregados sob demanda pelo adaptador vanilla (index.js).
//
// Build:
//   npx vite build --config public/components/panels/panel-bling/vite.config.ts
//   (rodar como www-data OU `chown -R www-data:www-data dist` depois — senão o
//    painel não monta: o nginx não consegue ler os arquivos.)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const RAIZ = resolve(__dirname);
const BASE = '/components/panels/panel-bling/dist/';

export default defineConfig({
  root: RAIZ,
  base: BASE,
  plugins: [react()],

  resolve: {
    alias: {
      '@': resolve(RAIZ, 'src'),
      // Biblioteca compartilhada extraída na entrega do Bling (decisão 8.4).
      '@shared': resolve(RAIZ, '../../_shared-react'),
    },
  },

  build: {
    outDir: resolve(RAIZ, 'dist'),
    emptyOutDir: true,
    manifest: true,
    target: 'es2020',
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 900,

    rollupOptions: {
      input: resolve(RAIZ, 'src/entry.tsx'),

      // ⚠️ CRÍTICO — NÃO REMOVER.
      // O entry é consumido como BIBLIOTECA pelo adaptador vanilla
      // (index.js chama `mod.mountReact`). Sem esta linha o Rollup conclui que
      // ninguém usa os exports e remove o App INTEIRO por dead-code: o build
      // passa, o bundle encolhe para ~23 kB e o painel monta em branco.
      // Isso aconteceu de verdade nesta entrega (2026-07-30) e o `vite build`
      // não deu um único aviso. O mesmo comentário existe no painel Google
      // Calendar, pela mesma razão.
      preserveEntrySignatures: 'strict',

      output: {
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',

        // Separar as bibliotecas pesadas mantém o primeiro paint leve.
        // `import()` sozinho NÃO garante lazy-load — o corte tem que ser
        // explícito E conferido no tamanho do chunk depois do build
        // (scripts/bling-smoke-bundle.mjs faz essa conferência).
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
            if (/[\\/]node_modules[\\/](echarts|zrender)[\\/]/.test(id)) return 'echarts';
            if (/[\\/]node_modules[\\/]d3-/.test(id)) return 'd3';
            if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'icones';
            if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return 'tanstack';
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
});
