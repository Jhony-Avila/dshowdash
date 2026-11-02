# BRIEFING TÉCNICO — Sprint Managers Exposure Fix
## Integração dos Sprint Managers ao `window.ContainerMain`

**Data:** 2026-02-12
**Autor:** Investigação manual (Jhony + Claude Opus)
**Executor sugerido:** Claude Code
**Prioridade:** P1 — Funcionalidade arquitetural incompleta
**Risco:** Baixo (import dinâmico, zero breaking changes)
**Estimativa:** 1-2 horas

---

## 1. CONTEXTO E PROBLEMA

### 1.1 Sintoma Observado
Ao abrir a aplicação, o DevTools exibia 4 warnings:
```
⚠️ [features-integration:commands] CommandPaletteManager not available
⚠️ [features-integration:tour] TourManager not available
⚠️ [features-integration:split-view] SplitViewManager not available
⚠️ [panel-nav-admin:renderer:items] updateItems: no container ref found
```

O 4º warning (items.js) é timing de subscription pré-mount — já corrigido (warn→debug).
Os 3 primeiros revelaram um problema arquitetural profundo.

### 1.2 Causa Raiz Investigada

O `features-integration` tenta obter managers via:
```javascript
const CM = getCM(); // resolve window.ContainerMain
commandPalette.value = CM.getCommandPaletteManager ? CM.getCommandPaletteManager() : null;
```

**Problema:** `window.ContainerMain` tem apenas **10 keys básicas** (DOM refs), sem nenhum Sprint manager.

**Evidência runtime:**
```javascript
Object.keys(window.ContainerMain)
// → ['element', 'contentElement', 'id', 'mode', 'mount', 'unmount',
//    'getElement', 'getContentElement', 'getBootstrap', 'isBootstrapped']
// Total: 10 keys — ZERO Sprint managers
```

### 1.3 Arquitetura Atual (Problema)

Existem **dois caminhos** que criam `window.ContainerMain`:

#### Caminho A — `bootstrap-integration.js` (MONOLÍTICO, NUNCA EXECUTA)
- **Arquivo:** `/components/main/ui/container-main/bootstrap-integration.js`
- **Versão:** 14.2.0-TOUR-IMPORT-FIX
- **O que faz:** Importa ~20 Sprint managers (Sprint 1-6) e os expõe via `_exposeGlobals()` em `window.ContainerMain` com 200+ keys
- **Status:** ❌ NUNCA CARREGADO pelo browser
- **Razão:** O main.bundle.js (Vite build) faz tree-shaking e remove TODOS os Sprint imports. O arquivo monolítico não é carregado como módulo avulso.

**Prova — zero ocorrências nos bundles:**
```bash
grep -c "getCommandPaletteManager" main.bundle.js        # 0
grep -c "getCommandPaletteManager" bootstrap.bundle.js    # 0
grep -c "getTourManager" main.bundle.js                   # 0
grep -c "getSplitViewManager" main.bundle.js              # 0
```

**Prova — não carregado pelo browser:**
```javascript
performance.getEntriesByType('resource').filter(r => r.name.includes('bootstrap-integration'))
// → [] (vazio)
```

#### Caminho B — `phase-4-main.js` (BOOTSTRAP-V2, EXECUTA)
- **Arquivo:** `/bootstrap-v2/phases/phase-4-main.js`
- **Versão:** 4.6.0-HEALTH-CONTRACT
- **O que faz:** Na função `syncContainerMainReference()`, cria `window.ContainerMain` com objeto **mínimo** (10 keys: DOM refs + getBootstrap + isBootstrapped)
- **Status:** ✅ ESTE É O CÓDIGO QUE REALMENTE EXECUTA

**Trecho relevante (linhas 100-120):**
```javascript
function syncContainerMainReference(logger, windowAdapter) {
  var existingBootstrap = _resolveGlobal('CMBootstrap');
  // ...
  var containerMain = _resolveGlobal('ContainerMain');
  if (!containerMain) {
    var containerAPI = {
      element: containerEl,
      contentElement: containerEl ? containerEl.querySelector('.dsd-container__content') : null,
      id: 'container-main',
      mode: 'synced',
      mount: function() {},
      unmount: function() {},
      getElement: function() { return containerEl; },
      getContentElement: function() { return this.contentElement; },
      getBootstrap: function() { return existingBootstrap; },
      isBootstrapped: function() { return true; }
    };
    windowAdapter.expose('ContainerMain', containerAPI);
    portsManager.exposeGlobal('ContainerMain', containerAPI);
  }
}
```

### 1.4 Estado dos Sprint Managers

