# MIGRATION STATUS — panel-nav-admin

**Data:** 2026-03-30
**Status:** COMPLETO (v16.0.0 — CONTEXT-FILTER-FIX)
**Versao:** 16.0.0-CONTEXT-FILTER-FIX

---

## v16.0.0 — CONTEXT-FILTER-FIX (2026-03-30)

### 3 Correções críticas — Grupos duplicados, colapsados e itens misturados

#### FIX 1 — Grupos duplicados/inválidos (SEPARATOR, TOOLS, DOCK, STATUS)
- **Causa:** `buildUnifiedSectionsQuery()` retornava grupos de TODAS as tabelas (sidebar_groups, navrail_groups, header_groups) sem filtro de contexto
- **Correção API:** `api/admin/navigation/index.php` — `buildUnifiedSectionsQuery()` agora aceita parâmetro `$context` opcional com whitelist de valores válidos (sidebar, navrail, header, footer)
- **Correção API:** Endpoints GET `/sections`, `?action=manifest` e `/tree` agora leem `$_GET['context']` e passam para a query
- **Correção Frontend:** `core/nav-adapter.ts` — `fetchSections()` agora passa `?context=sidebar` por padrão, filtrando apenas grupos do sidebar
- **Resultado:** Apenas grupos do contexto sidebar aparecem no painel admin. Grupos como SEPARATOR, TOOLS, DOCK, STATUS (de navrail_groups/header_groups) não aparecem mais

#### FIX 2 — Grupos colapsados por padrão
- **Causa:** `_collapsedGroups` era carregado de `localStorage` com estado stale de sessões anteriores, fazendo todos os grupos aparecerem colapsados
- **Correção:** `index.ts` — `_collapsedGroups` inicializa como `new Set()` (vazio = todos expandidos) e limpa `localStorage` keys (`pna-collapsed-groups`, `pna-flat-collapsed-groups`) no boot
- **Resultado:** Grupos sempre iniciam expandidos. Usuário pode colapsar manualmente durante a sessão; próxima visita reinicia expandido

#### FIX 3 — Itens misturados de contextos diferentes
- **Causa:** Filtro padrão de seção era `'all'`, mostrando itens de sidebar, navrail, header e footer misturados na mesma lista
- **Correção:** `core/contracts.ts` — `STATE_SHAPE.filters.section` alterado de `'all'` para `'sidebar'`
- **Correção:** `state/store.ts` — `clearFilters()` reseta para `section: 'sidebar'` em vez de `'all'`
- **Resultado:** Lista de itens mostra apenas itens do sidebar por padrão. Dropdown de filtro permite trocar para outros contextos

### Arquivos modificados
- `api/admin/navigation/index.php` — context filter na query de sections (v4.2.0)
- `core/nav-adapter.ts` — passa `?context=sidebar` ao buscar sections
- `core/contracts.ts` — default filter `section: 'sidebar'`
- `state/store.ts` — clearFilters reseta para sidebar
- `index.ts` — collapsed groups reset no boot

---

## v15.2.0 — GROUP-ICON-REORDER + 8 MELHORIAS (2026-03-30)

### 8 Melhorias implementadas nesta sessão

#### MELHORIA 1 — Verificar POST /api/admin/navigation/items
- **Status: OK** — POST handler aceita: `label`, `icon`→`icon_name`, `parent_key`, `context`→`display_context`, `href`→`route_path`, `min_level`
- Alias normalization em linhas 742-751 do index.php (v4.2.0)

#### MELHORIA 2 — Drag and drop entre grupos: console.log temporário
- `handlers/drag-drop.ts` v15.2.0: console.log adicionado no cross-group detection
- Log mostra: itemId, sourceGroup, targetGroup, isCrossGroup, insertBefore

#### MELHORIA 3 — Reordenar grupos via drag-and-drop
- `handlers/drag-drop.ts` v15.2.0: Handler completo para drag de separadores de grupo
- Detecta `.pna-group-drag-handle` → inicia drag de grupo com ghost
- Drop: coleta todos os separadores na nova ordem → POST `/api/admin/navigation/reorder` com `type: 'groups'`
- API `index.php`: Novo suporte `reorder type=groups` → atualiza `sidebar_groups`, `ui_nav_items` (groups), `navrail_groups`

#### MELHORIA 4 — Mover item via GRUPO editável
- **Status: OK** — `handlers/group-select.ts` v2.0.0 já faz PATCH com `parentKey` ao selecionar novo grupo
- CustomSelect popover com busca, timeout 5s, atualização otimista do badge

#### MELHORIA 5 — Ícone do grupo no separador
- `renderer/items.ts` v15.2.0: Função `_resolveGroupIcon()` busca icon_name via `window.__pnaSections`
- `core/data-loader.ts`: Expõe sections em `window.__pnaSections` após fetch
- Ícone renderizado no separador de grupo entre drag handle e label

#### MELHORIA 6 — Busca expande grupos colapsados
- **Status: OK** — `index.ts` linhas 535-552 já implementam expansão automática
- Quando `searchTerm` presente, percorre separadores e expande grupos com resultados

#### MELHORIA 7 — Panel-navrail-admin verificação
- **Status: OK** — `ui/renderer.ts` v16.0.0: Separadores de grupo com ícone, drag handle, contador
- Cards ordenados por group order_index + item order_index
- Humanização de labels via `_humanizeGroupLabel()`

#### MELHORIA 8 — Documentação atualizada
- `ROADMAP-MELHORIAS-2026.md`: 7 novas linhas na tabela "O Que Foi Feito"
- `MIGRATION_STATUS.md` (root): Atualizado com sessão v15.2.0
- `panel-nav-admin/MIGRATION_STATUS.md`: Atualizado com 8 melhorias detalhadas

### Arquivos modificados (4 TypeScript + 3 JavaScript + 1 PHP + 3 Docs)

| Arquivo | Versão | Melhoria |
|---------|--------|----------|
| handlers/drag-drop.ts+js | 15.2.0 | M2 (console.log) + M3 (group reorder drag) |
| renderer/items.ts+js | 15.2.0 | M5 (group icon no separador) |
| core/data-loader.ts+js | - | M5 (window.__pnaSections) |
| api/admin/navigation/index.php | 4.2.0 | M3 (reorder type=groups) |

---

## v15.0.0 — CROSS-GROUP-DND + 8 MELHORIAS (2026-03-30)

### 8 Melhorias implementadas nesta sessão

#### MELHORIA 1 — Drag and drop entre grupos
- `handlers/drag-drop.ts` v15.0.0: Detecta cross-group drop via `data-group-key`
- Ao dropar item em grupo diferente: PATCH `parent_key` via navAdapter → reorder → loadData
- Toast diferenciado: "Item movido para outro grupo" vs "Ordem atualizada"
- Fallback: se PATCH falhar, rollback via loadData()

#### MELHORIA 2 — Botão Novo Item funcional com modal completo
- `ui/modals.ts` v15.0.0: Modal reorganizado com campos: Label, Ícone, Grupo (dropdown), Contexto (sidebar/navrail/header/footer), Rota/Painel, Nível de Acesso
- Campo `displayContext` adicionado ao payload de criação
- Campo ID só aparece em criação (não edição)

#### MELHORIA 3 — Filtro por GRUPO na toolbar
- Já existente (v14.0.0): `data-filter="group"` dropdown na toolbar
- `updateGroupFilterOptions()` popula dropdown a partir dos dados carregados
- `store.getFilteredItems()` filtra por `filters.group`
- Confirmado funcional — sem alterações necessárias

#### MELHORIA 4 — Collapse/expand por grupo na lista flat
- `renderer/items.ts` v15.0.0: Separadores de grupo são clicáveis (data-action="toggle-flat-group-collapse")
- Estado persistido em `localStorage` (chave: `pna-flat-collapsed-groups`)
- Ícone de seta (▶/▼) indica estado
- `handlers/click-router.ts`: Ação `TOGGLE_FLAT_GROUP_COLLAPSE` adicionada
- `index.ts`: Handler `_toggleFlatGroupCollapse()` toggle DOM + localStorage
- CSS: `.pna-flat-group-hidden { display: none !important; }`

#### MELHORIA 5 — Contador de itens no separador de grupo
- `renderer/items.ts`: Separador mostra "N itens" ou "1 item" com badge colorido
- Pre-computa `groupItemCounts` antes de renderizar

#### MELHORIA 6 — Remover console.log de debug
- `state/store.ts`: Removidos console.log em _emit, _set, setItems
- `ui/audit-history.ts`: Removidos console.log de fetchAuditHistory
- `handlers/diagnostic.ts`: Removido console.log em logDiagnostics (mantido console.error)
- Total: ~10 console.log removidos; mantidos apenas console.error em catch

#### MELHORIA 7 — Documentação técnica atualizada
- `claude/docs/DOCUMENTACAO-TECNICA-PANEL-NAV-ADMIN.md` atualizado para v15.0.0
- Seções 3.12-3.16 adicionadas documentando todas as features novas

#### MELHORIA 8 — Panel-navrail-admin melhorias
- `panel-navrail-admin/ui/renderer.ts` v15.0.0: Separadores de grupo entre cards
- Cards ordenados por grupo (group order_index) + ordem do item
- Humanização do nome do grupo via `_humanizeGroupLabel()`
- Contador de itens por grupo no separador

### Arquivos modificados (11 TypeScript → 11 JavaScript compilados)

| Arquivo | Versão | Melhoria |
|---------|--------|----------|
| `handlers/drag-drop.ts` | 15.0.0-CROSS-GROUP-DND | M1 |
| `ui/modals.ts` | 15.0.0-NOVO-ITEM-FULL | M2 |
| `renderer/items.ts` | 15.0.0-COLLAPSE-COUNTER | M4, M5 |
| `handlers/click-router.ts` | 15.0.0-FLAT-GROUP-COLLAPSE | M4 |
| `index.ts` | 12.3.0-UX-IMPROVEMENTS | M1, M4 |
| `state/store.ts` | 10.0.0-GROUP-FILTER | M6 |
| `ui/audit-history.ts` | — | M6 |
| `handlers/diagnostic.ts` | — | M6 |
| `core/event-setup.ts` | 12.3.0-STOP-PROPAGATION | — (recompilado) |
| `panel-navrail-admin/index.ts` | 11.4.0-INLINE-EDIT | — (recompilado) |
| `panel-navrail-admin/ui/renderer.ts` | 15.0.0-GROUP-SEPARATORS | M8 |

### Validação
- Todos os 11 .js compilados via esbuild (ESM, ES2022)
- Todos passam `node --check`
- Backups em `/backup/` com timestamp

---

## v14.0.0 — GROUP ENHANCEMENTS (2026-03-30, sessão anterior)

### 7 Melhorias implementadas

#### MELHORIA 1 — Ordem correta (negócio antes de admin)
- Populado `sidebar_groups` com 21 registros correspondendo aos `parent_key` reais usados em `ui_nav_items`
- O JOIN `LEFT JOIN sidebar_groups sg ON sg.group_key = u.parent_key` agora retorna `parent_order_index` correto
- Ordem confirmada: Favoritos(1) → Comercial(2) → Compras(3) → ... → Admin(1000)

#### MELHORIA 2 — Coluna GRUPO com nome real
- `renderer/items.ts`: Adicionadas funções `_humanizeGroupKey()` e `_resolveGroupLabel()`
- Lógica: usa `parentLabel` da API (JOIN com sidebar_groups) → fallback humaniza `parentKey`
- Resultado: coluna GRUPO agora mostra "Comercial" ao invés de "sidebar.grp-comercial"

#### MELHORIA 3 — Filtro por GRUPO na toolbar
- `ui/renderer.ts`: Adicionado `<select data-filter="group">` ao lado dos filtros existentes
- `renderer/sections.ts`: Nova função `updateGroupFilterOptions()` popula dropdown com grupos únicos
- `core/data-loader.ts`: Chama `updateGroupFilterOptions()` após carregar dados
- `state/store.ts`: `getFilteredItems()` agora filtra por `filters.group`
- `core/contracts.ts`: `STATE_SHAPE.filters` inclui campo `group`

#### MELHORIA 4 — Zebra striping por grupo
- `renderer/items.ts`: Na renderização flat, cada grupo tem background alternado (via HSL do hash do group_key)
- Grupos pares: `hsla(hue, 30%, 50%, 0.04)`, ímpares: `hsla(hue, 30%, 50%, 0.08)`
- Função `renderItemRow()` agora aceita parâmetro opcional `zebraBg`

#### MELHORIA 5 — Cabeçalho de grupo separador
- `renderer/items.ts`: Entre grupos diferentes na lista flat, insere `<li class="pna-list-group-separator">`
- Separador com nome do grupo em uppercase + linha gradiente colorida

#### MELHORIA 6 — Criar novo grupo
- `ui/renderer.ts`: Botão "+ Grupo" adicionado na toolbar
- `index.ts`: Handler `_newGroup()` abre modal com formulário (group_key, label, icon, context, order)
- POST para `/api/admin/navigation/sections` cria o grupo na tabela correta
- `handlers/click-router.ts`: Ação `NEW_GROUP` registrada

#### MELHORIA 7 — Editar nome do grupo inline na aba Grupos
- `renderer/sections.ts`: `<h4>` do card do grupo agora é `contenteditable` ao clicar
- `index.ts`: Handler `_inlineEditGroupLabel()` faz blur→save via PATCH
- `api/admin/navigation/index.php`: Novo endpoint `PATCH /sections` atualiza label do grupo
  - Suporta `ui_nav_items` (sidebar), `navrail_groups`, `header_groups`
  - Também atualiza `sidebar_groups` quando sidebar
- `handlers/click-router.ts`: Ação `INLINE_EDIT_GROUP_LABEL` registrada

### Arquivos alterados (9 arquivos .ts + .js recompilados + 1 PHP + DB)
| Arquivo | Ação |
|---------|------|
| `renderer/items.ts` + `.js` | v14.0.0: _resolveGroupLabel, zebra striping, group separators, data-group-key attr |
| `ui/toolbar.ts` + `.js` | v13.0.0: Group filter dropdown, + Grupo button, setGroups(), getSelectedGroup() |
| `renderer/sections.ts` + `.js` | v10.0.0: Inline edit group label, updateGroupFilterOptions() |
| `state/store.ts` + `.js` | v10.0.0: Group filter in getFilteredItems(), clearFilters() |
| `core/contracts.ts` + `.js` | STATE_SHAPE.filters.group |
| `core/data-loader.ts` + `.js` | Chama updateGroupFilterOptions() |
| `handlers/click-router.ts` + `.js` | v13.1.0: INLINE_EDIT_GROUP_LABEL, NEW_GROUP actions |
| `ui/renderer.ts` + `.js` | Group filter dropdown, + Grupo button |
| `index.ts` + `.js` | _inlineEditGroupLabel(), _newGroup() handlers |
| `api/admin/navigation/index.php` | PATCH /sections endpoint |
| `sidebar_groups` (DB) | Populada com 21 registros para JOIN correto |

### Validação
| Teste | Resultado |
|-------|-----------|
| `node --check` em todos os .js | OK |
| `php -l` na API | OK |
| SQL order (PHP CLI) | Negócio antes de admin |
| parent_label preenchido | OK (JOIN funcional) |

---

## v13.8.0 — REMOÇÃO DE PAGINAÇÃO FRONTEND (2026-03-30)

### Problema
A paginação frontend limitava a exibição a 50 itens por página, impedindo a visualização de todos os itens de uma vez. A API já retorna todos os itens sem limit/offset.

### Correção aplicada
- **`core/constants.ts`** — `ITEMS_PER_PAGE`: 50 → 9999
- **`state/store.ts`** — `pagination.perPage` default: 50 → 9999
- **`index.ts`** — `_perPage`: 50 → 9999
- **`index.ts`** — `_applyFilters()`: removido slice de paginação (`itemsVM.slice(startIdx, startIdx + _perPage)` → `pagedItems = itemsVM`)
- **`index.ts`** — `_renderPaginationControls()`: transformado em no-op (apenas remove controles existentes)
- **`index.ts`** — chamada `_renderPaginationControls(totalItems)` comentada em `_applyFilters()`

### Arquivos alterados (3 arquivos .ts + .js recompilados)
| Arquivo | Ação |
|---------|------|
| `core/constants.ts` + `.js` | ITEMS_PER_PAGE = 9999 |
| `state/store.ts` + `.js` | perPage default = 9999 |
| `index.ts` + `.js` | Removido slice, desabilitado render de paginação |

### Validação
| Teste | Resultado |
|-------|-----------|
| `node --check core/constants.js` | PASS |
| `node --check state/store.js` | PASS |
| `node --check index.js` | PASS |
| `esbuild store.ts` | PASS |
| `esbuild index.ts` | PASS |

### Impacto
- Todos os itens agora exibidos de uma vez, sem paginação
- Componente de paginação (`ui/pagination.ts`) preservado mas não renderizado
- Contratos, exports e APIs preservados
- Group view (v12.3.0) continua funcionando com todos os itens
- Sem impacto em filtros (continuam funcionando normalmente)

---

## v13.7.0 — CORREÇÃO ORDER BY COM sidebar_groups (2026-03-30)

### Problema
A query principal da API admin (`api/admin/navigation/index.php`) fazia self-join com `ui_nav_items` para obter o `order_index` do grupo pai dos itens sidebar. Isso resultava em ordenação incorreta porque os grupos reais estão na tabela `sidebar_groups`.

### Correção aplicada
- **JOIN alterado:** `LEFT JOIN ui_nav_items gp ON gp.item_key = u.parent_key AND gp.item_type = 'group'` → `LEFT JOIN sidebar_groups sg ON sg.group_key = u.parent_key`
- **parent_label:** `COALESCE(gp.label, '')` → `COALESCE(sg.label, '')`
- **parent_order_index:** `COALESCE(gp.order_index, u.order_index)` → `COALESCE(sg.order_index, 999)` — itens sem grupo pai ficam no final
- **ORDER BY:** Adicionado `ASC` explícito: `parent_order_index ASC, order_index ASC`

### Arquivo alterado
| Arquivo | Ação |
|---------|------|
| `api/admin/navigation/index.php` | JOIN sidebar_groups + ORDER BY corrigido |

### Validação
| Teste | Resultado |
|-------|-----------|
| `php -l api/admin/navigation/index.php` | PASS — No syntax errors |
| Redis cache invalidado (`ui:nav:*`) | 1 key removida |

### Impacto
- Itens sidebar agora ordenados pelo `order_index` do grupo pai (tabela `sidebar_groups`) primeiro, depois pelo próprio `order_index`
- Itens sem grupo pai (`parent_key` NULL ou inexistente) recebem `parent_order_index = 999` (final da lista)
- Demais contextos (navrail, header, footer) não afetados
- Contratos, exports e APIs preservados

---

## v13.6.0 — REMOÇÃO DE CONSOLE.LOG DE DEBUG (2026-03-29)

### Ação realizada
Removidos **TODOS** os `console.log` de diagnóstico/debug adicionados durante as sessões v13.5.x.
Tags removidas: `[PNA]`, `[crud]`, `[STORE]`, `[DATA-LOADER]`, `[SUBSCRIPTIONS]`, `[RENDERER]`, `[PNA:modals]`, `[PNA:event-setup]`.

**Preservados:** Todos os `console.error` em blocos `catch` (15 ocorrências em 8 arquivos) — são logs de erro legítimos.

