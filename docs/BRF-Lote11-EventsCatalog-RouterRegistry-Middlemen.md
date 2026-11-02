# BRIEFING — Lote 11: Events Catalog Bundle + Router Registry + Middlemen

## 0. PROTOCOLOS OBRIGATÓRIOS

### Protocolo de Não Restauração
- Arquivos com erro NÃO devem ser restaurados a partir de backup.
- Devem ser CORRIGIDOS no estado atual. Backup é REFERÊNCIA.
- "Use o backup para entender. Corrija o arquivo atual. Nunca restaure cegamente."

### Protocolo Anti-Gambiarras (PAG)
- Toda mudança deve resolver a CAUSA, não contornar o problema.
- Não criar arquivos ponte, wrappers, fallbacks silenciosos.

### Protocolo de Correção (Full-File)
- NÃO utilizar sed, perl -pi, apply_patch ou edições parciais.
- Sempre reescrever o arquivo por completo via cat << 'EOF'.
- Backup obrigatório ANTES de qualquer alteração.

## 1. Estado Atual

| Métrica | Valor |
|---------|-------|
| JS Total | 141 requests |
| CSS Total | 36 requests |
| TOTAL | 177 requests |

## 2. Alvos — 3 Frentes (52 requests eliminável)

### FRENTE A — Events Catalog Bundle (34 requests → 1)

