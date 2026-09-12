# Piloto TS/JS — `public/koala/src` (lote chore/dshow-cleanup-dedup-v1)

**Padrão provado (verde):** TS canônico → JS gerado SÓ em pasta de saída (`public/koala/dist/`, gitignored)
→ build reproduzível (`scripts/koala-build.sh` → `vite build`) → runtime consome só o artefato
(`nginx alias public/koala/dist/` em `/koala/`; `public/koala/index.html` aponta para `/src/main.tsx`,
que o Vite resolve para as fontes `.ts/.tsx`) → **nenhum JS compilado ao lado das fontes**.

## O que havia
4 irmãos `.js` (saída antiga do esbuild) ao lado das fontes `.ts`: `src/format.js`, `src/theme.js`,
`src/api/client.js`, `src/components/proposals/status.js`. Os imports do app são sem extensão
(`from './format'`, `from '../theme'`, `from './api/client'`) e a ordem padrão de `resolve.extensions`
do Vite resolve `.js` **antes** de `.ts` → o build compilava os `.js` esquecidos e **ignorava as fontes
`.ts`** (fonte canônica sombreada).

## O que foi feito
1. Removidos os 4 `.js` (cópias em `/backup/dshow-cleanup-<ts>/removed/public/koala/src/`).
2. `public/koala/vite.config.js`: `resolve.extensions` explícito com `.ts/.tsx` antes de `.js`, para que
   um `.js` esquecido nunca volte a sombrear a fonte.
3. Prova: `vite build` ANTES (com os `.js`) e DEPOIS (só `.ts`) produzem dist **byte a byte idêntico**
   (`assets/index-TI7deeGy.js` sha256 `dae7c1fbf8f9df7e…`, `assets/index-Bz_oppBd.css` `8ed119c4…`,
   `index.html` `b7cb6b35…`) — os `.js` eram saída fiel do mesmo TS; `tsc --noEmit -p public/koala/tsconfig.json`
   = 0 erros (`allowJs:false`: o tsc só enxerga TS).

## Como aplicar depois (não ampliado nesta rodada)
Para cada subsistema candidato: (a) confirmar que o runtime consome um artefato de `dist/` (ou um único
`<script src>`), nunca o `.js` ao lado; (b) provar reprodutibilidade: transpilar o `.ts` atual e comparar
com o `.js` irmão — **se diferir, não remover** (o `.js` pode ter sido gerado de um TS mais antigo: é
drift, tratado por ADR-004/M4); (c) remover os irmãos, fixar `resolve.extensions`/build, rebuildar,
comparar hashes do dist; (d) registrar. Nesta base, 7 subsistemas testados (router registry, sidebar
registry, nav-rail registry, panel-loader, user-menu actions) **não** são reproduzíveis por esbuild
(diffs de 30–206 linhas) → ficam para M4; os únicos com build 1:1 versionado hoje são
`header/mobile-v2` e `app-shell/layout-v2` (scripts em `scripts/header` e `scripts/shell`).
