# PROGRAMA DE DESACOPLAMENTO DO RUNTIME DE EVENTS — FASE P0 / P1 / P2

## 1. CONTEXTO E TRABALHO PRÉVIO

### Trabalho já executado (agent_01 — P0 do BRF Refat_Nucleo_Runtime_Eventos)
- 80 imports do barrel migrados para granular nos 6 caminhos de boot críticos:
  bootstrap-v2/, core/, components/preloader/, components/overlay-layer/,
  components/app-shell/, components/login-modal/
- ports-profiles.js auditado e confirmado como conforme (zero side-effects no import)
- strict-mode.js refatorado (v2.5.0-P03-BOOT-SAFE): zero side-effects no import,
  boot-phase gate para emissão de eventos, throttle em _checkForAlerts
- 56 arquivos .bak-refat-eventos movidos de /public para /backup/
- Grep final nos 6 caminhos de boot: zero imports do barrel

### Estado atual
- Barrel /core/runtime/events/index.js ainda possui ~1600 imports ativos fora dos caminhos de boot
- O acoplamento estrutural ao barrel persiste no restante do sistema
- O barrel funciona como ponto único de dependência para o contrato de eventos

### Conclusão técnica
O boot está limpo. O problema agora é arquitetural-sistêmico: ~1600 módulos fora
do boot ainda dependem do barrel, impedindo granularidade real, lazy-load efetivo
e previsibilidade de carregamento.

---

## 2. OBJETIVO DO PROGRAMA

Eliminar o barrel como dependência estrutural do sistema inteiro, mantendo:
- Integridade funcional
- Compatibilidade progressiva
- Governança técnica
- Zero downtime
- Zero regressão

Sem reescrita completa. Migração controlada.

---

## 3. FASE P0 — GOVERNANÇA, CONTENÇÃO E HIGIENE

P0 não é migração. P0 é impedir que o problema cresça enquanto migramos.

### P0.1 — Congelamento do Barrel

Regra obrigatória (a partir de agora):
- Nenhum novo módulo pode importar /core/runtime/events/index.js
- Todo novo código deve usar imports granulares: /core/runtime/events/catalog/<xxx>.events.js
- Violação desta regra é considerada regressão arquitetural

### P0.2 — Regra Enterprise de Early-Path

Regra inviolável:
- Módulos de early-path (bootstrap-v2, preloader, login-modal, app-shell, overlay-layer, core/)
  só podem importar de /core/runtime/events/catalog/*.events.js
- Proibido importar do barrel nestes caminhos, mesmo para "conveniência"
- Esta regra já está em vigor (validada pelo agent_01)

Validação periódica:
```bash
cd /var/www/dshowdash/public && grep -RIn --exclude="*.bak*" --exclude-dir="backup" "from '/core/runtime/events/index.js'" bootstrap-v2/ core/ components/preloader/ components/overlay-layer/ components/app-shell/ components/login-modal/
```
Resultado esperado: sempre zero.

### P0.3 — Higiene Estrutural

Regras permanentes:
- Proibido manter arquivos .bak* dentro de /var/www/dshowdash/public/
- Backups devem estar exclusivamente em /backup/
- Verificação periódica:
```bash
find /var/www/dshowdash/public -type f -name "*.bak*" | head -20
```
Resultado esperado: sempre zero.

### P0.4 — Baseline de Medição

Antes de iniciar P1, registrar contagem atual:
```bash
cd /var/www/dshowdash/public && grep -RIn --exclude="*.bak*" --exclude-dir="backup" "from '/core/runtime/events/index.js'" --include="*.js" | wc -l
```
Este número é a baseline. Toda migração P1 deve reduzir este número com evidência.

### Critérios de aceite P0
- Regra de congelamento documentada e comunicada aos agentes
- Early-path com zero imports do barrel (já atendido)
- Zero arquivos .bak dentro de /public/ (já atendido)
- Baseline registrada

---

## 4. FASE P1 — MIGRAÇÃO PROGRESSIVA POR DOMÍNIO

### Estratégia
Migrar domínio por domínio, do menos acoplado ao mais acoplado.
Um lote por vez. Validar antes de avançar.

### Lote 1 — Shell e Navegação
- components/router/
- components/sidebar/
- components/nav-rail/
- components/header/
- components/footer/

### Lote 2 — Runtime e Main Engine
- components/main/
- container-main/
- modules/global-state/

### Lote 3 — Painéis (por grupo funcional)
- components/panels/ (dividir por subgrupos se necessário)

### Lote 4 — Módulos restantes
- Tudo que sobrar após Lotes 1-3

### Padrão Técnico de Migração

Substituir:
```javascript
import { AUTH_EVENTS } from '/core/runtime/events/index.js';
```
Por:
```javascript
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
```

Regras:
- Import granular direto do catalog/*.events.js
- Nunca criar barrels intermediários ou "minimal.js"
- Quando um import do barrel puxa múltiplos eventos de catálogos diferentes, fazer split em múltiplos imports granulares

### Fluxo por arquivo
1. Backup do arquivo para /backup/
2. Ler arquivo completo
3. Identificar imports do barrel e mapear para granular
4. Reescrever arquivo completo (protocolo NR-FULL)
5. node --check
6. Próximo arquivo

### Métricas de Redução
- Baseline: ~1600 ocorrências
- Meta Lote 1: reduzir para < 1200
- Meta Lote 2: reduzir para < 800
- Meta Lote 3: reduzir para < 200
- Meta Lote 4: 0

Cada lote deve apresentar:
- Contagem antes (grep | wc -l)
- Contagem depois (grep | wc -l)
- Lista de arquivos migrados
- node --check em todos os arquivos alterados

---

## 5. FASE P2 — DESATIVAÇÃO CONTROLADA DO BARREL

Quando restarem < 50 imports:
1. Adicionar comentário DEPRECATED no topo de events/index.js
2. Identificar e migrar os últimos imports restantes
3. Quando chegar a zero: manter events/index.js como arquivo vazio com comentário de histórico
4. Não remover o arquivo (evitar quebra de referências externas não mapeadas)

---

## 6. REGRAS DE EXECUÇÃO (todos os agentes)

- Seguir todos os protocolos do CLAUDE.md
- Não restaurar arquivos — corrigir o arquivo atual
- Não reescrever contratos públicos
- Mudanças incrementais, um lote por vez
- Backup antes de qualquer alteração
- Evidência sempre anexada (grep antes/depois)
- Nunca criar barrels intermediários ou camadas "ponte"
- Nunca consultar pastas com "react" no nome
- Validar sintaxe com node --check após cada edição

---

## 7. CRITÉRIOS DE ACEITE GLOBAIS

- Zero barrel nos caminhos de boot (já atendido — manter)
- Zero arquivos .bak dentro de /public/ (já atendido — manter)
- Redução progressiva mensurável com evidência
- Barrel final com zero imports ativos
- Todos os node --check passando

---

## 8. EXCLUSIVIDADE DE ESCOPO

- O agente designado para este briefing tem exclusividade sobre a migração de imports do barrel
- Nenhum outro agente deve alterar imports de /core/runtime/events/index.js simultaneamente
- Em caso de conflito de escopo com outro agente, parar e reportar antes de agir