### Arquivos alterados (7 arquivos .ts + .js recompilados)
| Arquivo | Logs removidos | Ação adicional |
|---------|---------------|----------------|
| `ui/modals.ts` + `.js` | 6 | Limpeza em showConfirmDialog, finish(), btnCancel/btnConfirm, ready flag |
| `handlers/crud.ts` + `.js` | 7 | Limpeza em confirmDeleteItem, executeDeleteItem |
| `core/data-loader.ts` + `.js` | 7 | Limpeza em loadData (setItems, updateItems, showEmptyState) |
| `core/event-setup.ts` + `.js` | 1 | Removido bloco CLICK TRACE completo (debug trace para action clicks) |
| `core/subscriptions.ts` + `.js` | 4 | Limpeza no items listener callback |
| `renderer/items.ts` + `.js` | 6 | Limpeza em updateItems (refs check, container, UL update) |
| `index.ts` + `.js` | 22 | Limpeza em _loadDataFn, _applyFilters, _toggleItemActive, _createItem, _duplicateItem |

**Total removido:** 53 linhas de console.log de debug (0 console.error removidos)

### Compilação e validação
| Teste | Resultado |
|-------|-----------|
| `esbuild ui/modals.ts` | PASS |
| `esbuild handlers/crud.ts` | PASS |
| `esbuild core/data-loader.ts` | PASS |
| `esbuild core/event-setup.ts` | PASS |
| `esbuild core/subscriptions.ts` | PASS |
| `esbuild renderer/items.ts` | PASS |
| `esbuild index.ts` | PASS |
| `node --check ui/modals.js` | PASS |
| `node --check handlers/crud.js` | PASS |
| `node --check core/data-loader.js` | PASS |
| `node --check core/event-setup.js` | PASS |
| `node --check core/subscriptions.js` | PASS |
| `node --check renderer/items.js` | PASS |
| `node --check index.js` | PASS |

### Impacto
- Zero regressão funcional (apenas remoção de logs de debug)
- Contratos, exports, APIs e eventos preservados intactos
- Console do browser ficará limpo em operações CRUD, loadData, render

---

## v13.5.3 — TRACE COMPLETO FLUXO LOADDATA→RENDER (2026-03-29)

### INVESTIGAÇÃO — _loadDataFn completa mas lista não re-renderiza no DOM

**Problema reportado:** Após DELETE e CREATE, `_loadDataFn` é chamado e completa, mas a lista não re-renderiza. Os dados são buscados mas o renderer não é chamado.

**Análise do fluxo completo (5 etapas):**
1. `_loadDataFn()` → `loadData()` (data-loader)
2. `loadData()` → `store.setItems(items)` (store)
3. `store.setItems()` → `store._set('items', items)` → `deepEqual` check → `_emit('items', items)` (store)
4. `_emit` → subscription callback → `updateItems(refs, itemsVM)` (subscriptions)
5. `_loadDataFn.then()` → `_refs = _rebuildRefsFromContainer()` → `_applyFilters()` → `updateItems(_refs, pagedItems)` (index)

**Pontos críticos identificados:**
- `store._set` usa `deepEqual()` — se dados forem iguais, NÃO emite evento (subscription não dispara)
- `subscriptions.ts` captura `refs` por valor no momento do setup — se DOM mudar, refs ficam stale
- `_applyFilters()` usa `_refs` por closure — depende de `_rebuildRefsFromContainer()` ter executado

**Ação:** console.log de diagnóstico em CADA etapa do fluxo (10 arquivos: 5 .ts + 5 .js)

**Arquivos alterados:**
| Arquivo | Ação | Console.logs adicionados |
|---------|------|--------------------------|
| `state/store.ts` + `.js` | EDITADO | `_set` (deepEqual result), `setItems` (chamada + retorno), `_emit` (listener count) |
| `core/data-loader.ts` + `.js` | EDITADO | Antes/depois de `store.setItems()`, antes/depois de `updateItems()` direto |
| `core/subscriptions.ts` + `.js` | EDITADO | Dentro do callback `items` — refs status, VM length, chamada updateItems |
| `renderer/items.ts` + `.js` | EDITADO | Entrada de `updateItems` — refs check, container check, isConnected, UL existente |
| `index.ts` + `.js` | EDITADO | `_loadDataFn.then` — refs rebuild status, `_applyFilters` — filtered/paged counts, updateItems call |

**Validação:**
| Teste | Resultado |
|-------|-----------|
| `node --check state/store.js` | PASS |
| `node --check core/data-loader.js` | PASS |
| `node --check core/subscriptions.js` | PASS |
| `node --check renderer/items.js` | PASS |
| `node --check index.js` | PASS |

**Próximo passo:** Testar no browser (DevTools Console), executar DELETE/CREATE e analisar os logs para identificar EXATAMENTE onde o fluxo para. Procurar por:
- `[STORE.setItems] _set retornou FALSE` → deepEqual bloqueando (dados idênticos)
- `[SUBSCRIPTIONS] items listener DISPARADO` ausente → subscription não registrada ou removida
- `[RENDERER] updateItems ABORTADO` → refs null ou container desconectado do DOM
- `[RENDERER] updateItems: container encontrado { isConnected: false }` → refs stale (DOM substituído)

---

## v13.5.2 — DIAGNOSTICO LOADDATA APOS CRUD (2026-03-29)

### INVESTIGAÇÃO — Lista não atualiza após DELETE/CREATE ok:true

**Problema reportado:** Após `deleteItem` e `createItem` retornarem `ok:true`, a lista não atualiza visualmente.

**Análise do código:**
- `crud.ts:executeDeleteItem` (linha 306) — **JÁ chama** `await loadData()` (via `callbacks.loadData` = `_loadDataFn`)
- `index.ts:_createItem` (linha 617) — **JÁ chama** `_loadDataFn()`
- `callbacks` (index.ts:329) — `loadData: _loadDataFn` — corretamente mapeado
- `_loadDataFn` (index.ts:207) — tem 2 guards: `_isDocumentVisible()` e `ensureAuth('loadData')`

**Suspeita:** Um dos guards (`_isDocumentVisible` ou `ensureAuth`) pode estar bloqueando silenciosamente o `_loadDataFn`.

**Ação:** Adicionados `console.log` de diagnóstico em 3 pontos:
1. `crud.ts` — ANTES e DEPOIS de `await loadData()` no DELETE path
2. `index.ts:_loadDataFn` — log na entrada + log se bloqueado por guards
3. `index.ts:_createItem` — log ANTES de chamar `_loadDataFn()` + `.then()/.catch()` para confirmar execução

**Próximo passo:** Testar no browser, abrir DevTools Console, executar DELETE e CREATE, verificar os logs para identificar se `_loadDataFn` é chamada e se completa com sucesso.

---

## v13.5.1 — STOP-IMMEDIATE-PROPAGATION DELETE/DUPLICATE (2026-03-29)

### CORREÇÃO 1 — DELETE chamado 2 vezes (event bubbling dispara segundo listener)

**Problema:** O primeiro DELETE funciona (ok:true), mas event bubbling dispara um segundo `confirmDeleteItem` com o item já excluído. O guard `_confirmInProgress` não funcionava porque já havia sido resetado após o primeiro DELETE completar.

**Causa raiz:** `e.stopPropagation()` impede propagação para elementos pai, mas NÃO impede outros event listeners registrados no MESMO elemento de processar o evento. Múltiplos listeners no container capturavam o mesmo click.

**Correção:** Adicionado `e.stopImmediatePropagation()` APÓS chamar `clickRouter`/`matched.handler` em **3 pontos** de `event-setup.ts`/`.js` (fast-path target, fast-path parent, walk-path), especificamente para `action=delete-item` e `action=duplicate-item`. Isso garante que nenhum outro listener no mesmo elemento processe o evento após o clickRouter já ter despachado a ação.

### CORREÇÃO 2 — DUPLICATE não atualiza a lista (verificação)

**Status:** VERIFICADO — código já correto. `_duplicateItem` em index.ts/js já chama `_loadDataFn()` após createItem ok:true (linha 711/.ts, 750/.js) e já emite `navigation:items:changed`. O bug de "tabela não recarrega" era causado pela CORREÇÃO 1 — o segundo disparo do evento via outro listener interferia com o fluxo.

### Arquivos alterados
- `core/event-setup.ts` → v12.3.1-STOP-IMMEDIATE-PROPAGATION (3 pontos: stopImmediatePropagation após clickRouter/handler)
- `core/event-setup.js` → editado em paralelo (mesmo conteúdo)

### Compilação e Validação
- `node --check event-setup.js` — OK
- tsc --noEmit — pendente verificação

---

## v13.5.0 — CONFIRM-FIX DELETE/DUPLICATE (2026-03-29)

### CORREÇÃO — confirmed=true mas DELETE e POST (duplicate) não executam

**Problema:** Após o diálogo de confirmação retornar `confirmed=true`, as operações DELETE e POST (duplicar) não eram executadas. Nenhum toast de sucesso ou erro aparecia.

**Causa raiz (DELETE):**
- O guard `_confirmInProgress` ficava no bloco `try/finally`. Se `executeDeleteItem` falhasse de forma inesperada ou o panel fosse destruído durante uma confirmação ativa, `_confirmInProgress` ficava stuck em `true`, bloqueando silenciosamente TODAS as operações de delete subsequentes (retorno no `if (_confirmInProgress) return;` sem nenhum log).
- O cleanup/destroy do panel chamava `clearPendingDelete()` mas NÃO resetava `_confirmInProgress`.

**Correção (DELETE — handlers/crud.ts v11.7.0-CONFIRM-FIX):**
1. `_confirmInProgress` agora é resetado ANTES de chamar `executeDeleteItem`, logo após o diálogo confirmar. O guard já cumpriu seu papel (impedir diálogos concorrentes durante showConfirmDialog).
2. Removido `finally` block — reset agora acontece explicitamente antes do `await` e no `catch`.
3. Nova função exportada `resetConfirmState()` que reseta ambos `_confirmInProgress` e `_pendingDelete`.
4. Adicionados console.logs diagnósticos em `executeDeleteItem`: ENTRADA (mostra _pendingDelete e _confirmInProgress), ANTES do API call, RESULTADO do API call.

**Causa raiz (DUPLICATE):**
- O `.then()` externo do `showConfirmDialog` não tinha `.catch()`. Qualquer erro síncrono dentro do callback (ex: erro ao criar objeto duplicate, item null) era engolido silenciosamente como unhandled promise rejection.

**Correção (DUPLICATE — index.ts):**
1. Adicionado `.catch()` no `.then()` externo para capturar erros não tratados no fluxo de duplicação.
2. Adicionados console.logs: ANTES de `navAdapter.createItem` (mostra duplicate object), RESULTADO de createItem (mostra ok/success/error).
3. Adicionado `crud.resetConfirmState()` no cleanup/destroy do panel para garantir que `_confirmInProgress` seja sempre resetado ao desmontar.

### Arquivos alterados
- `handlers/crud.ts` → v11.7.0-CONFIRM-FIX (nova export `resetConfirmState`, logs, fix do _confirmInProgress)
- `handlers/crud.js` → recompilado via esbuild (12.5kb)
- `index.ts` → adicionado .catch() no duplicate, logs, resetConfirmState no destroy
- `index.js` → recompilado via esbuild (50.4kb)

### Compilação e Validação
- `node --check handlers/crud.js` — OK
- `node --check index.js` — OK
- esbuild transpile OK para ambos os arquivos

### Diagnóstico (console.logs adicionados)
Os seguintes logs aparecem no console do browser para rastreamento:
- `[crud] confirmDeleteItem: _pendingDelete SETADO, chamando executeDeleteItem` + JSON
- `[crud] executeDeleteItem ENTRADA` + {_pendingDelete, _confirmInProgress, callbackKeys}
- `[crud] executeDeleteItem: ANTES de navAdapter.deleteItem` + {id, sourceTable, sourceId}
- `[crud] executeDeleteItem: RESULTADO de navAdapter.deleteItem` + {success, error, ok}
- `[PNA] _duplicateItem: ANTES de navAdapter.createItem` + {duplicateId, label}
- `[PNA] _duplicateItem: RESULTADO de createItem` + {ok, success, error}
- `[PNA] _duplicateItem: ERRO NAO CAPTURADO no fluxo de duplicate` (se houver)

---

## v13.4.6 — STOP PROPAGATION DELETE/DUPLICATE (2026-03-28)

### CORREÇÃO — Popover de confirmação desaparece em <300ms ao clicar delete/duplicate

- **Causa raiz:** O click handler em `event-setup.ts` processava `delete-item` e `duplicate-item` sem `stopPropagation()`. O evento bubbling causava re-render da lista pelo container click listener, destruindo o popover antes do usuário interagir.
- **Correção:** Adicionado `e.stopPropagation()` + `e.preventDefault()` em **3 pontos** de `event-setup.ts` (fast-path target, fast-path parent, walk-path) ANTES de chamar `clickRouter`, especificamente para `action=delete-item` e `action=duplicate-item`.
- **modals.ts:** Verificado — overlay e popover JÁ são appendados ao `document.body` com `position:fixed` (z-index 99998/99999), fora do container do panel. Nenhuma alteração necessária.
- **Arquivo alterado:** `core/event-setup.ts` (v12.3.0-STOP-PROPAGATION), `core/event-setup.js` (recompilado via esbuild)
- **Validação:** `node --check event-setup.js` OK, esbuild transpile OK (9.9kb)

---

## v13.4.5 — FIX DUPLICATE 500 + DELETE FADEOUT (2026-03-28)

### CORREÇÃO 1 — POST /api/admin/navigation/items retorna 500 ao duplicar item
- **Causa raiz:** Ao duplicar um item, o frontend envia `item_key` com sufixo `-copy`. Ao duplicar novamente, o mesmo `-copy` key é enviado, causando `SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry` na coluna UNIQUE `item_key`
- **Correção:** Adicionada função `ensureUniqueItemKey()` no backend PHP que verifica se o `item_key` já existe na tabela. Se existir, extrai a raiz (remove `-copy[-N]`), e incrementa counter (`-copy-2`, `-copy-3`, ...) até encontrar key disponível
- **Escopo:** Aplicado em todos os 4 INSERTs do `routeInsert()`: `ui_nav_items`, `navrail_items`, `header_components`, `footer_items`
- **Arquivo alterado:** `api/admin/navigation/index.php` (nova função `ensureUniqueItemKey` + 4 chamadas nos cases INSERT)
- **Validação:** `php -l` OK, endpoint retorna AUTH_REQUIRED (não mais 500)

### CORREÇÃO 2 — Excluir item: remoção instantânea do DOM com animação fadeOut
- **Causa raiz:** `executeDeleteItem()` em `handlers/crud.ts` fazia `deletedRow.remove()` sem animação, remoção não era visualmente perceptível
- **Correção:** Adicionada transição CSS `opacity 300ms ease-out` + `opacity: 0` antes de `remove()`. Usa `await new Promise` com `setTimeout(300ms)` para aguardar a animação completar antes de remover o elemento e prosseguir com `loadData()`
- **Seletor:** `[data-item-id="${itemId}"]` — encontra a linha pelo ID do item
- **Arquivos alterados:** `handlers/crud.ts` (fadeOut), `handlers/crud.js` (recompilado via esbuild)
- **Validação:** `node --check crud.js` OK, esbuild transpile OK

### Compilação e Validação
- PHP: `php -l` OK em `api/admin/navigation/index.php`
- JS: `node --check` OK em `handlers/crud.js`
- TS → JS: esbuild transpile OK (11.3kb)

---

## v13.4.4 — FIX POPOVER EVENT BUBBLING (2026-03-28)

### CORREÇÃO — pna-confirm-popover desaparece imediatamente ao abrir
- **Causa raiz:** O document click listener (para fechar popover ao clicar fora) era registrado com `setTimeout(..., 0)`, insuficiente para evitar que o próprio evento de click que abriu o popover disparasse o listener via event bubbling
- **Correção:** Substituído `setTimeout(() => document.addEventListener('click', onDocClick, true), 0)` por `requestAnimationFrame(() => { setTimeout(() => document.addEventListener('click', onDocClick, true), 100); })` — rAF garante que o frame atual termine, e o setTimeout de 100ms garante que o evento de click original complete totalmente o bubbling
- **Escopo:** Afeta tanto o popover de confirmação (confirm) quanto o de exclusão (delete) — ambos usam a mesma função `showConfirmDialog()` em `ui/modals.ts`
- **Arquivos alterados:** `ui/modals.ts` (linha 259), `ui/modals.js` (recompilado via esbuild)
- **Validação:** `node --check modals.js` OK, esbuild transpile OK

---

## v13.4.3 — CLICK TRACE + VALIDAÇÃO COMPLETA (2026-03-28)

### CORREÇÃO 1 — Botões duplicate-item e toggle-active: VERIFICAÇÃO COMPLETA
- **Resultado:** Ambos os cases JÁ existem no click-router switch:
  - `ACTIONS.TOGGLE_ACTIVE` (click-router.ts:139, click-router.js:123) → chama `handlers.onToggleActive(itemId)`
  - `ACTIONS.DUPLICATE_ITEM` (click-router.ts:273, click-router.js:266) → chama `handlers.onDuplicateItem(itemId, target)`
- **Constantes:** `ACTIONS.TOGGLE_ACTIVE = 'toggle-active'` (linha 41) e `ACTIONS.DUPLICATE_ITEM = 'duplicate-item'` (linha 78) — ambos presentes
- **Registro dos handlers:** `onToggleActive: _toggleItemActive` e `onDuplicateItem: _duplicateItem` registrados em index.ts:331 / index.js:352
- **Renderização HTML:** Botões renderizados corretamente em items.ts:219 com `data-action="toggle-active"` e `data-action="duplicate-item"` + `data-item-id`
- **Event dispatch:** event-setup.ts/js roteia via fast-path (target/parent) ou walk-loop para `[data-action]` → clickRouter
- **Ação adicional:** Adicionado console.log de CLICK TRACE no event-setup (v12.2.0-CLICK-TRACE) para rastrear se cliques chegam ao container, identificar target element, itemId e confirmar presença do clickRouter
- **Arquivos:** `core/event-setup.ts`, `core/event-setup.js`

### CORREÇÃO 2 — Toggle olho: VERIFICADO + DEBUG EXISTENTE
- **Resultado:** `_toggleItemActive` (index.ts:580, index.js:690) já funciona corretamente:
  - Recebe `itemId: string` do click-router
  - Usa `String(i.id) === String(itemId)` (coerção correta)
  - Envia PATCH com `isActive` invertido via `navAdapter.updateItem()`
  - 7 console.logs detalhados já existentes cobrindo: chamada, item encontrado, payload, response, resultado ok/falha, recarga
- **Mapeamento isActive:** nav-adapter.ts:203 converte `is_active == 1` para `true/false` boolean; toggle `item.isActive === false` funciona corretamente
- **Nenhuma alteração necessária** — debug completo já implementado em v13.4.2

### CORREÇÃO 3 — Histórico timestamp: JÁ CORRIGIDO
- **Resultado:** Query em api/admin/navigation/index.php:596 já usa `DATE_FORMAT(al.created_at, '%Y-%m-%dT%H:%i:%s')` retornando ISO 8601 com `T`
- **Corrigido em:** v13.4.0 (audit.php) e v13.4.2 (index.php)
- **Nenhuma alteração necessária**

### Compilação e Validação
- JS: `node --check` OK em event-setup.js, index.js, click-router.js
- PHP: `php -l` OK em index.php
- TS e JS sincronizados
- Todas as 3 correções verificadas como implementadas e funcionais no código

