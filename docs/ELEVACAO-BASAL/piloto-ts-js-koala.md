# Piloto TS/JS — `public/koala/src` (lote chore/dshow-cleanup-dedup-v2) — COMPLETO

**Padrão provado:** TypeScript/TSX é a fonte canônica → imports resolvem para as fontes `.ts/.tsx` → JavaScript
existe SÓ na saída de build (`public/koala/dist/`, gitignored) → build reproduzível (`scripts/koala-build.sh` →
`vite build`) → o runtime consome só o artefato (nginx `alias public/koala/dist/` em `/koala/`; `public/koala/index.html`
aponta para `/src/main.tsx`) → **nenhum JS compilado ao lado das fontes**.

## O que havia
1. 4 irmãos `.js` versionados ao lado das fontes `.ts`: `src/format.js`, `src/theme.js`, `src/api/client.js`,
   `src/components/proposals/status.js`. Os imports do app são sem extensão (`from './format'`, `from '../theme'`,
   `from './api/client'`, `from './status'`; 35 imports, todos internos ao Koala, nenhum com `.js` explícito, nenhum
   `<script>`/PHP/`koala/src` fora do app) e a ordem padrão de `resolve.extensions` do Vite resolve `.js` **antes**
   de `.ts` → o build compilava os `.js` e **ignorava as fontes `.ts`** (fonte canônica sombreada). Os 4 `.js` eram
   saída fiel do TS atual (esbuild `--format=esm --target=es2020` do `.ts` = `.js` byte a byte) — zero drift.
2. Colisão de caixa `src/components/DataGrid.tsx` (componente reutilizável) × `src/components/dataGrid.tsx`
   (mecânica de ordenação/colunas) — módulos DISTINTOS cujo nome difere só por maiúscula: único erro do
   `tsc -p public/koala` (TS1149) e armadilha em sistemas de arquivos sem distinção de caixa.

## O que foi feito (v2)
1. Removidos os 4 `.js` (cópias em `/backup/cleanup-dedup-v2/<carimbo>/removed/public/koala/src/`).
2. `public/koala/vite.config.js`: `resolve.extensions` explícito com `.ts/.tsx` antes de `.js`, para que um `.js`
   esquecido nunca volte a sombrear a fonte.
3. `src/components/dataGrid.tsx` → `src/components/dataGridCore.tsx` (7 imports atualizados; `DataGrid.tsx` mantém o
   nome — é o componente público). Nenhum consumidor fora do Koala.
4. Prova (worktree, Vite 5.4.21 do toolchain de `public/react`): `vite build` ANTES (com os `.js`) e DEPOIS (só `.ts`,
   já com o rename) produzem dist **byte a byte idêntico** e igual ao servido em produção:
   `assets/index-TI7deeGy.js` sha256 `dae7c1fbf8f9df7e…`, `assets/index-Bz_oppBd.css` `8ed119c4…`, `index.html`
   `b7cb6b35…`. `tsc --noEmit -p public/koala/tsconfig.json` = **0 erros** (era 1). `find src -name '*.js'` = 0.
   Scanner de imports relativos em `public/koala`: 0 quebrados.

## Como aplicar a outros subsistemas (padrão de migração; NÃO ampliado nesta rodada)
Para cada subsistema candidato: (a) confirmar que o runtime consome um artefato de `dist/` (ou um único `<script src>`),
nunca o `.js` ao lado; (b) provar reprodutibilidade: transpilar o `.ts` atual (esbuild `--format=esm`, `--charset=utf8`)
e comparar com o `.js` irmão — **se diferir funcionalmente, não remover** (o `.js` pode estar à frente ou atrás do TS:
é drift, tratado por ADR-004/M4 — sincronizar a fonte primeiro); (c) remover os irmãos, fixar `resolve.extensions`/build,
rebuildar, comparar hashes do dist; (d) checar colisões de caixa (`tsc` TS1149); (e) registrar. Nesta base, os registries
de router/sidebar/nav-rail, panel-loader e user-menu actions têm `.js` consumidos DIRETAMENTE pelos bundles congelados
(imports com extensão `.js`) e alguns estão à frente do `.ts` (ex.: `panel-paths.js`) → o passo (b) exige sincronizar o
`.ts` antes de qualquer remoção; ficam para M4. Os únicos com build 1:1 versionado hoje são `header/mobile-v2`,
`app-shell/layout-v2` e `router/profile-redirect` (scripts em `scripts/header` e `scripts/shell`).
