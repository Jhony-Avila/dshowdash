# BRIEFING — Lote 9: MEGA Bundle Paralelo (6 alvos simultâneos)

## 1. Estado Atual

| Métrica | Valor |
|---------|-------|
| JS Total | 159 requests |
| CSS Total | 36 requests |
| TOTAL | 195 requests |

## 2. Instrução de Execução Paralela

USE SUB-AGENTES (Task tool) para executar múltiplos alvos EM PARALELO.
Organize em 2 ondas:

ONDA 1 (paralela — 4 alvos independentes):
- Task 1: Alvo A — components/main bundle
- Task 2: Alvo B — components/overlay-layer bundle
- Task 3: Alvo C — core/ui-orchestrator bundle
- Task 4: Alvo D — platform/runtime + platform/shell bundles

ONDA 2 (sequencial — pós bundles, depende da Onda 1):
- Alvo E: Atualizar bootstrap-direct-imports.js com TODOS os novos mapeamentos
- Alvo F: Aplicar no bootstrap bundle + validar

## 3. Alvos — Detalhes

### ALVO A — components/main Bundle (39 requests → 2)
MAIOR ALVO. 789 files JS.
Entry: /components/main/index.js
Bootstrap carrega via: import("/components/main/index.js") + 4 sub-paths diretos:
  import("/components/main/ui/container-main/index.js")
  import("/components/main/ui/container-main/utils/features-integration/index.js")
  import("/components/main/ui/container-main/utils/features-toolbar/index.js")
  import("/components/main/ui/container-main/utils/toolbar-wiring.js")

ATENÇÃO: O bootstrap importa 5 paths do main. Precisa decidir:
- Opção 1: Bundlar TUDO em 1 mega-bundle. Os 4 sub-paths ficam como keepExternal
  e recebem re-exports individuais apontando para o bundle.
- Opção 2: Bundlar index.js e sub-paths ficam fora (mas eles puxam sub-módulos)

RECOMENDAÇÃO: Opção 1 — mega-bundle com TUDO.
Os 4 sub-paths que o bootstrap importa diretamente devem ter re-exports:
  export * from '../../dist/main.bundle.js'; // ou path relativo correto
Assim o bootstrap pode importar de qualquer path e tudo resolve no mesmo bundle.

IMPLEMENTAÇÃO:
1. Adicionar ao vite.components.config.js:
   'main': {
     entry: 'components/main/index.js',
     outDir: 'components/main/dist',
     fileName: 'main.bundle.js',
     keepExternal: [] // nenhum — tudo é interno
   }
2. Build: COMPONENT=main
3. fix-paths + node --check
4. Backup index.js + criar re-export
5. Criar re-exports nos 4 sub-paths importados pelo bootstrap:
   - components/main/ui/container-main/index.js
   - components/main/ui/container-main/utils/features-integration/index.js
   - components/main/ui/container-main/utils/features-toolbar/index.js
   - components/main/ui/container-main/utils/toolbar-wiring.js
   Cada um: backup + re-export apontando para ../../../dist/main.bundle.js (ajustar path)
6. VERIFICAR: se o bundle tem dynamic imports leaking (variableDynamicImportRuntimeHelper)

### ALVO B — components/overlay-layer Bundle (? requests → 2)
157 files JS. Provavelmente carrega lazy.
Entry: /components/overlay-layer/index.js
Bootstrap: import("/components/overlay-layer/index.js")

IMPLEMENTAÇÃO:
1. Verificar imports externos: grep -roh "from '/[^']*'" no index.js
2. Adicionar ao vite.components.config.js:
   'overlay-layer': {
     entry: 'components/overlay-layer/index.js',
     outDir: 'components/overlay-layer/dist',
     fileName: 'overlay-layer.bundle.js'
   }
3. Build: COMPONENT=overlay-layer
4. fix-paths + node --check
5. Backup + re-export

### ALVO C — core/ui-orchestrator Bundle (? requests → 2)
41 files JS.
Entry: /core/ui-orchestrator/index.js
Bootstrap: import("/core/ui-orchestrator/index.js")

IMPLEMENTAÇÃO:
1. Verificar imports externos
2. Adicionar ao vite.lote3bc.config.js:
   'ui-orchestrator': {
     entry: 'core/ui-orchestrator/index.js',
     outDir: 'core/ui-orchestrator/dist',
     fileName: 'ui-orchestrator.bundle.js',
     internalPrefix: '/core/ui-orchestrator/'
   }
3. Build: TARGET=ui-orchestrator
4. fix-paths + node --check
5. Backup + re-export

### ALVO D — platform/runtime + platform/shell (? requests → 2+2)
platform/runtime: 10 files JS. Entry: /platform/runtime/index.js
platform/shell: 5 files JS. Entry: /platform/shell/index.js
Bootstrap: import("/platform/runtime/index.js") + import("/platform/shell/index.js")

