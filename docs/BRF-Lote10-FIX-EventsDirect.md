# BRIEFING — CORREÇÃO CRÍTICA: Reverter Frente A (events-direct-imports)

## 0. PROTOCOLOS OBRIGATÓRIOS

### Protocolo de Não Restauração
- Arquivos com erro NÃO devem ser restaurados a partir de backup.
- Devem ser CORRIGIDOS no estado atual.
- Backup é REFERÊNCIA, não botão de voltar no tempo.
- "Use o backup para entender. Corrija o arquivo atual. Nunca restaure cegamente."
- Restaurar é regressão disfarçada: perda de correções recentes, quebra de integrações, inconsistência.

### Protocolo Anti-Gambiarras (PAG)
- Toda mudança deve resolver a CAUSA, não contornar o problema.
- Perguntar: "Isso resolve a causa ou só o efeito?"
- Não criar arquivos ponte, wrappers, fallbacks silenciosos.
- Se a solução não pode ser explicada claramente, ela é suspeita.
- Velocidade sem direção gera dívida.

### Protocolo de Correção (Full-File)
- Nenhuma correção sem análise do arquivo inteiro.
- NÃO utilizar sed, perl -pi, apply_patch ou edições parciais.
- Sempre reescrever o arquivo por completo via cat << 'EOF'.
- Correção = arquivo completo, nunca trechos isolados.
- Backup obrigatório ANTES de qualquer alteração.

## 1. Diagnóstico do Problema

### Causa Raiz
A Frente A do Lote 10 criou o script events-direct-imports.js que substituiu
TODAS as referências a `/core/runtime/events/catalog/*.events.js` por
`/core/runtime/dist/runtime.bundle.js` dentro de 29 bundles.