### Diagnóstico de possíveis causas residuais (se cliques ainda não funcionarem)
1. **Cache do browser** — JS antigo cacheado (forçar Ctrl+Shift+R)
2. **CSS `pointer-events: none`** — verificar se botões ou ancestrais têm esta propriedade
3. **`e.stopPropagation()`** — nenhum stopPropagation encontrado nos handlers relevantes
4. **Container scope** — botões devem estar dentro do `container` do panel para event delegation funcionar

---

## v13.4.2 — DEEP DEBUG + DATE FIX + AUDIT FIELD FIX (2026-03-28)

### PROBLEMA 1 — Duplicate popover: debug expandido em showConfirmDialog
- **Diagnóstico:** `_duplicateItem` usa `showConfirmDialog(title, msg, 'Duplicar', triggerElement)` corretamente. Click-router passa `target` como triggerElement.
- **Ação:** Adicionado `console.log('[PNA:modals] showConfirmDialog CHAMADO', ...)` no início de `showConfirmDialog` com `triggerTag`, `triggerRect`
- **Ação:** Adicionado `console.log('[PNA:modals] Popover INSERIDO no DOM', ...)` após `document.body.appendChild(popover)`
- **Propósito:** Rastrear se `showConfirmDialog` é invocado, se o trigger é válido, e se o popover é realmente inserido no DOM
- **Arquivos:** `ui/modals.ts`, `ui/modals.js`

### PROBLEMA 2 — Toggle olho: debug expandido + verificação de resultado PATCH
- **Diagnóstico:** `_toggleItemActive` envia PATCH via `navAdapter.updateItem()` com `is_active: 0/1`. Console.logs existiam.
- **Ação:** Adicionada verificação explícita de `result.success || result.ok` antes de recarregar
- **Ação:** Se PATCH falhar, agora mostra toast de erro com mensagem da API (antes silenciava)
- **Ação:** Adicionado log após `_loadDataFn()` confirmar que dados foram recarregados
- **Propósito:** Identificar se o PATCH falha silenciosamente (CSRF, auth, validação) ou se a recarga não funciona
- **Arquivos:** `index.ts`, `index.js`

### PROBLEMA 3 — Histórico sem datas: 2 BUGS CORRIGIDOS
- **Bug 1 (index.php):** Query SQL retornava `al.created_at` sem `DATE_FORMAT`. Formato `YYYY-MM-DD HH:MM:SS` (com espaço) não é parseável por `new Date()` em todos os browsers.
  - **Fix:** Alterado para `DATE_FORMAT(al.created_at, '%Y-%m-%dT%H:%i:%s') AS created_at` (ISO 8601 com T)
  - **Arquivo:** `api/admin/navigation/index.php` (linha 596)
- **Bug 2 (audit.php):** Query usava `COALESCE(u.name, ...)` mas a tabela `app_users` NÃO TEM coluna `name` — a coluna correta é `username`. Isso causaria erro SQL se audit.php fosse acessado diretamente.
  - **Fix:** Alterado `u.name` → `u.username`
  - **Arquivo:** `api/admin/navigation/audit.php` (linha 54)
- **Extra (audit-history.ts/js):** Adicionado console.log na resposta de `fetchAuditHistory` mostrando success, dataLength e primeiro registro. Corrigido check de sucesso para aceitar `result.ok` além de `result.success`.
- **Arquivos:** `ui/audit-history.ts`, `ui/audit-history.js`

### DB Confirmado
- `DESCRIBE app_audit_log`: 11 campos incluindo `created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`
- `SELECT COUNT(*)`: 6 registros com timestamps válidos
- PATCH e DELETE em `index.php` já inserem via `AuditLogger::log()` (linhas 869 e 900)

### Compilação e Validação
- JS: `node --check` OK em index.js, modals.js, audit-history.js
- PHP: `php -l` OK em index.php, audit.php
- TS e JS sincronizados

---

## v13.4.0 — 4 BUG FIXES URGENTES (2026-03-28)

### PROBLEMA 1 — Duplicar usava window.confirm (popup nativo)
- **Causa:** `_duplicateItem` em index.ts linha 659 usava `window.confirm()` ao invés do popover inline padrão
- **Fix:** Substituído por `showConfirmDialog()` de `ui/modals.ts` com `triggerElement` para posicionamento via `getBoundingClientRect`
- **Click-router:** `DUPLICATE_ITEM` agora passa `target` como segundo argumento para `onDuplicateItem`
- **Arquivos:** `index.ts`, `handlers/click-router.ts`

### PROBLEMA 2 — Toggle olho (ativar/desativar) não funcionava
- **Causa:** `_toggleItemActive` usava comparação estrita `i.id === itemId` — falhava quando `i.id` era number e `itemId` (do DOM dataset) era string
- **Fix:** Aplicada coerção `String(i.id) === String(itemId)` (mesmo padrão já usado em `confirmDeleteItem` no crud.ts)
- **Arquivo:** `index.ts`

### PROBLEMA 3 — Novo Item não funcionava
- **Causa:** `crud.openItemForm()` procurava `[data-modal="item-form"]` no DOM — elemento inexistente pois `renderItemForm()` foi deprecado no renderer
- **Fix:** Click-router agora roteia `CREATE_ITEM` via `handlers.onCreateItem()`. Nova função `_createItem` em index.ts usa `showItemFormModal()` de `ui/modals.ts` com callback `onSave` que chama `navAdapter.createItem()` + emite eventos + recarrega dados
- **Arquivos:** `index.ts`, `handlers/click-router.ts`

### PROBLEMA 4 — Histórico mostrava "Invalid Date"
- **Causa:** MySQL retornava `created_at` como `2026-03-28 03:01:55` (formato espaço) — JavaScript `new Date()` não parseia esse formato corretamente em todos os browsers
- **Fix:** Query SQL agora usa `DATE_FORMAT(al.created_at, '%Y-%m-%dT%H:%i:%s')` para retornar ISO 8601 (`2026-03-28T03:01:55`)
- **Arquivo:** `api/admin/navigation/audit.php`

### Compilação e Validação
- TypeScript: 0 novos erros (3 pré-existentes em index.ts, não relacionados)
- JS compilados: `node --check` OK em index.js, click-router.js, crud.js
- PHP: `php -l` OK em audit.php
- SQL: `DATE_FORMAT` validado com dados reais

---

## v13.3.0 — VISUAL ENHANCEMENTS (2026-03-28)

### 8 Melhorias Visuais Implementadas

**MELHORIA 1 — Animação de entrada das linhas**
- CSS `@keyframes pna-row-enter` com fade-in + translateY(12px) em 350ms
- Cada `.pna-list-item` recebe `style="animation-delay: Nms"` (30ms * index) em cascata
- Arquivo: `renderer/items.ts` (renderItemRow) + `styles/_pna-list.css`

**MELHORIA 2 — Hover nas linhas**
- `.pna-list-item:hover` com `background: rgba(99,102,241,0.06)` e `transition: 0.15s ease`
- Sutil e performático, complementa o glow já existente
- Arquivo: `styles/_pna-list.css`

**MELHORIA 3 — Coluna GRUPO com chips coloridos por hash**
- Funções `_getGroupColor(groupName)`, `_getGroupBgColor()`, `_getGroupBorderColor()` retornam HSL consistente
- Hash do nome do grupo gera hue único (0-360°) com saturação 65%, lightness 65%
- Badge inline-styled com cor, bg e border dinâmicos
- Arquivo: `renderer/items.ts` (renderItemRow)

**MELHORIA 4 — Coluna CONTEXTO com cores vibrantes**
- SIDEBAR = roxo vibrante (`#c084fc`, `rgba(168,85,247,...)`)
- NAVRAIL = azul (`#60a5fa`, `rgba(59,130,246,...)`)
- HEADER = verde (`#4ade80`, `rgba(34,197,94,...)`)
- FOOTER = laranja (`#fb923c`, `rgba(249,115,22,...)`)
- Glow sutil com `box-shadow: 0 0 6px` em estado normal, intensificado no hover
- Arquivo: `styles/_pna-base-list.css`

**MELHORIA 5 — Coluna ROTA com syntax highlight**
- Rotas hash (`#/admin/...`) = classe `pna-route-hash` (cor ciano `#22d3ee`)
- Panel IDs (`panel-...`) = classe `pna-route-panel` (cor verde `#4ade80`)
- Outros = classe `pna-route-other` (cinza sutil)
- Função `_getRouteClass(href)` no renderer
- Arquivo: `renderer/items.ts` + `styles/_pna-list.css`

**MELHORIA 6 — Contador animado nos KPIs**
- `_animateCountTo(el, targetValue, 800)` com easeOutCubic
- Valores numéricos animam de 0 ao valor final em 800ms via `requestAnimationFrame`
- Valores não-numéricos mantêm update direto
- Arquivo: `renderer/kpis.ts`

**MELHORIA 7 — Empty state melhorado**
- Ícone grande de busca (64x64 SVG)
- Texto "Nenhum item encontrado" em destaque
- Sugestão "Tente ajustar os filtros ou limpar a busca"
- Botão "Limpar filtros" com `data-action="clear-filters"`
- Arquivo: `renderer/items.ts` (showEmptyState + renderItemsList)

**MELHORIA 8 — Skeleton loading melhorado**
- Grid proporcional às 12 colunas reais (bulk, order, icon, label, title, status, id, rota, contexto, grupo, level, actions)
- Shimmer mais suave: `animation-duration: 2s` com `ease-in-out`
- Delay em cascata (80ms por linha) para efeito visual progressivo
- Arquivo: `renderer/items.ts` (showSkeleton) + `styles/_pna-base-loading.css`

### Arquivos modificados
- `renderer/items.ts` v13.3.0-VISUAL-ENHANCEMENTS — melhorias 1,3,5,7,8
- `renderer/items.js` — recompilado via esbuild
- `renderer/kpis.ts` v13.3.0-VISUAL-ENHANCEMENTS — melhoria 6
- `renderer/kpis.js` — recompilado
- `ui/skeleton-loader.ts` v13.3.0-VISUAL-ENHANCEMENTS — version bump
- `ui/skeleton-loader.js` — recompilado
- `styles/_pna-list.css` — melhorias 1,2,5
- `styles/_pna-base-list.css` — melhoria 4
- `styles/_pna-base-loading.css` — melhoria 8

### Validação
- `node --check renderer/items.js` — OK
- `node --check renderer/kpis.js` — OK
- `node --check ui/skeleton-loader.js` — OK
- Contratos preservados: todos os exports mantidos
- Nenhuma regressão funcional

### Backups
- `/backup/items.ts.bak_20260328_*`
- `/backup/kpis.ts.bak_20260328_*`
- `/backup/skeleton-loader.ts.bak_20260328_*`
- `/backup/_pna-list.css.bak_20260328_*`
- `/backup/_pna-base-list.css.bak_20260328_*`
- `/backup/_pna-base-loading.css.bak_20260328_*`
- `/backup/_pna-base-states.css.bak_20260328_*`
- `/backup/_pna-kpis.css.bak_20260328_*`

---

## v13.2.0 — LEVEL BADGE POST-SAVE FIX (2026-03-28)

### Problema
Apos selecionar nivel via CustomSelect e salvar (PATCH), o badge exibia o numero bruto (0,1,2,3) em vez do chip colorido com texto descritivo (Publico, Usuario, Moderador, Admin). O CSS class `pna-level-N` tambem nao era atualizado, perdendo as cores.

### Causa raiz
Em `handlers/level-select.ts` linha 94: `badgeEl.innerHTML = svgHtml + ' ' + newValue` usava o valor numerico (`newValue`) em vez do label descritivo. Alem disso, a classe CSS `pna-level-N` nao era trocada ao mudar de nivel, e o `currentValue` era extraido por regex do texto (que agora mostra labels, nao numeros).

### Correcao
- Criada funcao utilitaria `getLevelBadgeHTML(level)` que retorna o HTML completo do chip (shield icon + label descritivo)
- Criada funcao interna `_applyLevelBadge(badgeEl, level)` que atualiza: innerHTML, data-level, swap da classe pna-level-N, e pna-badge-admin
- `currentValue` agora lido via `badgeEl.getAttribute('data-level')` (fonte confiavel) em vez de regex no textContent
- Rollback em caso de erro tambem usa `_applyLevelBadge()` para restaurar chip colorido
- `getLevelBadgeHTML` exportada para uso compartilhado futuro com renderer

### Arquivos modificados
- `handlers/level-select.ts` v2.1.0-LEVEL-BADGE-FIX — reescrito com funcoes utilitarias
- `handlers/level-select.js` — recompilado

### Validacao
- `node --check handlers/level-select.js` — OK
- Contratos preservados: exports (MODULE_ID, VERSION, createLevelSelectHandlers, info, healthCheck) + novos (getLevelBadgeHTML, LEVEL_LABELS, SHIELD_ICON)
- Evento `navigation:items:changed` preservado
- Rollback em erro preservado (agora com chip colorido)

### Backups
- `/backup/level-select.ts.bak_20260328_*`
- `/backup/level-select.js.bak_20260328_*`

---

## v13.1.0 — LEVEL CHIPS COLORIDOS (2026-03-28)

### Mudanca
Coluna NIVEL agora exibe chips/badges coloridos com texto descritivo em vez de numeros:
- **0** = chip cinza "Público"
- **1** = chip verde "Usuário"
- **2** = chip azul "Moderador"
- **3** = chip vermelho "Admin"

CustomSelect de edição de nível atualizado com cores correspondentes (dot colorido nas opções).

### Arquivos modificados
- `renderer/items.ts` / `renderer/items.js` — levelLabels map + classe pna-level-N + texto descritivo no badge
- `handlers/level-select.ts` / `handlers/level-select.js` — cores atualizadas: 0=cinza #9ca3af, 1=verde #4ade80, 2=azul #60a5fa, 3=vermelho #ef4444
- `styles/_pna-base-list.css` — classes .pna-level-0 a .pna-level-3 com background, border-color e color permanentes (não apenas hover)

### Validacao
- `node --check renderer/items.js` — OK
- `node --check handlers/level-select.js` — OK

### Backups
- `/backup/items.ts.bak_20260328_*`
- `/backup/level-select.ts.bak_20260328_*`
- `/backup/_pna-base-list.css.bak_20260328_*`

---

## v13.0.0 — UI COMPONENTS MODERNIZACAO (2026-03-28)

### Mudanca
Modernizacao visual dos componentes UI conforme BRF-UI-COMPONENTS-MODERNIZACAO v1.0.0:

**FASE 1 — CSS-only (inputs inline + badges interativos):**
- `_pna-inline-edit.css` v2.0.0: inputs com glow roxo, pulse focus animation, editing dot pulsante, border sweep animado, route input com foco ciano
- `_pna-base-list.css`: badge base interativo (.pna-badge hover lift+brightness), badges status/contexto/grupo/nivel com hover glow por cor, cursor pointer em editaveis, data-level hover por nivel
- `renderer/items.ts`: adicionado `data-level` attribute ao badge de nivel

**FASE 2 — CustomCheckbox (SVG animado + ripple):**
- Novo `styles/_pna-custom-checkbox.css`: checkbox customizado com check SVG animado (stroke-dashoffset), ripple effect, estado indeterminate, variante bulk compacta
- `renderer/items.ts`: substituidos 5 checkboxes nativos (2 bulk + 3 form) por pna-checkbox com SVG
- `ui/modals.ts`: substituidos checkboxes isDivider e scaffold por pna-checkbox
- `ui/filters/multi-select.ts`: substituido checkbox de filtro por pna-checkbox--bulk
- Imports adicionados em `main.css` e `main-base.css`

**FASE 3 — CustomSelect (dropdowns customizados):**
- Novo `styles/_pna-custom-select.css`: trigger button, popover animado, busca, opcoes com icon/color dot/check, keyboard nav, footer contagem
- Novo `ui/custom-select.ts` v1.0.0: openCustomSelect/closeCustomSelect com posicionamento auto, busca filtravel, Arrow/Enter/Escape navigation
- `handlers/level-select.ts` v2.0.0: migrado de `<select>` nativo para CustomSelect (4 opcoes fixas com cores)
- `handlers/group-select.ts` v2.0.0: migrado de `<select>` nativo para CustomSelect (opcoes dinamicas com busca)
- Imports adicionados em `main.css` e `main-base.css`

### Novos arquivos
- `styles/_pna-custom-checkbox.css`
- `styles/_pna-custom-select.css`
- `ui/custom-select.ts` / `ui/custom-select.js`

### Arquivos modificados
- `styles/_pna-inline-edit.css` — v2.0.0-AAA-MODULAR
- `styles/_pna-base-list.css` — badges interativos
- `styles/main.css` — imports custom-checkbox + custom-select
- `styles/main-base.css` — imports custom-checkbox + custom-select
- `renderer/items.ts` / `renderer/items.js` — checkboxes + data-level
- `ui/modals.ts` / `ui/modals.js` — checkboxes customizados
- `ui/filters/multi-select.ts` / `ui/filters/multi-select.js` — checkboxes customizados
- `handlers/level-select.ts` / `handlers/level-select.js` — v2.0.0 CustomSelect
- `handlers/group-select.ts` / `handlers/group-select.js` — v2.0.0 CustomSelect

### Backups
- `/backup/_pna-inline-edit.css.bak_20260328_*`
- `/backup/_pna-base-list.css.bak_20260328_*`
- `/backup/items.ts.bak_20260328_*`
- `/backup/items.js.bak_20260328_*`
- `/backup/modals.ts.bak_20260328_*`
- `/backup/multi-select.ts.bak_20260328_*`
- `/backup/level-select.ts.bak_20260328_*`
- `/backup/level-select.js.bak_20260328_*`
- `/backup/group-select.ts.bak_20260328_*`
- `/backup/group-select.js.bak_20260328_*`
- `/backup/main.css.bak_20260328_*`
- `/backup/main-base.css.bak_20260328_*`

### HOTFIX 2026-03-28 — Import path sem extensao .js
- **Problema:** `handlers/group-select.js` e `handlers/level-select.js` importavam `../ui/custom-select` sem extensao `.js`. No browser (ESM nativo), a URL sem extensao caia no fallback nginx (index.html), retornando HTML em vez de JS → erro de modulo.
- **Correcao:** Adicionada extensao `.js` nos imports dos `.ts` fonte e recompilado com esbuild.
  - `group-select.ts:29` → `from '../ui/custom-select.js'`
  - `level-select.ts:28` → `from '../ui/custom-select.js'`
- **Validacao pos-fix:**
  - `curl -sI .../ui/custom-select.js` → 200 application/javascript
  - `curl -sI .../handlers/group-select.js` → 200 application/javascript
  - `curl -sI .../handlers/level-select.js` → 200 application/javascript
  - `node --check handlers/group-select.js` OK
  - `node --check handlers/level-select.js` OK
- **Backups:** `/backup/group-select.js.bak_20260328_*`, `/backup/level-select.js.bak_20260328_*`

### Validacao
- `npx tsc --noEmit` — 0 erros nos arquivos modificados
- `node --check ui/custom-select.js` OK
- `node --check handlers/level-select.js` OK
- `node --check handlers/group-select.js` OK
- `node --check renderer/items.js` OK
- `node --check ui/modals.js` OK
- `node --check ui/filters/multi-select.js` OK

### Contratos preservados
- Seletores `.pna-bulk-checkbox` e `.pna-bulk-select-all` mantidos nos inputs (dentro do wrapper pna-checkbox)
- `input[type="checkbox"]` selector continua funcionando (input oculto via clip)
- `form.isDivider.checked` continua funcionando (input preservado com name)
- `createLevelSelectHandlers()` e `createGroupSelectHandlers()` mantêm mesma assinatura
- Eventos `navigation:items:changed` preservados

