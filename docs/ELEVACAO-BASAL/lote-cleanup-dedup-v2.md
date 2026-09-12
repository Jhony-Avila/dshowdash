# Lote chore/dshow-cleanup-dedup-v2 — deduplicação e limpeza estrutural (entrega limpa)

Base: `origin/main` e09d2821 (2026-09-12) · branch isolada `chore/dshow-cleanup-dedup-v2` (worktree próprio; o worktree de
produção e a `chore/dshow-cleanup-dedup-v1` não foram tocados; sem merge, sem deploy, sem banco, sem flags).
Doutrina: nada é apagado sem cópia — removidos em `/backup/cleanup-dedup-v2/<carimbo>/removed/` além do histórico git.

## 1. Entrega limpa (transporte seletivo)
Transportados por cherry-pick, sem conflito, SOMENTE os 3 commits seguros aceitos pela auditoria: `5cdea77f` (TopoJSON
compartilhado em `components/_shared/geo`), `99451a87` (3 CSS idênticos removidos), `b4ee306a` (7 arquivos vazios removidos).
Não transportados: redirect (`/profile`, já em `main` por outro lote), rollout, docs históricas e demais commits da v1.
Prova adicional nesta rodada: `vite build` de `panel-ads` e `panel-google-analytics` no worktree OK, bundles referenciando
`/components/_shared/geo/br-uf.topo.json` (o `deploy-as5.sh` não rebuilda esses dois painéis; os dists servidos hoje
continuam com a cópia local, logo nada quebra até o próximo build deles — o asset compartilhado já está versionado).

## 2. Piloto TS/JS do Koala — COMPLETO
Ver `docs/ELEVACAO-BASAL/piloto-ts-js-koala.md`. Resumo: 4 `.js` irmãos removidos (esbuild do `.ts` = `.js` byte a byte;
35 imports internos sem extensão; nenhum consumidor externo), `resolve.extensions` TS-first no `vite.config.js`, colisão de
caixa `dataGrid.tsx` → `dataGridCore.tsx` (7 imports), dist ANTES/DEPOIS **byte a byte idêntico** ao servido em produção
(`index-TI7deeGy.js` dae7c1fb…, `index-Bz_oppBd.css` 8ed119c4…, `index.html` b7cb6b35…), `tsc -p public/koala` 1 → **0 erros**,
0 `.js` em `src/`, 0 imports quebrados. Padrão de migração documentado (não ampliado aos 5.542 pares).

