# BRIEFING — Lote 6: Sidebar Bundle + Header Components CSS

## 1. Estado Atual

| Métrica | Valor |
|---------|-------|
| JS Total | 148 requests |
| CSS Total | 54 requests |
| TOTAL | 202 requests |

## 2. Alvos

### ALVO A — Sidebar JS Bundle (43 requests → 2)

O sidebar é o maior gargalo JS restante com 43 requests:
- core: 9, features: 18, api: 3, kernel: 3, telemetry: 2,
  registry: 1, domain: 1, integration: 1, lifecycle: 1, metrics: 1,
  diagnostics: 1, sidebar.js: 1, factory.js: 1, index.js: 1

Estrutura: 139 files JS em 16 subdiretórios.
Entry: /components/sidebar/index.js (NÃO é re-export, é source original)
Bootstrap carrega via: import("/components/sidebar/index.js")
Imports externos: /core/runtime/ports-profiles.js, /core/runtime/enterprise/strict-mode.js,
/core/runtime/events/catalog/sidebar.events.js

IMPLEMENTAÇÃO:
1. Adicionar 'sidebar' ao /var/www/dshowdash/public/components/vite.components.config.js:
   'sidebar': {
     entry: 'components/sidebar/index.js',
     outDir: 'components/sidebar/dist',
     fileName: 'sidebar.bundle.js'
   }
2. Build: cd /var/www/dshowdash/public/react && COMPONENT=sidebar npx vite build --config ../components/vite.components.config.js
3. Post-process: node /var/www/dshowdash/public/scripts/fix-bundle-paths.js <bundle>
4. Syntax: node --check <bundle>
5. Backup index.js → /backup/components__sidebar__index.js.bak_TIMESTAMP
6. Criar re-export em index.js:
   export * from './dist/sidebar.bundle.js';
   export { default } from './dist/sidebar.bundle.js';
7. Atualizar bootstrap para importar direto do bundle:
   No bootstrap.bundle.js, substituir:
   import("/components/sidebar/index.js") → import("/components/sidebar/dist/sidebar.bundle.js")
   Usar o script: node /var/www/dshowdash/public/scripts/bootstrap-direct-imports.js
   (PRECISA ADICIONAR o mapeamento sidebar ao script)
8. Validar no browser

ATENÇÃO: O sidebar pode ter dynamic imports internos. Se Vite não conseguir
inlineDynamicImports, verificar warnings no build e ajustar.

### ALVO B — Header Components CSS Bundle (23 requests → 1)

23 CSS files em /components/header/components/*/component.css
São carregados dinamicamente pelos componentes do header (cada componente importa seu CSS).

ESTRATÉGIA: Concatenar todos os 23 component.css em 1 bundle CSS.
O loader de CSS do header provavelmente faz algo como:
  link.href = \`/components/header/components/\${name}/component.css\`

IMPLEMENTAÇÃO:
1. Investigar COMO o header carrega os CSS:
   grep -rn "component.css\|\.css" /var/www/dshowdash/public/components/header/core/components-loader.js
   (ou no header.bundle.js)
2. Criar bundle CSS concatenado:
   cat todos os component.css → /components/header/components/dist/header-components.bundle.css
   ORDEM: Não importa muito para CSS de componentes isolados, mas manter ordem alfabética.
   INCLUIR TAMBÉM: _internal/inline-editor CSS (10 files) se carregados
3. Alterar o loader CSS no header source para apontar para o bundle:
   Opção A: Carregar 1 bundle CSS no mount do header (antes dos componentes)
   Opção B: Cada componente verifica se o bundle já foi carregado, se sim, skip CSS individual
4. Rebuild header bundle (COMPONENT=header, usando _entry.js)
5. Validar visual no browser (CSS é sensível a ordem de cascata)

DIAGNÓSTICO NECESSÁRIO PARA ALVO B:
- Verificar se os 10 CSS do _internal/inline-editor são carregados no browser
- Como o header injeta CSS? Via <link>, via import(), via JS injection?
- Se via <link> dinâmico: alterar o path no loader
- Se via import() no JS: já está no bundle JS? Provavelmente não.

## 3. Ordem de Execução

### FASE 1 — Sidebar Bundle (baixo-médio risco, alto impacto: -41 requests)
1. Adicionar sidebar ao vite.components.config.js
2. Build + fix-paths + node --check
3. Backup + re-export
4. Adicionar mapeamento ao bootstrap-direct-imports.js
5. Aplicar no bootstrap bundle
6. Validar no browser
7. Contar requests

### FASE 2 — Header CSS Bundle (médio risco, médio impacto: -22 requests)
1. Diagnosticar como o header carrega CSS (grep no loader source e bundle)
2. Verificar quais CSS são carregados no browser (DevTools)
3. Criar bundle CSS concatenado
4. Alterar loader CSS source
5. Rebuild header bundle
6. Validar visual no browser

## 4. Regras Operacionais

1. SEMPRE backup para /backup ANTES de alterar qualquer arquivo
2. NUNCA use sed/patch parcial — reescreva arquivos inteiros via cat << 'EOF'
3. NUNCA restaure de backup — corrija o arquivo atual
4. Post-processing: rode /var/www/dshowdash/public/scripts/fix-bundle-paths.js após cada build
5. Valide syntax com node --check após cada build
6. BOOTSTRAP é CRÍTICO — validação imediata após alteração
7. Credenciais: Jhony / <SENHA-REMOVIDA-P1-01>
8. URL: https://dshowdash.com.br
9. Não minificar
10. Não remover arquivos fonte
11. Nunca liste conteúdo de pastas com "react" no nome

## 5. Projeção

| Alvo | Antes | Depois | Eliminados |
|------|-------|--------|------------|
| Sidebar JS | 43 | 2 | -41 |
| Header CSS | 23 | 1 | -22 |
| **Total** | **66** | **3** | **-63** |

Pós Lote 6: JS ~107, CSS ~32, Total ~139
Acumulado Lotes 1-6: ~580 → ~139 = -76% redução

## 6. Arquivos de Referência

- Config componentes: /var/www/dshowdash/public/components/vite.components.config.js
- Build componentes: /var/www/dshowdash/public/components/build-components.sh
- Bootstrap bundle: /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js
- Bootstrap direct imports: /var/www/dshowdash/public/scripts/bootstrap-direct-imports.js
- Fix paths: /var/www/dshowdash/public/scripts/fix-bundle-paths.js
- Header loader source: /var/www/dshowdash/public/components/header/core/components-loader.js
- Header _entry.js: /var/www/dshowdash/public/components/header/_entry.js
- Header components _entry.js: /var/www/dshowdash/public/components/header/components/_entry.js
- Manifest: /var/www/dshowdash/public/components/header/components/manifest.json

## 7. Rollback

- Sidebar: restaurar /backup/components__sidebar__index.js.bak_TIMESTAMP
- Header CSS: restaurar loader source do /backup, rebuild header
- Bootstrap: /backup/bootstrap-v2__dist__bootstrap.bundle.js.bak_TIMESTAMP
