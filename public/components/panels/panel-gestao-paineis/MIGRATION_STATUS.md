# MIGRATION STATUS — panel-gestao-paineis

**Data:** 2026-03-30
**Status:** CONCLUIDO (v1.9.0 — 8 MELHORIAS UX)
**Versao:** 1.9.0

---

## v1.9.0 — 8 MELHORIAS UX (2026-03-30)

### Implementacao

#### MELHORIA 1 — Thumbnail click navega para rota do painel
- **Status:** IMPLEMENTADO (2026-03-30)
- `panel-card.ts` v2.1.0: `data-action="open-panel"` + `data-panel-route` no `.pgp-card__thumb`
- `events.ts` v1.2.0: handler `open-panel` usa `window.location.hash` para navegar
- Se painel nao tem rota, click continua abrindo modal de detalhes

#### MELHORIA 2 — Botao "Abrir Painel" no modal
- **Status:** IMPLEMENTADO (2026-03-30)
- `panel-detail-modal.ts` v1.1.0: botao `<a>` com `target="_blank"` no header do modal
- Visivel apenas se painel tem rota definida
- CSS: `.pgp-btn--open-panel` com estilo azul, icone external-link

#### MELHORIA 3 — Ordenacao na toolbar com persistencia em localStorage
- **Status:** IMPLEMENTADO (2026-03-30)
- `filter-bar.ts` v1.1.0: dropdown sort trigger com opcoes Nome, Categoria, Screenshot, Status
- `data.ts` v1.1.0: funcao `sortPanels()` client-side + `reSortPanels()` para re-ordenar sem reload
- `events.ts` v1.2.0: handler `open-sort-select` usa custom select dropdown
- Toggle asc/desc ao clicar no mesmo campo; datas default desc
- Persistencia via `localStorage` key `pgp-sort-preference`
- CSS: `.pgp-sort-trigger` com icone sort + chevron

