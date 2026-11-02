# Plano de Refatoração do Núcleo de Runtime e Sistema de Eventos – Fase P0/P1

## Diagnóstico empírico (arquitetura + performance)

### 1) Hub #1: /core/runtime/ports-profiles.js (1373 imports)

O que é na prática: um "perfilador" de Ports (UI/Core/Panel/State/Telemetry) que resolve dependências via window.* com fallbacks (EventBus, Telemetry, Logger, Orchestrator, Metrics, Auth via GlobalState).
Ponto crítico: ele é importado por praticamente tudo, então qualquer custo aqui vira custo global.

Achados relevantes no trecho:
- Importa createPorts e isStrict. (já cria um acoplamento direto com governança/strict-mode)
- Tem resolvers com fallback em window.* e um adapter de auth baseado em GlobalState.
- Profiles exigem config/eventBus/logger mas permitem allowWindowFallback.

Risco P0 (performance):
- Se createPorts fizer validação pesada, scans, logs, ou checagens de required ports em runtime, isso se multiplica pelo sistema inteiro.
- A existência de muitos fallbacks window + adapter de auth pode gerar caminho de execução maior e potencial de side-effects indiretos (ex.: tocar em GlobalState).

Risco P0 (arquitetura): Esse arquivo virou o "centro de acoplamento": tudo depende dele, então ele define a arquitetura real.

### 2) Hub #2: /core/runtime/events/index.js (824 imports)

O que é na prática: um "barrel file" que exporta praticamente todo o catálogo de eventos + payloads + validate + listeners-registry.

