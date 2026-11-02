

// ═══════════════════════════════════════════════════════════════
// BUILD ENTRY — telemetry-core bundle
// ═══════════════════════════════════════════════════════════════
// Este arquivo NÃO é carregado pelo browser. Serve apenas como entry
// point para o Vite bundlar. O browser carrega index.js (re-export).
//
// ⚠️ 2026-07-28 — NÃO aponte este entry para `./index.js`.
// `index.js` re-exporta `./dist/telemetry-core.bundle.js`, que é a SAÍDA deste build.
// Com o entry em `index.js` a cadeia virava entry → index.js → o próprio bundle: cada
// rebuild re-empacotava o artefato anterior e descartava toda mudança feita nas fontes
// `.ts`. Foi assim que a correção de CSRF do transporte ficou fora do ar mesmo depois de
// pronta e validada no código. O entry precisa apontar para a FONTE (`_aggregator.ts`).
// ═══════════════════════════════════════════════════════════════
export * from './_aggregator.js';
export { default } from './_aggregator.js';
