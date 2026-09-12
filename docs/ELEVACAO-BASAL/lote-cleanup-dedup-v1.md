# Lote chore/dshow-cleanup-dedup-v1 — limpeza objetiva (dedup + órfãos + rotas + piloto TS/JS)

Base: origin/main e4b05066 · branch: `chore/dshow-cleanup-dedup-v1` (sem merge, sem deploy, sem banco, sem flags).
Doutrina: nada é apagado — todo arquivo removido está em `/backup/dshow-cleanup-<ts>/removed/<caminho>` além do
histórico da branch (`git revert`/`git checkout <base> -- <caminho>`).

## Prioridade 1 — ganhos rápidos (feito)
| item | ação | evidência |
|---|---|---|
| GeoJSON `br-uf.topo.json` ×2 (154 KB cada, SHA idêntico) em `panel-ads/public/geo` e `panel-google-analytics/public/geo` | asset compartilhado `public/components/_shared/geo/br-uf.topo.json` (versionado, fora de qualquer `dist/` — nenhum `emptyOutDir` o alcança, que era o motivo documentado da cópia); consumidores `GeoMapaBrasil.tsx` e `MapaBrasil.tsx` apontam para `/components/_shared/geo/…`; cópias removidas | `vite build` dos dois painéis OK (dist sem `geo/`, bundle referencia o asset compartilhado); smoke em `#/panel-ads`, `#/panel-ads/geo`, `#/panel-google-analytics/localizacoes`: mapa renderiza, fetch `200 /components/_shared/geo/br-uf.topo.json`, 0 erros de página |
| CSS idênticos: `preloader/styles/main.css`=`index.css`, `app-shell/styles/main.css`=`index.css`, `panel-health-dashboard/styles/styles.css`=`index.css` | mantido `index.css` (canônico); removidos os 3 redundantes | únicas referências: `index.html:96,101` e `panel-health-dashboard/index.ts:80` → `index.css`; grep repo (ts/js/php/html/json/css/sw) sem referência aos removidos |
| 7 arquivos vazios (`types.js` de módulos só-tipos ×6, `app/config/config.php`) | removidos | nenhum `import`/`require` de `types.js` em `.js`; imports `./types.js` só em `.ts` com `import type` (resolvem para `types.ts`); nenhum `include/require` de `config.php` em `api/`/`app/`; nginx não referencia |
| `panel-stub-dev` | **mantido** | alcançável por DADOS: `ui_nav_items` tem 148 linhas (101 ativas) com `panel_id='panel-stub-dev'` (é o default gravado por `panel-criacao-botoes`); remover = 101 itens de navegação carregando módulo inexistente. Classificação: placeholder ativo por dados; `panel_registry.is_active=0` |
| duplicatas exatas por SHA-256 (14 grupos) | 3 grupos resolvidos (acima); os demais mantidos com motivo | ver tabela "Duplicatas mantidas" abaixo |

## Prioridade 2 — painéis (nenhuma remoção: todos alcançáveis; evidência do banco em leitura)
Mecanismo: sidebar/nav vêm do BANCO (`/api/ui/navigation.php?action=manifest` → `ui_nav_items`), rotas dinâmicas de
`/api/admin/orchestrator/?action=manifest`, e o `panel-loader` carrega **por convenção** `/components/panels/<id>/index.js`
(`main/adapters/panel-loader/panel-paths.ts:184-193`) — estar em `PANEL_ID_PATHS` é opcional.

| painel | classificação | evidência (banco = leitura em 2026-09-12; repo) |
|---|---|---|
| panel-gestao-paineis | **ativo por registro** (não remover) | `panel_registry` 1 linha ativa; `ui_nav_items` 1 linha ativa (`#/admin/gestao-paineis`); `panel_screenshots` 1; 0 refs estáticas no repo (alcance por convenção) |
| panel-orchestrator-manager | **ativo por registro** (não remover) | `panel_registry` ativo; `ui_nav_items` ativo; 173 screenshots em `panel_screenshots`; API `/api/admin/orchestrator` |
| panel-cotacao-shared | **biblioteca** | import estático `panel-cotacao/index.js:5`; sem `index.js`/`mount` próprio; chega via header (`currency-panel`, `currency-rotator` ativo no `manifest.json`) |
| panel-criacao-botoes | **ativo-sem-rota declarada** (alcance por convenção `#/panel-criacao-botoes`) | completo (`index.js` + mount + CSS); importa `panel-nav-admin/core/nav-adapter.js`; grava `ui_nav_items` |
| panel-google-analytics | **ativo** | `ui_nav_items`/`v_nav_complete` ativo; `api/google-analytics/`; `scripts/ga-smoke-all.sh`; omissão do `PANEL_ID_PATHS` é decisão documentada em `index.js:10-13` (convenção) |
| panel-lotties-management | **ativo com registro explícito** | `panel-paths.ts:86` + aliases `lotties`/`animacoes` (`:147-148`); `panel_registry` ativo |
| panel-relogio-mundial | **ativo (React) com fallback vanilla** | `world-clock-map/index.js:38` `ROUTE='#/panel-relogio-mundial'` (clique no relógio do header, `index.html:198`); `panel-relogio-mundial/index.js:79` cai em `world-clock-map/panel.js` |

