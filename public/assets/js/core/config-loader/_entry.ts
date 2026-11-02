

// ═══════════════════════════════════════════════════════════════
// BUILD ENTRY — config-loader bundle
// ═══════════════════════════════════════════════════════════════
// Este arquivo NÃO é carregado pelo browser. Serve apenas como entry
// point para o Vite bundlar. O browser carrega index.js (re-export).
// Source real: index.js.bak.pre-bundle
// ═══════════════════════════════════════════════════════════════
// 2026-07-30: apontava para `./index.js`, que reexporta o proprio dist — o
// build se alimentava do artefato e descartava as fontes. Agora aponta para o
// `_aggregator.ts`, a fachada reconstruida lendo o bundle.
// Trava: scripts/detect-circular-build.sh (detector 7/7).
export * from './_aggregator.js';
export { default } from './_aggregator.js';