## 3. Rotas duplicadas `/preferencias` e `/meu-perfil` — resolvidas na fonte
Causa: definidas em `routes-dashboard.ts` (ids legados `panel-profile`/`panel-preferences`) **e** em `routes-admin.ts`
(`panel-user-preferences`/`panel-user-profile`); o resultado dependia da ordem do spread em `definitions/index.ts` (admin vencia).
Ação: definições concorrentes removidas de `routes-dashboard.ts` (junto com `/seguranca` e `/sessoes`, da mesma linha, que
apontavam para painéis inexistentes `panel-security`/`panel-sessions`); canônicas em `routes-admin.ts` com aliases explícitos
(`/preferences`, `/user-preferences`, `/minha-conta` · `/my-profile`, `/perfil`) + alias `/sessoes` → `/sessoes-ativas`
(link vivo em `action-bindings`); `ITEM_TO_PANEL` com ids canônicos; `panel-paths.ts` sincronizado com o `.js` (que estava À
FRENTE em ads/pipedrive — drift real corrigido na fonte); ids legados em `PANEL_ID_PATHS` marcados COMPATIBILIDADE → sucessor;
policy do permissions-guard para `meu-perfil`/`my-profile`; skeleton para `panel-user-profile`; módulos mortos
`router/core/dynamic-route-provider` e `legacy-inference` removidos (0 importadores, ausentes dos bundles).
Prova: `node scripts/router/check-routes-registry.mjs` (importa os mesmos `routes-*.js` que o bundle inlina; detecta colisão
de chave entre módulos, alias × rota real, alias duplicado, alias circular, rota sem painel) — ANTES: 2 colisões de chave +
3 alias×rota + 1 alias duplicado; DEPOIS: **147 rotas, TODOS PASS** (após a remoção de `/termos`).
**Limite conhecido (decisão #89):** os bundles `main`/`app-router` são congelados e não reproduzíveis; o runtime já resolvia
para as definições admin (mesmo comportamento), logo a mudança é de fonte, sem efeito funcional até o rebuild do lote `main`.
Os `.js` irmãos foram espelhados linha a linha (drift vs esbuild não cresceu: 50/8/18/14/24 linhas, só comentários/legado).

## 4. Registro canônico dos módulos — no registro existente (código), inventário derivado
Não foi criado registro concorrente: a fonte é o registro de rotas (`router/registry/definitions/routes-*.ts` → `.js` inlinado
nos bundles) + os diretórios de painéis; o banco (`ui_nav_items`/`app_nav_route`/`navrail_items`) segue sendo a navegação viva.
Consolidado no código: rotas legadas `/bling`, `/google-ads`, `/google-drive`, `/pipedrive` deixam de montar painéis numéricos
com OUTRO conteúdo (`panel-08` Alertas, `panel-15` Overview, `panel-16` Fornecedores, `panel-12` Jobs) e apontam para o sucessor
(`panel-bling`, `panel-ads`, `panel-integration-google-drive`, `panel-pipedrive`) como COMPATIBILIDADE; aliases que colidiam
com rotas reais removidos; rotas oficiais que faltavam registradas (`/panel-bling`, `/panel-google-calendar`,
`/panel-google-analytics`, `/panel-relogio-mundial`); fallbacks de sidebar/nav-rail (código) → rotas oficiais.
A tabela por produto (13 famílias, painel canônico único, widgets/status separados, compatibilidade, API, flags) está em
`docs/ELEVACAO-BASAL/inventario-paineis-101.md` (seção "Registro canônico por produto"), regenerável.
Pendências de DADOS (banco, fora do lote — precisa do Jhony): `app_nav_route` `google-ads`→`panel-12`, `google-drive`→`panel-13`,
`pipedrive`→`panel-18`, `bling`→`panel-04`, `analytics`→`panel-analytics`, `automacoes/mercado-livre`→`panel-03`;
`navrail_items` `pipedrive`→`panel-18`, `analytics`→`panel-02`; `admin/gestao-paineis`→`panel-nav-admin` (regressão vs 2026-03-29).

## 5. Painéis — 101/101 inventariados e classificados
Gerador `scripts/panels/inventario-paineis.mjs` (+ `dump-registros-nav.php`, snapshot só leitura do banco em
`docs/ELEVACAO-BASAL/evidencias/registros-nav-20260912.json`; decisões manuais justificadas em
`scripts/panels/classificacao-manual.json`). Reconciliação: 101 = 101 (nenhum adicionado/removido; `koala-docs` existe fora do
prefixo `panel-`). Totais: CANONICAL_ACTIVE 97 · COMPATIBILITY_ALIAS 1 (`panel-analytics` → sucessor `panel-google-analytics`) ·
SHARED_LIBRARY 1 (`panel-cotacao-shared`) · INTERNAL_UTILITY 2 (`panel-stub-dev` placeholder por dados — 101 itens ativos de
`ui_nav_items`; `panel-criacao-botoes`, sucessor `panel-nav-admin` já definido pelos dados) · DEV_ONLY 0 · INCOMPLETE 1
(`panel-lotties-management`: mount falha em produção e no preview com o mesmo erro pré-existente — `Cannot set properties of null
(setting 'hidden')`; `LOTTIES_BASE_PATH` corrigido para `/assets/animacoes/`; mantido por ter loader e registro persistido; decisão
consertar a UI ou remover precisa do Jhony) · ORPHAN_CONFIRMED 0 · REMOVED 0. Os 19 numéricos têm finalidade própria (config.json) e continuam ativos por rota, registro e navegação do banco;
os que eram alvo de rotas de integração erradas ficaram com o "legado relacionado" anotado e a rota corrigida no código.
`panel-orchestrator-manager`: os imports "ausentes" (`timeline-panel.js`, `metrics-dashboard.js`) são `import()` dinâmicos com
`.catch` e os alvos EXISTEM em `/core/ui-orchestrator/components/` (servido do document root; `public/core` não é rastreado por
design) — não ausentes; painel canônico ativo (rota no banco, API viva, screenshots diários).
Integridade: BROKEN_ROUTES=0 — a única rota quebrada era `/termos` → `panel-termos` (painel que NUNCA existiu: `git log` vazio;
quebrada em produção desde sempre). "Termos de Uso" é um MODAL do ui-orchestrator (intent `footer.open.termos` → `overlay-adapter`
`'termos'`), aberto pelo botão do footer via `ui:action footer:termos`; a rota foi removida do registro (`routes-dashboard.ts` + `.js`)
e o fallback sem EventBus de `footer/_shared/event-helpers.ts` deixa de navegar para ela (retorna `null`, como `logout`; `.js`
regenerado 1:1). Nenhuma funcionalidade válida removida: o modal continua igual. · BROKEN_LOADERS=0 · BROKEN_NAVIGATION_ENTRIES=0 nas tabelas com consumidor
(`navigation_items` não tem consumidor em `api/`/`public/`: 2 linhas apontam para ids inexistentes — tabela morta, nota de dados).

## 6. Validação (executada; ver `/backup/cleanup-dedup-v2/<carimbo>/evidencias/`)
- `tsc --noEmit` repo inteiro: baseline 3364 erros pré-existentes → 3362 (0 novos; 2 resolvidos pelos módulos mortos removidos).
- `tsc -p public/koala`: 0 erros. Builds no worktree: koala (dist idêntico), panel-ads, panel-google-analytics, panel-dashboard,
  panel-avatar-studio (as unidades que o `deploy-as5.sh` constrói; o footer não tem `package.json`/vite — o deploy também o pula) —
  ver logs `build-*.log`.
- Imports relativos quebrados (scanner): baseline 130 pré-existentes (dists/`core` só no servidor) → 130, **0 introduzidos**.
- Assets/módulos referenciados: `/components/_shared/geo/br-uf.topo.json` 200, `/assets/animacoes/*.json` 200, caminho antigo
  `/components/animacoes/` 404 (bug corrigido), arquivos removidos sem referência de runtime.
- Smoke das rotas/módulos no shell real autenticado (preview do worktree + baseline produção): `#/preferencias`, `#/meu-perfil`,
  `#/panel-cotacao`, `#/panel-google-analytics`, `#/panel-relogio-mundial`, `#/panel-orchestrator-manager`, `#/panel-gestao-paineis`,
  `#/panel-bling`, `#/panel-pipedrive` montam sem erro de página no preview E na produção (9/9 iguais); `#/panel-lotties-management`
  falha IGUAL nos dois (erro pré-existente, não introduzido pelo lote) — script `scripts/panels/smoke-rotas-preview.mjs`.
- `check-routes-registry`: TODOS PASS. `origin/main` é ancestral da entrega; remote = commit final; worktree limpo.

## Rollback
`git revert` por commit (todos temáticos) ou `git checkout e09d2821 -- <caminho>`; cópias dos removidos em
`/backup/cleanup-dedup-v2/<carimbo>/removed/`. Nada foi deployado: produção segue em `main`.