Os 20 módulos Sprint (1-6) **existem e funcionam perfeitamente**:

| Sprint | Managers | Módulos Fonte | Status |
|--------|----------|---------------|--------|
| Sprint 1 | PanelTransitions, StatePersistence, PerformanceAPI | ✅ Existem | Não expostos |
| Sprint 2 | SkeletonManager, UpdateNotifier | ✅ Existem | Não expostos |
| Sprint 3 | NavigationHistory, LoadingProgress | ✅ Existem | Não expostos |
| Sprint 4 | SplitViewManager, ExportContentManager, OfflineModeManager | ✅ Existem | Não expostos |
| Sprint 5 | AccessibilityManager, KeyboardNavManager, ZoomManager, PrintManager, BookmarksManager | ✅ Existem | Não expostos |
| Sprint 6 | CommandPaletteManager, PanelSearchManager, PanelTabsManager, QuickActionsManager, TourManager | ✅ Existem | Não expostos |

**Prova — import dinâmico funciona:**
```javascript
const cpm = await import('/components/main/ui/container-main/utils/command-palette-manager/index.js');
// → 22 exports: createCommandPaletteManager, getCommandPaletteManager, etc. ✅

const tm = await import('/components/main/ui/container-main/utils/tour-manager.js');
// → 23 exports: createTourManager, getTourManager, registerTour, startTour, etc. ✅

const svm = await import('/components/main/ui/container-main/utils/split-view-manager/index.js');
// → 20 exports: createSplitViewManager, getSplitViewManager, activate, toggle, etc. ✅
```

### 1.5 O que o `CMBootstrap` contém

O `window.CMBootstrap` (bootstrap object) tem **161 keys** com 65 getters — são os managers internos do bootstrap (Fases 4-7): ModalManager, ThemeManager, NetworkManager, etc. **Nenhum Sprint manager.**

---

## 2. CORREÇÃO PROPOSTA

### 2.1 Estratégia

Modificar `syncContainerMainReference()` em `phase-4-main.js` para enriquecer o `containerAPI` com os Sprint managers via **import dinâmico**. Os imports são lazy (não bloqueiam o boot) e os módulos já existem.

### 2.2 Arquivo a Modificar

**ÚNICO arquivo:** `/var/www/dshowdash/public/bootstrap-v2/phases/phase-4-main.js`

### 2.3 Abordagem

Após criar o `containerAPI` mínimo e expô-lo, chamar uma função `_enrichContainerMainWithSprints()` que:

1. Faz `import()` dinâmico dos 20 módulos Sprint
2. Atribui as funções ao `window.ContainerMain` existente (Object.assign ou atribuição direta)
3. Loga sucesso/falha
4. Não bloqueia o boot — é fire-and-forget (`.catch()` silencioso)

### 2.4 Módulos a Importar (caminhos absolutos browser)
```
/components/main/ui/container-main/utils/panel-transitions.js
/components/main/ui/container-main/utils/container-state-persistence.js
/components/main/ui/container-main/utils/performance-api/index.js
/components/main/ui/container-main/utils/skeleton-manager.js
/components/main/ui/container-main/utils/update-notifier/index.js
/components/main/ui/container-main/utils/navigation-history/index.js
/components/main/ui/container-main/utils/loading-progress/index.js
/components/main/ui/container-main/utils/split-view-manager/index.js
/components/main/ui/container-main/utils/export-content-manager/index.js
/components/main/ui/container-main/utils/offline-mode-manager/index.js
/components/main/ui/container-main/utils/accessibility-manager/index.js
/components/main/ui/container-main/utils/keyboard-navigation-manager/index.js
/components/main/ui/container-main/utils/zoom-manager.js
/components/main/ui/container-main/utils/print-manager/index.js
/components/main/ui/container-main/utils/panel-bookmarks-manager/index.js
/components/main/ui/container-main/utils/command-palette-manager/index.js
/components/main/ui/container-main/utils/panel-search-manager/index.js
/components/main/ui/container-main/utils/panel-tabs-manager/index.js
/components/main/ui/container-main/utils/quick-actions-manager.js
/components/main/ui/container-main/utils/tour-manager.js
```

### 2.5 Exports Esperados por Módulo

Referência completa dos exports de cada módulo no arquivo fonte:
`/components/main/ui/container-main/bootstrap-integration.js` (linhas 85-113)

O mapeamento exato está lá — cada import com destructuring nomeado. Usar o mesmo padrão.

### 2.6 Namespaced Access