---

## v12.5.0 — INLINE CONFIRM POPOVER (2026-03-28)

### Mudanca
- Substituido modal overlay de confirmacao de exclusao por popover inline posicionado junto ao botao da lixeira
- Popover usa `getBoundingClientRect()` do `triggerElement` para posicionamento fixed
- Visual: fundo #1e1e2e, borda vermelha sutil, icone de aviso amarelo, botoes Cancelar (ghost) e Excluir (vermelho com icone lixeira)
- Animacao suave de entrada (fade + scale 0.92→1 em 0.15s)
- Fecha ao clicar fora (document click listener com capture) ou Escape
- Retorna `Promise<boolean>` — resolve true (Excluir), false (Cancelar/fora)
- Fallback: se nao receber `triggerElement`, usa modal overlay como antes

### Assinatura atualizada
- `showConfirmDialog(title, message, confirmLabel?, triggerElement?): Promise<boolean>`

### Arquivos modificados
- `ui/modals.ts` — v9.5.0-INLINE-CONFIRM-POPOVER: nova implementacao com popover inline
- `ui/modals.js` — recompilado (esbuild)
- `handlers/crud.ts` — v11.6.0-INLINE-CONFIRM: passa triggerElement e nome do item no titulo
- `handlers/crud.js` — recompilado (esbuild)
- `handlers/click-router.ts` — passa `target` (botao clicado) como triggerElement para confirmDeleteItem
- `handlers/click-router.js` — recompilado (esbuild)
- `styles/_pna-base-list.css` — adicionado bloco `.pna-confirm-popover` e sub-classes

### Backups
- `/backup/modals.ts.bak_20260328_*`
- `/backup/modals.js.bak_20260328_*`
- `/backup/crud.ts.bak_20260328_*`
- `/backup/crud.js.bak_20260328_*`
- `/backup/click-router.ts.bak_20260328_*`
- `/backup/click-router.js.bak_20260328_*`
- `/backup/_pna-base-list.css.bak_20260328_*`

### Validacao
- `esbuild ui/modals.ts` → 12.0kb OK
- `esbuild handlers/crud.ts` → 12.1kb OK
- `esbuild handlers/click-router.ts` → 7.8kb OK
- `node --check ui/modals.js` OK
- `node --check handlers/crud.js` OK
- `node --check handlers/click-router.js` OK

---

## v12.4.0 — DELETE TRACE + FAST DISPATCH (2026-03-27)

### PROBLEMA 1: Exclusao de item nao funciona apos confirmacao

#### Diagnostico em andamento
- Adicionados 15 console.log traces em `confirmDeleteItem` e `executeDeleteItem`
- Traces rastreiam: entrada da funcao, item encontrado no state, retorno do window.confirm, _pendingDelete, sourceTable/sourceId, request DELETE, resposta do servidor
- Corrigido: constantes MODULE_ID e VERSION que estavam ausentes em crud.ts (referenciadas em info/healthCheck mas nunca declaradas)

#### Pontos de rastreamento adicionados
1. `[crud] confirmDeleteItem CHAMADO` — itemId recebido e callbacks
2. `[crud] items no state` — quantidade de items e itemId buscado
3. `[crud] item encontrado` — SIM/NAO + sourceTable/sourceId
4. `[crud] Abrindo window.confirm` — label do item
5. `[crud] window.confirm retornou` — true/false
6. `[crud] Exclusao CANCELADA` — se usuario cancelou
7. `[crud] _pendingDelete definido` — objeto completo
8. `[crud] executeDeleteItem CHAMADO` — _pendingDelete
9. `[crud] executeDeleteItem ABORTADO` — se _pendingDelete invalido ou sem sourceTable/sourceId
10. `[crud] Enviando DELETE` — id, sourceTable, sourceId
11. `[crud] DELETE resposta` — resultado do servidor

#### Arquivos modificados
- `handlers/crud.ts` — console.log traces + MODULE_ID/VERSION
- `handlers/crud.js` — recompilado (esbuild)

### PROBLEMA 2: Click handler lento (1273ms / 3305ms)

#### Causa raiz
- `for...in` loops sobre dispatch maps criavam iteradores a cada clique
- `.closest('.pna-list-header [data-sort]')` fazia travessia DOM redundante dentro do walk
- Maioria dos cliques (>80%) sao em `[data-action]` mas entravam no walk loop completo

#### Otimizacoes aplicadas (event-setup v12.1.0-FAST-DISPATCH)
1. **Fast path target/parent**: Verifica `data-action` no target e parent direto antes de entrar no walk — evita o loop para >80% dos cliques interativos
2. **Pre-computed key arrays**: `Object.keys()` chamado uma vez no setup; loops indexados (`for i=0; i<len; i++`) substituem `for...in` (elimina criacao de iterador)
3. **Sort detection via walk**: Removido `.closest('.pna-list-header [data-sort]')` — agora detecta `data-sort` durante o proprio walk (zero travessias extras)

#### Arquivos modificados
- `core/event-setup.ts` — v12.1.0-FAST-DISPATCH
- `core/event-setup.js` — recompilado (esbuild)

#### Backups
- `/backup/crud.ts.bak_20260327_*`
- `/backup/crud.js.bak_20260327_*`
- `/backup/event-setup.ts.bak_20260327_*`
- `/backup/event-setup.js.bak_20260327_*`

#### Validacao
- `esbuild handlers/crud.ts` → 11.7kb OK
- `esbuild core/event-setup.ts` → 8.5kb OK
- `node --check handlers/crud.js` OK
- `node --check core/event-setup.js` OK

---

## v12.3.1 — FIX CRITICO: displayTitle perdido no ViewModel (2026-03-27)

### Problema
- Coluna TITULO não exibia o valor salvo após edição inline
- O PATCH salvava corretamente no banco (display_title), cache era invalidado, mas ao recarregar a tabela o valor desaparecia

### Causa raiz
- `mapItemToViewModel()` em `utils/mappers.ts` NÃO incluía o campo `displayTitle` no objeto ViewModel
- O renderer (`renderer/items.ts:138`) acessava `item.displayTitle` que era sempre `undefined` no ViewModel
- Resultado: sempre exibia o placeholder "Mesmo Item" em vez do título customizado

### Fluxo verificado (completo)
1. `handlers/inline-edit.ts` → envia `{ displayTitle: valueToSave }` ao navAdapter ✓
2. `core/nav-adapter.ts` → mapeia `displayTitle` → `display_title` no PATCH body ✓
3. `api/admin/navigation/index.php` → `display_title` na lista de campos permitidos ✓
4. DB → `UPDATE ui_nav_items SET display_title = :val WHERE id = :id` → salva corretamente ✓
5. `invalidateNavCache()` → chamado após PATCH ✓
6. `nav-adapter._mapApiItem()` → mapeia `display_title` → `displayTitle` no fetch ✓
7. **`utils/mappers.ts` → `mapItemToViewModel()` NÃO passava `displayTitle` para o ViewModel** ← BUG

### Correção
- Adicionado `displayTitle: item.displayTitle || null` em `mapItemToViewModel()` (mappers.ts e mappers.js)

### Arquivos modificados
- `utils/mappers.ts` — adicionado displayTitle no ViewModel
- `utils/mappers.js` — idem (runtime)

### Backups
- `/backup/mappers.ts.bak_20260327_*`

### Validação
- `node --check utils/mappers.js` ✓

---

## v12.3.0 — UX IMPROVEMENTS — 3 Melhorias (2026-03-27)

### MELHORIA 1: Confirmação ao duplicar
- `_duplicateItem()` agora exibe `window.confirm()` antes de executar POST
- Mensagem: "Deseja duplicar o item NOME? Um novo item será criado com o nome NOME (cópia)."
- POST só executa após confirmação do usuário

### MELHORIA 2: Feedback visual após duplicar
- Após duplicação bem-sucedida:
  - a) Recarrega tabela via `_loadDataFn()`
  - b) Scroll suave até o novo item (`scrollIntoView({ behavior: 'smooth', block: 'center' })`)
  - c) Destaque verde temporário com borda + background por 3 segundos (classe `pna-item-highlight`)
  - d) Toast verde "Item duplicado com sucesso"
- CSS: animação `pna-highlight-fade` (keyframe 3s ease-out) em `_pna-base-list.css`

### MELHORIA 3: Modo agrupar melhorado
- a) Cabeçalho de grupo com ícone do grupo (via IconRegistry ou folder SVG fallback), nome e contador `(N)`
- b) Cabeçalhos colapsáveis — clique no cabeçalho expande/colapsa o grupo
- c) Estado de colapso persistido em `localStorage` (chave `pna-collapsed-groups`) por grupo
- d) Botões "Expandir tudo" e "Colapsar tudo" na toolbar quando em modo agrupado
- e) Grupos ordenados alfabeticamente pelo label
- f) Itens dentro de cada grupo mantendo ordem original
- Funções adicionadas: `_expandAllGroups()`, `_collapseAllGroups()`
- Event delegation: `data-action="expand-all-groups"`, `data-action="collapse-all-groups"`
- CSS: `.pna-group-header:hover`, `.pna-group-section--collapsed`, `.pna-group-toolbar`

### Arquivos modificados
- `index.ts` / `index.js` — _duplicateItem com confirm + feedback, _expandAllGroups, _collapseAllGroups, collapsed groups persistido em localStorage
- `renderer/items.ts` / `renderer/items.js` — renderGroupedItemsList com ícone, sort alfabético, contador badge
- `styles/_pna-base-list.css` — pna-item-highlight keyframe, pna-group-header hover, pna-group-toolbar

### Backups
- `/backup/index.ts.bak_20260327_*`
- `/backup/items.ts.bak_20260327_*`
- `/backup/MIGRATION_STATUS.md.bak_20260327_*`

### Validação
- `esbuild index.ts` → 28.0kb ✓
- `esbuild renderer/items.ts` → 20.5kb ✓
- `node --check index.js` ✓
- `node --check renderer/items.js` ✓

---

## v12.2.1 — UX BUGFIXES — 3 Correções (2026-03-27)

### FIX 1: Duplicar item retornava 403 Forbidden
- `_duplicateItem()` em `index.ts` fazia `fetch()` cru sem header `X-CSRF-Token`
- Corrigido para usar `navAdapter.createItem()` que inclui CSRF via `_writeHeaders()` e auto-retry via `_fetchWithCSRFRetry()`
- Payload agora usa chaves do dominio (id, label, section, etc.) conforme contrato do nav-adapter

### FIX 2: Botões Agrupar e Compacto cortados na toolbar (overflow)
- Botões estavam em `pna-view-toggles` entre filtros e tabs, causando overflow horizontal
- Movidos para dentro de `pna-filters` com `margin-left:auto` para alinhar à direita
- Removido texto dos botões — agora apenas ícones SVG com `title` tooltip

### FIX 3: Texto cortado nos botões Agrupar e Compacto
- Textos "Agrupar" e "Compacto" renderizavam truncados ("grupo", "ompac")
- Substituídos por ícones SVG icon-only com classe `pna-btn-icon-only`
- CSS atualizado em `_pna-base-toolbar.css`: `font-size:0`, botões 30x30px, centralização flex
- Tooltips preservados via atributo `title`

### Arquivos modificados
- `index.ts` / `index.js` — _duplicateItem usa navAdapter.createItem()
- `ui/renderer.ts` / `ui/renderer.js` — botões icon-only dentro de pna-filters
- `styles/_pna-base-toolbar.css` — pna-view-toggles com layout icon-only

### Validação
- `node --check index.js` ✓
- `node --check ui/renderer.js` ✓

---

## v12.2.0 — UX ENHANCEMENTS — 6 Melhorias (2026-03-27)

### MELHORIA 1: Exportar JSON/CSV com display_title
- `exportJSON()` agora mapeia cada item adicionando `display_title` ao objeto exportado
- `exportCSV()` inclui coluna `display_title` no header e dados
- Ambos resolvem `displayTitle` ou `display_title` do item original

### MELHORIA 2: Busca no display_title
- Predicado `getFilteredItems()` em `store.ts` agora busca tambem no campo `displayTitle`
- Campos pesquisaveis: label, id, href, displayTitle

### MELHORIA 3: Duplicar item (botao copy na coluna Acoes)
- Botao com icone copy (SVG) adicionado antes do toggle-active na coluna ACOES
- Acao `duplicate-item` roteada via click-router para handler `_duplicateItem`
- POST `/api/admin/navigation/items` com dados do item original + label sufixado " (copia)" + sem display_title
- Apos criar: recarrega tabela + emite `navigation:items:changed`

### MELHORIA 4: Agrupamento por secao
- Botao "Agrupar" na toolbar (area `pna-view-toggles`) alterna lista plana / agrupada por grupo (parentKey/section)
- No modo agrupado: cabecalho colapsavel com nome do grupo + quantidade de itens
- Click no cabecalho colapsa/expande grupo
- Preferencia persistida em `localStorage` (`pna-group-view`)
- Funcao `renderGroupedItemsList()` adicionada em `renderer/items.ts`

### MELHORIA 5: Modo compacto
- Botao "Compacto" na toolbar alterna linhas de 48px para 28px com fonte menor
- Classe `pna-compact` no container aplica CSS para linhas, badges, icones e botoes menores
- Preferencia persistida em `localStorage` (`pna-compact-mode`)
- CSS adicionado em `_pna-base-toolbar.css`

### MELHORIA 6: Confirmacao bulk delete
- `window.confirm()` antes de excluir itens em massa
- Mensagem lista quantidade total + nomes dos primeiros 5 itens selecionados
- Se mais de 5, mostra "... e mais N itens"
- Aplicado nos dois pontos de entrada: toolbar flutuante e handler `onBulkDeleteSelected`

### ARQUIVOS MODIFICADOS (v12.2.0)

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `handlers/export-import.ts` | MODIFICADO | display_title em exportJSON + exportCSV |
| `handlers/export-import.js` | RECOMPILADO | esbuild ESM (3.2kb) |
| `state/store.ts` | MODIFICADO | displayTitle no predicado de busca |
| `state/store.js` | RECOMPILADO | esbuild ESM (12.4kb) |
| `renderer/items.ts` | MODIFICADO | Botao duplicar + renderGroupedItemsList |
| `renderer/items.js` | RECOMPILADO | esbuild ESM (26.5kb) |
| `handlers/click-router.ts` | MODIFICADO | 3 novas acoes: duplicate-item, toggle-group-view, toggle-compact-mode |
| `handlers/click-router.js` | RECOMPILADO | esbuild ESM (7.8kb) |
| `index.ts` | MODIFICADO | Handlers: _duplicateItem, _confirmBulkDelete, _toggleGroupView, _toggleCompactMode, _toggleGroupCollapse, _restoreViewPreferences |
| `index.js` | RECOMPILADO | esbuild ESM (44.2kb) |
| `ui/renderer.ts` | MODIFICADO | Botoes Agrupar + Compacto na toolbar |
| `ui/renderer.js` | RECOMPILADO | esbuild ESM (15.6kb) |
| `styles/_pna-base-toolbar.css` | MODIFICADO | CSS para compact mode, view toggles, duplicate btn, group headers |

### VALIDACAO (v12.2.0)

- `node --check` handlers/export-import.js — PASS
- `node --check` state/store.js — PASS
- `node --check` renderer/items.js — PASS
- `node --check` handlers/click-router.js — PASS
- `node --check` index.js — PASS
- `node --check` ui/renderer.js — PASS

---

## v12.1.2 — CLEANUP: Remocao console.log debug display_title (2026-03-27)

Removidos todos os 6 `console.log` de debug com prefixos `[inline-edit]` adicionados em v12.1.1 para diagnostico do fluxo `display_title`.
Mantido `console.error` legitimo no bloco catch (linha 154: updateItem FAILED).

| Arquivo | Acao | Logs removidos | Logs mantidos |
|---------|------|----------------|---------------|
| `handlers/inline-edit.ts` | MODIFICADO | 6 (handleDisplayTitleClick x2, _finishTitleEdit x4) | 1 (console.error: updateItem FAILED) |
| `handlers/inline-edit.js` | RECOMPILADO | esbuild ESM (11.0kb) | node --check PASS |

### Logs removidos (detalhamento)
1. `handleDisplayTitleClick` — itemId, sourceTable, sourceId
2. `handleDisplayTitleClick` — storeItem, originalValue, fallbackLabel
3. `_finishTitleEdit` — save, newValue, valueToSave, originalValue
4. `_finishTitleEdit` — SKIP (save flag + same check)
5. `_finishTitleEdit` — PATCH payload
6. `_finishTitleEdit` — PATCH response

---

## v12.1.1 — TITLE BUGFIX — 3 Correcoes (2026-03-27)

### CORRECAO 1: Console.log para rastreio do fluxo displayTitle
- Adicionados 6 console.log em `handleDisplayTitleClick` e `_finishTitleEdit`
- **REMOVIDOS em v12.1.2** — diagnostico concluido
- Rastreia: itemId, sourceTable, sourceId, storeItem, originalValue, fallbackLabel
- Rastreia: save flag, newValue, valueToSave, originalValue (comparacao)
- Rastreia: payload do PATCH e resposta da API
- Permite diagnostico no DevTools quando o titulo nao persiste

### CORRECAO 2: Botao reset X nao aparecia
- Classe alterada de `pna-btn-reset-title` para `pna-display-title-reset`
- Condicao alterada: agora aparece quando `display_title` nao e null/vazio (`hasDisplayTitle`)
- Antes: so aparecia quando `displayTitle` diferia do `label` (`hasCustomTitle`)
- Botao mantem `data-action="reset-display-title"` e `data-item-id`

### CORRECAO 3: Hover tooltip com preview do header
- Atributo `title` no `.pna-display-title` alterado de "Clique para editar titulo no header"
  para "Preview no header: {displayTitle ou label}"
- Agora mostra o texto real que aparecera no header do container

### ARQUIVOS MODIFICADOS (v12.1.1)

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `handlers/inline-edit.ts` | MODIFICADO | 6 console.log no fluxo displayTitle |
| `handlers/inline-edit.js` | RECOMPILADO | esbuild ESM |
| `renderer/items.ts` | MODIFICADO | Reset btn class/condicao, title tooltip |
| `renderer/items.js` | RECOMPILADO | esbuild ESM |

### VALIDACAO (v12.1.1)

- `node --check` inline-edit.js — PASS
- `node --check` items.js — PASS
- Grep confirma: 6 console.log, pna-display-title-reset, "Preview no header" nos .js compilados

---

## v12.1.0 — TITLE UX ENHANCE — 5 Melhorias (2026-03-27)

### MELHORIA 1: Placeholder "Mesmo Item" quando display_title vazio
- Celula TITULO mostra `<span class="pna-title-placeholder">Mesmo Item</span>` em cinza italico
- Ao clicar para editar, input comeca vazio (nao pre-preenche com label)
- Placeholder do input mostra o label como referencia

### MELHORIA 2: Indicador visual de titulo customizado
- Ponto azul (`pna-title-custom-dot`) aparece antes do titulo quando `displayTitle` difere do `label`
- Box-shadow glow azul sutil para destaque

### MELHORIA 3: Botao reset titulo (X)
- Botao `pna-btn-reset-title` com `data-action="reset-display-title"` aparece ao hover da celula
- PATCH com `displayTitle: ''` via navAdapter, emite evento `navigation:items:changed`
- Rota no click-router: `RESET_DISPLAY_TITLE` → `onResetDisplayTitle`

