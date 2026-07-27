// vite.config.ts — build do painel DataTables (React) para dentro do app-shell.
// @version 1.1.0  @created 2026-07-20
//
// NAO e uma SPA independente: o resultado e um conjunto de modulos ES carregados
// sob demanda pelo adaptador vanilla (index.js) dentro do container-main.
//
// Por isso:
//   - format ES (o adaptador usa import() dinamico)
//   - base absoluta: os chunks precisam resolver a partir do docroot, nao da rota
//   - hash no nome: resolve o cache-bust sem depender de bump manual do ?v=
//
// DECISAO SOBRE emptyOutDir (v1.1.0 — corrige comentario antigo que dizia o
// contrario do codigo): `emptyOutDir: true` — cada build LIMPA o dist e recria
// os assets hasheados. Mantido de proposito (dono aprovou): evita acumular lixo
// e assets antigos servidos. O efeito colateral — uma sessao aberta ANTES do
// rebuild referenciar um hash ja apagado ("Unable to preload CSS") — NAO se
// resolve mantendo assets velhos (que so adiariam o problema e exporiam cruft),
// e sim em RUNTIME: manifest lido com no-store (index.js), 1 re-import automatico
// (shell/lazyComRetry) e reload guardado 1x/sessao (shell/preloadRecovery).
// Recomendacao futura (nao aplicada agora): servir o manifest.json com no-cache
// no nginx — tarefa separada, com backup do nginx.conf antes.
//
// Build:  npx vite build --config public/components/panels/panel-datatables/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const RAIZ = resolve(__dirname);
const BASE = '/components/panels/panel-datatables/dist/';

export default defineConfig({
  root: RAIZ,
  base: BASE,
  plugins: [react()],

  resolve: {
    alias: {
      '@': resolve(RAIZ, 'src'),
    },
  },

  css: {
    modules: {
      // Classe legivel em dev, curta em prod, SEMPRE com hash: e o que garante
      // que o CSS do painel nao vaze para o shell nem sofra dele.
      generateScopedName: '__dt_[local]_[hash:base64:5]',
    },
  },

  build: {
    outDir: resolve(RAIZ, 'dist'),
    emptyOutDir: true,
    // O adaptador le o manifesto para descobrir o nome com hash do bundle.
    manifest: true,
    target: 'es2020',
    sourcemap: false,
    // O shell ja e servido comprimido; relatorio de tamanho real vem do script
    // de analise, nao do aviso do Vite.
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      input: resolve(RAIZ, 'src/entry.tsx'),

      // CRITICO: em build de APLICACAO o Vite usa preserveEntrySignatures:false,
      // porque assume que o entry roda por efeito colateral. Aqui o entry e
      // consumido como BIBLIOTECA pelo adaptador (`mod.mountReact(...)`), entao
      // sem isto o Rollup considera as exportacoes mortas e remove o App inteiro
      // — o bundle sai com 0,04 kB e nenhum CSS, sem nenhum aviso.
      preserveEntrySignatures: 'strict',
      output: {
        format: 'es',
        entryFileNames: 'datatables.[hash].js',
        chunkFileNames: 'chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]',

        // Separacao explicita: o vendor React muda pouco e pode ser cacheado por
        // mais tempo que o codigo do painel. Bibliotecas pesadas (graficos, grafo)
        // NAO entram no vendor eager — retornam undefined para o Vite code-splitar
        // no chunk ASSINCRONO de quem as importa dinamicamente (ex.: ECharts só
        // baixa quando um grafico entra em tela).
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'react-vendor';
            }
            // ECharts (+ zrender) e o D3 (grafo de dependências) são pesados e
            // usados sob demanda: fora do vendor eager → viram chunk assíncrono
            // que só baixa quando a tela que os usa monta.
            if (/[\\/]node_modules[\\/](echarts|zrender|d3-[a-z]+)[\\/]/.test(id)) {
              return undefined;
            }
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },

  // O painel roda dentro do shell; nao ha dev server proprio nesta fase.
  server: { hmr: false },
});
