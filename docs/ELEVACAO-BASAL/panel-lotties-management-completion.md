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
   `/components/animacoes/` (diretório inexistente; corrigido para `/assets/animacoes/` no lote cleanup-v2). Existe fonte canônica:
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
- Rota canônica `/panel-lotties-management` em `routes-dashboard.ts` (+ `.js` espelho) com aliases `#/lotties`, `#/animacoes`
  (aliases só resolvem após o rebuild do lote `main` — decisão #89; a rota canônica já monta hoje pela convenção do shell).
- Inventário regenerado: `INCOMPLETE=0`, `CANONICAL_ACTIVE=98`, `PRIMARY_CLASSIFICATION_UNIQUE=YES`; `check-routes-registry`: 148 rotas PASS.

## Prova — `scripts/panels/smoke-lotties.mjs` (shell real autenticado, preview do worktree com API real) — 12/12 PASS
Desktop 1440×900 e mobile 390×844 × tema claro e escuro: monta pela rota canônica (`data-state="pronto"`); 3 cards = 3 itens do
módulo canônico; 0 arquivos ausentes e 0 respostas 4xx em `/assets/animacoes/`; preview abre (svg do lottie-web) e fecha por Esc;
atribuição persiste (localStorage) e sobrevive ao remount; ao navegar para outro painel: `initialized=false`, 0 listeners, 0
assinaturas, 0 instância lottie, 0 nós do painel no `body`; remount `mountCount=2`; 0 `pageerror`; 0 erro de console;
overflow-x 0; `html[data-theme]` aplicado. Evidências: `/backup/lotties-fix/20260912/smoke-preview/` (PNGs + JSON + SMOKE-LOTTIES.txt).
Validação: `tsc` repo 3362 → 3361 (0 novos; 1 resolvido no painel), builds `panel-dashboard`/`panel-avatar-studio` OK, imports
relativos quebrados 130 → 130 (0 novos).

## Limites e pendências fora deste lote
- O módulo canônico `/assets/animacoes/index.{ts,js}` vive em `public/assets` (não versionado) e resolve arquivos em
  `/components/animacoes/` (404) — por isso o painel monta as URLs; a animação "cards" do footer (que usa `loadAnimation`) depende
  desse módulo e continua 404 até o arquivo do servidor ser corrigido (fora do repo).
- `panel-gestao-paineis` mostra conteúdo vazio ao voltar após outro painel (`Already mounted`: guarda própria + shell que não chama
  `unmount`) — pré-existente, mesmo contrato; candidato ao mesmo padrão de auto-desmontagem.