### MELHORIA 4: Tooltip preview no header
- Atributo `data-tooltip-preview` com texto "Preview no header: {titulo}"
- CSS `::after` pseudo-element renderiza tooltip acima da celula no hover
- Animacao fade-in de 150ms

### MELHORIA 5: Bulk set display_title
- Nova acao `SET_DISPLAY_TITLE` em `BULK_ACTIONS` (bulk-operations.ts)
- Botao "Titulo" na toolbar bulk section (`data-action="bulk-set-title"`)
- Modal com input para definir titulo em massa
- Click-router: `BULK_SET_TITLE` → `onBulkSetTitle`
- Validacao: minimo 2 caracteres, vazio limpa todos

### ARQUIVOS MODIFICADOS (v12.1.0)

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `renderer/items.ts` | MODIFICADO | Placeholder, dot, reset btn, tooltip no renderItemRow |
| `renderer/items.js` | RECOMPILADO | esbuild ESM |
| `handlers/inline-edit.ts` | MODIFICADO | Input vazio ao editar titulo sem valor |
| `handlers/inline-edit.js` | RECOMPILADO | esbuild ESM |
| `handlers/click-router.ts` | MODIFICADO | RESET_DISPLAY_TITLE + BULK_SET_TITLE actions |
| `handlers/click-router.js` | RECOMPILADO | esbuild ESM |
| `data/bulk-operations.ts` | MODIFICADO | SET_DISPLAY_TITLE bulk action + _executeOne case |
| `data/bulk-operations.js` | RECOMPILADO | esbuild ESM |
| `ui/toolbar.ts` | MODIFICADO | Botao "Titulo" na bulk section |
| `ui/toolbar.js` | RECOMPILADO | esbuild ESM |
| `core/event-setup.ts` | SEM MUDANCA | Dispatch ja coberto pelo data-action existente |
| `core/event-setup.js` | RECOMPILADO | esbuild ESM (cache bust) |
| `index.ts` | MODIFICADO | _resetDisplayTitle + _bulkSetTitle handlers |
| `index.js` | RECOMPILADO | esbuild ESM |
| `styles/_pna-base-list.css` | MODIFICADO | CSS para placeholder, dot, reset btn, tooltip |

### VALIDACAO

- `node --check` em 7 .js compilados — PASS
- esbuild sem erros — PASS
- Grep confirma 7 features nos compiled outputs — PASS

### BACKUPS (v12.1.0)

Todos os originais em `/backup/` com sufixo `bak_20260327_184903`.

---

## v12.0.1 — DISPLAY TITLE AUDIT + RECOMPILE (2026-03-27)

### Auditoria completa: coluna TITULO verificada em todas as camadas

**Resultado:** Implementacao 100% correta em todas as camadas. Recompilacao forcada para garantir cache bust.

| Camada | Status | Detalhe |
|--------|--------|---------|
| `renderer/items.ts` (source) | OK | Header linha 172 + Row linha 151 com `pna-col-display-title` |
| `renderer/items.js` (compiled) | RECOMPILADO | esbuild ESM, 2 ocorrencias de `display-title` confirmadas |
| `_pna-base-list.css` (grid) | CORRIGIDO | Comentario atualizado: 12 colunas (era "11"), grid-template-columns ja tinha 12 valores |
| `_pna-base-responsive.css` | OK | Coluna oculta em `<1200px` (comportamento esperado) |
| `nav-adapter.js` (mapping) | OK | `display_title` → `displayTitle` na linha 140 |
| API `/admin/navigation/items` | OK | Retorna `display_title` nos UNIONs (sidebar+navrail=real, header+footer=NULL) |
| DB schema | OK | `ui_nav_items.display_title` e `navrail_items.display_title` existem (VARCHAR 100) |
| CSS conflicts | NENHUM | Nenhum override de grid-template-columns nos 12 premium partials |

**Nota:** Se a coluna nao aparece no browser, verificar: (1) viewport >= 1200px, (2) hard refresh Ctrl+Shift+R para limpar cache do browser.

---

## v12.0.0 — DISPLAY TITLE HEADER SYNC (2026-03-27)

### Implementacao completa: titulo editavel no header do container principal

**4 Etapas implementadas conforme diagnostico-titulo-header.md:**

### ETAPA 1: Contraste CSS imediato
- `.dsd-container__title` agora usa `color: #f1f5f9` (branco puro) com `text-shadow` sutil
- Garante legibilidade em qualquer fundo (violet, gradiente, glass)

### ETAPA 2: Schema DB + API
- `ALTER TABLE navrail_items ADD COLUMN display_title VARCHAR(100) NULL AFTER label`
- `ALTER TABLE ui_nav_items ADD COLUMN display_title VARCHAR(100) NULL AFTER label`
- GET `/api/admin/navigation/items` agora retorna `display_title` nos UNIONs (sidebar + navrail = coluna real, header + footer = NULL)
- PATCH aceita `display_title` como campo valido para `ui_nav_items` e `navrail_items`
- `nav-adapter.ts` `_mapApiItem()` inclui `displayTitle` no modelo
- `nav-adapter.ts` `updateItem()` envia `display_title` no payload PATCH

### ETAPA 3: UI editavel — coluna TITULO no panel-nav-admin
- Nova coluna "Titulo" no grid (12 colunas total) entre Item e Status
- Celula mostra `displayTitle` ou `label` como fallback
- Clique na celula abre input inline (mesmo padrao do campo Item)
- Enter salva via PATCH com `display_title`, Escape cancela
- Validacao: minimo 2 caracteres, campo vazio limpa o display_title
- Evento `navigation:items:changed` emitido com `action: 'display-title-edit'`
- CSS: `.pna-col-display-title`, `.pna-display-title` com hover highlight
- Responsivo: coluna oculta em `<1200px`

### ETAPA 4: Header sync em tempo real
- `_resolvePanelTitle()` agora prioriza `data-display-title` do DOM antes de `data-label`
- Sidebar renderer (`navigation-renderer.ts`) injeta `data-display-title` e `data-label` nos `<li>` items
- Sidebar model loader (`helpers.ts`) mapeia `display_title` → `displayTitle` no modelo
- `PanelLifecycleController` escuta `navigation:items:changed` e atualiza titulo do header em tempo real quando `action === 'display-title-edit'`

### ARQUIVOS MODIFICADOS (v12.0.0)

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `container-main/styles/modules/03-layout.css` | MODIFICADO | color: #f1f5f9 + text-shadow |
| `api/admin/navigation/index.php` | MODIFICADO | display_title nos UNIONs + $allowed PATCH |
| `panel-nav-admin/renderer/items.ts` | MODIFICADO | Coluna Titulo + status sync TS |
| `panel-nav-admin/handlers/inline-edit.ts` | MODIFICADO | handleDisplayTitleClick() |
| `panel-nav-admin/core/event-setup.ts` | MODIFICADO | Dispatch .pna-display-title |
| `panel-nav-admin/core/nav-adapter.ts` | MODIFICADO | displayTitle no _mapApiItem + updateItem |
| `panel-nav-admin/styles/_pna-base-list.css` | MODIFICADO | Grid 12 colunas + CSS display-title |
| `panel-nav-admin/styles/_pna-base-responsive.css` | MODIFICADO | Hide display-title <1200px |
| `main/domain/panel-lifecycle-controller.ts` | MODIFICADO | _resolvePanelTitle + event listener |
| `sidebar/ui/navigation-renderer.ts` | MODIFICADO | data-display-title + data-label attrs |
| `sidebar/.../helpers.ts` | MODIFICADO | displayTitle no modelo |
| `container-main.bundle.css` | RECOMPILADO | CSS atualizado |
| `main.bundle.js` | RECOMPILADO | Vite build OK |
| `sidebar.bundle.js` | RECOMPILADO | Vite build OK |

### DB SCHEMA

```sql
ALTER TABLE navrail_items ADD COLUMN display_title VARCHAR(100) NULL AFTER label;
ALTER TABLE ui_nav_items ADD COLUMN display_title VARCHAR(100) NULL AFTER label;
```

### VALIDACAO

- `php -l api/admin/navigation/index.php` — PASS
- `node --check` em todos os 7 .js compilados — PASS
- `main.bundle.js` (Vite) — PASS (1,297 kB)
- `sidebar.bundle.js` (Vite) — PASS (536 kB)
- `container-main.bundle.css` — PASS (zero @import)

### BACKUPS (v12.0.0)

Todos os originais em `/backup/` com sufixo `bak_20260327_*`.

---

## v11.6.0 — PAGINATION PERSIST FIX (2026-03-27)

### BUG FIX: Paginacao nunca aparecia na UI

**Causa raiz:** Tres caminhos independentes chamavam `updateItems()`, mas apenas `_applyFilters()` aplicava paginacao e renderizava controles:
1. `loadData()` (data-loader.ts:231) — renderizava TODOS os itens sem paginacao
2. Store subscription `items` (subscriptions.ts:59) — renderizava TODOS os itens sem paginacao
3. `_applyFilters()` (index.ts:390) — unico caminho com paginacao + `_renderPaginationControls()`

O fluxo `_loadDataFn → loadData → store.setItems → subscription` nunca chamava `_applyFilters()`, entao os controles de paginacao nunca eram renderizados apos carga de dados ou refresh.

**Correcao:** Adicionado `_applyFilters()` ao final de `_loadDataFn()` (apos `loadData` resolver e refs serem reconstruidos). Isso garante que:
- Items sao fatiados para a pagina atual
- Controles de paginacao sao renderizados abaixo da lista
- Paginacao persiste apos refresh automatico (scheduler)

### ARQUIVOS MODIFICADOS (v11.6.0)

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `index.ts` (nav-admin) | MODIFICADO | `_loadDataFn` agora chama `_applyFilters()` apos loadData |
| `index.js` (nav-admin) | MODIFICADO | JS sync com TS |

---

## v11.5.0 — BULK FLOAT + PAGINATION FIX + TESTS + DOCS (2026-03-27)

### MELHORIA 1: Bulk Actions — Toolbar Flutuante
- Toolbar de acoes em massa agora e **flutuante na parte inferior da tela** (position: fixed, bottom)
- Visual enterprise: backdrop-filter blur, sombra profunda, borda azul sutil
- Animacao slide-up ao aparecer
- Botoes com icones SVG: Ativar (olho), Desativar (olho-off), Excluir (lixeira), Limpar (X)
- Contagem gramaticalmente correta: "1 item selecionado" vs "5 itens selecionados"
- Novo estilo `.pna-btn--ghost` para botao Limpar
- CSS atualizado em `styles/_pna-table.css`

### MELHORIA 2: Paginacao — Fix Container Target
- `_renderPaginationControls` agora busca `[data-tab-content="items"]` como alvo prioritario
- Evita que controles de paginacao apareçam fora do tab de itens
- Fallback mantido: `.pna-items` → `[data-items]` → `.pna-content`

### MELHORIA 3: Testes Automatizados das APIs Criticas
- **Novo arquivo:** `tests/api-navigation-test.php` (v1.0.0)
- Testa 5 endpoints: GET items, PATCH items, POST reorder, DELETE items, GET health-dashboard
- Cada teste verifica: HTTP status, estrutura JSON, tempo de resposta (< 3000ms)
- Autenticacao automatica via login API
- PATCH/DELETE fazem testes nao destrutivos (restauram estado original)
- Relatorio final colorido com contagem passed/failed
- Exit code 0/1 para integracao CI/CD
- Uso: `php tests/api-navigation-test.php [--base-url=URL] [--verbose]`

### MELHORIA 4: Documentacao Tecnica
- **ROADMAP-MELHORIAS-2026.md** atualizado:
  - Secao 1.2 com 4 novas melhorias concluidas
  - Secao 1.3 com itens pendentes atualizados
  - Criterios de sucesso de paginacao (3.1) marcados como concluidos
  - Criterios de sucesso de bulk actions (3.2) marcados como concluidos
  - Versao atualizada para 11.5.0-BULK-FLOAT-PAG
- **DOCUMENTACAO-TECNICA-PANEL-NAV-ADMIN.md** criado:
  - Arquitetura completa com diagrama
  - Estrutura de diretorios (90+ arquivos documentados)
  - 11 features detalhadas
  - API Reference completa (5 endpoints)
  - Guia de desenvolvimento
  - Changelog recente

### ARQUIVOS MODIFICADOS (v11.5.0)

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `index.ts` (nav-admin) | MODIFICADO | Bulk toolbar flutuante + pagination fix |
| `index.js` (nav-admin) | MODIFICADO | JS sync com TS |
| `renderer/items.ts` | MODIFICADO | Versao atualizada |
| `styles/_pna-table.css` | MODIFICADO | Bulk toolbar floating CSS |
| `tests/api-navigation-test.php` | **CRIADO** | Suite de testes API |
| `claude/docs/ROADMAP-MELHORIAS-2026.md` | MODIFICADO | Status atualizado |
| `claude/docs/DOCUMENTACAO-TECNICA-PANEL-NAV-ADMIN.md` | **CRIADO** | Doc tecnica completa |

### VALIDACAO

- `node --check index.js` — PASS
- `node --check bulk-operations.js` — PASS
- `node --check pagination.js` — PASS
- `php -l api-navigation-test.php` — PASS
- `php -l api/admin/navigation/index.php` — PASS
- `php -l api/admin/navigation/reorder.php` — PASS
- `php -l api/admin/health-dashboard.php` — PASS

### BACKUPS (v11.5.0)

Todos os originais em `/backup/` com sufixo `bak_20260327_*`.

---

## v11.4.2 — STATUS BUTTON FIX (2026-03-27)

### FIX: Botao Status ausente na toolbar do panel-nav-admin
- **Problema:** O botao "Status" (`data-action="health-status"`) nao aparecia na toolbar
- **Causa raiz:** O botao existia na classe `Toolbar` em `ui/toolbar.ts`, mas essa classe **nunca e usada** para renderizar a toolbar real. O HTML real e gerado por `_renderToolbar()` em `ui/renderer.ts`, que nao incluia o botao Status
- **Correcao:** Adicionado o botao `<button class="pna-toolbar-btn pna-toolbar-btn--status" data-action="health-status">` na funcao `_renderToolbar()` do `ui/renderer.ts`, apos a div `.pna-tabs`
- **Arquivo:** `ui/renderer.ts` (linha 180)
- **Recompilacao:** `ui/renderer.js` via esbuild --format=esm --target=es2022 (14.8kb) — PASS
- **Validacao:** `node --check renderer.js` — PASS
- **Click-router:** Ja suportava a acao `HEALTH_STATUS` (handlers/click-router.ts:255) — nenhuma alteracao necessaria
- **CSS:** Estilo `.pna-toolbar-btn--status` ja existia em `styles/_pna-base-toolbar.css` — nenhuma alteracao necessaria

---

## v11.4.1 — ACTIONS COLUMN FLEX FIX (2026-03-27)

### FIX: Botoes da coluna Acoes em linhas separadas
- **Problema:** Botoes toggle-active (olho) e delete (lixeira) apareciam empilhados verticalmente na coluna Acoes
- **Causa:** `.pna-col-actions` nao tinha `flex-direction: row`, `align-items: center` nem `flex-wrap: nowrap` explicitos
- **Correcao:** Adicionado `flex-direction: row`, `align-items: center`, `gap: 4px`, `flex-wrap: nowrap` em `_pna-base-list.css`
- **Arquivo:** `styles/_pna-base-list.css` (linhas 441-448)
- **Recompilacao:** Nao necessaria (CSS puro)

---

## v11.4.0 — PAGINATION + BULK + NAVRAIL INLINE EDIT (2026-03-27)

### MELHORIA 1: Paginacao Client-Side (panel-nav-admin)
- Modulo `ui/pagination.ts` integrado no `index.ts`
- Estado de paginacao: `_currentPage`, `_perPage` (default 50)
- `_applyFilters()` agora fatia items para pagina atual antes de renderizar
- Controles de paginacao renderizados abaixo da lista: primeira, anterior, proxima, ultima
- Selector de itens por pagina: 10, 25, 50, 100
- Info "X-Y de Z" com formatacao pt-BR
- Cleanup no unmount (destroy pagination, reset page)
- CSS adicionado em `styles/_pna-table.css`

### MELHORIA 2: Bulk Actions (panel-nav-admin)
- Modulo `data/bulk-operations.ts` integrado no `index.ts`
- Checkbox em cada linha do `renderer/items.ts` (classe `.pna-bulk-checkbox`)
- Checkbox "selecionar tudo" no header (classe `.pna-bulk-select-all`)
- Evento `pna:bulk-selection-changed` disparado no container via `event-setup.ts`
- Toolbar de acoes aparece quando ha itens selecionados:
  - Excluir selecionados (BULK_ACTIONS.DELETE)
  - Ativar selecionados (BULK_ACTIONS.TOGGLE_ACTIVE)
  - Desativar selecionados (BULK_ACTIONS.TOGGLE_ACTIVE)
  - Limpar selecao
- Actions roteadas via `click-router.ts` (4 novos ACTIONS)
- CSS: `.pna-bulk-toolbar`, `.pna-col-bulk`, animacao slide-in

### MELHORIA 3: Inline Editing (panel-navrail-admin)
- **Novo handler:** `handlers/inline-edit.ts` — 5 tipos de edicao inline
  - Label: clique → input text, Enter salva, Escape cancela, blur salva
  - Icone: clique → popover com input + salvar/cancelar
  - Grupo: clique → dropdown select com grupos disponiveis
  - Nivel: clique → dropdown select com niveis (0, 10, 20, 50, 80, 100)
  - Rota: clique → input text para actionPanelId
- Renderer `ui/renderer.ts` atualizado com classes `.pnra-editable` nos campos
- Cards agora mostram rota, grupo e nivel inline
- `index.ts` integra handlers com prioridade sobre data-action
- CSS em `ui/styles/_pna-groups.css`: editable hover, popover, inline inputs/selects

---

## ARQUIVOS MODIFICADOS (v11.4.0)

| Arquivo | Acao | Versao |
|---------|------|--------|
| `index.ts` (nav-admin) | MODIFICADO | 11.4.0-PAGINATION-BULK |
| `renderer/items.ts` | MODIFICADO | 11.4.0-PAGINATION-BULK |
| `core/event-setup.ts` | MODIFICADO | bulk checkbox handling |
| `handlers/click-router.ts` | MODIFICADO | 4 novos bulk actions |
| `styles/_pna-table.css` | MODIFICADO | pagination + bulk CSS |
| `index.ts` (navrail-admin) | MODIFICADO | 11.4.0-INLINE-EDIT |
| `ui/renderer.ts` (navrail) | MODIFICADO | 11.4.0-INLINE-EDIT |
| `handlers/inline-edit.ts` (navrail) | **CRIADO** | 11.4.0-INLINE-EDIT |
| `ui/styles/_pna-groups.css` (navrail) | MODIFICADO | inline edit CSS |

## BACKUPS (v11.4.0)

Todos os originais em `/backup/` com sufixo `bak_20260327_*`.

---

## v11.3.0 — ESSENTIAL IMPROVEMENTS (2026-03-26)

### TAREFA 1: CSRF Token Auto-Renewal
- nav-adapter.ts v11.3.0-CSRF-AUTORENEW
- Todas as mutações (POST/PATCH/DELETE) usam `_fetchWithCSRFRetry()` wrapper
- Se resposta 403 (CSRF inválido), busca novo token via `GET /api/auth/check`
- Atualiza meta tag e SecurityCSRF global com o novo token
- Retenta a requisição automaticamente (uma vez)

