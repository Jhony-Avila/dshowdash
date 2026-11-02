# BRIEFING — Lote 10: FINAL MEGA OPTIMIZATION

## 1. Estado Atual

| Métrica | Valor |
|---------|-------|
| JS Total | 156 requests |
| CSS Total | 36 requests |
| TOTAL | 192 requests |
| Baseline original | ~580 |
| Redução acumulada | -67% |

## 2. Alvos — 6 Frentes (81+ requests eliminável)

### FRENTE A — Events Catalog Mega-Bundle (40 requests → 0)
MAIOR ALVO. 40 arquivos em /core/runtime/events/catalog/*.events.js
Cada um é um re-export de ~1 linha que importa do runtime.bundle.js.
São importados por MUITOS bundles (main:15, footer:8, sidebar:6, header, nav-rail, etc.)

O runtime.bundle.js JÁ CONTÉM todos os events. O problema é que bundles externos
fazem `import X from '/core/runtime/events/catalog/auth.events.js'` — e esse arquivo
é um re-export que faz `export * from '../dist/runtime.bundle.js'`, gerando 40 requests
extras que apenas redirecionam.

ESTRATÉGIA: Post-processing em TODOS os bundles existentes.
Criar um script /var/www/dshowdash/public/scripts/events-direct-imports.js que:
1. Recebe um bundle JS file como argumento
2. Substitui TODOS os imports de `/core/runtime/events/catalog/*.events.js`
   por `/core/runtime/dist/runtime.bundle.js`
3. Reporta quantos replacements fez

Lista dos 40 events files (todos seguem o pattern):
action, api, app, asset, audit-trail, auth, boot, component, container, error,
feature-flags, footer, governance, header, kernel, layout, lifecycle, log, main,
nav, navrail, orchestrator, overlay, panel-loader, panels, performance, permissions,
persistence, preloader, router, security, session, shell, sidebar, state, system,
telemetry, theme, ticker, ui

IMPLEMENTAÇÃO:
1. Criar /var/www/dshowdash/public/scripts/events-direct-imports.js:
```javascript
const fs = require('fs');
const path = require('path');

const bundlePath = process.argv[2];
if (!bundlePath) { console.error('Usage: node events-direct-imports.js <bundle.js>'); process.exit(1); }

const fullPath = path.resolve(bundlePath);
let content = fs.readFileSync(fullPath, 'utf8');
let count = 0;

// Pattern: import from or export from events/catalog/*.events.js
// Replace with runtime.bundle.js
const events = [
  'action','api','app','asset','audit-trail','auth','boot','component','container',
  'error','feature-flags','footer','governance','header','kernel','layout','lifecycle',
  'log','main','nav','navrail','orchestrator','overlay','panel-loader','panels',
  'performance','permissions','persistence','preloader','router','security','session',
  'shell','sidebar','state','system','telemetry','theme','ticker','ui'
];

for (const evt of events) {
  const oldPath = `/core/runtime/events/catalog/${evt}.events.js`;
  const newPath = `/core/runtime/dist/runtime.bundle.js`;
  // Match both single and double quotes
  const patterns = [
    `"${oldPath}"`,
    `'${oldPath}'`
  ];
  for (const pattern of patterns) {
    const replacement = pattern[0] + newPath + pattern[0];
    if (content.includes(pattern)) {
      content = content.split(pattern).join(replacement);
      count++;
    }
  }
}

if (count > 0) {
  fs.writeFileSync(fullPath, content);
  console.log(`Events direct: ${count} replacements in ${path.basename(fullPath)}`);
} else {
  console.log(`Events direct: NO CHANGE in ${path.basename(fullPath)}`);
}
```

2. Aplicar em TODOS os bundles que importam events:
```bash
BUNDLES=(
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
)
for b in "${BUNDLES[@]}"; do
  node /var/www/dshowdash/public/scripts/events-direct-imports.js "$b"
  node --check "$b"
done
```

3. Validar que NENHUM bundle importa events/catalog diretamente:
```bash
grep -rl "events/catalog" /var/www/dshowdash/public/*/dist/*.bundle.js /var/www/dshowdash/public/*/*/dist/*.bundle.js 2>/dev/null
```

RESULTADO ESPERADO: -40 requests

### FRENTE B — Router Registry Bundle (12 requests → 1)
O app-router.bundle.js fez os registry files como EXTERNOS porque estão em
/components/router/ e o internalPrefix era ['/app/router/', '/components/router/'].
MAS os registry files vazaram: 12 requests para /components/router/registry/*.

DIAGNÓSTICO: O app-router bundle provavelmente tem import() dinâmicos para registry
ou os registry files são importados por outros módulos (state/store.js, etc.).

IMPLEMENTAÇÃO:
1. Verificar POR QUE vazaram:
   grep "registry" /var/www/dshowdash/public/app/router/dist/app-router.bundle.js | head -5
2. Se são dynamic imports: aplicar barrel pattern como sidebar/main features
3. Se são static imports que ficaram externos: rebuild app-router com registry incluído
4. Verificar se components/router/state/store.js também vazou (1 request no mapa)
5. FIX: O mais provável é que o Vite tratou /components/router/registry/ como externo
   Rebuild app-router incluindo registry:
   - Adicionar '/components/router/registry/' ao internalPrefix array do app-router
   - Rebuild: TARGET=app-router
   - fix-paths + node --check
   - Re-aplicar bootstrap-direct-imports + events-direct-imports

RESULTADO ESPERADO: -11 requests (12 → 1)

### FRENTE C — Panel-Home Bundle (10 requests → 1)
10 files JS. Entry: /components/panel-home/index.js
Bootstrap: import("/components/panel-home/index.js") — NÃO ESTÁ no bootstrap!
Provavelmente carregado pelo app-shell ou main.

IMPLEMENTAÇÃO:
1. Verificar quem importa panel-home:
   grep -rl "panel-home" /var/www/dshowdash/public/*/dist/*.bundle.js /var/www/dshowdash/public/*/*/dist/*.bundle.js 2>/dev/null
2. Adicionar ao vite.components.config.js:
   'panel-home': {
     entry: 'components/panel-home/index.js',
     outDir: 'components/panel-home/dist',
     fileName: 'panel-home.bundle.js'
   }
3. Build: COMPONENT=panel-home
4. fix-paths + node --check
5. Backup index.js + re-export
6. Atualizar o bundle que importa panel-home (bootstrap-direct-imports ou alterar o bundle pai)

RESULTADO ESPERADO: -9 requests

### FRENTE D — Ticker Bundle (7 requests → 1)
7 files JS (38 files total no disco, maioria não carrega).
Entry: /components/ticker/index.js
Provavelmente carregado pelo app-shell/adapters/ticker-adapter.js

IMPLEMENTAÇÃO:
1. Verificar quem importa ticker:
   grep -rl "components/ticker" /var/www/dshowdash/public/*/dist/*.bundle.js /var/www/dshowdash/public/*/*/dist/*.bundle.js 2>/dev/null
2. Adicionar ao vite.components.config.js:
   'ticker': {
     entry: 'components/ticker/index.js',
     outDir: 'components/ticker/dist',
     fileName: 'ticker.bundle.js'
   }
3. Build: COMPONENT=ticker
4. fix-paths + node --check
5. Backup index.js + re-export
6. Atualizar o bundle importador

RESULTADO ESPERADO: -6 requests

### FRENTE E — Re-Export Middlemen (9 requests → 0)
9 index.js que são apenas re-exports para dist/bundle.js.
Cada um gera 1 request EXTRA (o browser carrega index.js, que re-exporta do bundle).
Se o CALLER importar direto do bundle, eliminamos 9 requests.

Lista dos middlemen:
1. /assets/js/core/logger-global/index.js → dist/logger-global.bundle.js
2. /assets/js/core/telemetry-core/index.js → dist/telemetry-core.bundle.js
3. /components/security/csrf-token-manager/index.js → dist/csrf-token-manager.bundle.js
4. /components/session-manager/index.js → dist/session-manager.bundle.js
5. /components/toast/service/index.js → dist/toast-service.bundle.js
6. /core/js/enterprise-loader/index.js → dist/enterprise-loader.bundle.js
7. /core/js/event-bus/index.js → dist/event-bus.bundle.js
8. /core/kernel/ui/index.js → dist/kernel-ui.bundle.js
9. /core/kernel/index.js → dist/kernel.bundle.js

IMPLEMENTAÇÃO:
Esses são importados por OUTROS BUNDLES (não pelo bootstrap).
Para cada middleman:
1. Encontrar quais bundles o importam:
   grep -rl "logger-global/index.js" /var/www/dshowdash/public/*/dist/*.bundle.js 2>/dev/null
2. Usar o events-direct-imports.js como modelo: criar middlemen-direct-imports.js
   que substitui `/X/index.js` por `/X/dist/X.bundle.js` em todos os bundles
3. Aplicar em todos os bundles

SCRIPT: /var/www/dshowdash/public/scripts/middlemen-direct-imports.js
Mapeamento:
```
'/assets/js/core/logger-global/index.js' → '/assets/js/core/logger-global/dist/logger-global.bundle.js'
'/assets/js/core/telemetry-core/index.js' → '/assets/js/core/telemetry-core/dist/telemetry-core.bundle.js'
'/components/security/csrf-token-manager/index.js' → '/components/security/csrf-token-manager/dist/csrf-token-manager.bundle.js'
'/components/session-manager/index.js' → '/components/session-manager/dist/session-manager.bundle.js'
'/components/toast/service/index.js' → '/components/toast/service/dist/toast-service.bundle.js'
'/core/js/enterprise-loader/index.js' → '/core/js/enterprise-loader/dist/enterprise-loader.bundle.js'
'/core/js/event-bus/index.js' → '/core/js/event-bus/dist/event-bus.bundle.js'
'/core/kernel/ui/index.js' → '/core/kernel/ui/dist/kernel-ui.bundle.js'
'/core/kernel/index.js' → '/core/kernel/dist/kernel.bundle.js'
```

RESULTADO ESPERADO: -9 requests

### FRENTE F — Singletons Restantes via Bootstrap Direct (5+ requests → 0)
Singletons que o bootstrap importa mas NÃO são bundlados e NÃO valem bundle próprio.
Alguns podem ser incluídos em bundles existentes via re-processing.

Lista:
1. /app/events/index.js (36 linhas, re-exports de events) — eliminar via events-direct
2. /app/router/contracts.js — importado pelo bootstrap como static, NÃO está no app-router bundle
3. /components/router/state/store.js — vazou do app-router
4. /components/app-shell/adapters/ticker-adapter.js — vazou do app-shell bundle
5. /components/header/core/navigation-adapter.js — vazou do header bundle
6. /components/header/utils/overlay-root.js — vazou do header bundle
7. /components/_shared/permissions/integration.js — tem dist/ mas ainda carrega index

Para 2-6: são singletons que vazaram de bundles existentes.
Para cada um, verificar se o bundle pai os inclui ou se ficaram como external.
Se ficaram external: rebuild o bundle pai incluindo-os.
Se foram carregados por OUTRO módulo: adicionar ao script de direct-imports.

IMPLEMENTAÇÃO:
1. Para cada singleton, verificar quem importa e se deve ser internalizado no bundle pai
2. Se simples (re-export ou 4 linhas): adicionar ao middlemen-direct-imports
3. Se vazou de bundle: rebuild com correção

RESULTADO ESPERADO: -5 a -7 requests

## 3. Ordem de Execução

### ONDA 1 — Scripts de Post-Processing (paralelo):
- Task 1: Criar events-direct-imports.js
- Task 2: Criar middlemen-direct-imports.js

### ONDA 2 — Bundles Novos (paralelo):
- Task 3: Router Registry fix (rebuild app-router ou bundle separado)
- Task 4: Panel-Home bundle
- Task 5: Ticker bundle

### ONDA 3 — Aplicar Post-Processing (sequencial):
1. Aplicar events-direct-imports em TODOS os bundles
2. Aplicar middlemen-direct-imports em TODOS os bundles
3. Tratar singletons restantes (Frente F)
4. node --check em TODOS os bundles modificados
5. Validar

## 4. Regras Operacionais

1. SEMPRE backup para /backup ANTES de alterar qualquer arquivo
2. NUNCA use sed/patch parcial — reescreva arquivos inteiros via cat << 'EOF'
3. NUNCA restaure de backup — corrija o arquivo atual
4. Post-processing: rode fix-bundle-paths.js após cada build Vite
5. Valide syntax com node --check após cada build e após cada post-processing
6. BOOTSTRAP é CRÍTICO — backup extra, validação imediata
7. Credenciais: Jhony / <SENHA-REMOVIDA-P1-01>
8. URL: https://dshowdash.com.br
9. Não minificar, não remover fontes
10. Nunca liste conteúdo de pastas com "react" no nome
11. Para components: usar vite.components.config.js com COMPONENT=
12. Para core/platform: usar vite.lote3bc.config.js com TARGET=

## 5. Projeção

| Frente | Antes | Depois | Eliminados |
|--------|-------|--------|------------|
| A: Events catalog | 40 | 0 | -40 |
| B: Router registry | 12 | 1 | -11 |
| C: Panel-Home | 10 | 1 | -9 |
| D: Ticker | 7 | 1 | -6 |
| E: Re-export middlemen | 9 | 0 | -9 |
| F: Singletons | ~6 | 0 | ~-6 |
| **Total** | **~84** | **~3** | **~-81** |

Pós Lote 10: JS ~75, CSS ~36, Total ~111
Acumulado: ~580 → ~111 = **~-81% redução**

## 6. Arquivos de Referência

- Config componentes: /var/www/dshowdash/public/components/vite.components.config.js
- Config core: /var/www/dshowdash/public/vite.lote3bc.config.js
- Bootstrap: /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js
- Bootstrap direct imports: /var/www/dshowdash/public/scripts/bootstrap-direct-imports.js
- Fix paths: /var/www/dshowdash/public/scripts/fix-bundle-paths.js
- Events direct imports: /var/www/dshowdash/public/scripts/events-direct-imports.js (CRIAR)
- Middlemen direct imports: /var/www/dshowdash/public/scripts/middlemen-direct-imports.js (CRIAR)

## 7. Lista COMPLETA de Bundles Existentes (para post-processing)

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
```

## 8. Rollback

Cada bundle tem backup em /backup/ com timestamp.
Bootstrap: /backup/bootstrap.bundle.js.bak-lote9 (último)
Para rollback total: restaurar TODOS os bundles dos backups pre-lote10.
