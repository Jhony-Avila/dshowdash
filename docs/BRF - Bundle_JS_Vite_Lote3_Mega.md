# BRIEFING — Bundle JS via Vite (Lote 3 — MEGA)

## 1. Contexto

Lotes 1-2 eliminaram 313 requests (bootstrap 148→3, 7 componentes bundlados).
Restam ~183 requests JS no first load. Os maiores gargalos agora são
domínios fora de /components/:

| Domínio              | Requests | KB  |
|----------------------|----------|-----|
| /assets/js/core      | 51       | 110 |
| /core/runtime        | 36       | 73  |
| /core/kernel         | 17       | 45  |
| /modules             | 16       | 31  |
| /core/js             | 13       | 22  |
| /components/feature-flags   | 9  | 19  |
| /components/error-boundary  | 6  | 25  |
| /core/auth           | 6        | 13  |
| /components/login-modal     | 3  | 13  |
| **Total bundlável**  | **157**  | **351** |

## 2. Objetivo

Bundlar os 9 alvos acima, reduzindo ~157 requests para ~18 (2 por bundle).

## 3. Organização em Sub-lotes

Para manter o processo controlável, dividir em 3 sub-lotes executados
em sequência dentro desta mesma tarefa:

### Sub-lote A — Componentes restantes (3 alvos, ~18 requests)
Mesmo padrão dos Lotes 1-2 — config paramétrico já existe.

1. **feature-flags** (9 requests)
   - Entry provável: /components/feature-flags/index.js
   - Output: /components/feature-flags/dist/feature-flags.bundle.js

2. **error-boundary** (6 requests) — INVESTIGAR
   - Já foi bundlado no Lote 1 (9→6). Os 6 restantes são sub-módulos
     importados diretamente por OUTROS componentes, não via index.js.
   - Diagnóstico: identificar QUEM importa arquivos do error-boundary
     além do index.js. Se são imports diretos de core/catcher.js etc.,
     o bundle do index.js não os captura.
   - Possível solução: ajustar quem importa para usar index.js, ou
     criar barrel que inclui tudo.

3. **login-modal** (3 requests)
   - Entry provável: /components/login-modal/index.js
   - Output: /components/login-modal/dist/login-modal.bundle.js

### Sub-lote B — Core (3 alvos, ~66 requests)
Estes são domínios usados como EXTERNALS por todos os bundles anteriores.
Bundlá-los é de alto impacto mas requer cuidado: outros bundles
importam deles como external.

1. **core/runtime** (36 requests, 73KB)
   - É o mais importado external de todos os bundles
   - Entry provável: /core/runtime/ — pode não ter index.js único
   - Precisa de diagnóstico na FASE 1

2. **core/kernel** (17 requests, 45KB)
   - Entry provável: /core/kernel/index.js ou feature-registry.js
   - Precisa de diagnóstico

3. **core/js** (13 requests, 22KB)
   - Contém event-bus, ready-flags, asset-loader
   - Entry provável: /core/js/ — pode ter múltiplos sub-entries
   - Precisa de diagnóstico

### Sub-lote C — Assets e Modules (2 alvos, ~67 requests)

1. **assets/js/core** (51 requests, 110KB)
   - Maior alvo restante em volume
   - Contém logger-global, telemetry-core, config-loader, metrics-polling,
     environment-manager
   - Precisa de diagnóstico de entry points

2. **modules** (16 requests, 31KB)
   - Contém global-state e possivelmente outros
   - Entry provável: /modules/global-state/index.js
   - Precisa de diagnóstico

NOTA: core/auth (6 requests) pode ser incluído no Sub-lote B se viável.

## 4. Fases de Execução

### FASE 1 — Diagnóstico (TODOS os 9 alvos de uma vez)
Para cada alvo:
1. Listar arquivos JS, confirmar entry point
2. Mapear imports externos
3. Identificar se é importado como unidade (index.js) ou fragmentado
4. Para error-boundary: identificar quem importa sub-módulos diretamente

Apresentar diagnóstico consolidado dos 9 alvos ANTES de qualquer build.

### FASE 2A — Build Sub-lote A (componentes)
1. Adicionar feature-flags e login-modal ao config paramétrico existente
2. Resolver error-boundary (ajuste de imports ou barrel)
3. Build + validação
4. Integração via re-export
5. Validação no browser

### FASE 2B — Build Sub-lote B (core)
1. Criar configs Vite para core/runtime, core/kernel, core/js
2. ATENÇÃO: estes são externals dos bundles anteriores — o bootstrap
   bundle faz `import from '/core/runtime/...'`. Após bundlar core/runtime,
   os re-exports nos index.js de cada sub-módulo garantem compatibilidade.
3. Build + validação
4. Integração via re-export
5. Validação no browser

### FASE 2C — Build Sub-lote C (assets + modules)
1. Criar configs para assets/js/core e modules
2. Build + validação
3. Integração
4. Validação final no browser

## 5. Regras Especiais para este Lote

1. **Cada sub-lote deve ser validado no browser antes de avançar ao próximo.**
2. **Core é mais arriscado** — são dependências transitivas de TODOS os
   bundles. Qualquer erro no re-export quebra tudo. Cautela extra.
3. **Error-boundary precisa de investigação** antes de bundlar.
4. **Não alterar bundles existentes** (bootstrap, preloader, session-manager,
   etc.) — apenas adicionar novos.
5. Sem minificação.

## 6. Critérios de Aceite
1. Todos os bundles gerados com node --check OK
2. Bootstrap inicia sem erros
3. Total de requests JS reduzido de ~183 para ~40-50
4. Navegação funcional
5. Build scripts atualizados e reproduzíveis

## 7. Rollback
Cada sub-lote tem rollback independente via backups dos index.js.
Fontes originais nunca são alteradas.