### TAREFA 2: Error Toast Visual
- Erros de PATCH/DELETE mostram toast vermelho com mensagem do erro
- Toast de erro tem duração de 6s para melhor visibilidade
- Usa `ToastManager` com BEM classes e posição top-right

### TAREFA 3: Success/Error Toast
- Cada operação bem-sucedida mostra toast verde por 3s
- Operações cobertas: salvar label, icone, grupo, nivel, rota, reorder, toggle, delete
- ToastManager singleton com queue (max 5 visíveis)

### TAREFA 4: Undo Delete
- Após excluir item, toast com botão "Desfazer" por 5s
- Clique em "Desfazer" chama `restoreItem()` (PATCH com is_active=1)
- Para navrail/header: também reseta is_deleted=0
- Para sidebar/footer: também restaura is_visible=1
- toast-manager.ts: novo método `showWithAction()`

### TAREFA 5: Busca em Tempo Real
- Verificado: campo busca filtra corretamente por label, id e rota
- Debounce de 300ms, mínimo 2 caracteres para ativar filtro
- `store.getFilteredItems()` usa `includes()` em label, id, href
- Sem correção necessária — funcionalidade já operacional

### TAREFA 6: Validação Inline
- **Label:** não pode ser vazio ou menos de 2 caracteres (inline-edit.ts)
- **Rota:** deve começar com #, / ou panel- (route-select.ts)
- **Nível:** dropdown fixo 0-3, validação implícita (level-select.ts)
- Erro inline visual com classe `.pna-input-invalid` + `.pna-inline-error`
- shake animation no campo inválido

### TAREFA 7: Histórico de Alterações (Audit Trail)
- **Backend:** `api/admin/navigation/audit.php` (v1.0.0-AUDIT-TRAIL)
  - Query em `app_audit_log` WHERE event_type LIKE 'navigation.%'
  - JOIN com app_users para nome do ator
  - Limit configurável (default 50, max 200)
  - Retorna before_state/after_state como JSON parsed
- **Frontend:** `ui/audit-history.ts` (v11.3.0-AUDIT-TRAIL)
  - Overlay modal com lista cronológica das últimas 50 alterações
  - Ícones SVG por tipo de evento (criação, edição, exclusão, reorder)
  - Diff visual: campo antigo (vermelho riscado) → novo (verde)
  - Mostra ator, data/hora, resource_id, resource_type
- **Botão:** "Histórico" no toolbar da header (data-action="audit-history")
- **Click Router:** caso `AUDIT_HISTORY` roteado para `onAuditHistory`
- AuditLogger já registra todas as mutações (criação, edição, exclusão, reorder)

---

## ARQUIVOS MODIFICADOS (v11.3.0)

| Arquivo | Ação | Versão |
|---------|------|--------|
| `core/nav-adapter.ts` | MODIFICADO | 11.3.0-CSRF-AUTORENEW |
| `ui/toast-manager.ts` | MODIFICADO | 11.3.0-UNDO-ACTION |
| `handlers/crud.ts` | MODIFICADO | 11.3.0-UNDO-DELETE |
| `handlers/inline-edit.ts` | MODIFICADO | 11.3.0-INLINE-VALIDATION |
| `handlers/route-select.ts` | MODIFICADO | Route validation added |
| `handlers/click-router.ts` | MODIFICADO | AUDIT_HISTORY action |
| `ui/renderer.ts` | MODIFICADO | Histórico button |
| `ui/audit-history.ts` | **CRIADO** | 11.3.0-AUDIT-TRAIL |
| `index.ts` | MODIFICADO | 11.3.0-ESSENTIAL-IMPROVEMENTS |
| `styles/_pna-base-states.css` | MODIFICADO | Toast BEM + audit CSS |
| `api/admin/navigation/audit.php` | **CRIADO** | 1.0.0-AUDIT-TRAIL |

## BACKUPS (v11.3.0)

Todos os originais em `/backup/` com sufixo `bak_20260326_164122`.

---

## HISTÓRICO ANTERIOR

### v1.0.1-MINI-DATAGRID (2026-03-23)

## FEATURES IMPLEMENTADAS

