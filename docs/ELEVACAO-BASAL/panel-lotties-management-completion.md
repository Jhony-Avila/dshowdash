# panel-lotties-management — correção estrutural (INCOMPLETE → CANONICAL_ACTIVE)

Branch `fix/panel-lotties-management-completion` (base `origin/main` 1326f19b, 2026-09-12). Sem merge, sem deploy, sem banco.

## Causa-raiz (medida em produção com Playwright, `getStatus()`/`mount()`/`unmount()` chamados diretamente)
1. **`mount()` lançava `TypeError: tracker.trackInit is not a function`** — `telemetry/tracker.ts` só tinha `track()`; o painel
   chamava `trackInit/trackMount/trackUnmount/trackPreview/trackAssign`. O shell (`panel-lifecycle-controller`) capturava a exceção,
   não montava nada (`mountCount=0`, conteúdo vazio) e, no caminho de erro, disparava o `Cannot set properties of null (setting
   'hidden')` observado nos smokes (helper de loading do bundle congelado sobre um elemento já removido).
2. **`unmount()` lançava `ReferenceError: cleanupEvents is not defined`** — `index.ts` declarava `declare const cleanupEvents` (ambient)
   e nunca importava `cleanup` de `ui/events.js`.
3. **Catálogo duplicado e caminho inválido** — `core/lifecycle.ts` tinha uma lista fixa de 5 animações e apontava para
   `/components/animacoes/` (diretório inexistente; corrigido para `/assets/animacoes/` no lote cleanup-v2; o mesmo caminho errado existia no
   módulo canônico do servidor e foi corrigido lá em 2026-09-14). Existe fonte canônica:
   `/assets/animacoes/index.js` (módulo do servidor consumido pelo footer/registry; expõe `info().availableAnimations`, `init()` que
   carrega a lottie-web e `loadAnimation()`).
4. **Vazamentos** — segunda assinatura do store (persistência) nunca cancelada; nenhum tratamento para o fato de o shell congelado **não
   chamar `unmount()`** ao trocar de painel (ele só faz `contentEl.innerHTML = ''`): listeners/assinaturas ficavam vivos.
5. **Sem rota canônica** — alcançável só por convenção; sem estados de carregamento/vazio/erro; CSS de tema só por `prefers-color-scheme`
   (o app usa `html[data-theme]`).

## O que foi feito (TypeScript é a fonte; `.js` regenerados 1:1 por esbuild `--format=esm --target=es2020 --charset=utf8`)
- `telemetry/tracker.ts`: métodos `trackInit/trackMount/trackUnmount/trackPreview/trackAssign/trackCatalog` (finos sobre `track()`).
- `core/catalogo.ts` (novo): **fonte única** — importa o módulo canônico em runtime, normaliza `{id, file, name, url, disponivel}`,
  monta a URL com `LOTTIES_BASE_PATH = /assets/animacoes/` (origem válida) e verifica cada arquivo por `HEAD`; `garantirLottie()`
  usa o `init()` do próprio módulo para a lottie-web. Nenhuma lista fixa restou no painel.
- `core/lifecycle.ts`: lista fixa removida; `buildHealthCheck/buildInfo` recebem a contagem do estado.
- `state/store.ts`: `catalogo: carregando|pronto|vazio|erro` + `catalogoOrigem`, `setCatalogo()`; tipos alinhados ao catálogo.
- `ui/renderer.ts`: renderiza SÓ do estado; estados **carregando** (skeleton), **vazio**, **erro** (com "tentar novamente"), pronto; badge
  "arquivo ausente" e preview desabilitado quando o HEAD falha; HTML escapado; `data-state` no root para prova.
- `ui/events.ts`: preview via lottie-web garantida pelo módulo canônico, token anti-corrida, Esc fecha, `recarregar`, `cleanup()`
  obrigatório (click/change/keydown).
- `index.ts`: `mount` assíncrono (skeleton → catálogo → estado), `unmount` cancela as DUAS assinaturas, listeners e cargas pendentes;
  **auto-desmontagem por MutationObserver** quando o shell esvazia/destaca o container (contrato real do bundle congelado); remount
  limpo; `reload()`; `getStatus().catalogo`.