Achados relevantes no trecho: Só exports, mas exporta dezenas de módulos (catalog/*, payloads/*, validate.js, listeners-registry.js).

Risco P0 (performance):
- Mesmo sendo "só export", na prática isso pode causar carregamento antecipado de muitos módulos se o bundler/ambiente não fizer tree-shaking real (e em ambiente browser ESM puro isso costuma carregar o grafo conforme os imports).
- Resultado típico: qualquer módulo que precisa de 1 evento puxa o catálogo inteiro.

Risco P0 (arquitetura):
- Eventos viraram dependência estrutural "sempre ligada", o que atrapalha lazy-load real (módulos "leves" passam a importar "pesado").

### 3) Hub de governança: /core/runtime/enterprise/strict-mode.js (205 imports)

O que é na prática: governança runtime com:
- import estático de governance.events.js
- tracking (rate buckets, map por módulo)
- emissão fire-and-forget via EventBus getters e fallbacks window.Core.eventBus, window.EventBus
- default ON (__DSHOW_ENTERPRISE_STRICT__ !== false)

Risco P0 (performance):
- O strict-mode é relativamente "pesado" por natureza (tracking + emissão + políticas). Se chamado frequentemente ou acoplado a caminhos quentes, pode degradar.
- Mesmo que não execute tudo no import, ele cria base de runtime que pode ser acionada por muitos módulos.

Risco P0 (arquitetura):
- Strict-mode está hoje acoplado ao ecossistema global (window fallbacks + event bus), o que é ok como transição, mas precisa ser governado por fases/boot.

### Conclusão P0 (o que tratar primeiro)

O gargalo está concentrado em 2 arquivos:
1. ports-profiles.js (wiring global + fallbacks)
2. events/index.js (barrel que pode puxar o catálogo inteiro)

Se você "enxuga" e controla o custo e o momento em que esses dois entram, você reduz:
- tempo de boot
- cascata de imports
- acoplamento estrutural
- risco de tela preta por startup inflado

---

## BRIEFING OPERACIONAL (P0/P1) — Arquitetura & Performance

### Objetivo
Reduzir custo de boot e acoplamento estrutural, garantindo:
- boot mínimo (login-first)
- lazy-load real de UI/painéis
- hubs centrais sem side-effects e sem puxar catálogos inteiros

### Evidências (empíricas)
- ports-profiles.js é o maior hub: 1373 imports
- events/index.js é o segundo maior hub: 824 imports
- strict-mode.js também é estrutural: 205 imports
- Tamanho por diretório mostra concentração em components/ e, dentro disso, panels e container-main.

---

## Escopo P0 — Ações obrigatórias

### P0.1 — "Higienizar" core/runtime/events/index.js para não puxar tudo

Meta: evitar que importar 1 evento carregue o catálogo inteiro.

Tarefas:
1. Criar um padrão de import granular:
   - Ao invés de importar de /core/runtime/events/index.js, módulos devem importar direto de:
   - /core/runtime/events/catalog/<xxx>.events.js
   - ou /core/runtime/events/payloads/<xxx>.payloads.js
2. Manter events/index.js como compat, mas:
   - Marcar como "barrel legacy"
   - Proibir uso em caminhos de boot críticos (bootstrap, preloader, login-modal, app-shell, kernel/core runtime)

Critério de aceite (P0.1):
- Bootstrap não importa events/index.js.
- Módulos críticos trocados para import granular (começar pelos P0: bootstrap-v2, core/kernel, preloader, overlay-layer, app-shell, container-main).

### P0.2 — Blindar ports-profiles.js contra "custo invisível"

Meta: manter esse hub extremamente "barato" e previsível.

Tarefas:
1. Garantir que ports-profiles.js:
   - não faz validações pesadas no import
   - não dispara governança/telemetria automaticamente no import
2. Isolar fallback window.*:
   - fallback permitido só se allowWindowFallback===true
   - em strict-mode, fallback deve ser auditável (e opcionalmente bloqueável por fase)
3. Revisar _authResolver:
   - confirmar que não "puxa" estado de forma cara (ex.: loops/normalizações)
   - manter como lazy (só executa quando getAuth() é chamado)

Critério de aceite (P0.2):
- Importar ports-profiles.js não deve: registrar nada global, emitir eventos, inicializar serviços.
- Nenhuma leitura de GlobalState.getState() acontece no import; apenas dentro de funções chamadas sob demanda.

### P0.3 — Strict-mode: governança por fase (boot-controlled)

Meta: strict-mode não pode degradar boot e não pode virar dependência "sempre ativa" no startup sem controle.

Tarefas:
1. Garantir que setEventBusGetter() seja configurado apenas quando EventBus estiver pronto (fase do bootstrap).
2. Garantir que recordViolation()/emissão seja:
   - "cheap" (sem custo alto por chamada)
   - com degradação segura (já é fire-and-forget)
3. Confirmar que governance.events.js não puxa catálogos grandes indevidos.

Critério de aceite (P0.3):
- Em boot inicial, strict-mode não emite spam nem faz trabalho pesado.
- Existe um "gate" por fase (ex.: só emitir governança após BOOT_READY).

---

## Escopo P1 — Depois do P0 estabilizado

1. Revisar container-main como hub de dependências (não pode ser carregado inteiro no primeiro paint do login).
2. Validar painéis: nenhum painel deve entrar no boot; todos via loader dinâmico.
3. "Shell early-load": header/sidebar/footer só após auth (ou em modo mínimo).

---

## Regras de execução (para evitar regressão)

- Antes de qualquer alteração, fazer backup do arquivo para /backup seguindo o padrão NOME.bak_YYYYMMDD_HHMMSS
- Não restaurar arquivo por backup; usar backup apenas como referência.
- Mudanças incrementais, uma por vez, com validação.
- Não criar novos "barrels" globais; preferir imports granulares.
- Nunca consultar pastas com "react" no nome.
- Cada correção deve ser entregue como comando único: backup + cat << 'INNEREOF' + node --check
- Este agente tem exclusividade sobre os arquivos listados no escopo P0. Nenhum outro agente deve alterar esses arquivos simultaneamente.

---

## ANEXO — Ordem de Execução (P0) + Aceite Mensurável

### P0 — Arquivos a auditar primeiro (obrigatório)
1. /var/www/dshowdash/public/core/runtime/events/index.js
2. /var/www/dshowdash/public/core/runtime/ports-profiles.js
3. /var/www/dshowdash/public/core/runtime/enterprise/strict-mode.js
4. /var/www/dshowdash/public/bootstrap-v2/index.js + /var/www/dshowdash/public/bootstrap-v2/phases/phase-1-core.js

### P0 — Meta Técnica
- Proibir import de /core/runtime/events/index.js em caminhos de boot (bootstrap-v2, preloader, overlay-layer, app-shell, login-modal, kernel/core runtime).
- Migrar imports para granular (/core/runtime/events/catalog/* e /core/runtime/events/payloads/*).

### P0 — Critérios de Aceite (mensuráveis)
- grep -RIn "/core/runtime/events/index.js" bootstrap-v2 core components/preloader components/overlay-layer components/app-shell components/login-modal retorna 0 ocorrências (ou justificadas e documentadas).
- Boot inicial não carrega painéis: nenhuma referência direta a components/panels/* dentro de bootstrap-v2/phases/*.
- ports-profiles.js não executa side-effects no import (apenas declarações + funções).

### P0 — Entregáveis do agente
1. Comando único por arquivo (backup + cat << 'INNEREOF' + node --check) com as mudanças P0.1–P0.3
2. Relatório curto listando:
   - imports removidos do barrel
   - arquivos migrados para import granular
   - evidências (grep outputs) anexadas
