# BRIEFING — Bundle de Componentes JS via Vite (Lote 2)

## 1. Contexto

Lote 1 concluído: preloader (27→2), session-manager (18→2), error-boundary (9→6).
Infraestrutura Vite já existe: config paramétrico + build script.

Alvos do Lote 2 (medidos no DevTools pós-Lote 1):

| Componente       | Requests | Tamanho |
|------------------|----------|---------|
| context-provider | 12       | 31KB    |
| security         | 12       | 24KB    |
| _shared          | 10       | 21KB    |
| toast            | 8        | 17KB    |
| **Total**        | **42**   | **93KB** |

## 2. Objetivo

Bundlar cada componente em 1 arquivo JS, reduzindo 42 requests para ~8
(2 por componente: index.js re-export + bundle).

## 3. Estratégia

Mesmo padrão do Lote 1: Vite como bundler, externals para tudo fora do componente,
output em dist/ dentro de cada componente, integração via Opção A (re-export no index.js).

### 3.1 — Context-Provider (12 requests → 2)
- Entry: /components/context-provider/index.js
- Output: /components/context-provider/dist/context-provider.bundle.js

### 3.2 — Security (12 requests → 2)
- Entry: /components/security/csrf-token-manager/index.js
  (ATENÇÃO: verificar se o entry point real é /components/security/index.js
  ou /components/security/csrf-token-manager/index.js — o bootstrap importa
  de /components/security/csrf-token-manager/index.js)
- Output: depende do entry point confirmado na FASE 1

### 3.3 — _shared (10 requests → 2)
- Entry: /components/_shared/permissions/index.js
  (ATENÇÃO: _shared pode ter múltiplos sub-módulos importados independentemente.
  Verificar na FASE 1 se é possível bundlar como unidade ou se precisa
  de abordagem diferente)
- Output: depende da análise na FASE 1

### 3.4 — Toast (8 requests → 2)
- Entry: /components/toast/service/index.js
  (ATENÇÃO: verificar entry point real — pode ser /components/toast/index.js)
- Output: depende do entry point confirmado na FASE 1

## 4. Implementação

### 4.1 — Atualizar Config Paramétrico Existente
Adicionar os 4 novos componentes ao vite.components.config.js existente
em /var/www/dshowdash/public/components/

### 4.2 — Atualizar Build Script
Adicionar os 4 novos componentes ao build-components.sh existente.

### 4.3 — Integração (Opção A)
Mesmo padrão do Lote 1:
```js
export * from './dist/NOME.bundle.js';
export { default } from './dist/NOME.bundle.js';
```

## 5. Fases de Execução

### FASE 1 — Diagnóstico (CRÍTICO para este lote)
Este lote tem mais incertezas que o Lote 1. Entry points de security,
_shared e toast precisam ser confirmados.

1. Para cada componente: listar arquivos, confirmar entry point, mapear imports externos
2. Para _shared: verificar se é importado como unidade (/components/_shared/permissions/index.js)
   ou se diferentes sub-módulos são importados diretamente
3. Para security: verificar se há index.js na raiz ou apenas em csrf-token-manager/
4. Apresentar diagnóstico completo ANTES de qualquer config

### FASE 2 — Build
1. Atualizar config paramétrico com novos componentes
2. Atualizar build script
3. Executar builds dos 4 componentes
4. Validar: node --check, tamanho, warnings
5. Apresentar resultados ANTES de integrar

### FASE 3 — Integração
1. Backup dos index.js originais para /backup/ com timestamp
2. Substituir com re-export (named + default)
3. Apresentar conteúdo de cada novo index.js
4. Aguardar validação no browser

## 6. O que NÃO fazer
- Não alterar lógica dos componentes
- Não alterar bundles existentes (bootstrap, preloader, session-manager, error-boundary)
- Não minificar
- Não remover arquivos fonte
- Não bundlar dependências externas

## 7. Critérios de Aceite
1. 4 bundles gerados em dist/ de cada componente
2. Bootstrap inicia sem erros
3. Requests de components reduzidos de ~53 para ~19
4. Build script atualizado e reproduzível
5. Navegação funcional

## 8. Rollback
Restaurar cada index.js do backup. Bundles são artefatos — fontes intactas.