"Corrigir o registro" (registro explícito em `PANEL_ID_PATHS`, item de `ui_nav_items` para `panel-relogio-mundial`) fica
para revisão: `panel-paths.ts` tem `.js` irmão **não reproduzível** por esbuild (drift TS/JS, ADR-004) e o runtime
consome `main/dist/main.bundle.js` congelado — editar a fonte aqui não muda o runtime e amplia o drift.

## Prioridade 3 — mapa canônico de rotas (definido; sem alteração de código nesta rodada)
Motivo de não alterar código: `router/registry/definitions/*.ts`, `router/core/dynamic-route-provider.ts`,
`sidebar/registry/items.manifest.ts`, `nav-rail/registry/items.ts` e `panel-paths.ts` têm `.js` irmãos que NÃO são
reproduzíveis por esbuild a partir do `.ts` atual (30–206 linhas de diff) e o runtime consome bundles `dist/`
congelados; a sidebar/nav real vem do banco (`ui_nav_items`, fora deste lote). Alterar só o `.ts` = drift sem efeito;
alterar `.js` à mão = proibido. Regra aplicada: alias/redirect legado→canônico; legado com consumidor é preservado.

| rota/integração | painel canônico | rota oficial | aliases (existentes) | legados com consumidor (preservar) | ajuste pendente (revisão) |
|---|---|---|---|---|---|
| /preferencias | panel-user-preferences | `#/preferencias` | `/preferences`, `/user-preferences`, `/minha-conta` (routes-admin.ts:36); id legado `panel-preferences` → mesmo arquivo (panel-paths.ts:77) | definição duplicada morta em routes-dashboard.ts:40 (perde no spread); `dynamic-route-provider.ts:76` usa id legado | remover a definição morta; provider → id canônico; `/profile` e `/settings` apontam para preferências (routes-admin.ts:39-40) — **precisa do Jhony** (`/profile` deveria ir a perfil?) |
| /meu-perfil | panel-user-profile | `#/meu-perfil` | `/my-profile`, `/perfil`; id legado `panel-profile` → mesmo arquivo (panel-paths.ts:76) | duplicada morta em routes-dashboard.ts:40; `dynamic-route-provider.ts:75` id legado; `permissions-guard/registry/routes.ts` sem policy para `meu-perfil` | idem + policy de `meu-perfil` |
| Pipedrive | panel-pipedrive (React; `api/pipedrive`) | `#/panel-pipedrive` | `#/pipedrive`, `#/integrations/pipedrive` (routes-dashboard.ts:35) | `/pipedrive`→panel-12 (routes-integrations.ts:34); nav-rail `panelId:'panel-18'` (items.ts:75); `ITEM_TO_PANEL` panel-18; widget panel-integration-pipedrive | colisão alias × path real em `#/pipedrive`; sidebar/nav-rail (banco) → `#/panel-pipedrive` |
| Bling | panel-bling (React) | `#/panel-bling` | — (header já usa; `index.ts:39-42` proíbe `#/bling`) | `/bling`→panel-08; sidebar fallback `#/bling`; widget panel-integration-bling | sidebar (banco) → `#/panel-bling`; `panel-paths` `'bling':'panel-bling'` já canônico |
| Google Calendar | panel-google-calendar | `#/panel-google-calendar` (+ `/hoje`, `/agenda`) | — | widget panel-integration-calendar; `/status-calendar` | nenhum (header e dashboard já canônicos) |
| Google Analytics | panel-google-analytics (`api/google-analytics`) | `#/panel-google-analytics/<tela>` | — | `/analytics`→panel-analytics (widget); `'analytics':'panel-02'`; intent `navrail.open.analytics`→`#/02` | nav-rail (banco) → `#/panel-google-analytics` |
| Google Ads | panel-ads (Ads Intelligence); panel-anuncios é produto distinto (Consultor, `api/anuncios`) | `#/panel-ads` · `#/panel-anuncios` | `#/ads`, `#/google-ads`, `#/adwords` · `#/anuncios` | `/google-ads`→panel-15; `'google-ads':'panel-12'`; widget panel-integration-adwords | colisão alias × path real em `#/google-ads`; sidebar (banco) → `#/panel-ads` |
| Google Drive | panel-integration-google-drive (único alvo do header; não há painel React) | `#/integrations/google-drive` | — | `/google-drive`→panel-16 (sidebar fallback); `'google-drive':'panel-13'` | três destinos para "Drive": unificar em `#/integrations/google-drive` (banco) |
| Mercado Livre | panel-mercadolivre | `#/panel-mercadolivre` (+ `/perguntas`, `/pedidos`) | `#/mercadolivre`, `#/mercado-livre` | widget panel-integration-mercado-livre | nenhum |
| Outlook | panel-outlook | `#/panel-outlook` | `#/outlook` | `panel-status-email-integration` (indicador), `/status-mail` | nenhum |
| Avatar Studio | panel-avatar-studio (buildado no deploy) | `#/panel-avatar-studio` | `#/avatar-studio`, `#/avatar` | `panel-user-preferences/avatar/*` é sub-recurso (upload/render), não duplicata | nenhum |
| DataTables | panel-datatables | `#/panel-datatables` | — | `table-engine`/`DataGrid.tsx` são biblioteca | nenhum |
| Meta Ads | panel-metaads | `#/panel-metaads` (+ `/leads`) | `#/metaads`, `#/meta-ads` | `/instagram`→panel-18 é Instagram, não Meta Ads | nenhum |
| Relógio Mundial | panel-relogio-mundial (React) + `world-clock-map` (trigger no header e fallback vanilla) | `#/panel-relogio-mundial` | `?wc=1` (deep-link, world-clock-map/index.js:63) | — | registrar em `PANEL_ID_PATHS`/banco (revisão) |