#### MELHORIA 4 — Badge DESATUALIZADO (amarelo) em screenshots > 7 dias
- **Status:** IMPLEMENTADO (2026-03-30)
- `panel-card.ts` v2.1.0: funcao `isScreenshotOutdated()` compara `thumbnail_updated_at` com 7 dias
- Badge `.pgp-badge--outdated` amarelo (#fbbf24) sobre thumbnail
- CSS: `_panel-card.css` com estilo do badge

#### MELHORIA 5 — Historico de Screenshots no modal
- **Status:** IMPLEMENTADO (2026-03-30)
- `panel-detail-modal.ts` v1.1.0: secao "Historico de Screenshots" com loading state
- `api-client.ts` v1.2.0: `fetchScreenshotHistory()` via GET `/api/admin/panels/:id/screenshots`
- `data.ts` v1.1.0: `loadScreenshotHistory()` carrega ultimos 5 screenshots
- `events.ts` v1.2.0: handler `load-screenshot-history` auto-triggered na abertura do modal
- `index.ts`: auto-click no elemento de historico ao abrir modal
- Exibe data + tamanho do arquivo para cada screenshot
- CSS: `.pgp-screenshot-history__*` estilos dark theme

#### MELHORIA 6 — Recaptura manual (verificacao)
- **Status:** VERIFICADO (2026-03-30)
- Botao camera (`data-action="screenshot"`) ja funciona corretamente:
  - `events.ts`: handler chama `handleScreenshotRequest(panelId, signal)`
  - `screenshot.ts`: `handleScreenshotRequest()` verifica pending, gera URL fallback, chama API
  - `screenshot-client.ts`: `requestScreenshot()` faz POST via `triggerScreenshot()`
  - `api-client.ts`: `triggerScreenshot()` POST `/api/admin/panels/:id/screenshot`
  - Feedback visual: card fica `.pgp-card--pending` com overlay escuro e spinner
  - Auto-clear do pending apos estimated_seconds + 10s buffer

#### MELHORIA 7 — Captura paralela no capture-all.mjs
- **Status:** IMPLEMENTADO (2026-03-30)
- `capture-all.mjs` v2.0.0: classe `Semaphore` com limite configuravel
- Padrao: 3 capturas simultaneas (--concurrency=N)
- `Promise.all()` com todas as tasks, semaforo controla concorrencia
- Reducao estimada: ~20min → ~7min para ~60 paineis
- Relatorio inclui campo `concurrency` no JSON de saida

#### MELHORIA 8 — Busca em tempo real (verificacao)
- **Status:** VERIFICADO (2026-03-30)
- `search-input.ts`: debounce 300ms via `SEARCH_DEBOUNCE_MS` constante
- `events.ts`: handler `search` em `_handleInput` chama debounce → `applyFilter` → `loadPanels`
- Filtra por titulo e panel_id (server-side via `?search=` param)
- Funcionalidade confirmada correta, sem alteracao necessaria

### Arquivos alterados (v1.9.0)
| Arquivo | Mudanca |
|---------|---------|
| `ui/grid/panel-card.ts` + `.js` | v2.1.0 — onclick thumbnail, badge DESATUALIZADO |
| `ui/modal/panel-detail-modal.ts` + `.js` | v1.1.0 — botao Abrir Painel, historico screenshots, renderScreenshotHistory() |
| `ui/filters/filter-bar.ts` + `.js` | v1.1.0 — sort trigger, getSavedSort/saveSort, SortConfig types |
| `handlers/events.ts` + `.js` | v1.2.0 — handlers open-panel, open-sort-select, load-screenshot-history |
| `handlers/data.ts` + `.js` | v1.1.0 — sortPanels(), loadScreenshotHistory(), reSortPanels() |
| `services/api-client.ts` + `.js` | v1.2.0 — fetchScreenshotHistory() |
| `index.ts` + `.js` | auto-trigger screenshot history no modal |
| `styles/_panel-card.css` | Badge .pgp-badge--outdated |
| `styles/_panel-filters.css` | Sort trigger .pgp-sort-trigger |
| `styles/_panel-modal.css` | Botao .pgp-btn--open-panel, historico .pgp-screenshot-history__* |
| `tools/screenshot/capture-all.mjs` | v2.0.0 — captura paralela com Semaphore |

### Validacao (v1.9.0)
| Teste | Resultado |
|-------|-----------|
| `esbuild panel-card.ts` | PASS |
| `esbuild panel-detail-modal.ts` | PASS |
| `esbuild filter-bar.ts` | PASS |
| `esbuild events.ts` | PASS |
| `esbuild data.ts` | PASS |
| `esbuild api-client.ts` | PASS |
| `esbuild index.ts` | PASS |
| `node --check` (todos 7 .js) | PASS |
| `node --check capture-all.mjs` | PASS |

### Contratos preservados (v1.9.0)
- `renderPanelCard(panel, isPending)` — assinatura mantida
- `renderDetailModal(panel, categories, isPending)` — assinatura mantida
- `renderFilterBar(filters, categories, totalFiltered)` — assinatura mantida
- `setupEventListeners(container, abortController)` — assinatura mantida
- `getModalFormData(container)` — assinatura mantida
- Novos exports: `renderScreenshotHistory()`, `getSavedSort()`, `saveSort()`, `loadScreenshotHistory()`, `reSortPanels()`, `fetchScreenshotHistory()`
- Novos data-actions: `open-panel`, `open-sort-select`, `load-screenshot-history`
- Store — sem alteracao na API
- Todos os data-actions existentes mantidos

---

## v1.8.0 — CARD LAYOUT REDESIGN (2026-03-30)

### Implementacao

#### Redesenho completo do layout visual dos cards
- **Status:** IMPLEMENTADO (2026-03-30)
- **Objetivo:** Cards com thumbnail dominante e informacoes sobrepostas (overlay pattern)
- **Novo layout:**
  1. **THUMBNAIL** ocupa toda a parte superior do card com aspect-ratio 16:9, bordas arredondadas no topo
  2. **OVERLAYS** gradiente escuro sutil no topo e no rodape sobre a thumbnail
  3. **BADGES** canto superior ESQUERDO sobre a thumbnail: badge ATIVO (verde) ou INATIVO (vermelho) + badge de categoria (fundo escuro semitransparente com backdrop-blur)
  4. **ICONES** centro superior sobre a thumbnail: icone olho (toggle ativo) + icone camera (capturar screenshot) — pequenos (28px), discretos, fundo semitransparente, aparecem no hover
  5. **TIMESTAMP** canto superior DIREITO sobre a thumbnail: "ha X horas/dias" em texto 10px branco semitransparente com fundo pill
  6. **FOOTER** compacto com fundo ligeiramente diferente (`rgba(255,255,255,0.03)`): nome do painel 14px bold esquerda + versao v1.0.0 cinza 11px direita
  7. **HOVER** no card: borda roxa sutil (`rgba(124,58,237,0.45)`) + leve elevacao (box-shadow roxo)
- **Removido:** Secao `__body` com header/meta/actions/footer separados — tudo integrado no overlay da thumbnail + footer compacto

### Arquivos alterados (v1.8.0)
| Arquivo | Mudanca |
|---------|---------|
| `ui/grid/panel-card.ts` + `.js` | v2.0.0 — Estrutura HTML redesenhada: overlays, badges/icons/timestamp dentro da thumbnail, footer compacto |
| `styles/_panel-card.css` | v2.0.0 — CSS completo redesenhado: gradientes, posicionamento absoluto overlay, hover roxo, footer flex |

### Validacao (v1.8.0)
| Teste | Resultado |
|-------|-----------|
| `esbuild panel-card.ts` | PASS |
| `node --check panel-card.js` | PASS |

### Contratos preservados (v1.8.0)
- `renderPanelCard(panel, isPending)` — assinatura mantida
- `renderStatusBadge(isActive)` — chamada mantida (posicao movida para overlay)
- `renderCategoryBadge(category)` — chamada mantida (posicao movida para overlay)
- `renderScreenshotAge(isoDate)` — chamada mantida (posicao movida para overlay)
- `renderToggleButton(panelId, isActive)` — chamada mantida (posicao movida para overlay)
- `renderScreenshotButton(panelId, isPending)` — chamada mantida (posicao movida para overlay)
- `data-action` attributes mantidos: `toggle-active`, `screenshot` — handlers de eventos continuam funcionando
- `data-panel-id` no `<article>` mantido
- Classes CSS de estado mantidas: `.pgp-card--inactive`, `.pgp-card--pending`
- Store, events, modal, grid — sem alteracao

---

## v1.7.0 — CUSTOM SELECT DROPDOWNS (2026-03-30)

### Implementacao

#### Substituicao de `<select>` nativos por dropdowns customizados
- **Status:** IMPLEMENTADO (2026-03-30)
- **Problema:** Selects nativos (`<select>`) nao permitem customizacao completa do dropdown (opcoes com fundo branco em alguns browsers, sem animacoes, sem hover roxo consistente)
- **Solucao:** Novo componente `CustomSelect` baseado no pattern do panel-nav-admin, com prefixo CSS `pgp-cs`
- **Caracteristicas:**
  1. Fundo `#1e1e2e` (dark theme consistente)
  2. Opcoes com hover roxo `rgba(124,58,237,0.15)` e texto `#c4b5fd`
  3. Animacao fade+scale no abrir/fechar (pgp-cs-open, pgp-cs-close keyframes)
  4. Busca (searchable) para filtro de categorias com 6+ opcoes
  5. Navegacao por teclado: ArrowUp/Down, Enter, Escape
  6. Posicionamento fixo com deteccao de colisao (bottom/top)
  7. Opcao selecionada com checkmark e cor `#a78bfa`
  8. Color dots no filtro de status (verde ativos, vermelho inativos, cinza todos)
  9. Chevron rotaciona 180° quando dropdown esta aberto
- **Trigger buttons:** `<button>` com classes `.pgp-category-filter` / `.pgp-status-filter` + `.pgp-cs-trigger`
- **Integração com eventos:** Actions `open-category-select` e `open-status-select` no click handler
- **Cleanup:** `closeCustomSelect()` chamado no `cleanupEventListeners()`

### Arquivos alterados (v1.7.0)
| Arquivo | Mudanca |
|---------|---------|
| `ui/custom-select.ts` + `.js` | NOVO — componente dropdown customizado (pgp-cs) |
| `ui/filters/category-filter.ts` + `.js` | v2.0.0 — `<select>` substituido por trigger `<button>` |
| `ui/filters/status-filter.ts` + `.js` | v2.0.0 — `<select>` substituido por trigger `<button>` |
| `handlers/events.ts` + `.js` | v1.1.0 — handlers para open-category-select/open-status-select, import custom-select, removido `change` listener nativo |
| `styles/_panel-filters.css` | v1.3.0 — CSS trigger buttons, popover pgp-cs, animacoes, scrollbar |

### Validacao (v1.7.0)
| Teste | Resultado |
|-------|-----------|
| `node --check custom-select.js` | PASS |
| `node --check category-filter.js` | PASS |
| `node --check status-filter.js` | PASS |
| `node --check events.js` | PASS |
| `node --check filter-bar.js` | PASS |

### Contratos preservados (v1.7.0)
- `renderCategoryFilter(categories, selected)` — assinatura mantida (retorno mudou de `<select>` para `<button>`)
- `renderStatusFilter(selected)` — assinatura mantida (retorno mudou de `<select>` para `<button>`)
- `renderFilterBar(filters, categories, totalFiltered)` — sem alteracao
- `setupEventListeners(container, abortController)` — assinatura mantida (novos cases internos)
- `cleanupEventListeners()` — assinatura mantida (chama closeCustomSelect)
- Store, modal, grid — sem alteracao

---

## v1.6.0 — ONERROR PLACEHOLDER FIX (2026-03-30)

### Correcao implementada

#### FIX — Cards com thumbnail quebrada mostram fundo vazio (sem placeholder)
- **Status:** CORRIGIDO (2026-03-30)
- **Problema:** O `onerror` handler inline do `<img>` usava `insertAdjacentHTML` com SVG contendo aspas duplas dentro do atributo `onerror="..."`, quebrando o HTML. Cards cuja imagem falhava ficavam com area de thumbnail vazia (sem placeholder SVG nem label)
- **Causa raiz:** `PLACEHOLDER_SVG` contem `width="48"` etc — as aspas duplas terminam prematuramente o atributo `onerror`
- **Solucao (v1.3.0 panel-card.ts):**
  1. Fallback SVG+label agora renderizado como `<div class="pgp-card__thumb-fallback">` — SEMPRE presente no DOM, oculto por CSS
  2. `onerror` simplificado: apenas `this.parentElement.classList.add('...');this.remove();` — sem HTML injection inline
  3. CSS controla visibilidade: `.pgp-card__thumb-fallback` oculto por padrao, visivel quando parent tem `--placeholder`
  4. `img` escondido via CSS quando parent tem `--placeholder` (safety)
- **Resultado:** Qualquer falha de imagem (404, rede, formato) resulta em placeholder visivel (SVG + titulo do painel), sem dependencia de escaping correto em atributos HTML

### Arquivos alterados (v1.6.0)
| Arquivo | Mudanca |
|---------|---------|
| `ui/grid/panel-card.ts` + `.js` | v1.3.0 — fallback block como elemento DOM oculto, onerror simplificado |
| `styles/_panel-card.css` | v1.2.0 — `.pgp-card__thumb-fallback` hidden/shown via `--placeholder` class |

### Validacao (v1.6.0)
| Teste | Resultado |
|-------|-----------|
| `node --check panel-card.js` | PASS |

### Contratos preservados (v1.6.0)
- `renderPanelCard(panel, isPending)` — assinatura mantida
- Classes CSS existentes mantidas: `.pgp-card__thumb`, `.pgp-card__thumb--placeholder`, `.pgp-card__thumb-label`
- Nova classe: `.pgp-card__thumb-fallback` (nao quebra seletores existentes)

---

## v1.5.0 — DARK THEME DROPDOWN OPTIONS (2026-03-30)

### Correcao implementada

#### FIX — Opcoes do select (dropdown aberto) com fundo branco do browser
- **Status:** CORRIGIDO (2026-03-30)
- **Problema:** Ao abrir os `<select>` de categoria e status, as opcoes exibiam fundo branco padrao do browser, quebrando o tema escuro
- **Fix em `_panel-filters.css` (v1.2.0):**
  1. `option`: background `#1e1e2e`, cor `#f1f5f9`, padding `8px 12px`
  2. `option:hover`: background `rgba(255,255,255,0.08)` (destaque sutil)
  3. `option:checked`: background `rgba(124,58,237,0.2)`, cor `#a78bfa` (roxo — opcao selecionada)
  4. Firefox: `:-moz-focusring` para manter texto legivel
  5. Webkit scrollbar: fundo `#1e1e2e`, thumb `rgba(255,255,255,0.15)` com border-radius
- **Nota:** Selects sao nativos (`<select>`), nao custom dropdowns — estilizacao via `option` pseudo-classes

### Arquivos alterados (v1.5.0)
| Arquivo | Mudanca |
|---------|---------|
| `styles/_panel-filters.css` | Dark theme para option, option:hover, option:checked, scrollbar, Firefox fix |

### Contratos preservados (v1.5.0)
- Todas as classes CSS mantidas — nenhuma classe adicionada ou removida
- HTML em `category-filter.js` e `status-filter.js` sem alteracao
- Selects nativos — sem mudanca de estrutura

---

## v1.4.0 — DARK THEME BARRA DE FILTROS (2026-03-30)

### Correcao implementada

#### FIX — Barra de filtros com fundo branco/claro
- **Status:** CORRIGIDO (2026-03-30)
- **Problema:** Filter bar, inputs e selects usavam CSS variables com fallbacks claros (#111113, #1a1a1d, rgba 0.04 borders), resultando em aparencia inconsistente com o tema escuro do sistema
- **Fix em `_panel-filters.css` (v1.1.0):**
  1. `.pgp-filter-bar`: background `transparent` (era `#111113`), sem borda branca
  2. `.pgp-search-input`: background `#1e1e2e`, borda `rgba(255,255,255,0.1)`, texto `#f1f5f9`, placeholder `rgba(255,255,255,0.4)`
  3. `.pgp-search__icon`: cor `rgba(255,255,255,0.5)` (icone branco visivel)
  4. `.pgp-category-filter`, `.pgp-status-filter`: background `#1e1e2e`, borda `rgba(255,255,255,0.1)`, texto `#f1f5f9`, seta dropdown branca via SVG data-URI
  5. `.pgp-filter-count`: cor `rgba(255,255,255,0.5)` (confirmado)
  6. Hover em campos: borda `rgba(255,255,255,0.2)`
  7. Focus em campos: borda `#7c3aed` (roxo)
  8. Removidos CSS variables com fallbacks inconsistentes — valores explicitos dark theme

### Arquivos alterados (v1.4.0)
| Arquivo | Mudanca |
|---------|---------|
| `styles/_panel-filters.css` | Dark theme explicito: background, bordas, cores, hover, focus, dropdown arrow |

### Contratos preservados (v1.4.0)
- Todas as classes CSS mantidas: `.pgp-filter-bar`, `.pgp-search`, `.pgp-search-input`, `.pgp-category-filter`, `.pgp-status-filter`, `.pgp-filter-count`, `.pgp-btn--export`, `.pgp-kpi-*`
- Nenhuma classe adicionada ou removida
- HTML em `filter-bar.js` sem alteracao

---

## v1.3.0 — AJUSTES FINAIS (2026-03-30)

### Melhorias implementadas

#### AJUSTE 1 — KPIs com labels confirmados e recompilados
- **Status:** VERIFICADO + RECOMPILADO (2026-03-30)
- **Investigacao:** HTML em `_renderKPIs()` (index.ts:64-82) gera corretamente:
  - `div.pgp-kpi > span.pgp-kpi__value` (numero) + `span.pgp-kpi__label` (texto)
  - 4 KPIs: Total, Ativos, Inativos, Sem Screenshot
- **CSS:** `_panel-filters.css` tem `.pgp-kpi__value` (32px, bold) e `.pgp-kpi__label` (12px, uppercase)
- **Fix:** Recompilado index.js com esbuild para garantir sincronia TS→JS

#### AJUSTE 2 — Thumbnail onerror com placeholder SVG
- **Status:** CORRIGIDO (2026-03-30)
- **Investigacao DB:** `thumbnail_path` para panel-03..12 = `screenshots/panel-XX/latest.jpg` — correto
- **Investigacao HTTP:** Todos retornam HTTP 200 via `https://dshowdash.com.br/storage/media/images/screenshots/panel-XX/latest.jpg`
- **Problema real:** `onerror` handler antigo removia o `<img>` mas nao inseria conteudo placeholder — card ficava com area de thumbnail vazia
- **Fix:** `panel-card.ts` — onerror agora insere SVG placeholder + label via `insertAdjacentHTML('afterbegin', ...)` antes de remover o `<img>`
- **Resultado:** Se imagem 404 ou falha, card mostra placeholder SVG com nome do painel (mesmo comportamento do card sem thumbnail)

#### AJUSTE 3 — Botao Exportar JSON
- **Status:** IMPLEMENTADO (2026-03-30)
- **Problema:** Nao existia botao de exportacao
- **Fix 1:** `ui/filters/filter-bar.ts` — botao "Exportar" adicionado ao filter-bar com icone SVG download
- **Fix 2:** `handlers/events.ts` — handler `export-panels` + funcao `_exportPanelsJSON()`:
  - Exporta todos os paineis carregados no store
  - Formato: JSON com `exported_at`, `total`, `filters`, `panels[]`
  - Campos: panel_id, title, description, category, is_active, version, author, route, tags, sort_order, thumbnail_url, last_screenshot_at, created_at, updated_at
  - Download automatico: `paineis_export_YYYY-MM-DD.json`
- **Fix 3:** `styles/_panel-filters.css` — estilo `.pgp-btn--export` com hover roxo

### Arquivos alterados (v1.3.0)
| Arquivo | Mudanca |
|---------|---------|
| `index.ts` + `.js` | Recompilado (KPIs corretos, sincronizado) |
| `ui/grid/panel-card.ts` + `.js` | onerror handler agora insere SVG placeholder |
| `ui/filters/filter-bar.ts` + `.js` | Botao "Exportar" adicionado |
| `handlers/events.ts` + `.js` | Handler export-panels + _exportPanelsJSON() |
| `styles/_panel-filters.css` | CSS .pgp-btn--export |

### Validacao (v1.3.0)
| Teste | Resultado |
|-------|-----------|
| `node --check index.js` | PASS |
| `node --check panel-card.js` | PASS |
| `node --check filter-bar.js` | PASS |
| `node --check events.js` | PASS |
| Thumbnails HTTP (panel-03..12) | Todos 200 OK |
| DB thumbnail_path (panel-03..12) | Todos corretos |

### Contratos preservados (v1.3.0)
- `renderPanelCard(panel, isPending)` — assinatura mantida
- `renderFilterBar(filters, categories, totalFiltered)` — assinatura mantida (exportar adicionado internamente)
- `_renderKPIs(state)` — sem alteracao
- `setupEventListeners(container, abortController)` — assinatura mantida (novo case interno)
- Store — sem alteracao

---

## v1.2.0 — CORRECOES VISUAIS (2026-03-30)

### Melhorias implementadas

#### CORRECAO 1 — Modal "Detalhes do Painel" com dark theme
- **Status:** CORRIGIDO (2026-03-30)
- **Fix:** `_panel-modal.css` reescrito com cores dark theme explicitas

#### CORRECAO 2 — KPI labels renomeados
- **Status:** CORRIGIDO (2026-03-30)
- **Fix:** "Total de Painéis" → "Total", "Sem Thumbnail" → "Sem Screenshot"

#### CORRECAO 3 — Cards fundo preto (thumbnail null/string "null")
- **Status:** CORRIGIDO (2026-03-30)
- **Fix:** hasThumb robusto + img onerror fallback

---

## v1.1.0 — MELHORIAS UI + SCREENSHOT URL FALLBACK (2026-03-30)

### Melhorias implementadas

#### CORRECAO 1 — Cards com fundo PRETO (thumbnail vazia)
- **Status:** CORRIGIDO (2026-03-30)
- **Problema:** `thumbnail_url` retornava string vazia `""` ou com espacos, passava na condicao `if (panel.thumbnail_url)` como truthy em alguns casos, renderizando `<img src="">` (fundo preto)
- **Fix:** Condicao alterada para `const hasThumb = panel.thumbnail_url && panel.thumbnail_url.trim() !== ''`
- Arquivos: `panel-card.ts:22` e `panel-card.js:13`
- Placeholder renderiza: fundo `#2a2a3e`, icone SVG monitor 48px branco, nome do painel em branco
- CSS em `_panel-card.css` classes `.pgp-card__thumb--placeholder` e `.pgp-card__thumb-label`

#### CORRECAO 2 — Cards muito pequenos / caber mais cards
- **Status:** APLICADO (2026-03-30)
- `_panel-grid.css`: `minmax(300px, 1fr)` → `minmax(260px, 1fr)`, gap `1.25rem` → `12px`
- Desktop 1600px+: `minmax(340px, 1fr)` → `minmax(280px, 1fr)`
- `config.ts/js`: `cardMinWidth: 300` → `cardMinWidth: 260`
- Thumbnail mantem `aspect-ratio: 16 / 9` (260px largura = ~146px altura)

#### CORRECAO 3 — Texto e badges menores
- **Status:** APLICADO (2026-03-30)
- Titulo: `.pgp-card__title` → 13px (era 14px), font-weight 700, color `#ffffff`
- Categoria: `.pgp-category-badge` → 10px (era 11px)
- Status: `.pgp-badge` → 10px (era 11px)

#### MELHORIA 4 — Captura thumbnails para paineis sem rota
- **Status:** APLICADO
- 50 paineis sem thumbnail nao tem rota no banco
- URL fallback: `https://dshowdash.com.br/#/PANEL_ID`
- `handlers/screenshot.ts` → `buildCaptureUrl()`: detecta painel sem rota e gera URL fallback
- `services/screenshot-client.ts` → `requestScreenshot()`: aceita `options` (url, width, height, format)
- `services/api-client.ts` → `triggerScreenshot()`: passa options incluindo url ao backend
- `api/admin/panels/screenshot.php` → aceita `url` no body, valida same-origin, usa como capture URL
- Hierarquia de URL no backend: body.url > panel.route > fallback `/#/PANEL_ID`
- Se captura falhar, placeholder permanece (comportamento existente)

### Arquivos alterados
| Arquivo | Mudanca |
|---------|---------|
| `ui/grid/panel-card.ts` + `.js` | Fix: hasThumb com trim() para evitar img src vazio |
| `styles/_panel-grid.css` | Grid minmax 260px, gap 12px, desktop 280px |
| `styles/_panel-card.css` | Titulo 13px (era 14px) |
| `styles/_panel-gestao.css` | Badges pgp-badge e pgp-category-badge 10px (era 11px) |
| `core/config.ts` + `.js` | cardMinWidth 260 |
| `handlers/screenshot.ts` + `.js` | buildCaptureUrl() com fallback URL |
| `services/screenshot-client.ts` + `.js` | Aceita options param |
| `services/api-client.ts` + `.js` | triggerScreenshot aceita url |
| `api/admin/panels/screenshot.php` | Aceita url, valida same-origin, passa ao capture |

### Validacao
| Teste | Resultado |
|-------|-----------|
| `node --check screenshot.js` | PASS |
| `node --check screenshot-client.js` | PASS |
| `node --check api-client.js` | PASS |
| `node --check config.js` | PASS |
| `php -l screenshot.php` | PASS |

### Contratos preservados
- `handleScreenshotRequest(panelId, signal)` — assinatura mantida
- `requestScreenshot(panelId, callback, signal, options?)` — param options adicionado como opcional
- `triggerScreenshot(panelId, options?, signal?)` — options ja existia, apenas url adicionado
- `renderPanelCard(panel, isPending)` — sem alteracao
- Store, events, filters — sem alteracao

### Nota sobre captura
O servico `tools/screenshot-service/capture.mjs` ainda nao existe (previsto para FASE 3).
O `screenshot.php` agora passa `--url=` ao comando de captura para quando o servico for implementado.
Enquanto isso, o placeholder SVG continua sendo exibido para paineis sem thumbnail.
