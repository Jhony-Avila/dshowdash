# BRIEFING — Lote 4: Bundle Optimization (JS + CSS)

## 1. Estado Atual (pós Lotes 1-3 + app-shell)

| Métrica    | Valor  |
|------------|--------|
| JS Total   | 144 requests |
| CSS Total  | 96 requests  |
| **TOTAL**  | **240 requests** |

Baseline original: ~484 JS. Já eliminados: ~340 JS requests via Lotes 1-3.

## 2. Maiores Gargalos JS (144 requests)

| Domínio                          | Requests | Ação                    |
|----------------------------------|----------|-------------------------|
| /core/runtime/events             | 26       | Re-exports (não reduz)  |
| /components/header/*             | 13       | BUNDLAR                 |
| /components/layout-manager/*     | 12       | BUNDLAR                 |
| /assets/js/core                  | 11       | Investigar restantes    |
| /core/kernel/ui                  | 8        | BUNDLAR                 |
| /core/js/enterprise-loader       | 7        | BUNDLAR                 |
| /core/auth/* (fora do bundle)    | 7        | Investigar re-exports   |
| /core/runtime/* (fora do bundle) | 10       | Investigar re-exports   |
| /core/js/*                       | 6        | BUNDLAR                 |
| Singletons (1-2 cada)            | ~34      | Não bundlável           |

### Alvos Bundláveis JS (5 alvos, ~51 requests → ~10)

#### 2A — header (13 requests → 2)
- Entry: /components/header/index.js
- Subdiretórios: core(8), telemetry(2), utils(1), state(1), api(1)
- Output: /components/header/dist/header.bundle.js
- Config: Adicionar ao vite.components.config.js
- ATENÇÃO: Verificar se bootstrap carrega via index.js ou paths diretos

#### 2B — layout-manager (12 requests → 2)
- Entry: /components/layout-manager/index.js
- Subdiretórios: core(4), integrations(3), state(1), utils(1), telemetry(1), handlers(1)
- Output: /components/layout-manager/dist/layout-manager.bundle.js
- Config: Adicionar ao vite.components.config.js

#### 2C — core/kernel/ui (8 requests → 2)
- Entry: Precisa de diagnóstico — pode não ter index.js
- Provavelmente: criar barrel (_entry.js) que importa todos os 8 files
- Output: /core/kernel/ui/dist/kernel-ui.bundle.js
- Config: Adicionar ao vite.lote3bc.config.js (domínio core)
- ATENÇÃO: Verificar se são importados individualmente pelo bootstrap

#### 2D — core/js/enterprise-loader (7 requests → 2)
- Entry: Precisa de diagnóstico
- Provavelmente: /core/js/enterprise-loader/index.js ou barrel
- Output: /core/js/enterprise-loader/dist/enterprise-loader.bundle.js
- Config: Adicionar ao vite.lote3bc.config.js

#### 2E — core/js restantes (6 requests)
- ready-flags(1), event-bus(2), asset-loader(2), EnterpriseLoader.js(1), AssetLoader.js(1)
- event-bus e asset-loader JÁ ESTÃO BUNDLADOS (index.js + dist = 2 cada)
- ready-flags, EnterpriseLoader.js, AssetLoader.js são singletons legados
- AÇÃO: Verificar se EnterpriseLoader.js e AssetLoader.js são wrappers legados que podem ser re-exports

## 3. Maiores Gargalos CSS (96 requests)

| Domínio                              | Requests | Ação            |
|--------------------------------------|----------|-----------------|
| /components/app-shell/styles         | 35       | BUNDLAR CSS     |
| /components/modal-manager-global     | 9        | BUNDLAR CSS     |
| /components/login-modal/styles       | 9        | BUNDLAR CSS     |
| /components/preloader/styles         | 5        | BUNDLAR CSS     |
| /assets/css/design-system            | 4        | BUNDLAR CSS     |
| /assets/css/panels-sane.*            | 7        | BUNDLAR CSS     |
| /assets/css/theme.*                  | 6        | BUNDLAR CSS     |
| /assets/css/layout.*                 | 7        | BUNDLAR CSS     |
| /assets/css/tokens                   | 2        | Incluir no tema |
| Singletons (1 cada)                  | ~12      | Não bundlável   |

### Alvos Bundláveis CSS (8 alvos, ~83 requests → ~8)

#### 3A — app-shell/styles (35 → 1)
- Maior alvo CSS. Inclui styles/ raiz (8 files) + panel-ui/ (27 files)
- Entry: /components/app-shell/styles/index.css (já existe como barrel?)
- Técnica: Vite CSS-only build ou cat concatenation com @import resolver
- ATENÇÃO: Ordem de @import importa para CSS cascata

#### 3B — modal-manager-global/styles (9 → 1)
- Entry: styles.css + 8 sub-files em styles/
- Técnica: Mesma do 3A

#### 3C — login-modal/styles (9 → 1)
- styles.css + 8 sub-files em styles/
- Técnica: Mesma do 3A

#### 3D — preloader/styles (5 → 1)
- 5 files em styles/
- Técnica: Mesma do 3A

#### 3E — assets/css/design-system (4 → 1)
- 4 files no design system
- Técnica: CSS concatenation

#### 3F — assets/css/panels-sane.* (7 → 1)
- panels-sane.css + 6 variantes (.tokens, .responsive, .states, .scrollbar, .specifics, .base)
- Técnica: CSS concatenation na ordem correta

#### 3G — assets/css/theme.* (6 → 1)
- theme.css + 5 variantes (.utilities, .reset, .tokens, .keyframes, .typography)
- Técnica: CSS concatenation

#### 3H — assets/css/layout.* (7 → 1)
- layout.css + 6 variantes (.toasts, .footer, .cards, .loading, .base, .utilities, .responsive)
- Técnica: CSS concatenation

## 4. Infraestrutura Existente

### Configs Vite
- `/var/www/dshowdash/public/components/vite.components.config.js` — paramétrico, COMPONENT env var
- `/var/www/dshowdash/public/vite.lote3bc.config.js` — paramétrico, TARGET env var

### Build Scripts
- `/var/www/dshowdash/public/components/build-components.sh` — componentes
- `/var/www/dshowdash/public/build-lote3bc.sh` — core/assets/modules

### Post-Processing
- `/tmp/fix-paths.js` — corrige paths relativos em bundles (PRECISA SER PERMANENTE)
- Padrão: build → fix-paths → node --check → integrar re-export

### Padrão de Entry para Módulos já Bundlados
- Módulos cujo index.js já é re-export: usar `_entry.js` como entry point do Vite
- _entry.js re-exporta do `.bak.pre-bundle` (fonte original) preservado em /backup

## 5. Ordem de Execução

### FASE 1 — Diagnóstico (ANTES de qualquer build)
Para cada alvo JS (2A-2E):
1. Confirmar entry point (index.js ou barrel necessário)
2. Mapear imports externos
3. Verificar se é carregado via index.js ou paths diretos
4. Para header: verificar se bootstrap importa sub-paths diretamente

Para cada alvo CSS (3A-3H):
1. Listar arquivos na ordem de @import
2. Verificar se existe barrel (index.css com @import)
3. Mapear dependências entre CSS files

### FASE 2 — JS Bundles (5 alvos)
Ordem: header → layout-manager → kernel/ui → enterprise-loader → core/js legados
Para cada:
1. Adicionar ao config Vite (components ou lote3bc)
2. Build + node --check
3. fix-paths.js
4. Backup index.js → /backup
5. Criar re-export
6. Validar no browser (count requests)

### FASE 3 — CSS Bundles (8 alvos)
Ordem: app-shell/styles → modal-manager → login-modal → preloader → design-system → panels-sane → theme → layout
Técnica recomendada: 
- Para componentes com index.css: Vite CSS-only build
- Para assets/css/*: cat concatenation com ordem preservada
Para cada:
1. Criar CSS bundle (concatenação ou Vite)
2. Verificar cascata (ordem importa!)
3. Backup original → /backup
4. Substituir barrel CSS com @import do bundle
5. Validar visual no browser

### FASE 4 — Permanentizar fix-paths.js
1. Mover /tmp/fix-paths.js → /var/www/dshowdash/public/scripts/fix-bundle-paths.js
2. Integrar nos build scripts (build-components.sh e build-lote3bc.sh)
3. Testar rebuild de um bundle existente para confirmar pipeline completo

## 6. Projeção de Resultados

| Fase  | Antes | Depois | Eliminados |
|-------|-------|--------|------------|
| JS    | 144   | ~95    | ~-49       |
| CSS   | 96    | ~20    | ~-76       |
| **Total** | **240** | **~115** | **~-125** |

Combinado com Lotes 1-3: **~484 → ~115 requests** = **-76% redução total**

## 7. Regras Operacionais

1. SEMPRE fazer backup para /backup ANTES de alterar qualquer arquivo
2. NUNCA usar sed/patch parcial — reescrever arquivo inteiro via cat << 'EOF'
3. NUNCA restaurar de backup — corrigir o arquivo atual
4. Validar syntax com node --check após cada build JS
5. Validar visual no browser após cada integração CSS
6. Manter externals: tudo fora do componente/módulo é external
7. Post-processing obrigatório: fix-paths.js após cada build Vite
8. Não minificar bundles
9. Não alterar bundles existentes dos lotes anteriores
10. Não remover arquivos fonte originais
11. Credenciais - Usuário: Jhony / Senha: <SENHA-REMOVIDA-P1-01>

## 8. Rollback

Cada bundle tem rollback independente:
- JS: Restaurar index.js do /backup (o bundle é artefato, fontes intactas)
- CSS: Restaurar barrel CSS do /backup

## 9. Arquivos de Referência

- Config componentes: /var/www/dshowdash/public/components/vite.components.config.js
- Config core: /var/www/dshowdash/public/vite.lote3bc.config.js
- Build componentes: /var/www/dshowdash/public/components/build-components.sh
- Build core: /var/www/dshowdash/public/build-lote3bc.sh
- Fix paths: /tmp/fix-paths.js (MOVER para scripts/)
- Backups: /backup/