MAIOR ALVO. 34 dos 141 JS requests (24%) são events/catalog/*.events.js.
Há 66 files no disco, 34 carregam no browser.

#### Por que a tentativa anterior falhou
A Frente A do Lote 10 tentou redirecionar imports de events/catalog para runtime.bundle.js,
mas o runtime.bundle.js NÃO exporta os named constants (ACTION_EVENTS, etc.).

#### Solução correta (Enterprise)
Criar um events-catalog.bundle.js que CONTÉM e EXPORTA todos os named exports.
Depois, cada events/catalog/*.events.js vira re-export do bundle.
Bundles que importam events/catalog carregarão o bundle (1 request, cacheado).

#### Implementação

PASSO 1 — Criar entry point /core/runtime/events/catalog/_entry.js

Este arquivo importa TODOS os 66 events files e re-exporta tudo.
Cada file tem exports únicos, então não há conflito (exceto VERSION e MODULE_ID
que existem em todos — esses devem ser agrupados por namespace).

ATENÇÃO: Vários files exportam `VERSION` e `MODULE_ID` com mesmo nome.
A solução é exportar cada file como NAMESPACE:
```javascript
export * as ActionEvents from './action.events.js';
export * as ApiEvents from './api.events.js';
export * as AppEvents from './app.events.js';
// ... para todos os 66 files
```

MAS isso muda a forma de importar. Os bundles fazem:
  import { ACTION_EVENTS } from '/core/runtime/events/catalog/action.events.js';
E precisariam mudar para:
  import { ACTION_EVENTS } from '/core/runtime/events/catalog/dist/events-catalog.bundle.js';
  // Funciona se o bundle exportar ACTION_EVENTS diretamente

SOLUÇÃO MELHOR: Como cada file tem named exports ÚNICOS (ACTION_EVENTS só existe em action.events.js,
AUTH_EVENTS só em auth.events.js), podemos fazer barrel com cherry-pick:

```javascript
// _entry.js
export { ACTION_EVENTS, ACTION_INTENTS } from './action.events.js';
export { API_EVENTS } from './api.events.js';
// ... cherry-pick dos exports únicos de cada file
// Para VERSION e MODULE_ID: ignorar (são metadata, não importados por bundles)
```

VERIFICAÇÃO NECESSÁRIA: Confirmar que bundles NÃO importam VERSION/MODULE_ID dos events.
Se importam, usar namespace ou renomear.

PASSO 2 — Verificar que os bundles só importam named exports únicos:
```bash
# No bootstrap e em cada bundle, verificar o que importam dos events:
grep -oh "import {[^}]*} from.*events/catalog" /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js
# Repetir para main, footer, sidebar, header, nav-rail, etc.
```

PASSO 3 — Criar barrel _entry.js com TODOS os named exports únicos dos 66 files:
Localização: /var/www/dshowdash/public/core/runtime/events/catalog/_entry.js

PASSO 4 — Adicionar ao vite.lote3bc.config.js:
```javascript
'events-catalog': {
  entry: 'core/runtime/events/catalog/_entry.js',
  outDir: 'core/runtime/events/catalog/dist',
  fileName: 'events-catalog.bundle.js',
  internalPrefix: '/core/runtime/events/catalog/'
}
```

PASSO 5 — Build:
```bash
cd /var/www/dshowdash/public/react
TARGET=events-catalog npx vite build --config ../vite.lote3bc.config.js
```

PASSO 6 — fix-bundle-paths + node --check

PASSO 7 — Transformar CADA events/catalog/*.events.js em re-export do bundle:
Para cada file (66 total):
  - Backup para /backup/
  - Reescrever com: export { NAMED_EXPORT1, NAMED_EXPORT2 } from './dist/events-catalog.bundle.js';
  - Incluir default export se o original tinha

PASSO 8 — Validar: os bundles existentes que importam events/catalog/*.events.js
agora carregarão o re-export, que resolve do events-catalog.bundle.js.
Primeira vez: browser carrega *.events.js (re-export) + events-catalog.bundle.js
Demais: events-catalog.bundle.js já está em cache.

RESULTADO: 34 events requests → 34 re-exports (cacheados) + 1 bundle = efetivamente ~2-3 requests
(o browser resolve os re-exports do cache, o bundle é 1 request novo).

NOTA: Para ELIMINAR os re-exports também, seria necessário post-processing nos bundles
existentes para apontar diretamente ao events-catalog.bundle.js. Mas o cherry-pick
dos named exports precisa ser feito com cuidado para cada bundle.

ALTERNATIVA MAIS AGRESSIVA (elimina os 34 re-exports):
Após criar o bundle, criar script events-catalog-direct.js que:
1. Para cada bundle existente
2. Substitui import { X } from '/core/runtime/events/catalog/Y.events.js'
   por import { X } from '/core/runtime/events/catalog/dist/events-catalog.bundle.js'
3. Isso funciona porque o bundle EXPORTA todos os named exports diretamente
4. O browser só carrega 1 arquivo (o bundle), sem middlemen

RECOMENDAÇÃO: Usar a alternativa agressiva. Criar o bundle com TODOS os exports,
depois post-processar TODOS os bundles existentes para importar direto do bundle.
Desta vez funciona porque o bundle TEM os named exports.

RESULTADO FINAL: 34 → 1 request (-33)

### FRENTE B — Router Registry no Main Bundle (13 requests → 0)

O main.bundle.js importa /components/router/registry/* externamente (12 requests)
e /components/router/state/store.js (1 request).

#### Causa
O main bundle foi construído com vite.components.config.js que trata
/components/router/ como EXTERNO (diferente do app-router que tem internalPrefix).

#### Solução
Rebuild do main bundle incluindo /components/router/registry/ e
/components/router/state/ como internos.

#### Implementação

PASSO 1 — Verificar config atual do main no vite.components.config.js:
```bash
grep -A8 "'main'" /var/www/dshowdash/public/components/vite.components.config.js
```

PASSO 2 — O vite.components.config.js pode não suportar internalPrefix como array.
Verificar se a lógica isExternal() diferencia. Se não:
- Adicionar suporte a keepInternal no config (lista de paths que NÃO são externos)
- OU: adicionar os router files como parte do entry via barrel

PASSO 3 — Opção mais simples: adicionar keepInternal ao main config:
```javascript
'main': {
  entry: 'components/main/_entry.js',
  outDir: 'components/main/dist',
  fileName: 'main.bundle.js',
  keepInternal: ['/components/router/registry/', '/components/router/state/']
}
```

PASSO 4 — Atualizar isExternal() no vite.components.config.js para suportar keepInternal:
Se o path começa com qualquer item de keepInternal → NÃO é externo.

PASSO 5 — Rebuild main:
```bash
cd /var/www/dshowdash/public/react
COMPONENT=main npx vite build --config ../components/vite.components.config.js
```

PASSO 6 — fix-bundle-paths + node --check

PASSO 7 — Verificar que router/registry NÃO vaza:
```bash
grep "router/registry" /var/www/dshowdash/public/components/main/dist/main.bundle.js | head -3
```
Deve retornar 0 (internalizado).

PASSO 8 — Restaurar os 5 re-exports (index.js + 4 sub-paths) se foram sobrescritos pelo rebuild.

RESULTADO: -13 requests

### FRENTE C — Middlemen Re-exports Fix (7 requests → 0)

7 index.js que são re-exports para dist/bundle.js ainda carregam.
Apenas o main.bundle.js importa esses middlemen.

#### Causa
O middlemen-direct-imports.js do Lote 10 não processou o main.bundle.js
corretamente, OU o main foi rebuilt depois sem re-aplicar.

#### Solução
Re-aplicar middlemen-direct-imports.js no main.bundle.js (e em qualquer
outro bundle que ainda importe middlemen).

#### Implementação

PASSO 1 — Verificar quais middlemen o main importa:
```bash
grep -oh "from \"[^\"]*index\.js\"" /var/www/dshowdash/public/components/main/dist/main.bundle.js | sort -u
```

PASSO 2 — Aplicar middlemen-direct-imports.js:
```bash
node /var/www/dshowdash/public/scripts/middlemen-direct-imports.js \
  /var/www/dshowdash/public/components/main/dist/main.bundle.js
```

PASSO 3 — node --check

NOTA: Se a Frente B rebuild o main, aplicar middlemen-direct DEPOIS do rebuild.

RESULTADO: -7 requests (no mínimo -6, depende se todos são do main)

## 3. Ordem de Execução

### FASE 1 — Frente A: Events Catalog Bundle (PARALELA com Fase 2)
1. Verificar imports de events nos bundles existentes (quais named exports usam)
2. Criar _entry.js barrel com TODOS os named exports dos 66 files
3. Adicionar ao vite.lote3bc.config.js
4. Build events-catalog.bundle.js
5. fix-paths + node --check
6. Transformar 66 events files em re-exports do bundle
7. Criar events-catalog-direct.js para post-processar bundles existentes
8. Aplicar em todos os bundles
9. node --check em todos
10. Validar

### FASE 2 — Frente B: Router Registry no Main (PARALELA com Fase 1)
1. Verificar config main
2. Adicionar keepInternal ao config
3. Atualizar isExternal() se necessário
4. Rebuild main
5. fix-paths + node --check
6. Restaurar re-exports
7. Validar

### FASE 3 — Frente C: Middlemen Fix (SEQUENCIAL, após Fase 2)
1. Re-aplicar middlemen-direct-imports no main bundle (pós-rebuild)
2. Aplicar em qualquer outro bundle que precise
3. node --check
4. Validar

### FASE 4 — Post-Processing Final
1. Aplicar events-catalog-direct.js no main rebuild (Fase 2 output)
2. Aplicar bootstrap-direct-imports.js se necessário
3. node --check em TUDO
4. Validar no browser

## 4. Regras Operacionais

1. SEMPRE backup para /backup ANTES de alterar qualquer arquivo
2. NUNCA restaure um arquivo inteiro do backup — use backup como REFERÊNCIA
3. NUNCA use sed/patch parcial — reescreva arquivos inteiros via cat << 'EOF'
4. Post-processing: rode fix-bundle-paths.js após cada build Vite
5. Valide syntax com node --check após CADA modificação
6. BOOTSTRAP é CRÍTICO — backup extra, validação imediata
7. Credenciais: Jhony / <SENHA-REMOVIDA-P1-01>
8. URL: https://dshowdash.com.br
9. Não minificar, não remover fontes
10. Nunca liste conteúdo de pastas com "react" no nome

## 5. Projeção

| Frente | Antes | Depois | Eliminados |
|--------|-------|--------|------------|
| A: Events Catalog | 34 | 1 | -33 |
| B: Router Registry | 13 | 0 | -13 |
| C: Middlemen | 7 | 0 | -7 |
| **Total** | **54** | **1** | **-53** |

Pós Lote 11: JS ~88, CSS ~36, Total ~124
Acumulado: ~580 → ~124 = **~-79% redução**

## 6. Arquivos de Referência

- Config componentes: /var/www/dshowdash/public/components/vite.components.config.js
- Config core: /var/www/dshowdash/public/vite.lote3bc.config.js
- Bootstrap: /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js
- Bootstrap direct imports: /var/www/dshowdash/public/scripts/bootstrap-direct-imports.js
- Fix paths: /var/www/dshowdash/public/scripts/fix-bundle-paths.js
- Middlemen direct: /var/www/dshowdash/public/scripts/middlemen-direct-imports.js
- Events catalog source: /var/www/dshowdash/public/core/runtime/events/catalog/
- Main bundle: /var/www/dshowdash/public/components/main/dist/main.bundle.js
- Main config entry: components/main/_entry.js

## 7. Lista de Bundles para Post-Processing (events-catalog-direct)

```
/var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js
/var/www/dshowdash/public/components/main/dist/main.bundle.js
/var/www/dshowdash/public/components/footer/dist/footer.bundle.js
/var/www/dshowdash/public/components/sidebar/dist/sidebar.bundle.js
/var/www/dshowdash/public/components/header/dist/header.bundle.js
/var/www/dshowdash/public/components/header/components/dist/header-components.bundle.js
/var/www/dshowdash/public/components/nav-rail/dist/nav-rail.bundle.js
/var/www/dshowdash/public/components/overlay-layer/dist/overlay-layer.bundle.js
/var/www/dshowdash/public/app/router/dist/app-router.bundle.js
/var/www/dshowdash/public/core/ui-orchestrator/dist/ui-orchestrator.bundle.js
/var/www/dshowdash/public/components/app-shell/dist/app-shell.bundle.js
/var/www/dshowdash/public/components/login-modal/dist/login-modal.bundle.js
/var/www/dshowdash/public/components/layout-manager/dist/layout-manager.bundle.js
/var/www/dshowdash/public/components/preloader/dist/preloader.bundle.js
/var/www/dshowdash/public/components/error-boundary/dist/error-boundary.bundle.js
/var/www/dshowdash/public/components/context-provider/dist/context-provider.bundle.js
/var/www/dshowdash/public/components/feature-flags/dist/feature-flags.bundle.js
/var/www/dshowdash/public/core/kernel/dist/kernel.bundle.js
/var/www/dshowdash/public/core/kernel/ui/dist/kernel-ui.bundle.js
/var/www/dshowdash/public/core/runtime/dist/runtime.bundle.js
/var/www/dshowdash/public/core/js/event-bus/dist/event-bus.bundle.js
/var/www/dshowdash/public/core/js/asset-loader/dist/asset-loader.bundle.js
/var/www/dshowdash/public/core/js/enterprise-loader/dist/enterprise-loader.bundle.js
/var/www/dshowdash/public/modules/global-state/dist/global-state.bundle.js
/var/www/dshowdash/public/assets/js/core/config-loader/dist/config-loader.bundle.js
/var/www/dshowdash/public/assets/js/core/environment-manager/dist/environment-manager.bundle.js
/var/www/dshowdash/public/assets/js/core/logger-global/dist/logger-global.bundle.js
/var/www/dshowdash/public/assets/js/core/telemetry-core/dist/telemetry-core.bundle.js
/var/www/dshowdash/public/components/security/csrf-token-manager/dist/csrf-token-manager.bundle.js
/var/www/dshowdash/public/components/session-manager/dist/session-manager.bundle.js
/var/www/dshowdash/public/components/toast/service/dist/toast-service.bundle.js
/var/www/dshowdash/public/platform/runtime/dist/platform-runtime.bundle.js
/var/www/dshowdash/public/platform/shell/dist/platform-shell.bundle.js
/var/www/dshowdash/public/components/_shared/permissions/dist/integration.bundle.js
/var/www/dshowdash/public/components/_shared/permissions/dist/ui-feedback.bundle.js
/var/www/dshowdash/public/components/panel-home/dist/panel-home.bundle.js
/var/www/dshowdash/public/components/ticker/dist/ticker.bundle.js
```

## 8. Rollback

Cada bundle tem backup em /backup/ com timestamp.
Events files: /backup/ com pattern events/catalog
Main bundle: /backup/ pre-lote11
Bootstrap: /backup/ pre-lote11
