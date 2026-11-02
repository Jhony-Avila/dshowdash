// ═══════════════════════════════════════════════════════════════
// platform-runtime / _entry.ts — ENTRY DE BUILD (browser NAO carrega)
// ═══════════════════════════════════════════════════════════════
//     _entry.ts (build)  ->  _aggregator.js  ->  os 9 submodulos reais
//     index.js (browser) ->  dist/platform-runtime.bundle.js  (inalterado)
//
// NAO apontar para `./index.js` — e o laco de volta.
// Trava: scripts/detect-circular-build.sh (detector 7/7).
// ═══════════════════════════════════════════════════════════════

export * from './_aggregator.js';
export { default } from './_aggregator.js';
