# BRIEFING — Lote 7: Nav-Rail + Footer + Sidebar Features Fix

## 1. Estado Atual

| Métrica | Valor |
|---------|-------|
| JS Total | 162 requests |
| CSS Total | 38 requests |
| TOTAL | 200 requests |

## 2. Alvos — 3 Frentes

### ALVO A — Nav-Rail Bundle (44 requests → 2)

O nav-rail é o segundo maior gargalo JS com 44 requests:
- core: 15, components: 9, registry: 8, component: 6, ui: 3, telemetry: 1, ports.js: 1, index.js: 1

Estrutura: 66 files JS.
Entry: /components/nav-rail/index.js (source original, NÃO re-export)
Bootstrap carrega via: import("/components/nav-rail/index.js")
Imports externos: /core/runtime/ports-profiles.js, /core/runtime/enterprise/strict-mode.js

IMPLEMENTAÇÃO:
1. Adicionar 'nav-rail' ao /var/www/dshowdash/public/components/vite.components.config.js:
   'nav-rail': {
     entry: 'components/nav-rail/index.js',
     outDir: 'components/nav-rail/dist',
     fileName: 'nav-rail.bundle.js'
   }
2. Build: cd /var/www/dshowdash/public/react && COMPONENT=nav-rail npx vite build --config ../components/vite.components.config.js
3. fix-bundle-paths.js no bundle
4. node --check
5. Backup index.js → /backup/components__nav-rail__index.js.bak_TIMESTAMP
6. Re-export no index.js
7. Adicionar mapeamento ao bootstrap-direct-imports.js:
   import("/components/nav-rail/index.js") → import("/components/nav-rail/dist/nav-rail.bundle.js")
8. Aplicar no bootstrap bundle
9. node --check bootstrap
10. Validar

ATENÇÃO: O nav-rail pode ter dynamic imports como o sidebar.
Se o build gerar variableDynamicImportRuntimeHelper, os sub-módulos podem vazar.
Verificar com: grep "variableDynamicImport\|import(" no bundle gerado.
Se houver leak, aplicar o mesmo fix do Alvo C.

### ALVO B — Footer Bundle (? requests → 2)

NOTA: O footer tem 805 files JS — é ENORME. Nem todos são carregados no primeiro load.
O footer NÃO apareceu na medição de requests anterior, mas o bootstrap carrega via:
  import("/components/footer/index.js")

DIAGNÓSTICO NECESSÁRIO ANTES DE BUNDLAR:
1. Contar quantos JS requests do footer carregam no browser (DevTools):
   performance.getEntriesByType('resource').filter(r => r.name.includes('/footer/')).length
2. Se for 0-2 requests: talvez o footer ainda não tenha carregado, não é prioridade
3. Se for >5: bundlar vale a pena

IMPLEMENTAÇÃO (se diagnosticado como necessário):
O footer pode ter sub-componentes lazy como o header.
Verificar a estrutura:
  - Se index.js importa tudo estaticamente: bundlar direto
  - Se tem loader dinâmico (como header): criar mega-bundle + alterar loader