### Por que está errado
Os arquivos events/catalog/*.events.js são SOURCES ORIGINAIS com exports próprios:
```
export const ACTION_EVENTS = Object.freeze({ ... });
export const ACTION_INTENTS = Object.freeze({ ... });
```
Eles NÃO são re-exports do runtime.bundle.js.
O runtime.bundle.js NÃO contém esses named exports (ACTION_EVENTS, etc.).

### Erro exato
```
"The requested module '/core/runtime/dist/runtime.bundle.js' does not
provide an export named 'ACTION_EVENTS'"
```
Isso causa falha na phase-4-main (crítica), tela preta, app não carrega.

### Quantos bundles afetados
29 bundles foram modificados pelo events-direct-imports.js.

## 2. Solução Correta (Enterprise, não gambiarra)

### O que fazer
Criar um script REVERSO que desfaz APENAS as substituições da Frente A.
O script deve restaurar os paths originais `events/catalog/*.events.js`
nos 29 bundles, SEM restaurar backups.

### Por que é enterprise e não gambiarra
- Resolve a CAUSA (paths errados nos bundles)
- Não cria código extra, ponte, ou wrapper
- Usa o mesmo mecanismo de post-processing que já existe
- É reversível e verificável
- Os events/catalog files continuarão sendo carregados individualmente (40 requests)
  mas isso é CORRETO até que uma solução enterprise adequada seja criada

### Script: /var/www/dshowdash/public/scripts/revert-events-direct.js

Lógica do script:
1. Receber path de um bundle como argumento
2. Para cada um dos 40 events, fazer a substituição INVERSA:
   `/core/runtime/dist/runtime.bundle.js` NÃO pode ser substituído cegamente
   porque o runtime.bundle.js é importado legitimamente por alguns bundles.
   
   A FORMA CORRETA é: procurar imports que importam NAMED EXPORTS dos events
   que vieram do runtime.bundle.js e NÃO existem lá.
   
   MAS isso é muito complexo de detectar em texto plano.

   ALTERNATIVA MAIS SEGURA: O script events-direct-imports.js original fez
   substituições de STRING específicas. Precisamos saber EXATAMENTE quais
   strings foram substituídas para revertê-las.

### Estratégia de Reversão

PASSO 1: Ler o script events-direct-imports.js para entender o que ele fez:
  cat /var/www/dshowdash/public/scripts/events-direct-imports.js

PASSO 2: O script substituiu paths como:
  "/core/runtime/events/catalog/action.events.js" → "/core/runtime/dist/runtime.bundle.js"
  "/core/runtime/events/catalog/auth.events.js" → "/core/runtime/dist/runtime.bundle.js"
  ... (40 events)

PASSO 3: Para reverter, NÃO podemos simplesmente trocar runtime.bundle.js → *.events.js
porque não sabemos qual events.js era qual (todos viraram o mesmo path).

PASSO 4: SOLUÇÃO — Usar os BUNDLES EXISTENTES (estado atual) + BACKUPS como REFERÊNCIA
para identificar quais imports cada bundle tinha originalmente:

Para CADA um dos 29 bundles afetados:
a) Verificar se existe backup pré-Lote 10 em /backup/
b) Comparar: no backup, quais events/catalog imports existiam?
c) Nos imports atuais, onde está runtime.bundle.js que ANTES era um events/catalog?
d) Restaurar apenas os PATHS (strings), não o arquivo inteiro

MAS ATENÇÃO: Isso é complexo demais para fazer manualmente em 29 bundles.

### SOLUÇÃO PRAGMÁTICA E CORRETA

A forma mais segura e enterprise de resolver:

1. Verificar quais bundles foram REBUILDS (Vite) no Lote 10
   — esses bundles foram reconstruídos do SOURCE, então o Vite usou os paths
   dos sources originais que AINDA apontam para events/catalog/*.events.js
   — O problema é que o events-direct-imports.js foi aplicado DEPOIS do build

2. Para bundles que foram APENAS pós-processados (não rebuilds):
   — O events-direct-imports.js MODIFICOU os paths dentro do bundle
   — Precisamos reverter essas modificações

3. A MELHOR SOLUÇÃO: Re-executar o build de cada bundle afetado SEM aplicar
   events-direct-imports.js depois. Isso restaura os paths corretos do source.
   Mas NEM todos os bundles foram builds — alguns só tiveram pós-processamento.

### DECISÃO FINAL — ABORDAGEM EM 2 ETAPAS

ETAPA 1 — Identificar e categorizar os 29 bundles:
- Quais foram REBUILD no Lote 10? (app-router, panel-home, ticker, app-shell)
  → Para esses: rebuild sem events-direct → resolve
- Quais foram APENAS pós-processados?
  → Para esses: criar script reverso usando o backup como referência para mapear os paths

ETAPA 2 — Para CADA bundle pós-processado:
1. Ler o backup (REFERÊNCIA APENAS)
2. Extrair os imports de events/catalog que existiam: 
   grep -oh "events/catalog/[^\"']*" backup_file
3. No arquivo atual, encontrar onde esses imports foram trocados por runtime.bundle.js
4. O contexto ao redor (variáveis importadas, from clause) indica qual events file era
5. Substituir de volta

## 3. Implementação

### FASE 1 — Diagnóstico completo (OBRIGATÓRIO antes de qualquer ação)

Executar para cada um dos 29 bundles:
1. Identificar se foi rebuild ou só pós-processado no Lote 10
2. Contar quantas vezes "runtime.bundle.js" aparece (legítimo + errado)
3. Comparar com backup para saber quantas eram events/catalog

Comando de diagnóstico:
```bash
# Listar os 29 bundles afetados
grep -rl "runtime/dist/runtime.bundle.js" \
  /var/www/dshowdash/public/*/dist/*.bundle.js \
  /var/www/dshowdash/public/*/*/dist/*.bundle.js \
  /var/www/dshowdash/public/*/*/*/dist/*.bundle.js 2>/dev/null

# Para cada bundle, contar ocorrências atuais vs backup
```

### FASE 2 — Criar script de reversão inteligente

Script: /var/www/dshowdash/public/scripts/revert-events-direct.js

O script deve:
1. Para cada bundle afetado, encontrar o backup correspondente
2. Extrair os events/catalog imports do backup (grep -oh)
3. No bundle atual, identificar os imports que DEVERIAM ser events/catalog
   mas estão como runtime.bundle.js
4. A identificação pode ser feita pelo CONTEXTO: 
   - Se o import tem named exports como ACTION_EVENTS → era action.events.js
   - Se tem AUTH_EVENTS → era auth.events.js
   - etc.
5. OU mais simples: comparar as posições/contexto no backup vs atual

ALTERNATIVA MAIS SIMPLES E SEGURA:
Como temos os 29 bundles pós-processados e seus backups:
1. Para cada bundle, ler o backup e extrair TODOS os paths de events/catalog
2. Ler o bundle atual
3. No bundle atual, onde antes tinha o path de events/catalog (agora runtime.bundle.js),
   verificar se os bytes ao redor são compatíveis
4. Se sim: substituir de volta

MAS A FORMA MAIS SIMPLES DE TODAS:
- O events-direct-imports.js fez substituições de STRING pura
- Ele trocou a STRING "/core/runtime/events/catalog/X.events.js" pela STRING
  "/core/runtime/dist/runtime.bundle.js"
- Como o path de runtime.bundle.js é MAIS CURTO que os paths originais,
  o arquivo MUDOU DE TAMANHO
- Ou seja: as strings literais "from '/core/runtime/dist/runtime.bundle.js'"
  que ANTES eram "from '/core/runtime/events/catalog/X.events.js'"
  podem ser identificadas pelo contexto (o que é importado)

ABORDAGEM FINAL (mais eficiente e segura):
1. Rebuild os 4 bundles que foram construídos no Lote 10 (app-router, panel-home, ticker, app-shell)
   SEM aplicar events-direct-imports.js
2. Para os outros 25 bundles: comparar com backup, identificar as substituições, reverter

## 4. Ordem de Execução

1. DIAGNÓSTICO: Ler events-direct-imports.js, listar 29 bundles, categorizar
2. REBUILDS: Rebuild app-router, panel-home, ticker, app-shell sem events-direct
   (mas COM fix-bundle-paths, bootstrap-direct-imports e middlemen-direct-imports)
3. PÓS-PROCESSADOS: Para cada um dos ~25 restantes, criar script reverso e aplicar
4. VALIDAÇÃO: node --check em TODOS os 29 bundles
5. TESTE: Verificar que a app carrega sem erro

## 5. Regras Operacionais

1. SEMPRE backup para /backup ANTES de alterar qualquer arquivo
2. NUNCA restaure um arquivo inteiro do backup — use backup como REFERÊNCIA
3. NUNCA use sed/patch parcial — reescreva arquivos inteiros via cat << 'EOF'
4. Post-processing: rode fix-bundle-paths.js após cada build Vite
5. NÃO aplicar events-direct-imports.js (ele é o CAUSADOR do problema)
6. Aplicar middlemen-direct-imports.js e bootstrap-direct-imports.js normalmente
7. Valide syntax com node --check após CADA modificação
8. Credenciais: Jhony / <SENHA-REMOVIDA-P1-01>
9. URL: https://dshowdash.com.br
10. Nunca liste conteúdo de pastas com "react" no nome

## 6. Resultado Esperado

- App carrega sem tela preta
- phase-4-main executa com sucesso
- Events/catalog files carregam normalmente (40 requests — é o comportamento correto)
- Todas as demais otimizações do Lote 10 (Frentes B-F) preservadas
- Zero regressão

## 7. Nota sobre Events Futuros

Os 40 events/catalog requests NÃO PODEM ser eliminados com substituição simples.
Para otimizá-los no futuro, a solução enterprise seria:
- Criar um events-catalog.bundle.js que EXPORTA todos os named exports
- Cada events/catalog/*.events.js vira re-export do events-catalog.bundle.js
- Bundles importam do events-catalog.bundle.js com os named exports corretos
Isso é trabalho FUTURO, não deste briefing.
