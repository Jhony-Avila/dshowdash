// ═══════════════════════════════════════════════════════════════
// kernel-ui / _entry.ts — ENTRY DE BUILD (o browser NÃO carrega este arquivo)
// ═══════════════════════════════════════════════════════════════
// POR QUE ESTE ARQUIVO EXISTE (2026-07-30)
//
// O alvo `kernel-ui` do vite tinha como entry o próprio `index.ts`, que faz:
//
//     export * from './dist/kernel-ui.bundle.js';
//
// Ou seja: o build se alimentava do PRÓPRIO artefato. Rebuildar re-empacotava o
// bundle antigo e descartava as fontes `.ts` — e saía VERDE. Qualquer correção
// feita em `kernel-governance-panel.ts` NUNCA chegaria ao browser, e o sintoma
// para quem edita seria "corrigi, rebuildei, e o bug continua". Foi exatamente
// assim que a correção de CSRF do telemetry-core ficou fora do ar por 15 dias.
//
// A CADEIA CORRETA, agora:
//     _entry.ts (build) → kernel-governance-panel.js → submódulos reais
//     index.js (browser) → dist/kernel-ui.bundle.js   ← inalterado
//
// `index.ts`/`index.js` seguem re-exportando o bundle DE PROPÓSITO: é o que o
// browser carrega. O que mudou é só de onde o bundle NASCE.
//
// POR QUE NÃO PRECISOU DE `_aggregator.ts` (diferente do telemetry-core):
// lá a camada de fachada só existia dentro do bundle minificado e teve de ser
// reescrita. Aqui `kernel-governance-panel.ts` JÁ é a fachada — conferido
// símbolo a símbolo: os 13 exports do bundle e os 13 da fonte são o MESMO
// conjunto, sem faltar nem sobrar. Reexportar basta.
//
// ⚠️ NÃO apontar este arquivo para `./index.js` — é o laço de volta.
// Trava permanente: `scripts/detect-circular-build.sh` (detector 7/7).
// ═══════════════════════════════════════════════════════════════

export * from './kernel-governance-panel.js';
export { default } from './kernel-governance-panel.js';