ATENÇÃO: /platform/shell/layout-regions.js é importado por MUITOS bundles como external.
NÃO incluir layout-regions.js no bundle do shell — deve ficar como keepExternal.

IMPLEMENTAÇÃO platform/runtime:
1. Adicionar ao vite.lote3bc.config.js:
   'platform-runtime': {
     entry: 'platform/runtime/index.js',
     outDir: 'platform/runtime/dist',
     fileName: 'platform-runtime.bundle.js',
     internalPrefix: '/platform/runtime/'
   }
2. Build: TARGET=platform-runtime
3. fix-paths + node --check + backup + re-export

IMPLEMENTAÇÃO platform/shell:
1. Adicionar ao vite.lote3bc.config.js:
   'platform-shell': {
     entry: 'platform/shell/index.js',
     outDir: 'platform/shell/dist',
     fileName: 'platform-shell.bundle.js',
     internalPrefix: '/platform/shell/',
     keepExternal: ['/platform/shell/layout-regions.js']
   }
   NOTA: Verificar se vite.lote3bc.config.js suporta keepExternal. Se não, adicionar suporte.
2. Build: TARGET=platform-shell
3. fix-paths + node --check + backup + re-export

### ALVO E — Atualizar bootstrap-direct-imports.js
Adicionar TODOS os novos mapeamentos ao script:
  '/components/main/index.js' → '/components/main/dist/main.bundle.js'
  '/components/main/ui/container-main/index.js' → '/components/main/dist/main.bundle.js'
  '/components/main/ui/container-main/utils/features-integration/index.js' → '/components/main/dist/main.bundle.js'
  '/components/main/ui/container-main/utils/features-toolbar/index.js' → '/components/main/dist/main.bundle.js'
  '/components/main/ui/container-main/utils/toolbar-wiring.js' → '/components/main/dist/main.bundle.js'
  '/components/overlay-layer/index.js' → '/components/overlay-layer/dist/overlay-layer.bundle.js'
  '/core/ui-orchestrator/index.js' → '/core/ui-orchestrator/dist/ui-orchestrator.bundle.js'
  '/platform/runtime/index.js' → '/platform/runtime/dist/platform-runtime.bundle.js'
  '/platform/shell/index.js' → '/platform/shell/dist/platform-shell.bundle.js'

### ALVO F — Aplicar no Bootstrap
1. Backup extra do bootstrap
2. Aplicar: node bootstrap-direct-imports.js no bootstrap bundle
3. node --check bootstrap
4. Validar

## 4. Regras Operacionais

1. SEMPRE backup para /backup ANTES de alterar qualquer arquivo
2. NUNCA use sed/patch parcial — reescreva arquivos inteiros via cat << 'EOF'
3. NUNCA restaure de backup — corrija o arquivo atual
4. Post-processing: rode /var/www/dshowdash/public/scripts/fix-bundle-paths.js após cada build
5. Valide syntax com node --check após cada build
6. BOOTSTRAP é CRÍTICO — backup extra, validação imediata
7. Credenciais: Jhony / <SENHA-REMOVIDA-P1-01>
8. URL: https://dshowdash.com.br
9. Não minificar, não remover fontes
10. Nunca liste conteúdo de pastas com "react" no nome
11. Para components: usar vite.components.config.js com COMPONENT=
12. Para core/platform: usar vite.lote3bc.config.js com TARGET=

## 5. Projeção

| Alvo | Antes | Depois | Eliminados |
|------|-------|--------|------------|
| main | 39 | 2 | -37 |
| overlay-layer | ~? | 2 | ~-? |
| ui-orchestrator | ~? | 2 | ~-? |
| platform/runtime | ~? | 2 | ~-? |
| platform/shell | ~? | 2 | ~-? |
| bootstrap direct | ~9 | 0 | -9 |
| **Total estimado** | | | **~-50+** |

Pós Lote 9 estimado: JS ~109, CSS ~36, Total ~145
Acumulado: ~580 → ~145 = ~-75%

## 6. Arquivos de Referência

- Config componentes: /var/www/dshowdash/public/components/vite.components.config.js
- Config core: /var/www/dshowdash/public/vite.lote3bc.config.js
- Bootstrap: /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js
- Bootstrap direct imports: /var/www/dshowdash/public/scripts/bootstrap-direct-imports.js
- Fix paths: /var/www/dshowdash/public/scripts/fix-bundle-paths.js
- Build componentes: /var/www/dshowdash/public/components/build-components.sh

## 7. Rollback

Cada alvo tem rollback independente via /backup.
Bootstrap: /backup/bootstrap-v2__dist__bootstrap.bundle.js.bak_TIMESTAMP