1. Verificar: head -30 /components/footer/index.js
2. Verificar dynamic imports: grep -r "import(" /components/footer/index.js /components/footer/core/*.js
3. Se simples: adicionar ao vite.components.config.js e bundlar
4. Se complexo: criar _entry.js + mega-bundle como header

Config:
  'footer': {
    entry: 'components/footer/index.js',
    outDir: 'components/footer/dist',
    fileName: 'footer.bundle.js'
  }

### ALVO C — Sidebar Features Leak Fix (11 requests → 0)

DIAGNÓSTICO: O sidebar bundle JÁ CONTÉM todos os features inline via
variableDynamicImportRuntimeHelper com Promise.resolve(). Mas o Vite helper
ainda gera import() calls com paths relativos que o browser tenta resolver.

EVIDÊNCIA: No bundle linha 8040, o helper mapeia "../features/X.js" → Promise.resolve()
para cada feature. Esses requests NÃO deveriam estar acontecendo se o helper
está resolvendo inline.

POSSÍVEL CAUSA: O path "../features/" é relativo ao bundle em dist/,
então resolve para /components/sidebar/features/ — e o browser faz request
mesmo com Promise.resolve() porque o helper chama import() como fallback.

INVESTIGAÇÃO:
1. Verificar no bundle a implementação do __variableDynamicImportRuntimeHelper:
   grep -A5 "variableDynamicImportRuntimeHelper" no bundle (primeiras linhas)
2. Se o helper tem fallback import(): o fix é substituir o helper por lookup direto
3. Alternativa: o Vite pode gerar chunks separados mesmo com inlineDynamicImports
   — verificar se há files em /components/sidebar/dist/ além do bundle

FIX PROVÁVEL:
O sidebar source usa import() dinâmico com variável:
  const module = await import(\`../features/\${featureId}.js\`);
Isso gera o variableDynamicImportRuntimeHelper no Vite.
Para eliminar: alterar o source da sidebar ANTES do rebuild:
  - Criar barrel features/index.js que exporta tudo por nome
  - No source do loader, substituir import() dinâmico por lookup no barrel:
    import * as AllFeatures from './features/index.js';
    const module = AllFeatures[featureId];
  - Rebuild sidebar bundle

IMPLEMENTAÇÃO:
1. Localizar o source que faz o import() dinâmico de features:
   grep -rn "import.*features/" /components/sidebar/core/*.js /components/sidebar/kernel/*.js
2. Listar todas as features: ls /components/sidebar/features/*.js
3. Criar barrel: /components/sidebar/features/index.js com exports nomeados
4. Alterar o source loader para usar barrel lookup
5. Rebuild sidebar: COMPONENT=sidebar
6. Verificar que o bundle NÃO tem mais variableDynamicImportRuntimeHelper
7. fix-paths + node --check
8. Validar no browser

## 3. Ordem de Execução

### FASE 1 — Alvo A: Nav-Rail Bundle (baixo risco, alto impacto: -42 requests)
Mais seguro e maior ganho. Mesmo padrão do sidebar/header.

### FASE 2 — Alvo C: Sidebar Features Fix (médio risco, médio impacto: -11 requests)
Requer alteração de source + rebuild. Fazer antes do footer que é mais complexo.

### FASE 3 — Alvo B: Footer Bundle (médio-alto risco, impacto variável)
Diagnosticar primeiro. Se footer não carrega muitos requests, pular.
Se carrega: bundlar seguindo o padrão estabelecido.

## 4. Regras Operacionais

1. SEMPRE backup para /backup ANTES de alterar qualquer arquivo
2. NUNCA use sed/patch parcial — reescreva arquivos inteiros via cat << 'EOF'
3. NUNCA restaure de backup — corrija o arquivo atual
4. Post-processing: rode /var/www/dshowdash/public/scripts/fix-bundle-paths.js após cada build
5. Valide syntax com node --check após cada build
6. BOOTSTRAP é CRÍTICO — backup extra, validação imediata
7. Credenciais: Jhony / <SENHA-REMOVIDA-P1-01>
8. URL: https://dshowdash.com.br
9. Não minificar
10. Não remover arquivos fonte
11. Nunca liste conteúdo de pastas com "react" no nome (travamento)

## 5. Projeção

| Alvo | Antes | Depois | Eliminados |
|------|-------|--------|------------|
| Nav-Rail | 44 | 2 | -42 |
| Sidebar Fix | 11 | 0 | -11 |
| Footer | ? | 2 | ? |
| **Total mínimo** | **55** | **4** | **-53** |

Pós Lote 7 (mínimo): JS ~109, CSS ~38, Total ~147
Acumulado Lotes 1-7: ~580 → ~147 = -75% redução

## 6. Arquivos de Referência

- Config componentes: /var/www/dshowdash/public/components/vite.components.config.js
- Bootstrap bundle: /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js
- Bootstrap direct imports: /var/www/dshowdash/public/scripts/bootstrap-direct-imports.js
- Fix paths: /var/www/dshowdash/public/scripts/fix-bundle-paths.js
- Sidebar bundle: /var/www/dshowdash/public/components/sidebar/dist/sidebar.bundle.js
- Sidebar source features loader: verificar /components/sidebar/core/ ou /components/sidebar/kernel/
- Nav-rail index: /components/nav-rail/index.js
- Footer index: /components/footer/index.js

## 7. Rollback

- Nav-Rail: /backup/components__nav-rail__index.js.bak_TIMESTAMP
- Sidebar: /backup/components__sidebar__index.js.bak_TIMESTAMP (source original)
- Footer: /backup/components__footer__index.js.bak_TIMESTAMP
- Bootstrap: /backup/bootstrap-v2__dist__bootstrap.bundle.js.bak_TIMESTAMP
