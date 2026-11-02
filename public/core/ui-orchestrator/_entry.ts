// ═══════════════════════════════════════════════════════════════
// ui-orchestrator / _entry.ts — ENTRY DE BUILD (o browser NAO carrega)
// ═══════════════════════════════════════════════════════════════
// POR QUE ESTE ARQUIVO EXISTE (2026-07-30)
//
// O alvo tinha como entry o proprio `index.ts`, que faz
// `export * from './dist/ui-orchestrator.bundle.js'` — o build se alimentava do
// artefato e descartava as fontes, saindo VERDE.
//
// NAO precisou de `_aggregator.ts`: a fachada JA existe em fonte, em
// `core/resolver.ts`, que exporta os 22 nomes e tambem o
// `export default Object.freeze({...})`. Conferido campo a campo contra o
// bundle: os dois conjuntos de 22 sao identicos.
//
// ⚠️ Havia DOIS `init` nas fontes — `core/manifest-state.ts:init(manifestModule)`
// e `core/resolver.ts:init(options)`. O bundle exporta o do RESOLVER (conferido
// pelo corpo da funcao: "Resolver already initialized"). Escolher por nome teria
// 50% de chance de pegar o errado.
//
// NAO apontar para `./index.js` — e o laco de volta.
// Trava: scripts/detect-circular-build.sh (detector 7/7).
// ═══════════════════════════════════════════════════════════════

export * from './core/resolver.js';
export { default } from './core/resolver.js';
