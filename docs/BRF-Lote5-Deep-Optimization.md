# BRIEFING — Lote 5: Deep Optimization (JS + Header Components)

## 1. Estado Atual (pós Lotes 1-4)

| Métrica    | Valor  |
|------------|--------|
| JS (sem header lazy) | 117 requests |
| JS (header lazy)     | 79 requests  |
| CSS                  | 35 requests  |
| **TOTAL**            | **231 requests** |

## 2. Alvos — 4 Frentes

### FRENTE A — Header Components Bundle (79 requests → ~5)
O header carrega 23 micro-componentes dinamicamente via manifest.json.
Cada componente é um diretório (currency-usd-brl/, user-menu/, etc.) com index.js + sub-files.
São carregados pelo loader em: /components/header/dist/header.bundle.js linha 1750:
  const modulePath = \`/components/header/components/\${name}/index.js\`;

São 79 requests para ~23 componentes + _base/ + _shared/ + _internal/.

ESTRATÉGIA: Bundlar cada componente individual seria 23 configs.
MELHOR: Criar 1 mega-bundle de todos os header components, e alterar o loader
para importar do bundle em vez de paths individuais.

ALTERNATIVA MAIS SEGURA: Bundlar por grupo funcional (currencies, integrations, panels, etc.)
e ajustar o loader para primeiro tentar o bundle, fallback para individual.

IMPLEMENTAÇÃO RECOMENDADA:
1. Criar barrel _entry.js que importa TODOS os 23 componentes por nome
2. Vite build → header-components.bundle.js
3. O bundle exporta cada componente por nome: { 'currency-btc': module, 'user-menu': module, ... }
4. Alterar o loader no header.bundle.js para:
   - Primeiro: import do bundle + lookup por nome
   - Isso elimina 79 requests → 1

DIAGNÓSTICO NECESSÁRIO:
- Cada componente exporta default? Named exports? 
- O loader usa import() dinâmico — como mapear para lookup no bundle?
- Verificar: grep "import(" no header bundle para entender o pattern do loader

ATENÇÃO: O header.bundle.js precisará de rebuild após alterar o loader.
Portanto a ordem é: (1) criar header-components bundle, (2) alterar loader source,
(3) rebuild header bundle, (4) validar.

ENTRY POINT: Criar /components/header/components/_entry.js com:
  export { default as CurrencyBtc } from './currency-btc/index.js';
  export { default as CurrencyUsdBrl } from './currency-usd-brl/index.js';
  ... (1 linha por componente, baseado no manifest.json categories)

OUTPUT: /components/header/components/dist/header-components.bundle.js

EXTERNALS: /core/*, /platform/*, /assets/*, /boot/*, /components/header/core/*, 
/components/header/state/*, /components/header/telemetry/*
(tudo fora de /components/header/components/ é external)

LOADER ALTERATION (no source original do header, antes do rebuild):
Arquivo: /var/www/dshowdash/public/components/header/core/component-loader.js (ou similar)
Buscar a função que faz:
  const modulePath = \`/components/header/components/\${name}/index.js\`;
  const module = await import(modulePath);
Alterar para:
  import * as HeaderComponents from '../components/dist/header-components.bundle.js';
  // No loader:
  const module = HeaderComponents[normalizedName] || await import(\`/components/header/components/\${name}/index.js\`);

### FRENTE B — Eliminar Re-exports Duplos no Bootstrap (potencial -13 requests)
O bootstrap faz dynamic import de index.js de cada componente/módulo.
Cada index.js agora é um re-export de 2 linhas que redireciona para dist/bundle.
Isso gera 2 requests por módulo: index.js + bundle.

LISTA DOS 13 PARES (index.js re-export → dist/bundle):
  1. /components/app-shell/index.js → dist/app-shell.bundle.js
  2. /components/preloader/index.js → dist/preloader.bundle.js
  3. /components/error-boundary/index.js → dist/error-boundary.bundle.js
  4. /components/context-provider/index.js → dist/context-provider.bundle.js
  5. /components/feature-flags/index.js → dist/feature-flags.bundle.js
  6. /components/login-modal/index.js → dist/login-modal.bundle.js
  7. /components/session-manager/index.js → dist/session-manager.bundle.js (via static import)
  8. /components/layout-manager/index.js → dist/layout-manager.bundle.js
  9. /components/header/index.js → dist/header.bundle.js
  10. /core/kernel/feature-definitions.js → dist/kernel.bundle.js (re-export)
  11. /core/kernel/index.js → dist/kernel.bundle.js (re-export)
  12. /modules/global-state/index.js → dist/global-state.bundle.js
  13. /core/js/event-bus/index.js → dist/event-bus.bundle.js
  14. /core/js/asset-loader/index.js → dist/asset-loader.bundle.js

ESTRATÉGIA: Rebuild do bootstrap para importar diretamente dos bundles.
O bootstrap source está em /var/www/dshowdash/public/bootstrap-v2/ (VERIFICAR estrutura).

ATENÇÃO CRÍTICA: O bootstrap bundle é o CORAÇÃO do sistema. Qualquer erro = app não carrega.
- OBRIGATÓRIO: backup completo antes de qualquer alteração
- OBRIGATÓRIO: validar no browser imediatamente após rebuild
- Se falhar: reverter IMEDIATAMENTE

IMPLEMENTAÇÃO:
1. Localizar os sources do bootstrap (NÃO o bundle, os SOURCES)
2. Em cada source file, substituir:
   import("/components/app-shell/index.js") → import("/components/app-shell/dist/app-shell.bundle.js")
   import("/components/preloader/index.js") → import("/components/preloader/dist/preloader.bundle.js")
   ... etc para cada par
3. Para static imports do bootstrap:
   from "/core/auth/adapters/auth-adapter-enterprise.js" → esses JÁ SÃO re-exports para auth.bundle.js
   Substituir por: from "/core/auth/dist/auth.bundle.js" (com named import ajustado)
   CUIDADO: os named imports devem existir no bundle
4. Rebuild bootstrap:
   cd /var/www/dshowdash/public/react
   npx vite build --config ../bootstrap-v2/vite.config.js (ou similar — VERIFICAR config)
5. fix-paths no bootstrap bundle
6. Validar

NOTA: Os static imports do bootstrap (from "/core/runtime/events/catalog/...") 
NÃO devem ser alterados — os events re-exports são necessários para resolução de nomes.

### FRENTE C — Assets/JS/Core Restantes (11 → ~5 requests)
Dos 11 requests em /assets/js/core, 8 são pares index.js+bundle (4 módulos já bundlados).
Restam 3 módulos NÃO bundlados carregados pelo browser:

Verificar quais dos seguintes são carregados (via DevTools):
- api-client/index.js
- debug-logger/index.js
- fonts-manager/index.js
- health-aggregator/index.js
- metrics-polling/index.js (SIM — dynamic import no bootstrap)
- smoke-test/index.js
- theme-manager/index.js
- theme-tokens-loader/index.js

Para os que são carregados E têm mais de 1 file:
1. Adicionar ao vite.lote3bc.config.js
2. Build + fix-paths + node --check
3. Backup + re-export

Para metrics-polling especificamente: bootstrap faz import("/assets/js/core/metrics-polling/index.js")
Se é arquivo único, não precisa bundlar. Se tem sub-módulos, bundlar.

### FRENTE D — Runtime Events Re-exports (30 requests — análise)
30 events files carregados, cada um é re-export de 3 linhas.
Cada re-export gera 1 HTTP request de ~200 bytes → redireciona para runtime.bundle.js (já em cache).
São requests baratos mas somam.

Para eliminar: os CONSUMERS (bootstrap, header, app-shell, etc.) precisariam importar
diretamente do runtime.bundle.js. Mas isso quebraria a semântica:
  from "/core/runtime/events/catalog/auth.events.js" (import by domain name)
  vs from "/core/runtime/dist/runtime.bundle.js" (import from mega-bundle)

OPÇÃO: Criar um barrel /core/runtime/events/catalog/index.js que re-exporta TUDO:
  export * from '../../dist/runtime.bundle.js';
E alterar consumers para: from "/core/runtime/events/catalog/index.js"
Isso reduz 30 → 1 request. Mas requer rebuild de TODOS os consumers.

RECOMENDAÇÃO: Fazer isso JUNTO com a Frente B (rebuild do bootstrap) para amortizar o risco.

## 3. Ordem de Execução

PRIORIDADE POR IMPACTO × RISCO:

### FASE 1 — Frente C: Assets/JS/Core (baixo risco, médio impacto)
1. Diagnosticar quais dos 11 requests são módulos não-bundlados
2. Bundlar os elegíveis
3. Validar no browser

### FASE 2 — Frente A: Header Components (médio risco, ALTO impacto: -79 requests)
1. Analisar o loader pattern no header source (ANTES do bundle)
   - O source original está em /backup/components__header__index.js.bak_TIMESTAMP
   - OU nos files individuais: /components/header/core/component-loader.js
2. Criar _entry.js barrel para header/components
3. Build header-components.bundle.js
4. Alterar loader source para usar bundle
5. Rebuild header bundle
6. Validar no browser

### FASE 3 — Frente B + D: Bootstrap Direct Imports + Events (alto risco, alto impacto: -43 requests)
1. Localizar e auditar sources do bootstrap
2. Substituir imports para apontar direto aos bundles
3. Criar /core/runtime/events/catalog/index.js barrel
4. Substituir events imports para usar barrel
5. Rebuild bootstrap
6. VALIDAÇÃO CRÍTICA no browser

## 4. Infraestrutura

### Configs Vite Existentes
- /var/www/dshowdash/public/components/vite.components.config.js (componentes)
- /var/www/dshowdash/public/vite.lote3bc.config.js (core/assets/modules)
- /var/www/dshowdash/public/bootstrap-v2/vite.config.js (bootstrap — VERIFICAR)

### Build Scripts
- /var/www/dshowdash/public/components/build-components.sh
- /var/www/dshowdash/public/build-lote3bc.sh

### Post-Processing
- /var/www/dshowdash/public/scripts/fix-bundle-paths.js (permanentizado)

### Padrões Estabelecidos
- Entry: _entry.js para módulos cujo index.js já é re-export
- External: tudo fora do módulo sendo bundlado
- Re-export: export * from './dist/NOME.bundle.js'; export { default } from './dist/NOME.bundle.js';
- Backup: /backup/CAMINHO__FLAT.bak_TIMESTAMP

## 5. Projeção de Resultados

| Frente | Antes | Depois | Eliminados |
|--------|-------|--------|------------|
| C: assets/js/core | 11 | ~5 | ~-6 |
| A: header components | 79 | ~3 | ~-76 |
| B: bootstrap direct | 117 | ~104 | ~-13 |
| D: events barrel | 30 | ~2 | ~-28 |
| **Total JS** | **~196** (117+79) | **~83** | **~-113** |
| CSS (já otimizado) | 35 | 35 | 0 |
| **GRAND TOTAL** | **231** | **~118** | **~-113** |

Acumulado Lotes 1-5: ~580 → ~118 = **-80% redução total**

## 6. Regras Operacionais

1. SEMPRE backup para /backup ANTES de alterar qualquer arquivo
2. NUNCA use sed/patch parcial — reescreva arquivos inteiros via cat << 'EOF'
3. NUNCA restaure de backup — corrija o arquivo atual
4. Post-processing: rode /var/www/dshowdash/public/scripts/fix-bundle-paths.js após cada build
5. Valide syntax com node --check após cada build
6. BOOTSTRAP é CRÍTICO — backup extra, validação imediata, rollback se falhar
7. Credenciais: Jhony / <SENHA-REMOVIDA-P1-01>
8. URL: https://dshowdash.com.br
9. Não minificar
10. Não alterar bundles de lotes anteriores (exceto header rebuild na Frente A e bootstrap na Frente B)
11. Não remover arquivos fonte
12. Nunca consultar pastas com nomes que contenham "react" para listar conteúdo (evitar travamentos)

## 7. Validação Final

Após cada Fase:
- Abrir https://dshowdash.com.br
- Login: Jhony / <SENHA-REMOVIDA-P1-01>
- Console: sem erros 404 ou import failures
- JS count: performance.getEntriesByType('resource').filter(r => r.name.endsWith('.js')).length
- CSS count: performance.getEntriesByType('resource').filter(r => r.name.endsWith('.css')).length

## 8. Rollback

- Bootstrap: /backup/bootstrap.bundle.js.bak_TIMESTAMP
- Header: /backup/components__header__index.js.bak_TIMESTAMP
- Cada módulo: restaurar index.js do /backup

## 9. Arquivos de Referência

- Header manifest: /components/header/components/manifest.json
- Header loader: verificar /components/header/core/ por component-loader ou registry
- Bootstrap sources: /var/www/dshowdash/public/bootstrap-v2/ (verificar estrutura)
- Bootstrap config: /var/www/dshowdash/public/bootstrap-v2/vite.config.js (verificar)
- Fix paths: /var/www/dshowdash/public/scripts/fix-bundle-paths.js