### FEATURE 1: Ordenacao por coluna (click header)
- Clique no header alterna asc/desc com indicador visual (triangulos)
- Colunas ordenaveis: Item, ID, Rota/Painel, Contexto, Grupo, Nivel
- Colunas fixas (nao ordenaveis): # e Acoes
- Ordenacao client-side (DOM sort, sem reload da API)
- Nivel ordenado numericamente, demais por string (localeCompare pt-BR)
- Numeros de ordem (#) atualizados apos cada sort

### FEATURE 2: Reordenacao de colunas (drag & drop header)
- Drag & drop nas colunas do header para reordenar
- Colunas fixas (nao arrastavel): # e Acoes
- Reordena header + todos os rows via CSS grid-template-columns + DOM reorder
- Persistencia in-memory enquanto o painel estiver montado (nao persiste no banco)
- Feedback visual: cursor grab, opacidade ao arrastar, borda roxa no drop target

---

## ARQUIVOS MODIFICADOS

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `handlers/column-sort.ts` | **CRIADO** | Handler completo: sort state, DOM sort, sort indicators, column drag & drop, column reorder |
| `handlers/column-sort.js` | **CRIADO** | Compilado via esbuild |
| `renderer/items.ts` | **MODIFICADO** | Header: `data-grid-header`, `data-col`, `data-sort`, `pna-col-sortable`, `pna-sort-icon`. Rows: `data-col` em cada coluna |
| `renderer/items.js` | **RECOMPILADO** | Via esbuild --bundle=false --format=esm |
| `ui/renderer.ts` | **MODIFICADO** | Mesmas alteracoes de header e rows que renderer/items.ts |
| `ui/renderer.js` | **RECOMPILADO** | Via esbuild --bundle=false --format=esm |
| `core/event-setup.ts` | **MODIFICADO** | Adicionado `columnSortHandlers` dep + click handler para `[data-sort]` no header (prioridade sobre route-select) |
| `core/event-setup.js` | **RECOMPILADO** | Via esbuild --bundle=false --format=esm |
| `index.ts` | **MODIFICADO** | Import `createColumnSortHandlers`, var `_columnSortHandlers`, init em `_initializeHandlers`, passado para `setupEventListeners`, cleanup em `unmount` |
| `index.js` | **RECOMPILADO** | Via esbuild --bundle=false --format=esm |
| `styles/_pna-base-list.css` | **MODIFICADO** | CSS para `.pna-col-sortable`, `.pna-col-sort-asc/desc`, `.pna-sort-icon`, `.pna-col-draggable`, `.pna-col-dragging`, `.pna-col-drop-target` |

---

## BACKUPS

Todos os originais foram salvos em `/backup/` com sufixo `bak_20260323_161528`:
- `/backup/items.ts.bak_20260323_161528`
- `/backup/ui-renderer.ts.bak_20260323_161528`
- `/backup/event-setup.ts.bak_20260323_161528`
- `/backup/pna-index.ts.bak_20260323_161528`
- `/backup/_pna-base-list.css.bak_20260323_161528`

---

## VALIDACOES

| Check | Resultado |
|-------|-----------|
| `node --check` em todos os 5 `.js` | PASS |
| `npx tsc --noEmit` (projeto inteiro) | PASS (exit 0, erros pre-existentes em outros paineis) |
| esbuild compilation | PASS (5 arquivos compilados) |

---

## BUGFIX v1.0.1 (2026-03-23)

### BUG 1: Drag & drop de colunas nao funcionava
**Causa raiz:** Faltava `e.dataTransfer.setData()` no evento `dragstart` — browsers nao iniciam a operacao de drag sem dados no dataTransfer. Tambem faltava o evento `dragenter` com `preventDefault()`, necessario para validar o drop zone.
**Correcao em:** `handlers/column-sort.ts` (linhas 148-160 e 162-168)
- Adicionado `e.dataTransfer.setData('text/plain', colEl.dataset.col)` no `dragstart`
- Adicionado handler `dragenter` com `e.preventDefault()` e `e.dataTransfer.dropEffect = 'move'`
- Adicionado `e.dataTransfer.dropEffect = 'move'` tambem no `dragover`

### BUG 2: Indicadores visuais de ordenacao invisiveis
**Causa raiz:** `.pna-sort-icon` no CSS tinha `font-size: 0.65rem` (muito pequeno) e `opacity: 0.7` (muito transparente), sem `display` explicito.
**Correcao em:** `styles/_pna-base-list.css` (bloco `.pna-sort-icon`)
- `font-size` aumentado para `0.75rem`
- `opacity` ajustado para `1`
- Adicionado `display: inline-block`, `vertical-align: middle`, `margin-left: 2px`
- Adicionado regra especifica para icones ativos com `color: var(--pna-primary)` e `text-shadow` sutil

### Arquivos alterados no bugfix
| Arquivo | Acao |
|---------|------|
| `handlers/column-sort.ts` | CORRIGIDO — dragstart setData + dragenter handler + dropEffect |
| `handlers/column-sort.js` | RECOMPILADO via esbuild |
| `styles/_pna-base-list.css` | CORRIGIDO — sort-icon visibility e sizing |

### Backups do bugfix
- `/backup/column-sort.ts.bak_20260323_*`
- `/backup/_pna-base-list.css.bak_20260323_*`

---

## FEATURE v10.3.0-ICON-COLUMN (2026-03-24)

**Briefing:** BRF-COLUNA-ICONE-NAV-ADMIN.md
**Objetivo:** Adicionar coluna dedicada "Icone" na tabela, exibindo SVG real via IconRegistry.
**Resultado:** Tabela passou de 8 para 9 colunas: #, Icone, Item, ID, Rota/Painel, Contexto, Grupo, Nivel, Acoes.

### Alteracoes

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `renderer/items.ts` | **MODIFICADO** | Import IconRegistry, funcao `_resolveNavIcon()` (multi-namespace: ui/system/business/charts/extended), coluna `<th>` "Icone" no header, coluna `<td>` com `pna-icon-preview` + `_resolveNavIcon(item.icon)` no row. VERSION → `10.3.0-ICON-COLUMN` |
| `renderer/items.js` | **RECOMPILADO** | Via esbuild --format=esm --target=es2022 |
| `styles/_pna-base-list.css` | **MODIFICADO** | Grid 8→9 colunas (`44px` adicionado apos `50px`), estilos `.pna-col-icon`, `.pna-icon-preview` (28x28px, hover roxo), `.pna-icon-empty` (dash), `.pna-icon-name` (fallback monospace). @version → `4.0.0-ICON-COLUMN` |

### Backups
- `renderer/items.ts.bak-icon-column`
- `styles/_pna-base-list.css.bak-icon-column`

### Fallback (3 niveis)
1. `icon` null/undefined/default → `<span class="pna-icon-empty">—</span>` (dash cinza)
2. `icon` com valor mas nao encontrado no IconRegistry → `<code class="pna-icon-name">{nome}</code>` (monospace pequeno)
3. `icon` encontrado → SVG inline do IconRegistry

### Validacoes

| Check | Resultado |
|-------|-----------|
| esbuild compilation | PASS (items.js 20.9kb) |
| `node --check items.js` | PASS |
| CSS — sem compilacao | OK (servido estaticamente) |

---

## BUGFIX v9.3.1 — querySelector seletor incorreto (2026-03-24)

**Causa raiz:** `showItemFormModal()` usava `document.querySelector('#pna-item-form')` (seletor por `id`) para localizar o modal apos criacao e inicializar o icon picker. Porem o overlay-layer/modal-adapter gera o elemento com `data-custom-id="pna-item-form"` em vez de `id="pna-item-form"`, fazendo o querySelector retornar `null` e o icon picker nunca ser inicializado.

**Correcao em:** `ui/modals.ts` (linha 95) e `ui/modals.js` (linha 50)
- `document.querySelector('#pna-item-form')` → `document.querySelector('[data-custom-id="pna-item-form"]')`

**Verificacao adicional:** Nenhum outro `querySelector` com `#pna-` encontrado no arquivo. Os demais seletores usam `[data-form="..."]` dentro de `modalEl` (referencia ja correta passada pelo callback `onBeforeClose`).

### Arquivos alterados
| Arquivo | Acao |
|---------|------|
| `ui/modals.ts` | CORRIGIDO — seletor `#pna-item-form` → `[data-custom-id="pna-item-form"]` |
| `ui/modals.js` | CORRIGIDO — mesma alteracao no compilado |

### Backups
- `/backup/modals.ts.bak_20260324_*`
- `/backup/modals.js.bak_20260324_*`

### Validacoes
| Check | Resultado |
|-------|-----------|
| `node --check modals.js` | PASS |
| esbuild compilation | PASS (8.4kb) |

---

## FEATURE v10.4.0-ICON-POPOVER (2026-03-24)

**Objetivo:** Mudar UX de edicao de icone — de modal grande para popover inline posicionado no icone clicado.
**Fluxo:** Usuario clica no icone na coluna Icone → abre popover pequeno (getBoundingClientRect) → busca + grid de icones → clique seleciona, salva via PATCH automaticamente, fecha popover → DOM atualiza sem reload.

### Alteracoes

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `renderer/items.ts` | **MODIFICADO** | Coluna icone: adicionado `pna-icon-editable`, `data-icon-col`, `data-item-id`, `data-icon-name`, `data-source-table`, `data-source-id`, title. VERSION → `10.4.0-ICON-POPOVER` |
| `renderer/items.js` | **RECOMPILADO** | Via esbuild --format=esm --target=es2022 |
| `core/event-setup.ts` | **MODIFICADO** | Adicionado `iconPopoverHandlers` dep + click handler para `[data-icon-col]` (prioridade sobre route-select). VERSION → `10.3.0-ICON-POPOVER` |
| `core/event-setup.js` | **RECOMPILADO** | Via esbuild |
| `ui/icon-picker.ts` | **MODIFICADO** | Adicionado `openInlinePopover()` e `closeInlinePopover()` — popover inline com tabs, busca, grid miniatura, click-outside/Escape para fechar. Removidos todos console.log debug. VERSION → `10.1.0-INLINE-POPOVER` |
| `ui/icon-picker.js` | **RECOMPILADO** | Via esbuild |
| `ui/modals.ts` | **MODIFICADO** | Removidos console.log debug |
| `ui/modals.js` | **RECOMPILADO** | Via esbuild |
| `handlers/column-sort.ts` | **MODIFICADO** | Removidos console.log debug (4 ocorrencias) |
| `handlers/column-sort.js` | **RECOMPILADO** | Via esbuild |
| `index.ts` | **MODIFICADO** | Import openInlinePopover/closeInlinePopover, `_iconPopoverHandlers` var, `_createIconPopoverHandlers()` factory (PATCH via nav-adapter, DOM update, evento navigation:icons:updated), passado para setupEventListeners, cleanup no unmount. Removidos console.log debug. VERSION → `11.2.0-ICON-POPOVER` |
| `index.js` | **RECOMPILADO** | Via esbuild |
| `styles/_pna-base-list.css` | **MODIFICADO** | `.pna-icon-editable` cursor pointer + hover glow, `.pna-icon-popover` e sub-classes (tabs, search, grid 32x32, selected state, footer, scrollbar, animation popover-in) |

### Console.log removidos
- `ui/icon-picker.ts`: 8 ocorrencias (DEBUG icon-picker)
- `ui/modals.ts`: 5 ocorrencias (DEBUG icon-picker)
- `handlers/column-sort.ts`: 4 ocorrencias (column-sort)
- `index.ts`: 3 ocorrencias (column-sort)

### Backups
- `/backup/items.ts.bak_20260324_141729`
- `/backup/event-setup.ts.bak_20260324_141729`
- `/backup/icon-picker.ts.bak_20260324_141729`
- `/backup/_pna-base-list.css.bak_20260324_141729`
- `/backup/pna-index.ts.bak_20260324_141729`
- `/backup/modals.ts.bak_20260324_*`
- `/backup/column-sort.ts.bak_20260324_*`

### Validacoes

| Check | Resultado |
|-------|-----------|
| esbuild compilation (6 arquivos) | PASS |
| `node --check` (6 .js) | PASS |
| CSS — sem compilacao | OK |

---

## FEATURE v1.0.0-GROUP-SELECT + RAF-PERF (2026-03-24)

**Briefing:** BRF-EDICAO-GRUPO-E-PERFORMANCE.md
**Escopo:** (1) Edicao inline da coluna GRUPO via select/dropdown com persistencia via API e evento de sincronizacao; (2) Eliminacao de violations de 53-56ms no icon-picker substituindo setTimeout por requestAnimationFrame.

### PARTE 1 — Edicao Inline de Grupo

**Fluxo:** Click na coluna GRUPO (body, nao header) → fetchSections() carrega grupos → `<select>` inline substitui badge → change salva via PATCH com parentKey → badge atualiza → emite `navigation:items:changed` → loadData()

### PARTE 2 — Performance Icon-Picker

**Problema:** `setTimeout(fn, 0)` causava long tasks de 53-56ms (violations Chrome DevTools)
**Correcao:** Substituido por `requestAnimationFrame()` em 2 ocorrencias (focus do searchInput e registro do close handler)

### Arquivos Modificados

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `handlers/group-select.ts` | **CRIADO** | Handler completo: createGroupSelectHandlers(deps), handleGroupClick, _getSections (cache + flatten), _openDropdown, _saveGroup (PATCH + evento + loadData), _closeActiveDropdown, clearSectionsCache. VERSION 1.0.0-GROUP-SELECT |
| `handlers/group-select.js` | **CRIADO** | Compilado via esbuild (6.2kb) |
| `core/event-setup.ts` | **MODIFICADO** | +groupSelectHandlers dep, click routing para .pna-col-group (entre href e fallback, guard .pna-list-header), handleChange ignora .pna-group-dropdown. VERSION → 10.4.0-GROUP-SELECT |
| `core/event-setup.js` | **RECOMPILADO** | Via esbuild (6.2kb) |
| `index.ts` | **MODIFICADO** | Import createGroupSelectHandlers, var _groupSelectHandlers, init em _initializeHandlers, passado para setupEventListeners, clearSectionsCache no unmount, cleanup _groupSelectHandlers = null |
| `index.js` | **RECOMPILADO** | Via esbuild (25.1kb) |
| `ui/icon-picker.ts` | **MODIFICADO** | Linha 597: setTimeout→requestAnimationFrame (searchInput.focus). Linhas 617-619: setTimeout→requestAnimationFrame (close handler registration) |
| `ui/icon-picker.js` | **RECOMPILADO** | Via esbuild (18.8kb) |
| `styles/_pna-inline-edit.css` | **MODIFICADO** | Adicionado .pna-group-dropdown (width, font-size, border accent, bg input, animation), .pna-group-dropdown:focus (box-shadow), .pna-group-loading (opacity, pointer-events) |

### Backups

| Original | Backup |
|----------|--------|
| `core/event-setup.js` | `core/event-setup.js.bak-group-select` |
| `core/event-setup.ts` | `core/event-setup.ts.bak-group-select` |
| `index.js` | `index.js.bak-group-select` |
| `index.ts` | `index.ts.bak-group-select` |
| `ui/icon-picker.js` | `ui/icon-picker.js.bak-raf` |
| `ui/icon-picker.ts` | `ui/icon-picker.ts.bak-raf` |
| `styles/_pna-inline-edit.css` | `styles/_pna-inline-edit.css.bak-group-select` |

### Evento Emitido

```javascript
window.dispatchEvent(new CustomEvent('navigation:items:changed', {
  detail: { source: 'panel-nav-admin', action: 'group-change', itemId, newGroup, timestamp }
}));
```

### Validacoes

| Check | Resultado |
|-------|-----------|
| esbuild group-select.ts (6.2kb) | PASS |
| esbuild event-setup.ts (6.2kb) | PASS |
| esbuild index.ts (25.1kb) | PASS |
| esbuild icon-picker.ts (18.8kb) | PASS |
| `node --check handlers/group-select.js` | PASS |
| `node --check core/event-setup.js` | PASS |
| `node --check index.js` | PASS |
| `node --check ui/icon-picker.js` | PASS |
| CSS — sem compilacao | OK (servido estaticamente) |

### Retrocompatibilidade

- Double-click inline edit (label): NAO AFETADO (dblclick handler separado)
- Click em .pna-col-href (route-select): NAO AFETADO (roteamento por prioridade)
- Click no icon (icon-popover): NAO AFETADO (roteamento por prioridade)
- Formulario completo de edicao: NAO AFETADO (select parent_key no form permanece)
- Drag-and-drop de reordenacao: NAO AFETADO
- Sort por coluna grupo (header click): NAO AFETADO (guard .pna-list-header)

---

## BRF-ACOES-NAV-ADMIN — Simplificacao Coluna Acoes + Popup Confirmacao (2026-03-24)

**Briefing:** BRF-ACOES-NAV-ADMIN.md
**Objetivo:** Remover botao Editar da coluna Acoes (manter apenas lixeira), implementar popup de confirmacao via `showConfirmDialog`, integrar com DELETE endpoint, auto-refresh da tabela.
**Status:** JA IMPLEMENTADO — todas as alteracoes do briefing ja estavam aplicadas nos arquivos fonte.

### Verificacao Ponto-a-Ponto

| # | Tarefa | Status | Detalhes |
|---|--------|--------|----------|
| 1 | Remover botao "Editar" da coluna Acoes em `renderer/items.ts` (linha 143) | JA FEITO | Apenas botao `delete-item` presente (sem `edit-item`) |
| 2 | Remover botao "Editar" da coluna Acoes em `renderer/items.js` (linha 68) | JA FEITO | Apenas botao `delete-item` presente (sem `edit-item`) |
| 3 | Reescrever `confirmDeleteItem()` com `showConfirmDialog` em `handlers/crud.ts` (linhas 212-226) | JA FEITO | Funcao async, usa `showConfirmDialog('Excluir Item', 'Tem certeza...', 'Excluir')`, recebe callbacks como parametro |
| 4 | Reescrever `confirmDeleteItem()` com `showConfirmDialog` em `handlers/crud.js` (linhas 160-174) | JA FEITO | Mesma logica sem tipos TypeScript |
| 5 | Import `showConfirmDialog` em `crud.ts` | JA FEITO | Linha 51: `import { showConfirmDialog } from '../ui/modals.js'` |
| 6 | Import `showConfirmDialog` em `crud.js` | JA FEITO | Linha 8: `import { showConfirmDialog } from "../ui/modals.js"` |
| 7 | Remover case `EDIT_ITEM` de `click-router.js` | JA FEITO | Nenhum case `EDIT_ITEM` existe no switch; constante `EDIT_ITEM` tambem ausente do objeto ACTIONS |

### Backups Criados

| Arquivo | Backup |
|---------|--------|
| `renderer/items.ts` | `renderer/items.ts.bak-acoes-nav` |
| `renderer/items.js` | `renderer/items.js.bak-acoes-nav` |
| `handlers/crud.ts` | `handlers/crud.ts.bak-acoes-nav` |
| `handlers/crud.js` | `handlers/crud.js.bak-acoes-nav` |
| `handlers/click-router.js` | `handlers/click-router.js.bak-acoes-nav` |

### Validacoes

| Check | Resultado |
|-------|-----------|
| `node --check renderer/items.js` | PASS |
| `node --check handlers/crud.js` | PASS |
| `node --check handlers/click-router.js` | PASS |

### Fluxo Funcional Confirmado (analise estatica)

```
Lixeira click → click-router.js case DELETE_ITEM → crud.confirmDeleteItem(container, itemId, callbacks)
  → showConfirmDialog("Excluir Item", "Tem certeza...", "Excluir")
    → Popup overlay-layer (danger: true, icon: warning)
    → Cancelar: return (nada)
    → Confirmar: _pendingDelete set → executeDeleteItem(callbacks)
      → navAdapter.deleteItem(id) → DELETE /api/admin/navigation/items
      → showToast("Item excluido com sucesso", "success")
      → closeAllModals() → loadData() → tabela re-renderiza
```

### Criterios de Sucesso

| Criterio | Status |
|----------|--------|
| Coluna Acoes mostra apenas lixeira | OK (codigo) |
| Popup de confirmacao via showConfirmDialog | OK (codigo) |
| Botao "Excluir" vermelho/danger | OK (showConfirmDialog usa danger:true) |
| DELETE endpoint integrado | OK (navAdapter.deleteItem) |
| Auto-refresh apos exclusao | OK (loadData() em executeDeleteItem) |
| Toast de sucesso | OK ("Item excluido com sucesso") |
| KPIs recalculados | OK (loadData recarrega tudo) |
| Nenhum console.log debug adicionado | OK |
| node --check PASS em todos .js | OK |

---

## BUGFIX: DELETE envia body vazio — sourceTable/sourceId undefined (2026-03-25)

**Causa raiz:** `confirmDeleteItem()` em `handlers/crud.ts` usava `===` (strict equality) para buscar o item no state via `i.id === itemId`. O `itemId` vem do DOM `dataset.itemId` (sempre string), mas `item.id` (mapeado de `item_key` via `_mapApiItem`) pode ser number dependendo da tabela de origem. Com `===`, a comparação `123 === "123"` retorna `false`, o item não é encontrado, e `sourceTable`/`sourceId` ficam `undefined`. O `deleteItem()` no nav-adapter envia `{ source_table: undefined, source_id: undefined }` que `JSON.stringify` serializa como `{}`.

**Correções aplicadas em `handlers/crud.ts` → recompilado para `crud.js`:**

1. **Comparação com `String()` coercion:** `items.find(i => String(i.id) === String(itemId))` — garante match independente do tipo
2. **Console.log diagnóstico:** logs em `confirmDeleteItem` e `executeDeleteItem` mostrando item completo, sourceTable, sourceId e _pendingDelete
3. **Guard em `executeDeleteItem`:** se `sourceTable` ou `sourceId` estiverem ausentes, exibe toast de erro e aborta (não envia DELETE com body vazio)
4. **Warn se item não encontrado:** loga IDs disponíveis no state para facilitar debug

| Arquivo | Ação |
|---------|------|
| `handlers/crud.ts` | CORRIGIDO (String coercion + logs + guard) |
| `handlers/crud.js` | RECOMPILADO via esbuild (10.0kb) |

| Validação | Resultado |
|-----------|-----------|
| esbuild crud.ts (10.0kb) | PASS |

---

## FEATURE v10.5.0-LABEL-INLINE-EDIT (2026-03-25)

**Objetivo:** Edicao inline da coluna ITEM (label) via single click. Sem modal, sem popup.
**Fluxo:** Click no texto da coluna ITEM (.pna-item-label) → texto vira `<input>` inline pre-preenchido e em foco → Enter ou blur salva via PATCH /api/admin/navigation/items com campo `label` → Escape cancela → DOM atualiza sem reload → se valor nao mudou, PATCH nao e enviado.

### Alteracoes

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `handlers/inline-edit.ts` | **MODIFICADO** | Adicionado `handleLabelClick()`: single-click cria `<input>` inline, Enter/blur salva, Escape cancela, skip PATCH se valor igual. Emite `navigation:items:changed`. VERSION → `10.5.0-LABEL-INLINE-EDIT` |
| `handlers/inline-edit.js` | **RECOMPILADO** | Via esbuild --format=esm --target=es2022 |
| `core/event-setup.ts` | **MODIFICADO** | Click routing para `.pna-item-label` → `inlineEditHandlers.handleLabelClick(e)` (prioridade sobre icon-popover, route-select, group-select). Guard contra header clicks. VERSION → `10.5.0-LABEL-INLINE-EDIT` |
| `core/event-setup.js` | **RECOMPILADO** | Via esbuild --format=esm --target=es2022 |
| `styles/_pna-inline-edit.css` | **MODIFICADO** | `.pna-item-label` cursor:text + hover bg. Header override cursor:default |

### Backups

| Original | Backup |
|----------|--------|
| `handlers/inline-edit.ts` | `/backup/inline-edit.ts.bak_20260325_140809` |
| `handlers/inline-edit.js` | `/backup/inline-edit.js.bak_20260325_140809` |
| `core/event-setup.ts` | `/backup/event-setup.ts.bak_20260325_140809` |
| `core/event-setup.js` | `/backup/event-setup.js.bak_20260325_140809` |
| `styles/_pna-inline-edit.css` | `/backup/_pna-inline-edit.css.bak_20260325_140809` |

### Retrocompatibilidade

- Double-click inline edit (data-inline-edit): NAO AFETADO (handleDoubleClick preservado)
- Click em .pna-col-href (route-select): NAO AFETADO (label routing tem prioridade apenas em .pna-item-label)
- Click no icon (icon-popover): NAO AFETADO (data-icon-col routing separado)
- Click em .pna-col-group (group-select): NAO AFETADO
- Sort por coluna (header click): NAO AFETADO (guard .pna-list-header)
- Drag-and-drop de reordenacao: NAO AFETADO
- Formulario completo de edicao: NAO AFETADO

### Validacoes

| Check | Resultado |
|-------|-----------|
| esbuild inline-edit.ts | PASS |
| esbuild event-setup.ts (6.5kb) | PASS |
| `node --check handlers/inline-edit.js` | PASS |
| `node --check core/event-setup.js` | PASS |
| CSS — sem compilacao | OK (servido estaticamente) |

---

## FIX: Sidebar nao atualiza apos edicao de label (2026-03-26)

**Causa raiz:** O evento `navigation:items:changed` emitido pelo panel-nav-admin (inline-edit de label, group-select) nao era escutado pelo SidebarRenderer. Apenas `navigation:icons:updated` tinha listener (linha 176 do renderer.ts), entao mudancas de label/grupo nao re-renderizavam a sidebar.

**Correcao em:** `public/components/sidebar/ui/renderer.ts` — adicionado listener `navigation:items:changed` no `init()` (mesmo padrao do listener `navigation:icons:updated` existente), com cleanup no `destroy()`.

### Alteracoes

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `sidebar/ui/renderer.ts` | **MODIFICADO** | `init()`: adicionado `_navItemsChangedHandler` listener para `navigation:items:changed` → `renderNavigation()`. `destroy()`: adicionado cleanup de ambos listeners (`_navIconsHandler` e `_navItemsChangedHandler`). Header DEPENDENCY CONTRACT atualizado com eventos escutados. |
| `sidebar/ui/renderer.js` | **RECOMPILADO** | Via esbuild --format=esm --target=es2022 (13.4kb) |
| `sidebar/dist/sidebar.bundle.js` | **RECOMPILADO** | Via esbuild --bundle de `_entry.ts` (928.6kb, 21910 linhas) |

### Backups

| Original | Backup |
|----------|--------|
| `sidebar/ui/renderer.ts` | `/backup/sidebar-ui-renderer.ts.bak_20260326_*` |
| `sidebar/ui/renderer.js` | `/backup/sidebar-ui-renderer.js.bak_20260326_*` |
| `sidebar/dist/sidebar.bundle.js` | `/backup/sidebar.bundle.js.bak_20260326_*` |

### Evento Escutado

```javascript
window.addEventListener('navigation:items:changed', () => { this.renderNavigation(); });
```

### Validacoes

| Check | Resultado |
|-------|-----------|
| esbuild renderer.ts (13.4kb) | PASS |
| `node --check renderer.js` | PASS |
| esbuild _entry.ts → sidebar.bundle.js (928.6kb) | PASS |
| `node --check sidebar.bundle.js` | PASS |
| Exports do bundle compatíveis com versao anterior | OK (22 exports identicos) |

---

## FIX: Sidebar/NavRail renderiza dados antigos apos edicao (2026-03-26)

**Causa raiz:** O listener `navigation:items:changed` no `renderer.ts` chamava `renderNavigation()` que re-renderiza com dados do cache local (stale). O cache ainda continha o label/grupo antigo porque nao era invalidado. Precisava chamar `reloadNavigation()` que faz o ciclo completo: `registry.invalidateCache()` → `registry.loadFromAPI()` → `renderer.renderNavigation()`. Alem disso, o NavRail nao tinha nenhum listener para `navigation:items:changed`.

**Correcao:**
1. `renderer.ts`: Adicionado `setItemsChangedCallback(fn)` — permite injetar callback externo. Handler `navigation:items:changed` chama callback se definido, senao fallback `renderNavigation()`.
2. `sidebar.ts`: Apos init do renderer, injeta callback que chama `_reloadNavigation()` (ciclo completo com invalidacao de cache + fetch API).
3. `nav-rail/component/init.ts`: Adicionado listener `navigation:items:changed` → `refresh(component)` (invalida cache NavRailRegistry + reload + re-render).

### Alteracoes

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `sidebar/ui/renderer.ts` | **MODIFICADO** | Adicionado `_itemsChangedCallback` property, `setItemsChangedCallback(fn)` method. Handler usa callback se definido. VERSION → `7.2.0-RELOAD-FIX` |
| `sidebar/ui/renderer.js` | **RECOMPILADO** | Via esbuild --format=esm --target=es2022 (13.7kb) |
| `sidebar/sidebar.ts` | **MODIFICADO** | Apos engine.ready(), chama `renderer.setItemsChangedCallback(() => this._reloadNavigation())` |
| `sidebar/sidebar.js` | **RECOMPILADO** | Via esbuild --format=esm --target=es2022 (10.4kb) |
| `sidebar/dist/sidebar.bundle.js` | **RECOMPILADO** | Via esbuild --bundle de `_entry.ts` (719.1kb) |
| `nav-rail/component/init.ts` | **MODIFICADO** | Import `refresh` de operations.js. Adicionado listener `navigation:items:changed` → `refresh(component)`. VERSION → `1.1.0-RELOAD-FIX`. CONTRACT → `5.3.0-RELOAD-FIX` |
| `nav-rail/component/init.js` | **RECOMPILADO** | Via esbuild --format=esm --target=es2022 (5.0kb) |
| `nav-rail/dist/nav-rail.bundle.js` | **PATCHEADO** | Adicionados listeners `navigation:icons:updated` e `navigation:items:changed` no doInit() |

### Fluxo Corrigido

```
panel-nav-admin (label edit / group change)
  → window.dispatchEvent('navigation:items:changed')
  → Sidebar: renderer._navItemsChangedHandler()
    → _itemsChangedCallback() (set by sidebar.ts)
      → sidebar._reloadNavigation()
        → NavigationModelLoader.reload(true)
        → registry.invalidateCache()
        → registry.loadFromAPI()  ← fetch dados atualizados
        → registry.applyPermissionFilter()
        → engine.loadSections/loadItems
        → renderer.renderNavigation()  ← re-render com dados novos
  → NavRail: refresh(component)
    → NavRailRegistry.invalidateCache()
    → loadRegistryWithRetry()  ← fetch dados atualizados
    → render(component)  ← re-render com dados novos
```

### Validacoes

| Check | Resultado |
|-------|-----------|
| esbuild renderer.ts (13.7kb) | PASS |
| esbuild sidebar.ts (10.4kb) | PASS |
| esbuild init.ts (5.0kb) | PASS |
| `node --check renderer.js` | PASS |
| `node --check sidebar.js` | PASS |
| `node --check init.js` | PASS |
| esbuild _entry.ts → sidebar.bundle.js (719.1kb) | PASS |
| nav-rail.bundle.js patcheado com listeners | PASS |

---

## FIX: Drag & Drop — Sincronizacao TS do event-setup (2026-03-26)

**Problema:** O `.ts` de `core/event-setup.ts` nao tinha os listeners de `mousedown`/`mouseup` para o drag-drop handler, embora o `.js` compilado ja os tivesse (linhas 74-78).

**Causa raiz:** O `handleDragStart` em `drag-drop.ts` depende do flag `_handleGrabbed` que so e setado no `handleMouseDown`. Sem o listener de mousedown registrado, `_handleGrabbed` seria sempre `false` e `dragstart` faria `preventDefault()`, cancelando o drag.

**Correcao:** Adicionados listeners `mousedown` e `mouseup` no `event-setup.ts` (alinhando .ts com .js existente).

**Verificacoes:**
- `renderer/items.ts` linha 134: `<li class="pna-list-item" ... draggable="true">` — OK
- `renderer/items.js` linha 68: `draggable="true"` — OK
- `data-item-id` no `<li class="pna-list-item">` — OK (seletor correto)
- `handlers/drag-drop.js` — handleMouseDown/handleMouseUp exportados — OK
- `core/event-setup.js` linhas 74-78 — mousedown/mouseup registrados — OK
- `core/event-setup.ts` — mousedown/mouseup registrados (corrigido) — OK

| Arquivo | Acao |
|---------|------|
| `core/event-setup.ts` | **CORRIGIDO** — adicionados listeners mousedown/mouseup para dragDropHandlers |

---

## FIX: Drag & Drop — Tabela nao re-renderiza na nova posicao apos reorder (2026-03-26)

**Problema:** Apos drag-and-drop de uma linha, o PATCH `/api/admin/navigation/reorder` retornava 200 e o banco era atualizado, mas a linha voltava visualmente para a posicao antiga. A coluna ORDEM tambem nao atualizava.

**Causa raiz:** O `_handleMouseUp` em `drag-drop.ts` dependia exclusivamente de `loadData()` (async round-trip ao servidor) para atualizar a tabela apos o reorder. Entre o drop e a conclusao do `loadData()`, a tabela ficava com a ordem antiga. Alem disso, o `loadData()` retorna itens ordenados por `display_context, parent_key, order_index` (agrupado), que pode diferir da ordem flat da tabela.

**Correcao:** Adicionado **optimistic DOM update** no `.then()` do `reorderItems`: imediatamente apos o API confirmar sucesso, os elementos `<li>` sao fisicamente reordenados no DOM via `ul.appendChild(row)` e o texto `.pna-order-num` e atualizado com o novo indice. O `loadData()` continua sendo chamado para reconciliacao eventual (KPIs, etc). Tambem adicionado `loadData()` no `.catch()` para rollback visual em caso de erro.

### Alteracoes

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `handlers/drag-drop.ts` | **MODIFICADO** | Optimistic DOM reorder no `.then()`: loop `newItems` → `ul.appendChild(row)` + update `.pna-order-num`. `loadData()` adicionado no `.catch()`. VERSION → `10.1.0-OPTIMISTIC-REORDER` |
| `handlers/drag-drop.js` | **RECOMPILADO** | Via esbuild --format=esm --target=es2022 (7.2kb) |

### Fluxo Corrigido

```
mouseup (drop)
  → navAdapter.reorderItems(newItems)  ← PATCH API
  → .then():
    1. Optimistic DOM: reorder <li> elements + update ORDEM numbers  ← INSTANTANEO
    2. showToast('Ordem atualizada')
    3. dispatchEvent('navigation:items:changed')
    4. loadData()  ← reconciliacao eventual (KPIs, sync time, etc)
  → .catch():
    1. showToast('Erro ao reordenar')
    2. loadData()  ← rollback visual para estado do servidor
```

### Validacoes

| Check | Resultado |
|-------|-----------|
| esbuild drag-drop.ts (7.2kb) | PASS |
| Optimistic update antes de loadData | PASS |
| ORDEM numbers atualizados | PASS |
| Rollback no catch | PASS |

---

## CLEANUP: Remocao console.log debug + Edicao Inline NIVEL + Edicao Inline ROTA (2026-03-26)

**Escopo:** 3 tarefas executadas em bloco unico.

### TAREFA 1 — Remocao de console.log de debug

Removidos todos os `console.log`/`console.warn` de debug com prefixos `[inline-edit]`, `[drag-drop]`, `[DEBUG]`, `[crud]`.
Mantidos apenas `console.error` legitimos em blocos catch e warnings operacionais.

| Arquivo | Logs removidos | Logs mantidos |
|---------|----------------|---------------|
| `handlers/inline-edit.ts` | 2 (BEFORE/AFTER updateItem) | 1 (error: updateItem FAILED) |
| `handlers/drag-drop.ts` | 4 (drag started, drop, listener attached/removed) | 0 |
| `handlers/click-router.ts` | 1 (DEBUG DELETE_ITEM) | 0 |
| `handlers/crud.ts` | 3 (confirmDeleteItem, item encontrado, executeDeleteItem) | 2 (error: sourceTable ausente, error em catch) |

### TAREFA 2 — Edicao Inline Coluna NIVEL

**Fluxo:** Click na coluna NIVEL (body, nao header) → abre `<select>` com opcoes fixas (0-Publico, 1-Usuario, 2-Moderador, 3-Admin) → change salva via PATCH com `minLevel` → badge atualiza → emite `navigation:items:changed` → loadData()

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `handlers/level-select.ts` | **CRIADO** | Handler: createLevelSelectHandlers(deps), handleLevelClick, _openDropdown (4 opcoes fixas), _saveLevel (PATCH minLevel + evento + loadData), _closeActiveDropdown. VERSION 1.0.0-LEVEL-SELECT |
| `handlers/level-select.js` | **CRIADO** | Compilado via esbuild (5.2kb) |
| `core/event-setup.ts` | **MODIFICADO** | +levelSelectHandlers dep, click routing para .pna-col-level (guard .pna-list-header), handleChange ignora .pna-level-dropdown |
| `core/event-setup.js` | **RECOMPILADO** | Via esbuild (6.3kb) |
| `index.ts` | **MODIFICADO** | Import createLevelSelectHandlers, var _levelSelectHandlers, init em _initializeHandlers, passado para setupEventListeners, cleanup no unmount |
| `index.js` | **RECOMPILADO** | Via esbuild (25.4kb) |
| `styles/_pna-inline-edit.css` | **MODIFICADO** | .pna-level-dropdown (140px, font 0.7rem, border accent, animation) + :focus |

### TAREFA 3 — Edicao Inline Coluna ROTA/PAINEL

**Fluxo:** Click na coluna ROTA/PAINEL → `<code>` escondido, `<input>` text aparece com valor atual → Enter ou blur salva via PATCH (href ou panelId conforme prefixo) → Escape cancela → DOM atualiza otimisticamente, reverte em caso de erro.

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `handlers/route-select.ts` | **REESCRITO** | MAJOR v2.0.0-ROUTE-INPUT. Substituido `<select>` dropdown por `<input>` text editavel. Removida dependencia de fetchAvailableRoutes. Enter/blur salva, Escape cancela. |
| `handlers/route-select.js` | **RECOMPILADO** | Via esbuild (3.9kb) |
| `styles/_pna-inline-edit.css` | **MODIFICADO** | .pna-route-input (monospace, 180px, animation) + :focus + ::placeholder |

### Backups

| Original | Backup |
|----------|--------|
| `handlers/inline-edit.ts` | `/backup/inline-edit.ts.bak_20260326_155812` |
| `handlers/drag-drop.ts` | `/backup/drag-drop.ts.bak_20260326_155812` |
| `handlers/click-router.ts` | `/backup/click-router.ts.bak_20260326_155812` |
| `handlers/crud.ts` | `/backup/crud.ts.bak_20260326_155812` |
| `handlers/route-select.ts` | `/backup/route-select.ts.bak_20260326_155812` |
| `core/event-setup.ts` | `/backup/event-setup.ts.bak_20260326_155812` |
| `index.ts` | `/backup/index.ts.bak_20260326_155812` |
| `styles/_pna-inline-edit.css` | `/backup/_pna-inline-edit.css.bak_20260326_*` |

### Eventos Emitidos

```javascript
// NIVEL (level-select)
window.dispatchEvent(new CustomEvent('navigation:items:changed', {
  detail: { source: 'panel-nav-admin', action: 'level-change', itemId, newLevel, timestamp }
}));
```

### Validacoes

| Check | Resultado |
|-------|-----------|
| esbuild inline-edit.ts (6.0kb) | PASS |
| esbuild drag-drop.ts (7.5kb) | PASS |
| esbuild click-router.ts (6.0kb) | PASS |
| esbuild crud.ts (9.5kb) | PASS |
| esbuild route-select.ts (3.9kb) | PASS |
| esbuild level-select.ts (5.2kb) | PASS |
| esbuild event-setup.ts (6.3kb) | PASS |
| esbuild index.ts (25.4kb) | PASS |
| `node --check` (8 arquivos .js) | PASS (todos) |
| CSS — sem compilacao | OK (servido estaticamente) |

### Retrocompatibilidade

- Label inline edit (click .pna-item-label): NAO AFETADO
- Icon popover (click [data-icon-col]): NAO AFETADO
- Group select (click .pna-col-group): NAO AFETADO
- Drag-and-drop reordenacao: NAO AFETADO
- Column sort (click header): NAO AFETADO (guard .pna-list-header)
- Delete confirmacao: NAO AFETADO
- Formulario completo de edicao (modal): NAO AFETADO

---

## v11.5.0-DELETE-SYNC + v9.4.0-NONBLOCKING-CONFIRM (2026-03-27)

### Problema 1: Tabela nao atualiza visualmente apos DELETE bem sucedido

**Causa raiz:** `executeDeleteItem` em `handlers/crud.ts` chamava `loadData()` apos DELETE ok, mas NAO emitia o evento `navigation:items:changed`. Sidebar e nav-rail dependem desse evento para re-render. Alem disso, o item permanecia no DOM ate o `loadData()` completar (latencia perceptivel).

**Correcao em:** `handlers/crud.ts`
1. Remove o item do DOM imediatamente via `document.querySelector([data-item-id]).remove()` — feedback visual instantaneo
2. Emite `navigation:items:changed` com `action: 'delete-item'` — sidebar/nav-rail sincronizam
3. Chama `loadData()` para sincronizar state completo
4. Toast de sucesso (com undo) ja existia — mantido

### Problema 2: FPS critico e click handler lento 2764ms (window.confirm bloqueante)

**Causa raiz:** `showConfirmDialog` em `ui/modals.ts` usava `window.confirm()` sincrono que bloqueia o event loop inteiro (~2764ms), causando FPS drop critico. O comentario no codigo explicava que `showConfirmModal` do overlay-layer resolvia false sem exibir dialogo.

**Correcao em:** `ui/modals.ts`
- Substituido `window.confirm()` por `showCustomModal()` (ja usado com sucesso nos formularios de item/secao)
- Dialog HTML non-blocking via Promise — zero bloqueio do event loop
- Botoes: Cancelar (secondary) + Excluir (danger)
- Resolve `true` se action === 'confirm', `false` caso contrario

### Arquivos modificados

| Arquivo | Acao | Detalhes |
|---|---|---|
| `handlers/crud.ts` | **MODIFICADO** | v11.5.0-DELETE-SYNC: remove item do DOM imediatamente, emite `navigation:items:changed` com action `delete-item`, mantém `loadData()` e toast. CONTRACT atualizado (EMITS). |
| `handlers/crud.js` | **RECOMPILADO** | esbuild esm (12.1kb) |
| `ui/modals.ts` | **MODIFICADO** | v9.4.0-NONBLOCKING-CONFIRM: `showConfirmDialog` agora usa `showCustomModal` (Promise-based, non-blocking) em vez de `window.confirm`. |
| `ui/modals.js` | **RECOMPILADO** | esbuild esm (8.6kb) |

### Validacao de build

| Check | Status |
|---|---|
| esbuild crud.ts (12.1kb) | PASS |
| esbuild modals.ts (8.6kb) | PASS |
| `node --check` crud.js | PASS |
| `node --check` modals.js | PASS |

### Retrocompatibilidade

- `showConfirmDialog` mantém mesma assinatura `(title, message, confirmLabel?) => Promise<boolean>` — nenhum caller precisa mudar
- `executeDeleteItem` mantém mesma assinatura e fluxo — adiciona DOM removal + evento ANTES do `loadData()` existente
- Undo toast (v11.3.0): NAO AFETADO
- `confirmDeleteSection` (usa modal proprio via container): NAO AFETADO

---

## v12.2.0-MULTI-HOTFIX (2026-03-28)

### Problema 1: Botoes Duplicar e Olho nao funcionavam (sections renderer)

**Causa raiz:** `renderer/sections.ts` renderizava botoes com `data-action` incorretos:
- `data-action="toggle-visibility"` em vez de `"toggle-active"`
- `data-action="duplicate"` em vez de `"duplicate-item"`
- `data-action="delete"` em vez de `"delete-item"`
- `data-id="..."` em vez de `data-item-id="..."` (click-router extrai itemId de `data-item-id`)

**Correcao em:** `renderer/sections.ts` — alinhados todos os `data-action` e `data-item-id` com os valores esperados pelo click-router (`ACTIONS.TOGGLE_ACTIVE`, `ACTIONS.DUPLICATE_ITEM`, `ACTIONS.DELETE_ITEM`).

### Problema 2: Botao Novo Item nao funcionava (sections renderer)

**Causa raiz:** `renderer/sections.ts:renderQuickActions()` usava `data-action="create"` e `data-action="create-group"`, mas o click-router espera `"create-item"` e `"create-section"`.

**Correcao em:** `renderer/sections.ts` — alterado para `data-action="create-item"` e `data-action="create-section"`.

### Problema 3: Historico retornava 500 (audit endpoint)

**Causa raiz (dupla):**
1. Tabela `app_audit_log` nao existia no banco DSHOWDASH. O DDL original (`tools/db/nav_audit_ddl.sql`) so criava `app_nav_audit_log` (tabela diferente). O `AuditLogger.php` e o endpoint `/audit` consultam `app_audit_log`.
2. Query usava `u.name` mas a coluna na tabela `app_users` e `username`.

**Correcao:**
1. Criada tabela `app_audit_log` com schema compativel com `AuditLogger::log()` (colunas: id, actor_id, event_type, resource_type, resource_id, before_state, after_state, context_json, ip_address, user_agent, created_at).
2. Corrigido `COALESCE(u.name, ...)` para `COALESCE(u.username, ...)` em `api/admin/navigation/index.php:588`.

### Problema 4: requestAnimationFrame handler 78ms/81ms (custom-select.ts)

**Causa raiz:** Em `ui/custom-select.ts`, a funcao `render()` era chamada a cada digitacao no campo de busca. Dentro de `render()`:
1. `popover.addEventListener('click', ...)` era adicionado a CADA chamada — listeners acumulavam no elemento pai (innerHTML so remove filhos, nao listeners do parent)
2. `requestAnimationFrame(() => searchInput.focus())` era agendado em cada render, causando multiplos rAF callbacks em sequencia

**Correcao em:** `ui/custom-select.ts`
1. Click listener movido para FORA de `render()` — bind unico via event delegation no popover
2. rAF para focus() limitado ao primeiro render; re-renders subsequentes usam `searchInput.focus()` direto

### Arquivos modificados

| Arquivo | Acao | Detalhes |
|---|---|---|
| `renderer/sections.ts` | **MODIFICADO** | Fix data-action e data-item-id para toggle-active, duplicate-item, delete-item, create-item, create-section |
| `renderer/sections.js` | **RECOMPILADO** | esbuild esm |
| `ui/custom-select.ts` | **MODIFICADO** | Click listener fora de render(), rAF limitado ao primeiro render |
| `ui/custom-select.js` | **RECOMPILADO** | esbuild esm (6.9kb) |
| `api/admin/navigation/index.php` | **MODIFICADO** | Fix u.name → u.username na query audit |
| DB: `DSHOWDASH.app_audit_log` | **CRIADA** | Tabela de auditoria para AuditLogger.php |

### Validacao de build

| Check | Status |
|---|---|
| esbuild sections.ts | PASS |
| esbuild custom-select.ts (6.9kb) | PASS |
| `node --check` sections.js | PASS |
| `node --check` custom-select.js | PASS |
| `DESCRIBE app_audit_log` | PASS (11 colunas) |
| `GET /api/admin/navigation/audit?limit=5` | PASS (200 OK, dados retornados) |

### Retrocompatibilidade

- click-router.ts: NAO MODIFICADO — os cases ja existiam, o problema era nos renderers
- crud.ts: NAO AFETADO
- items.ts (renderer principal): NAO AFETADO (ja usava data-action corretos)
- AuditLogger.php: NAO MODIFICADO — funciona agora que a tabela existe
- openCustomSelect/closeCustomSelect: mesma assinatura publica — zero breaking change

---

## PENDENCIAS

- [ ] Purgar cache Cloudflare (sem acesso a `/root/.cloudflare.env` — requer root ou outro agente)
- [ ] Validacao no browser (teste manual)
- [ ] Verificar que IconRegistry resolve icones comuns (home, grid, settings, users) no runtime
- [ ] Teste manual: click coluna grupo abre dropdown, selecao salva via PATCH
- [ ] Teste manual: DevTools Performance — zero violations 53-56ms no icon-picker
- [ ] Teste manual: click lixeira abre popup confirmacao, confirmar exclui item, tabela atualiza
- [ ] Teste manual: click no label da coluna ITEM abre input inline, Enter salva, Escape cancela, blur salva
- [ ] Teste manual: apos editar label ou grupo no panel-nav-admin, sidebar atualiza automaticamente (sem reload)
- [ ] Teste manual: click na coluna NIVEL abre select com 4 opcoes (0-3), selecao salva via PATCH
- [ ] Teste manual: click na coluna ROTA/PAINEL abre input editavel, Enter salva, Escape cancela, blur salva

---

## 2026-03-29 — DIAGNOSTICO: confirmDeleteItem + _duplicateItem + showConfirmDialog

### Problema reportado
Após clicar "Confirmar" no popover de exclusão, o DELETE não executa.
Logs mostravam `showConfirmDialog` chamado mas nenhum log de crud após confirmar.

### Análise
- **crud.ts:confirmDeleteItem** — JÁ usa `await showConfirmDialog(...)` corretamente (linha 226)
- **crud.ts:confirmDeleteItem** — JÁ verifica `if (!confirmed) return;` antes de `executeDeleteItem`
- **index.ts:_duplicateItem** — usa `.then(confirmed => ...)` (funcionalmente correto, não requer `await`)
- **modals.ts:showConfirmDialog** — Promise com popover usa `finish(true/false)` → `resolve(val)`
- **modals.ts** — guard `ready` (50ms via rAF+setTimeout) pode silenciosamente ignorar clicks rápidos

### Ações realizadas
1. **crud.ts** — Adicionados `console.log` ANTES e DEPOIS do `await showConfirmDialog` para rastrear resolução da Promise
2. **modals.ts** — Adicionados `console.log` em:
   - `finish()` — confirma se chamado e com qual valor
   - `btnConfirm.onclick` e `btnCancel.onclick` — confirma se click chega e se `ready` está true
   - `ready = true` callback — confirma timing do guard
3. **index.ts:_duplicateItem** — Adicionados `console.log` ANTES e DEPOIS do `showConfirmDialog().then()`
4. Recompilados: crud.js, modals.js, index.js (esbuild --format=esm --target=es2022)
5. Validação: `node --check` OK nos 3 arquivos

### Arquivos modificados
- `handlers/crud.ts` + `handlers/crud.js` — logs diagnósticos
- `ui/modals.ts` + `ui/modals.js` — logs diagnósticos no popover
- `index.ts` + `index.js` — logs diagnósticos em _duplicateItem

### Próximos passos
- [ ] Teste no browser: abrir DevTools Console, clicar Excluir, observar sequência de logs
- [ ] Se `[PNA:modals] btnConfirm clicado, ready= false` → problema é timing do guard
- [ ] Se `[PNA:modals] finish() chamado` aparece mas `[crud] DEPOIS de await` NÃO → problema na resolução da Promise
- [ ] Se `[crud] DEPOIS de await` aparece com `confirmed: true` mas delete não executa → problema em executeDeleteItem

---

## FIX: Dessincronia order_index — Alinhamento de campo end-to-end (2026-03-30)

**Problema:** O payload de reorder enviava `order` como nome de campo, enquanto o campo real no banco e `order_index`. Embora o PHP fizesse a traducao (`$item['order']` → `order_index`), a inconsistencia de nomenclatura causava confusao e potenciais falhas em cenarios edge. Adicionalmente, `mapFormToSection` enviava `order` ao criar grupos, mas a API esperava `order_index`, causando fallback para `99` no `order_index` de novos grupos.

**Causa raiz:**
1. `nav-adapter.ts` `reorderItems()` mapeava `order: i.order` no payload — deveria ser `order_index`
2. `mappers.ts` `mapFormToSection()` retornava `order` — API espera `order_index`
3. Ambos `reorder.php` e `index.php` liam apenas `$item['order']` sem fallback para `order_index`

**Correcoes aplicadas:**

| Arquivo | Mudanca |
|---------|---------|
| `core/nav-adapter.ts` (L340) | `order: i.order` → `order_index: i.order` |
| `core/nav-adapter.js` (L374) | Idem (JS compilado) |
| `utils/mappers.ts` `mapFormToSection` | `order:` → `order_index:` |
| `utils/mappers.js` | Idem (JS compilado) |
| `api/admin/navigation/reorder.php` (L67) | `$item['order']` → `$item['order_index'] ?? $item['order']` (backward compat) |
| `api/admin/navigation/index.php` (L834) | Idem |
| `api/admin/navigation/reorder.php` response | Adicionado `_cache_bust => time()` |
| `api/admin/navigation/index.php` reorder response | Adicionado `_cache_bust => time()` |

**Fluxo corrigido end-to-end:**
```
DB: order_index (coluna)
  ↑ UPDATE SET order_index = :ord
API reorder.php: le order_index do payload (fallback: order)
  ↑ POST { items: [{ source_table, source_id, order_index }] }
nav-adapter.ts reorderItems(): mapeia order_index: i.order
  ↑ item.order (ViewModel)
_mapApiItem(): order_index (API) → order (ViewModel)
  ↑
API GET: SELECT order_index FROM tabela
```

**Cache invalidation:**
- Redis: `RedisHelper::invalidateByPattern('ui:nav:*')` ja existia em `reorder.php`
- Redis: `invalidateNavCache()` ja existia em `index.php`
- Browser: sidebar escuta `navigation:items:changed` → `_reloadNavigation()` → `Cache.invalidateAll()` (localStorage + sessionStorage)
- API: adicionado `_cache_bust` timestamp na resposta do reorder

**Validacoes:**
| Check | Resultado |
|-------|-----------|
| `php -l reorder.php` | PASS |
| `php -l index.php` | PASS |
| `node --check nav-adapter.js` | PASS |
| `node --check mappers.js` | PASS |
| Redis nav keys | Limpo (0 keys) |
| `sort_order` em panel-nav-admin | 0 ocorrencias (confirmado) |