Além dos exports flat, criar os namespaces (como no bootstrap-integration.js original):
```javascript
splitView: { create, get, ORIENTATIONS, POSITIONS },
commandPalette: { create, get, register, registerMany, TYPES, MODES },
tour: { create, get, register, start, end, STATES, TOOLTIP },
// ... etc (ver bootstrap-integration.js linhas 220-260)
```

---

## 3. REGRAS DE EXECUÇÃO

### 3.1 Protocolo Obrigatório
1. **Backup** antes de qualquer alteração: `sudo cp phase-4-main.js /backup/phase-4-main.js.bak_$(date +"%Y%m%d_%H%M%S")`
2. **Full-file audit** — solicitar `cat` do arquivo completo antes de editar
3. **Reescrever arquivo inteiro** — nunca edição parcial (sed/patch)
4. **Syntax check** — `node --check` após escrita
5. **Rebuild** — bootstrap-v2 bundle: `cd /var/www/dshowdash/public/react && npx vite build --config ../bootstrap-v2/vite.bundle.config.js`
6. **Validação terminal** — grep no bundle compilado para confirmar presença dos managers
7. **Validação browser** — DevTools: verificar `Object.keys(window.ContainerMain)` e ausência dos 3 warnings

### 3.2 Restrições
- ❌ Não alterar o main.bundle.js ou seu build
- ❌ Não alterar o bootstrap-integration.js monolítico
- ❌ Não alterar os módulos Sprint fonte
- ❌ Não usar gambiarras (stubs, mocks, etc.)
- ✅ Alterar APENAS `phase-4-main.js`
- ✅ Rebuild APENAS bootstrap-v2

### 3.3 Validação de Sucesso

**Terminal:**
```bash
grep -c "getCommandPaletteManager" /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js  # > 0
grep -c "getTourManager" /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js             # > 0
grep -c "getSplitViewManager" /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js        # > 0
```

**Browser (DevTools):**
```javascript
// Deve retornar 'function' para todos:
typeof window.ContainerMain.getCommandPaletteManager  // 'function'
typeof window.ContainerMain.getTourManager             // 'function'
typeof window.ContainerMain.getSplitViewManager        // 'function'
typeof window.ContainerMain.getZoomManager             // 'function'

// Deve retornar objeto (não null):
window.ContainerMain.getCommandPaletteManager()  // {registerCommand, ...}
window.ContainerMain.getTourManager()             // {registerTour, startTour, ...}

// Zero warnings de "not available" no console
```

---

## 4. CONTEXTO DO SERVIDOR

- **Servidor:** srv920234.hstgr.cloud
- **Webroot:** /var/www/dshowdash/public
- **Shell:** zsh
- **Node:** disponível para --check
- **Vite:** instalado em /var/www/dshowdash/public/react/node_modules
- **Build bootstrap-v2:** `cd /var/www/dshowdash/public/react && npx vite build --config ../bootstrap-v2/vite.bundle.config.js`
- **Backup dir:** /backup/

---

## 5. NOTA IMPORTANTE SOBRE TREE-SHAKING

O motivo pelo qual os Sprint managers foram eliminados do main.bundle.js é que o Vite/Rollup detecta que as funções importadas no `bootstrap-integration.js` são apenas atribuídas a um objeto literal (`window.ContainerMain = { ... }`) — que o bundler trata como dead code porque `window.ContainerMain` não é consumido dentro do bundle.

A solução via `phase-4-main.js` é correta porque:
1. Usa `import()` dinâmico (não sujeito a tree-shaking estático)
2. Os módulos são carregados sob demanda pelo browser
3. O `window.ContainerMain` já existe como objeto global mutável
4. Os Sprint managers são atribuídos após boot (non-blocking)

---

## 6. ARQUIVOS DE REFERÊNCIA

| Arquivo | Propósito | Ação |
|---------|-----------|------|
| `/bootstrap-v2/phases/phase-4-main.js` | Phase 4 — cria window.ContainerMain | **MODIFICAR** |
| `/bootstrap-v2/vite.bundle.config.js` | Config de build do bootstrap-v2 | Consultar (não modificar) |
| `/components/main/ui/container-main/bootstrap-integration.js` | Monolítico com Sprint imports (referência) | Consultar (não modificar) |
| `/components/main/ui/container-main/utils/features-integration/commands.js` | Consome getCommandPaletteManager | Já corrigido (warn→debug) |
| `/components/main/ui/container-main/utils/features-integration/tour.js` | Consome getTourManager | Já corrigido (warn→debug) |
| `/components/main/ui/container-main/utils/features-integration/split-view.js` | Consome getSplitViewManager | Já corrigido (warn→debug) |

---

*Briefing gerado a partir de investigação manual completa com 20+ iterações de diagnóstico.*
