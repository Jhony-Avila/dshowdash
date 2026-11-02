// ═══════════════════════════════════════════════════════════════
// platform-shell / _entry.ts — ENTRY DE BUILD (o browser NÃO carrega este)
// ═══════════════════════════════════════════════════════════════
// Cadeia correta:
//     _entry.ts (build)  →  _aggregator.js  →  os quatro sub-shells reais
//     index.js (browser) →  dist/platform-shell.bundle.js   ← inalterado
//
// `index.ts`/`index.js` seguem reexportando o bundle DE PROPOSITO: e o que o
// browser carrega. O que mudou e de onde o bundle NASCE.
//
// NAO apontar para `./index.js` — e o laco de volta.
// Trava: scripts/detect-circular-build.sh (detector 7/7).
// ═══════════════════════════════════════════════════════════════

export * from './_aggregator.js';
export { default } from './_aggregator.js';