Padrões de colisão encontrados (todos preservados, nenhum removido): três camadas por integração (React `panel-<nome>`,
widget `panel-integration-<nome>` com `/api/status/*.php`, numérico `panel-08/12/13/15/16/18`); aliases que colidem
com paths reais (`#/pipedrive`, `#/google-ads`, `#/google-drive`, `#/mercado-livre`); sidebar/nav-rail com slugs antigos
enquanto header/dashboard já usam `#/panel-*`.

## Prioridade 4 — piloto TS/JS (verde): `public/koala/src` — ver `docs/ELEVACAO-BASAL/piloto-ts-js-koala.md`.

## Duplicatas mantidas (motivo funcional) e "precisa do Jhony"
- tsconfig.json ×11 (unidades de build Vite independentes) · useDados.ts ×2 (painéis Vite separados) ·
  `currency-rotator/index.ts` = `index.js` (o .ts é JS puro; runtime consome o .js) · `helpers/logger.ts` ×6 +
  `logger.js` ×6 + `logger.js` ×2 e `bootstrap/types.ts` = `bootstrap-integration/types.ts` (container-main: consolidar
  exige trocar imports em 12+ fontes e regerar `.js` sem pipeline reproduzível → M4).
- **precisa do Jhony**: (1) `panel-enterprise/observability/status` — `core/lifecycle.js` idênticos entre si mas cada
  `lifecycle.ts` difere (JS defasado vs TS, drift); decidir se seguem ativos. (2) `scripts/avatar/art-intake/fixtures/
  invalidos/blazer_ruim.json` é byte a byte igual a `validos/blazer.json` — fixture "inválido" que não invalida nada.
  (3) `/profile` → preferências (routes-admin.ts:39). (4) `panel-stub-dev` como default de 101 itens ativos em
  `ui_nav_items` (dado de produção). (5) registro explícito de `panel-relogio-mundial`/`panel-criacao-botoes`.

## Validação
TSC: repo inteiro (erros pré-existentes) contagem baseline × branch idêntica; `tsc -p public/koala` 0 erros ·
BUILD: `vite build` panel-ads, panel-google-analytics, koala OK · imports relativos quebrados: 53 pré-existentes no
baseline (dists/assets só no servidor, `worker-manager` removido antes, `tools/` sem node_modules) e os mesmos 53 na
branch (0 introduzidos) · 0 referências de runtime a arquivos removidos · assets 404: 0 (asset compartilhado e CSS
canônicos 200 no preview do worktree) · smoke das rotas alteradas OK · worktree limpo.

## Fechamento (briefing autônomo único, 2026-09-12) — itens A–D
Backup desta rodada: `/backup/cleanup-dedup-v1/20260912-0001/` (evidências; nada foi movido para `removed/` — nenhum arquivo apagado).