- `styles/index.css`: estados, origem, ausentes, `html[data-theme="light|dark"]` com precedência sobre `prefers-color-scheme`, mobile ≤640px.
- Rota canônica `/panel-lotties-management` em `routes-dashboard.ts` (+ `.js` espelho) com aliases `#/lotties`, `#/animacoes`.
- **Aliases passam a ser resolvidos pelo shell**: `router/registry/helpers.ts` ganha `getRouteByAlias()` e `getRouteByIdOrPath()` tenta
  id → path → alias (antes os aliases do registro eram letra morta: `extractPanelId` só consultava id e path). `helpers.js` regenerado
  1:1. Como `registry/` é inlinado no lote `main` (`keepInternal`), o efeito em produção exige o rebuild/deploy do bundle `main`
  (decisão #89); na branch o bundle foi reconstruído (`COMPONENT=main vite build`, 954,06 kB ≈ vivo) e os aliases provados no preview.
- `check-routes-registry` ganhou a colisão ALIAS × ID (o helper tenta id antes do alias): 148 rotas, TODOS PASS.
- Inventário regenerado: `INCOMPLETE=0`, `CANONICAL_ACTIVE=98`, `PRIMARY_CLASSIFICATION_UNIQUE=YES`; `check-routes-registry`: 148 rotas PASS.

## Prova — `scripts/panels/smoke-lotties.mjs` (shell real autenticado, preview do worktree com API real e bundle `main` da branch) — 13/13 PASS
Desktop 1440×900 e mobile 390×844 × tema claro e escuro: monta pela rota canônica (`data-state="pronto"`); 3 cards = 3 itens do
módulo canônico; 0 arquivos ausentes e 0 respostas 4xx em `/assets/animacoes/`; preview abre (svg do lottie-web) e fecha por Esc;
atribuição persiste (localStorage) e sobrevive ao remount; ao navegar para outro painel: `initialized=false`, 0 listeners, 0
assinaturas, 0 instância lottie, 0 nós do painel no `body`; aliases `#/lotties` e `#/animacoes` montam o painel (rota canônica remonta depois: `mountCount=4`); 0 `pageerror`; 0 erro de console;
overflow-x 0; `html[data-theme]` aplicado. Evidências: `/backup/lotties-fix/20260912/smoke-preview/` (PNGs + JSON + SMOKE-LOTTIES.txt).
Leitura do console (2026-09-15, `scripts/shell/console-texto.mjs`, compartilhado com `smoke-gestao-paineis`, `smoke-rotas-preview` e
`smoke-flags-prod`): texto limpo de `%c`/estilos do logger do shell e guardado até 600c; a telemetria esporádica do bootstrap
`Performance critical:` é contada à parte (`perfShell`) e não entra em `cerr`/`cerrAll` — qualquer outro `console.error` segue
valendo. Regra registrada no `scripts/deploy/RUNBOOK-BANCO.md` (item 6).
Validação TypeScript com tipos REAIS: o tsconfig já mapeia `/core/*` → `public/core/*`, mas `public/core` é servido do document root e
não versionado — no worktree limpo o `tsc` acusa TS2307 falsos. Com `public/core` presente (link para o runtime servido, ignorado pelo
git, exatamente como no servidor): `tsc --noEmit -p tsconfig.json` → main 406 erros pré-existentes / branch 402 (0 novos; os 2 do
diff são o mesmo erro com caminho do worktree); **0 erros em todos os `.ts` alterados** (7 do painel, `helpers.ts`, `routes-dashboard.ts`);
`@ts-expect-error` não usado removido. Builds `panel-dashboard`/`panel-avatar-studio`/lote `main` OK, imports relativos quebrados 130 → 130.

## Limites e pendências fora deste lote
- O módulo canônico `/assets/animacoes/index.{ts,js}` vive em `public/assets` (não versionado) e resolvia arquivos em
  `/components/animacoes/` (404) — por isso o painel monta as URLs com `LOTTIES_BASE_PATH`. **Corrigido no servidor em 2026-09-14**
  (`basePath = '/assets/animacoes/'` no `.ts` e no `.js`; backup em `/backup/animacoes-modulo-20260914-*/`): `loadAnimation('cards')`
  busca `/assets/animacoes/Lottie_Cards.json` (200) e renderiza; o slot `[data-lottie="cards"]` do footer não existe no DOM atual, logo
  não há consumidor quebrado. O painel continua montando as URLs por conta própria (independe do módulo para isso).
- `panel-gestao-paineis` mostra conteúdo vazio ao voltar após outro painel (`Already mounted`: guarda própria + shell que não chama
  `unmount`) — pré-existente, mesmo contrato; candidato ao mesmo padrão de auto-desmontagem.
