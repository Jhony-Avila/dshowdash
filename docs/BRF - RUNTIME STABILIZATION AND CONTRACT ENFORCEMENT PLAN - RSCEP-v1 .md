BRIEFING RUNTIME STABILIZATION AND CONTRACT ENFORCEMENT PLAN (RSCEP-v1)

PARTE 1/10
Escopo, Regra-Mãe e Definition of Done (DoD)
1) Objetivo (P0 absoluto)
Executar uma estabilização e padronização transversal do DshowDash (frontend modular + runtime), focada em:
correções reais (bugs/riscos/contratos quebrados)
melhorias estruturais (governança de contratos)
elevação de nível (Enterprise/AAA executado, não só declarado)

Não é projeto de feature.
É projeto de “tirar variância do runtime”, reduzir risco e garantir previsibilidade.

2) Escopo (o que entra)
Entram no escopo:
/var/www/dshowdash/public/components/**
/var/www/dshowdash/public/app/**
/var/www/dshowdash/public/config/**
/var/www/dshowdash/public/contracts/**
(quando aplicável) /var/www/dshowdash/public/assets/js/core/** apenas se for dependência direta de runtime dos componentes.

3) Fora de escopo (proibido mexer)
🚫 Proibido mexer em vendor / dependências de build:
/var/www/dshowdash/public/react/** (inclui node_modules, vite, babel, etc.)

Regra: qualquer contagem/varredura que inclua /public/react/** deve ser considerada “poluída” e inválida para governança do código do DshowDash.

4) Evidência empírica base (por que isso existe)
O sistema já tem governança forte “no papel”, mas precisa virar governança “executada”:
“DEPENDENCY CONTRACT” aparece em 4.997 arquivos (forte intenção de padrão).
Existem 3.678 exports de VERSION e 3.746 exports de MODULE_ID (diferença → inconsistência).
healthCheck() aparece 8.423 vezes (grande cobertura, mas precisa virar sinal confiável).
new AbortController: 274 ocorrências.
setInterval(: 402 ocorrências.
“circuit-breaker”: 609 ocorrências.
Ports/DI (inject/get/isInitialized): 7.442 ocorrências.

➡️ Conclusão: existe base Enterprise/AAA, mas a execução ainda é heterogênea e precisa ser normalizada.

5) Regra-mãe (não negociável)
Todo módulo crítico deve ser determinístico no tempo
Determinístico significa:
repetir mount → unmount → mount não pode acumular resíduos
nenhum listener/timer/request pode sobreviver além do lifecycle
o sistema não pode degradar com horas de uso

Se não for determinístico, não está pronto.

6) Diretriz de execução (como o agente deve trabalhar)
6.1Ordem obrigatória (visão macro)
1. Padronizar contratos dos fetch.js e circuit-breaker.js (ETAPA 3 / P0)
2. Completar VERSION nos módulos alvo (ETAPA 4 / P1)
3. Fortalecer healthCheck/telemetria (transformar em “verdade operacional”)
4. Normalizar timers / abort / polling / listeners (governança mínima)
5. Revisar ports críticos (router/auth/logger/eventBus/telemetry/config)

6.2 Estilo de mudança
Mudanças incrementais (pequenas e rastreáveis)
Proibido “reescrever tudo”
Proibido “migrar tudo” de uma vez
Um eixo por vez, com validação real ao final de cada eixo

7) Padrões obrigatórios de governança (mínimo)
A partir desta execução, qualquer módulo do escopo deve ter:
export const VERSION = '...'
export const MODULE_ID = '...'
healthCheck() e info() (no mínimo para módulos críticos)
contrato consistente em fetch/circuit-breaker (ETAPA 3)
regra de abort/timer: se cria, tem que destruir (ownership)

8) Anti-padrões proibidos (rejeição automática)
O agente deve considerar “reprovação” se:
alterar qualquer coisa dentro de /public/react/**
criar novo fetch que não aceita signal
criar setInterval sem stop()/destroy() (ou equivalente)
criar AbortController “solto” sem abort() no lifecycle
manter healthCheck “fake” (sempre HEALTHY, sem medir resíduos)
duplicar utilitários (debounce/throttle/timers/fetch wrappers) sem justificar

9) Deliverables obrigatórios (o que o agente deve entregar)
1. Changelog técnico por etapa (ETAPA 3, ETAPA 4, etc.)
2. Relatório de conformidade:
quantos fetch/circuit-breakers foram normalizados
quantos módulos receberam VERSION
quantos healthChecks foram ajustados
3. Prova empírica:
comandos de verificação + outputs
amostragem objetiva (antes/depois)

10) Definition of Done (DoD) — Aceite da Parte 1
A PARTE 1 está concluída quando:
o agente concorda formalmente com:
escopo / fora de escopo
regra-mãe (determinismo)
ordem de execução
o agente prepara o terreno para iniciar a ETAPA 3:
lista final dos 40 fetch.js + 40 circuit-breaker.js alvo
definição do contrato único de retorno (formato padrão)
plano de validação pós-mudança (comandos + critérios)

PARTE 2/10
Padronização do DEPENDENCY CONTRACT (Formato, Campos Mínimos e Regras de Auditoria)
1) Objetivo (P1 estrutural)
Transformar o “DEPENDENCY CONTRACT” de um cabeçalho decorativo em um instrumento formal de governança arquitetural, garantindo que:
todo módulo declare claramente:
o que consome
o que expõe
o que escuta
o que emite
o que toca em window
o contrato seja padronizado e auditável
o agente consiga validar automaticamente conformidade

2) Problema identificado
Você tem 4.997 ocorrências de “DEPENDENCY CONTRACT”.

Isso é excelente como cultura arquitetural.
Mas hoje:
há variações de formato
campos nem sempre são completos
contratos nem sempre refletem o que o módulo realmente faz
não existe auditoria automática do contrato vs implementação

➡️ Resultado: governança declarada > governança executada.

3) Princípio obrigatório
O DEPENDENCY CONTRACT é uma declaração formal de responsabilidade arquitetural.

Se o contrato não bate com o código:
o código está errado
ou
o contrato está errado

Ambos são inaceitáveis.

4) Formato oficial obrigatório (a partir desta etapa)
Todo módulo do escopo deve seguir exatamente esta estrutura lógica:
═══════════════════════════════════════════════════════
DEPENDENCY CONTRACT (X.Y.Z-AAA)
═══════════════════════════════════════════════════════
MODULE: <module-name>
PURPOSE: <curta descrição objetiva>

IMPORTS:
- módulo A
- módulo B

PROVIDES:
- função1()
- função2()
- VERSION
- MODULE_ID

RECEIVES (via init/options):
- config?
- ports?
- callbacks?

EMITS (eventos):
- event.name

LISTENS (eventos):
- event.name

WINDOW ACCESS:
- window.__DEVTOOLS__?
- window.addEventListener?
═══════════════════════════════════════════════════════


5) Campos obrigatórios mínimos
São obrigatórios:
MODULE
PURPOSE
IMPORTS
PROVIDES
WINDOW ACCESS

Mesmo que algum campo seja (none) — ele deve existir.

6) Regras de consistência
O agente deve validar que:
tudo que aparece em PROVIDES realmente é exportado
tudo que aparece em IMPORTS realmente é importado
se usa window, deve constar em WINDOW ACCESS
se usa addEventListener, deve constar em WINDOW ACCESS
se emite eventos, deve constar em EMITS

Contrato e código não podem divergir.

7) Escopo de aplicação prioritário
Primeiro aplicar padronização em:
/components/header/**
/components/panels/**
/components/router/**
/components/app-shell/**
/components/main/**
/components/ui-orchestrator/**

Depois expandir.

8) Auditoria obrigatória
O agente deve gerar:
script de auditoria que:
verifica presença do contrato
verifica presença dos campos mínimos
relatório com:
total de módulos auditados
total conformes
total divergentes
lista de divergências

Sem relatório, etapa não está concluída.

9) Anti-padrões proibidos
🚫 Contrato incompleto
🚫 Contrato desatualizado
🚫 Campos omitidos
🚫 Copiar/colar contrato sem atualizar MODULE
🚫 Usar contrato como comentário vazio

10) Definition of Done (DoD) — Parte 2
A Parte 2 está concluída quando:
100% dos módulos críticos seguem o formato oficial
divergências contrato vs código foram corrigidas
relatório de auditoria foi entregue
contrato passou a ser referência real de governança


PARTE 3/10
ETAPA 3 (P0): Contrato Unificado para fetch.js e circuit-breaker.js (≈80 módulos)
1) Objetivo (P0 absoluto)

Normalizar e padronizar todos os módulos fetch.js e circuit-breaker.js do projeto (aprox. 40 + 40) para eliminar:
retornos inconsistentes (ok vs success, data vs payload)
aborts sem padrão (AbortController “solto”)
timeouts divergentes
retries despadronizados
circuit breakers com APIs diferentes

Essa etapa é pré-requisito para estabilidade real do runtime.

2) Problema identificado (evidência)
Há uso recorrente de:
AbortController em múltiplos módulos, com variações de fallback e cancelamento  ￼
retornos com success: true/false e payload em alguns módulos, ao invés de um padrão universal  ￼

Isso cria incompatibilidade silenciosa entre consumidores.

3) Regra-mãe da ETAPA 3
Todo fetch.js deve parecer o mesmo para quem consome.
Todo circuit-breaker.js deve ter a mesma interface e semântica.

Sem isso, não existe previsibilidade.

4) Contrato obrigatório — Fetch Result
Escolher um padrão e aplicar em todos.
Padrão recomendado (único e universal):
{
ok: boolean,
data?: any,
meta?: object,
error?: string,
errors?: any[],
statusCode?: number,
aborted?: boolean,
timeout?: boolean,
retryCount?: number,
timestamp?: number,
moduleId?: string,
version?: string
}

Regras:
ok === true → data obrigatório
ok === false → error obrigatório (string)
aborted e timeout são booleanos auxiliares
statusCode deve existir quando houver response HTTP
moduleId/version devem ser anexados (se não for custo alto)

5) Contrato obrigatório — Fetch API
Todos os fetch.js devem expor (no mínimo):
request(method, url, options)
get(url, options)
post(url, body, options)
healthCheck()
info()

Regras de options

options deve aceitar:
signal (AbortSignal externo)
timeoutMs
headers
credentials (se aplicável)
retries / retryDelayMs (se aplicável)

6) AbortController — regra obrigatória
Se options.signal existir: não criar controller novo
Se não existir: criar controller interno
Timeout deve abortar via controller interno
Cancelamento deve ser possível via signal externo

Além disso:
controllers internos não podem ficar “ativos” fora do escopo do request
se existir ApiClient.cancel(), deve abortar o request em andamento consistentemente

7) Timeout — regra obrigatória
Timeout deve:
ser parametrizável (timeoutMs)
ter default único por domínio (ex: 30s)
marcar resultado como:
ok:false, timeout:true, aborted:true, error:'TIMEOUT'

8) Retry — regra obrigatória (se existir)
Se o módulo suporta retry:
retryCount deve ser reportado
backoff deve ser documentado
retry não pode ignorar abort (se sinal abortar, para imediatamente)

9) Circuit-breaker — contrato obrigatório
Escolher uma interface universal:
Recomendado:
execute(fn, fallback?)
reset()
getState()
healthCheck()
info()

Regras:
estados: closed, open, half-open
threshold/timeout/halfOpenMax padronizados por domínio
fallback opcional, mas semântica única

10) Integração fetch + circuit-breaker (obrigatória)
Se um módulo usa circuit-breaker:
toda chamada de rede deve passar por breaker.execute(() => fetch...)
exceções devem alimentar o breaker
abort/timeout devem ser tratados sem “quebrar” o breaker indevidamente:
abort por navegação pode ser “não-falha” (definir política)
timeout é falha real

11) Deliverables obrigatórios (ETAPA 3)
O agente deve entregar:
1. Lista exata dos 80 módulos alvo
2. Patch aplicado com contrato unificado
3. Relatório:
quantos padronizados
divergências encontradas
casos especiais e justificativas
4. Validação empírica:
script que testa N módulos em amostra (ex: 10 fetch + 10 cb)
outputs

12) Definition of Done (DoD) — Parte 3
A Parte 3 está concluída quando:
100% dos fetch.js retornam o mesmo formato
100% dos circuit-breaker.js expõem a mesma interface
abort/timeout/retry seguem as regras
nenhum consumidor quebre por divergência de formato
relatório e evidências foram entregues

PARTE 4/10
ETAPA 4 (P1): Padronização e Completação de VERSION (com exclusão de Vendor)
1) Objetivo
Garantir que 100% dos módulos do DshowDash (escopo próprio) possuam:
export const VERSION = '...'
export const MODULE_ID = '...'

Essa etapa não é estética.
Ela é essencial para:
rastreabilidade
telemetria confiável
auditoria automatizada
diagnóstico pós-deploy
rollback seguro

2) Problema identificado

Diagnóstico mostrou:
export const VERSION: 3.678
export const MODULE_ID: 3.746

Diferença entre os dois números = inconsistência estrutural.

Além disso, a lista de “modules sem VERSION” foi poluída por:
/public/react/node_modules/**
arquivos de vendor

Isso não entra no escopo.

3) Regra de escopo obrigatório

Esta etapa se aplica exclusivamente a:
/public/components/**
/public/app/**
/public/config/**
/public/contracts/**
/public/assets/js/core/** (somente se for código próprio do DshowDash)

🚫 Excluir explicitamente:
/public/react/**
qualquer node_modules
bibliotecas externas

4) Padrão obrigatório de VERSION
Formato recomendado:

MAJOR.MINOR.PATCH-SCOPE-LEVEL

Exemplo:
9.3.0-P2-ENTERPRISE

Onde:
MAJOR → quebra estrutural
MINOR → mudança funcional relevante
PATCH → correção incremental
SCOPE → P0 / P1 / P2 / etc
LEVEL → ENTERPRISE / AAA / STRICT-MODE

5) Regras obrigatórias

O agente deve garantir que:
1. Todo módulo exportável possua:
export const VERSION = '...';
export const MODULE_ID = '...';


2. VERSION deve ser:
consistente com o domínio
não genérico (ex: “1.0.0” puro não é aceitável)
3. MODULE_ID deve:
refletir o caminho lógico
não colidir com outros módulos
4. healthCheck() e info() devem incluir:
version
moduleId

6) Casos especiais
6.1Arquivos utilitários internos

Se o arquivo:
não é módulo público
não é consumido externamente
não tem export público

→ pode ser isento, mas deve ser listado e justificado no relatório.

7) Auditoria obrigatória

O agente deve entregar:
Lista de módulos do escopo
Quantos tinham VERSION
Quantos não tinham
Quais foram atualizados
Exclusões justificadas (vendor, testes, etc.)

Sem relatório = etapa não concluída.

8) Anti-padrões proibidos

🚫 VERSION copiado e colado sem atualização
🚫 VERSION genérico igual para tudo
🚫 MODULE_ID inconsistente com o caminho
🚫 Adicionar VERSION em vendor
🚫 Remover VERSION existente

9) Benefícios esperados

Após esta etapa:
Telemetria passa a ter rastreabilidade real
Logs ganham valor operacional
Debug de produção fica possível
Diferenças entre ambientes são detectáveis
Auditorias automatizadas passam a funcionar

10) Definition of Done (DoD) — Parte 4

A etapa está concluída quando:
100% dos módulos do escopo possuem VERSION
Nenhum arquivo vendor foi alterado
MODULE_ID e VERSION são coerentes
Relatório completo foi entregue
Amostragem manual validada

PARTE 5/10
HealthCheck: de “declaração” para sinal operacional real (anti-HEALTHY fake)
1) Objetivo
Transformar healthCheck() em uma ferramenta que detecta problemas reais (resíduos, vazamentos e estados inválidos), ao invés de ser um retorno fixo “HEALTHY”.
Isso é crítico porque você tem 8.423 ocorrências de healthCheck(): volume alto exige padrão único e verdade operacional.

2) Problema identificado
Hoje, em muitos módulos:
healthCheck() existe, mas:
não mede resíduos
não mede lifecycle real
não mede timers/listeners/aborts
não mede ports essenciais
o HealthAggregator pode consolidar “saúde” de módulos que estão, na prática, vazando recursos.

Resultado:
“HEALTHY fake”
alertas inúteis
diagnóstico difícil
regressões passam despercebidas

3) Princípio obrigatório

HealthCheck deve falhar quando existe risco real.

Se existe:
timer ativo fora do estado correto
listener global não limpo
request pendurado
circuito aberto sem justificativa
ports críticos indisponíveis

Então health não pode ser HEALTHY.

4) Contrato unificado de HealthCheck (obrigatório)

Todo healthCheck() deve retornar no mínimo:
{
status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY',
score?: 'X/Y' | number,
checks: { [name: string]: boolean },
issues?: string[],
version: VERSION,
moduleId: MODULE_ID,
timestamp?: number
}

Regras:
checks é obrigatório
status deve ser derivado de checks (não hardcoded)
issues deve listar checks falsos

5) Checks obrigatórios por categoria

5.1 Módulos com Ports/DI

Obrigatório:
portsInitialized
hasLogger (se aplicável)
hasEventBus (se aplicável)
hasRouter (se aplicável)

5.2 Módulos que fazem fetch

Obrigatório:
abortSupported
noActiveRequestOrCancelable
lastErrorRateAcceptable (se houver métrica)

5.3 Módulos com timers

Obrigatório:
noOrphanIntervals
noOrphanTimeouts
timerOwnershipOk

5.4 Módulos com listeners

Obrigatório:
noOrphanListeners
usesAbortSignalOrCleanup

5.5 Módulos com circuit-breaker

Obrigatório:
circuitStateOk (closed/half-open ok; open deve degradar)
failureRateOk (se houver)

6) Regra de severidade (padrão)
HEALTHY: 100% checks OK
DEGRADED: 70–99% checks OK (ou “open” controlado / modo degradado)
UNHEALTHY: <70% checks OK ou estado “error/destroyed” inconsistente

7) Padrão obrigatório de info()

info() deve incluir sempre:
moduleId
version
healthCheck: healthCheck()
métricas relevantes (se existirem)
estado/lifecycle (se existirem)

8) Auditoria obrigatória (mecânica)

O agente deve entregar:
auditoria por amostragem (mínimo 30 módulos críticos):
Header ecosystem
Panels core
Router/nav stack
Telemetry kernel
e provar que:
health muda para DEGRADED/UNHEALTHY quando forçado um cenário (ex: desligar port, simular open breaker, etc.)

9) Anti-padrões proibidos

🚫 healthCheck() { return { status: 'HEALTHY' } } sem checks
🚫 checks sempre true
🚫 status hardcoded
🚫 não incluir version/moduleId
🚫 health ignorar timers/listeners/aborts quando o módulo usa isso

10) Definition of Done (DoD) — Parte 5

Concluída quando:
healthCheck passa a ter contrato único
módulos críticos medem resíduos reais
HealthAggregator passa a refletir saúde real
relatório de auditoria entregue
“HEALTHY fake” reduzido drasticamente

PARTE 6/10
Timers: Governança mínima (ownership, start/stop/destroy, zero órfãos)
1) Objetivo
Eliminar timers órfãos e execução fora de contexto, criando uma governança mínima e obrigatória sobre:
setInterval
setTimeout
loops de refresh
countdowns
flush periódicos
Você tem 402 ocorrências de setInterval( no escopo varrido. Isso exige padrão único.

2) Problema identificado
Hoje, timers podem ser:
criados em vários níveis (UI, core, services)
não vinculados ao lifecycle
sem ownership rastreável
sem stop() / destroy() consistente

Resultado:
degradação progressiva
CPU crescente
polling concorrente
bugs intermitentes (“fantasmas”)

3) Princípio obrigatório
Se um módulo cria timer, ele é responsável por destruí-lo.

Timers são recursos finitos.
Sem ownership, não existe previsibilidade.

4) Contrato mínimo obrigatório para módulos que usam timers
Se um módulo usa timers, ele deve oferecer (no mínimo):
start()
stop()
destroy() (chama stop + limpa referência)
healthCheck() medindo:
se há timer ativo quando não deveria

5) Regras obrigatórias de implementação (para o agente)
5.1 Proibição de timer “solto”

🚫 Proibido:
setInterval(...) sem guardar o id
setTimeout(...) sem guardar o id
timer criado em helper sem retorno de cleanup

5.2 Ownership
Todo timer deve ter:
id
ownerModuleId
método claro de limpar (clearInterval/clearTimeout)
controle no lifecycle (unmount/destroy)

5.3 Idempotência
start() pode ser chamado duas vezes sem duplicar timers (deve fazer stop() antes)
stop() pode ser chamado várias vezes sem erro

6) Padronização recomendada (sem reescrever tudo)
Se já existir TimersManager/TimerAdapter em alguns domínios, o agente deve:
reutilizar onde fizer sentido
não criar outro padrão paralelo
criar uma convenção mínima:
Exemplo de convenção:
chaves de timer: polling:alerts, ui:countdown, telemetry:flush
clearAll() por módulo

7) Regras especiais para timers de UI
Timers de UI (countdowns, animações) devem:
pausar em document.hidden (quando aplicável)
não impedir navegação/unmount
ser interrompidos no unmount

8) Auditoria obrigatória (mecânica)
O agente deve entregar:
1. Lista de módulos críticos com timers
2. Evidência de stop/destroy
3. Amostragem com cenário:
montar módulo
desmontar módulo
confirmar que timers não continuam rodando

9) Anti-padrões proibidos
🚫 setInterval dentro de “render”
🚫 timer sem id guardado
🚫 start sem stop
🚫 destroy que não limpa timers
🚫 timers duplicados para o mesmo recurso

10) Definition of Done (DoD) — Parte 6
Concluída quando:
módulos críticos têm start/stop/destroy coerentes
não há timers órfãos após unmount/destroy
healthCheck mede timers corretamente
relatório de auditoria entregue


PARTE 7/10
AbortController: governança e vínculo com lifecycle (sem controllers “soltos”)

1) Objetivo
Padronizar o uso de AbortController para eliminar:
requests “zumbis”
aborts inconsistentes
controllers criados sem dono (ownership)
cancelamento que não ocorre em navegação/unmount

Seu diagnóstico mostrou 274 ocorrências de new AbortController no escopo varrido.

2) Problema identificado
Hoje, há padrões misturados:
controller criado “por request”
controller criado “por módulo”
controller criado em helper
timeout abortando controller local
cancel() abortando controller global (às vezes)

Isso causa:
comportamento diferente por módulo
dificuldade de padronizar fetch/circuit-breaker (ETAPA 3)
vazamentos e concorrência de requisições

3) Princípio obrigatório
Todo AbortController deve ter owner e fim garantido.

Se não existe:
owner (módulo/componente)
ponto de abort (unmount/destroy/cancel)
regra de criação
Então está errado.

4) Contrato mínimo obrigatório (módulos que usam AbortController)
Se um módulo usa AbortController, deve ter:
cancel() (ou equivalente)
destroy() (que chama cancel e limpa referências)
healthCheck() medindo:
abortControllerActive
hasActiveRequest (se aplicável)

5) Regras obrigatórias de criação de controllers
5.1 Se existe signal externo → não criar controller interno
options.signal é sempre prioridade
controller interno só existe como fallback

5.2 Se criar controller interno → ele deve morrer no mesmo escopo
por timeout (no request)
por cancel()
por destroy()

5.3 Proibição de controller “global eterno”
controller que fica vivo por horas sem motivo é risco
o correto é:
controller por ciclo de mount
ou por request (com governança e fim claro)

6) Timeout e abort (regra única)

Timeout deve sempre:
abortar via controller (interno)
retornar resultado consistente (ETAPA 3):
ok:false, timeout:true, aborted:true, error:'TIMEOUT'

Nunca retornar erro genérico sem sinalizar timeout.

7) Cancelamento em eventos do sistema (recomendado)
Sempre que um módulo fizer fetch/polling, ele deve:
pausar/cancelar em:
document.hidden (quando faz sentido)
mudança de rota (quando faz sentido)
unmount/destroy (sempre)

8) Auditoria obrigatória
O agente deve:
mapear módulos que criam AbortController
garantir que:
cada um tem cancel/destroy
o controller é abortado no fim
entregar relatório:
módulos conformes
módulos não conformes
política aplicada

9) Anti-padrões proibidos
🚫 criar AbortController e nunca abortar
🚫 timeout sem abort (só Promise.race sem cancelar)
🚫 request sem aceitar signal
🚫 cancel() que não cancela o request real
🚫 controller criado em helper sem owner

10) Definition of Done (DoD) — Parte 7

Concluída quando:
módulos críticos seguem regra única de AbortController
fetch/circuit-breaker (ETAPA 3) passa a ser consistente
nenhum controller fica ativo sem necessidade
healthCheck mede corretamente abortControllerActive
relatório de auditoria entregue

PARTE 8/10
Polling / Auto-Refresh: unificação, coordenação e eliminação de concorrência

1) Objetivo
Unificar o comportamento de polling/auto-refresh para eliminar:
múltiplos refresh concorrentes
chamadas redundantes ao backend
polling ativo quando não deveria (aba oculta, logout, unmount)
degradação progressiva de rede/CPU

Essa parte se apoia diretamente nas PARTES 6 (Timers) e 7 (Abort).

2) Problema identificado

O projeto tem:
setInterval em volume
muitas menções a circuit-breaker (609)
diversos módulos com “refresh loops” próprios

Sem coordenação central, isso gera:
duas ou mais rotinas atualizando o mesmo recurso
refresh que continua mesmo após mudança de contexto
comportamento diferente por módulo

3) Princípio obrigatório

Polling não é decisão local. É recurso global governado.

Componentes podem pedir refresh.
Mas o scheduler deve controlar quando e como.

4) Contrato obrigatório do Polling (padrão mínimo)

Todo módulo que faz polling deve expor:
start()
stop()
pause()
resume()
destroy() (stop + cancelar requests)
healthCheck() medindo:
isRunning
isPaused
hasActiveRequest
visibilityGatingOk
authGatingOk

5) Regras obrigatórias de coordenação

5.1 Gating por visibilidade

Se a aba estiver oculta:
polling deve pausar (pause())

Ao voltar polling pode retomar (resume()), se autorizado por gating.

5.2 Gating por autenticação

Se não estiver autenticado:
polling não pode rodar
qualquer request pendente deve ser cancelado

5.3 Gating por lifecycle
unmount/destroy sempre param polling
polling nunca sobrevive ao módulo

6) Política de prioridade (recomendado)

Criar prioridade mínima:
P0: auth/session/security
P1: header/kpis/alertas
P2: dashboards e panels não críticos

Polling P2 não pode derrubar P0.

7) Integração com circuit-breaker (obrigatória nos fluxos críticos)
Se o polling chama a rede:
deve ser protegido por circuit-breaker
quando circuit ficar open:
degradar
aumentar intervalo (backoff)
ou pausar temporariamente

8) Anti-padrões proibidos

🚫 polling direto “para sempre” sem stop
🚫 polling sem pause por visibilidade
🚫 polling sem auth gating
🚫 múltiplos pollings do mesmo recurso
🚫 polling sem AbortController

9) Auditoria obrigatória
O agente deve entregar:
inventário dos módulos com polling
classificação:
crítico (P0)
importante (P1)
opcional (P2)
regra de coordenação aplicada
evidência empírica:
aba oculta pausa
logout para
unmount mata

10) Definition of Done (DoD) — Parte 8
Concluída quando:
polling foi normalizado nos módulos críticos
não existe concorrência de refresh do mesmo recurso
polling respeita visibilidade/auth/lifecycle
circuit-breaker governa degradação
relatório entregue

PARTE 9/10
Ports / DI + Strict Mode
Contrato mínimo dos Ports críticos e eliminação de fallback indevido em window

1) Objetivo
Fortalecer a camada de Ports/DI para que:
dependências sejam explícitas
módulos não dependam de window.* implícito
Strict Mode seja real (não apenas simbólico)
router/auth/logger/eventBus/telemetry/config sejam previsíveis

Seu diagnóstico mostrou 7.442 ocorrências relacionadas a Ports.
Isso é uma base forte — agora precisa virar contrato rígido.

2) Problema identificado

Hoje:
muitos módulos usam Ports.isInitialized()
alguns usam fallback via window.*
nem sempre está claro:
quais ports são obrigatórios
quais são opcionais
qual é o estado mínimo para HEALTHY

Isso cria:
dependência oculta
comportamento diferente entre ambientes
Strict Mode que não é verdadeiramente restritivo

3) Princípio obrigatório

Nenhum módulo pode depender implicitamente de global.

Se precisa de logger/eventBus/router/config:
deve receber via port
ou declarar explicitamente no contrato

4) Contrato mínimo obrigatório de um Port crítico

Cada Port crítico deve expor:
healthCheck()
info()
isInitialized() (quando aplicável)
contrato de API documentado (mínimo de métodos)

Ports críticos:
router
auth/session
logger
eventBus
telemetry
config
globalState (se aplicável)

5) Strict Mode (obrigatório reforçar)

Strict Mode deve significar:
se Port obrigatório não existe → DEGRADED ou UNHEALTHY
proibir fallback automático silencioso para window.*
fallback só permitido se explicitamente documentado no contrato

6) Regras obrigatórias para o agente
6.1Eliminar fallback implícito

🚫 window.RouterGlobal direto
🚫 window.logger sem port
🚫 acessar window.__DEVTOOLS__ fora do contrato

Se for usar window:
deve constar no DEPENDENCY CONTRACT
deve ser gated por Strict Mode

6.2 Padronizar injeção

Módulos que precisam de ports devem:
aceitar via init(options) ou equivalente
expor injectPorts()
ter getPorts() consistente

6.3 HealthCheck dos Ports

Se módulo depende de port crítico:
healthCheck deve falhar se port indisponível
não pode retornar HEALTHY ignorando port

7) Auditoria obrigatória

O agente deve entregar:
lista dos ports críticos
lista de módulos que dependem deles
evidência de:
ausência de fallback indevido
uso consistente de inject/getPorts
relatório de inconsistências encontradas

8) Anti-padrões proibidos

🚫 usar global como fallback silencioso
🚫 Strict Mode que não altera comportamento
🚫 módulo crítico que ignora indisponibilidade de port
🚫 dependência circular entre ports

9) Benefício esperado

Após esta etapa:
inicialização do sistema fica previsível
erro de port é detectado cedo
ambiente de teste e produção convergem
Strict Mode passa a ter valor real

10) Definition of Done (DoD) — Parte 9
Concluída quando:
ports críticos têm contrato mínimo
fallback global foi auditado e restringido
Strict Mode detecta indisponibilidade real
healthCheck reflete indisponibilidade de port
relatório entregue

PARTE 10/10
Consolidação Final: Plano de Validação Empírica, Checklist P0–P2 e Entrega Formal
1) Objetivo
Encerrar o ciclo com:
validação técnica real (não declarativa)
checklist objetivo de conformidade
evidência empírica antes/depois
critério claro de aceite final

Sem essa etapa, todo o megabriefing vira apenas intenção.

2) Estrutura final de execução (ordem obrigatória)
O agente deve ter executado:
1. Padronização do DEPENDENCY CONTRACT
2. ETAPA 3 — Normalização de fetch.js + circuit-breaker.js
3. ETAPA 4 — VERSION nos módulos do escopo
4. Reforço de HealthCheck
5. Governança de Timers
6. Governança de AbortController
7. Unificação de Polling
8. Ports/DI + Strict Mode

Agora entra a fase de validação empírica consolidada.

3) Validação empírica obrigatória
O agente deve executar:
3.1 Verificação de contratos
100% dos módulos críticos com DEPENDENCY CONTRACT completo
100% dos módulos do escopo com VERSION + MODULE_ID

3.2 Verificação de fetch/circuit-breaker
Amostra mínima: 10 fetch + 10 circuit-breaker
Conferir:
formato de retorno unificado
suporte a signal
timeout consistente
retry consistente

3.3 Verificação de timers
Montar/desmontar módulo crítico
Confirmar:
nenhum setInterval continua rodando
destroy limpa timers

3.4 Verificação de AbortController
Simular navegação/unmount
Confirmar:
requests são abortadas
não existem controllers ativos após destroy

3.5 Verificação de polling
Minimizar aba → polling pausa
Logout → polling para
Unmount → polling encerra

3.6 Verificação de ports
Desabilitar port crítico (simulação)
Confirmar:
healthCheck detecta
Strict Mode reage
status vira DEGRADED ou UNHEALTHY

4) Checklist final P0 / P1 / P2
P0 (Obrigatório antes de qualquer nova feature)
Fetch/circuit-breaker padronizados
Abort governado
Timers sem órfãos
Polling sem concorrência crítica

P1 (Estrutural)
VERSION completo no escopo
Contratos uniformes
Ports consistentes

P2 (Elevação)
HealthCheck operacional real
Telemetria consistente
Strict Mode significativo

5) Relatório final obrigatório
O agente deve entregar:
1. Lista de arquivos modificados
2. Contagem antes/depois:
fetch normalizados
circuit-breakers normalizados
módulos com VERSION adicionada
3. Evidência de testes empíricos
4. Pontos fora do escopo (justificados)
5. Riscos remanescentes (se houver)

6) Critério de Aceite Final
O sistema pode ser considerado “elevado de nível” quando:
não degrada após horas de uso
navegação rápida não gera erros intermitentes
healthCheck reflete estados reais
timers/listeners/requests não sobrevivem indevidamente
ports críticos são explicitamente governados

7) Resultado esperado

Após as 10 partes executadas:
Arquitetura declarada ≈ arquitetura executada
Runtime previsível
Debug simplificado
Regressões detectáveis
Evolução sustentável