### A — `fixtures/invalidos/blazer_ruim.json` idêntico ao válido → **não alterar (é o manifesto válido do par)**
O gate técnico (`scripts/avatar/art-intake.mjs:50-57`) descobre pacotes `<nome>.svg + <nome>.json`; sem o `.json` o
pacote falha por "manifesto ausente" (`:103`) e não por causa da arte. O caso inválido de `fixtures/invalidos/` é o
**SVG** `blazer_ruim.svg` (documentado em `docs/AVATAR-STUDIO-5/art-requests/ART_INTAKE_SAMPLE_REPORT.md:64`); o `.json`
idêntico ao válido é intencional: garante que a única causa de falha seja a arte. Prova: `node scripts/avatar/art-intake.mjs
fixtures/invalidos` → `blazer_ruim: TECHNICAL_FAIL (8 violações)`, todas com `arquivo: blazer_ruim.svg` (gates SECURITY_P0/
CONTRACT), nenhuma sobre o manifesto; `node scripts/avatar/testes/art-intake.mjs` → "✓ art-intake verde". O teste consome só
`fixtures/validos/` (`testes/art-intake.mjs:19`). Referências ao `.json` inválido: nenhuma além do CLI por convenção de par.

### B — `core/lifecycle.js` ×3 (enterprise/observability/status) → **divergente por byte: não tocar**
Os três `lifecycle.ts` diferem só nos comentários de cabeçalho (MODULE/PURPOSE); os três `.js` são idênticos (sha
`0773fd03…`). Rebuild do `.ts` atual: esbuild transpile (`--format=esm`, targets es2017–esnext) DIFERE (24 linhas: o `.js`
vivo tem `function …` + `export { … }` no fim — estilo Rollup/Vite lib, não transpile); esbuild `--bundle --external:./constants.js`
DIFERE em 2 linhas (`var` vs `let`, comentário de origem). Ou seja: o `.js` é saída de outro toolchain (semanticamente
igual, byte-diferente). Além disso o runtime **carrega o `.js` irmão diretamente** (`core/index.js:3 export * from
"./lifecycle.js"`, sem `dist/`) — o padrão koala (remover o `.js` sombra) não se aplica: não há artefato de saída.
Recomendação: quando esses painéis ganharem build em pasta de saída (M4), regerar do `.ts`; até lá o `.js` é o vivo.

### C — `/profile` → Avatar Studio **[PARADO — origem de build]**
Alvo canônico confirmado: painel `panel-avatar-studio`, rota `/panel-avatar-studio` (aliases `#/avatar-studio`, `#/avatar`;
`routes-dashboard.ts:35`). A definição errada está em `routes-admin.ts:39` (`/profile` → `panel-user-preferences`).
**Onde a rota vive em runtime:** (1) `public/components/main/dist/main.bundle.js` (954.342 bytes, 2026-07-30; o lote `main`
de `vite.components.config.js:129-133` inlina `/components/router/registry/` via `keepInternal`) — contém
`"/profile": je("profile","Meu Perfil","panel-user-preferences",…)`; (2) `public/app/router/dist/app-router.bundle.js`
(2026-04-30, fora do git). **Prova de que o runtime não reconstrói a partir do `.ts`:** `scripts/deploy/deploy-as5.sh` não
builda `components/main` (só panel-avatar-studio, panel-dashboard e footer); e o rebuild do lote `main` a partir das fontes
atuais (`COMPONENT=main vite build`, ROOT apontado para o worktree) gera 903.411 bytes, sha `545b1533…` ≠ vivo `2777df85…`
(com avisos de namespaces conflitantes) → o bundle vivo **não é reproduzível** das fontes de hoje. Editar `routes-admin.ts`
seria drift sem efeito; editar o `.js`/bundle é proibido. Tripwire do briefing acionado: **parado neste item**. Pré-requisito
para a correção: acertar a origem de build do lote `main` (reproduzir o bundle vivo ou assumir um novo baseline com
validação) e incluir esse build no deploy. Evidência: `/backup/cleanup-dedup-v1/20260912-0001/evidencias/item-c-main-bundle/`.
C1 (defs duplicadas mortas de `/preferencias`/`/meu-perfil` em `routes-dashboard.ts:40`) fica junto, pelo mesmo motivo.

### D — registrar `panel-relogio-mundial` e `panel-criacao-botoes` → **não registrado (latente), documentado**
`panel-criacao-botoes`: completo (`index.js` com `mount/unmount`, adapters, CSS), carrega por convenção `#/panel-criacao-botoes`.
`panel-relogio-mundial`: React com `dist/` presente no servidor (manifest de 2026-07-30, marcado DEFASADO no baseline
BASAL) e fallback vanilla via `world-clock-map`; já alcançado pelo clique no relógio do header. Nenhum dos dois em
`panel_registry`, `ui_nav_items`, `navigation_items`, `navrail_items` (leitura). O registro explícito vive em
`main/adapters/panel-loader/panel-paths.ts` → mesmo bundle `main` do Item C (não reproduzível, não rebuildado no deploy) →
registrar na fonte não muda o runtime. Recomendação: registrar via banco/`ui_nav_items` (fora deste lote, exige decisão) ou
junto com a reconciliação do lote `main`.
