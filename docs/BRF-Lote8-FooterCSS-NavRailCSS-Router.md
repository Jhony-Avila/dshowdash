# BRIEFING — Lote 8: Footer CSS + Nav-Rail CSS + Router Bundle

## 1. Estado Atual

| Métrica | Valor |
|---------|-------|
| JS Total | 127 requests |
| CSS Total | 69 requests |
| TOTAL | 196 requests |

## 2. Alvos — 3 Frentes

### ALVO A — Footer CSS Bundle (31 requests → 1)

O footer carrega:
- /components/footer/styles: 15 CSS (14 partials + 1 index.css barrel)
- /components/footer/components: 16 CSS (component.css de vários sub-componentes)
Total: 31 CSS requests

NOTA: O footer tem ~160 CSS files no disco (buttons/*/styles/, icons/*/styles/, etc.)
mas apenas 31 carregam no browser. Bundlar apenas os 31 que carregam.

IMPLEMENTAÇÃO:
1. Diagnosticar como o footer carrega CSS:
   grep -n "\.css\|stylesheet\|link" /var/www/dshowdash/public/components/footer/dist/footer.bundle.js | head -20
2. Verificar se footer/styles/index.css é barrel com @import:
   cat /var/www/dshowdash/public/components/footer/styles/index.css
3. Para footer/styles (15 files):
   - Se index.css é barrel: concatenar na ordem do barrel
   - Gerar /components/footer/styles/dist/footer-styles.bundle.css
   - Substituir index.css com @import do bundle
4. Para footer/components CSS (16 files):
   - São carregados dinamicamente pelo JS (como header components)
   - Grep no footer.bundle.js para entender o pattern de carregamento CSS
   - Concatenar todos os component.css → /components/footer/components/dist/footer-components.bundle.css
   - Alterar o loader CSS no footer source, rebuild footer bundle
   OU: Carregar o bundle CSS no mount do footer (injetar <link> antes dos componentes)
5. Validar visual no browser

### ALVO B — Nav-Rail CSS Bundle (6 requests → 1)

6 CSS files em /components/nav-rail/styles/:
- index.css (barrel), tokens.css, base.css, components.css, groups.css, responsive.css

IMPLEMENTAÇÃO:
1. cat /var/www/dshowdash/public/components/nav-rail/styles/index.css para ver ordem de @import
2. Concatenar na ordem → /components/nav-rail/styles/dist/nav-rail-styles.bundle.css
3. Backup index.css → /backup
4. Substituir index.css com @import do bundle
5. Validar

### ALVO C — Router Bundle (10 requests → 2)

O router tem 2 partes:
- /app/router/ (entry point, 10 files): index.js, ports.js, navigation-controller.js, circuit-breaker.js, navigation.js, integrations.js, contracts.js, etc.
- /components/router/ (library, ~65 files): core/, registry/, state/, telemetry/, etc.

Bootstrap carrega via: import("/app/router/index.js")

/app/router/ imports de /components/router/:
- core/guard.js, core/history.js, core/parser.js, core/resolver.js, core/transitions.js
- hooks/index.js, registry/routes.js, registry/validation.js
- state/store.js, telemetry/tracker.js

/app/router/ imports de outros externals:
- /app/events/index.js
- /core/runtime/events/catalog/*.events.js (3 files)
- /core/runtime/ports-profiles.js

ESTRATÉGIA: Bundlar /app/router/ com /components/router/ como INTERNO.
Isso requer que o entry point inclua ambos os diretórios como internos.

IMPLEMENTAÇÃO:
1. Adicionar 'app-router' ao vite.lote3bc.config.js:
   'app-router': {
     entry: 'app/router/index.js',
     outDir: 'app/router/dist',
     fileName: 'app-router.bundle.js',
     internalPrefix: '/app/router/'
   }
   PROBLEMA: /components/router/ seria tratado como external pelo prefix /components/.
   SOLUÇÃO: Usar internalPrefixes (array) em vez de internalPrefix:
   internalPrefixes: ['/app/router/', '/components/router/']
   OU: Adicionar lógica especial no config para o router.

2. ALTERNATIVA MAIS SIMPLES: Alterar o isExternal no vite.lote3bc.config.js
   para suportar múltiplos prefixos internos via array:
   Se target.internalPrefix é array: checar contra todos
   Se target.internalPrefix é string: checar contra 1

3. Configuração:
   'app-router': {
     entry: 'app/router/index.js',
     outDir: 'app/router/dist',
     fileName: 'app-router.bundle.js',
     internalPrefix: ['/app/router/', '/components/router/']
   }

4. Build: TARGET=app-router npx vite build --config vite.lote3bc.config.js
5. fix-paths + node --check
6. Backup /app/router/index.js → /backup
7. Re-export no index.js
8. Adicionar ao bootstrap-direct-imports.js
9. Aplicar no bootstrap
10. Validar

ATENÇÃO: /app/router/contracts.js é importado pelo bootstrap como static import:
  from "/app/router/contracts.js"
Verificar se está na lista e se precisa de re-export separado ou se fica no bundle.
Se o bootstrap importa contracts.js diretamente (não via index.js), precisa de re-export.

VERIFICAR: grep "app/router/contracts" no bootstrap bundle.

## 3. Ordem de Execução

### FASE 1 — Alvo B: Nav-Rail CSS (baixo risco, -5 requests)
Mais simples — padrão já estabelecido.

### FASE 2 — Alvo A: Footer CSS (médio risco, -30 requests)
Mais impactante em CSS. Requer diagnóstico do loader.

### FASE 3 — Alvo C: Router Bundle (médio risco, -8 requests)
Requer mudança no config para suportar múltiplos prefixos internos.

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
11. Nunca liste conteúdo de pastas com "react" no nome

## 5. Projeção

| Alvo | Tipo | Antes | Depois | Eliminados |
|------|------|-------|--------|------------|
| Nav-Rail CSS | CSS | 6 | 1 | -5 |
| Footer CSS | CSS | 31 | 1 | -30 |
| Router JS | JS | 10 | 2 | -8 |
| **Total** | | **47** | **4** | **-43** |

Pós Lote 8: JS ~119, CSS ~34, Total ~153
Acumulado Lotes 1-8: ~580 → ~153 = -74% redução

## 6. Arquivos de Referência

- Config componentes: /var/www/dshowdash/public/components/vite.components.config.js
- Config core: /var/www/dshowdash/public/vite.lote3bc.config.js
- Bootstrap: /var/www/dshowdash/public/bootstrap-v2/dist/bootstrap.bundle.js
- Bootstrap direct imports: /var/www/dshowdash/public/scripts/bootstrap-direct-imports.js
- Fix paths: /var/www/dshowdash/public/scripts/fix-bundle-paths.js
- Footer bundle: /var/www/dshowdash/public/components/footer/dist/footer.bundle.js
- Footer styles: /var/www/dshowdash/public/components/footer/styles/
- Nav-Rail styles: /var/www/dshowdash/public/components/nav-rail/styles/
- App router: /var/www/dshowdash/public/app/router/
- Components router: /var/www/dshowdash/public/components/router/

## 7. Rollback

- Nav-Rail CSS: /backup/ nav-rail styles index.css
- Footer CSS: /backup/ footer styles + rebuild footer bundle
- Router: /backup/ app/router/index.js + bootstrap backup
- Bootstrap: /backup/bootstrap-v2__dist__bootstrap.bundle.js.bak_TIMESTAMP
