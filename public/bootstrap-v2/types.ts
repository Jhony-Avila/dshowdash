
/**
 * Bootstrap-V2 Type Definitions (JSDoc)
 * @version 1.0.1-CONTRACTS
 * @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
 * @description Documentação completa de tipos e APIs do Bootstrap-V2
 * @module bootstrap-v2/types
 */
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (pure type definitions — zero runtime code)
// PROVIDES: JSDoc type definitions for Bootstrap-V2 APIs
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * @typedef {Object} BootstrapV2Instance
 * @property {string} VERSION - Versão do Bootstrap (ex: "3.0.0-COMPLETE")
 * @property {string} LOADER_VERSION - Versão do Loader (ex: "6.0.0-COMPLETE")
 * @property {boolean} ENTERPRISE - Flag de recursos Enterprise
 * @property {boolean} ROBUST - Flag de recursos Robust
 * @property {boolean} OBSERVABILITY - Flag de recursos Observability
 * @property {boolean} QUALITY - Flag de recursos Quality
 * @property {boolean} PERSISTENCE - Flag de recursos Persistence
 * @property {boolean} OBSERVABILITY_ADVANCED - Flag de recursos Observability Advanced
 * @property {boolean} RESILIENCE_ADVANCED - Flag de recursos Resilience Advanced
 * @property {boolean} PERFORMANCE - Flag de recursos Performance
 */

/**
 * @typedef {'idle'|'booting'|'ready'|'error'|'shutdown'} BootState
 */

/**
 * @typedef {Object} BootResult
 * @property {boolean} success - Se o boot foi bem-sucedido
 * @property {number} duration - Duração em ms
 * @property {string[]} phasesCompleted - IDs das fases completadas
 * @property {Object[]} errors - Erros ocorridos
 * @property {Object} metrics - Métricas do boot
 */

/**
 * @typedef {Object} HealthStatus
 * @property {'HEALTHY'|'DEGRADED'|'UNHEALTHY'} status - Status geral
 * @property {number} score - Score de 0 a 100
 * @property {Object} checks - Checks individuais
 * @property {string[]} issues - Lista de problemas encontrados
 */

/**
 * @typedef {Object} BootHistoryEntry
 * @property {string} id - ID único do boot
 * @property {number} timestamp - Timestamp do boot
 * @property {boolean} success - Se foi bem-sucedido
 * @property {number} duration - Duração em ms
 * @property {string} version - Versão do Bootstrap
 * @property {Object} [error] - Erro se falhou
 */

// ============================================================================
// CORE APIs
// ============================================================================

/**
 * Inicia o processo de boot do sistema
 * @function boot
 * @returns {Promise<BootResult>} Resultado do boot
 * @example
 * const result = await BootstrapV2.boot();
 * console.log(result.success, result.duration);
 */

/**
 * Retorna o estado atual do boot
 * @function getState
 * @returns {BootState} Estado atual
 * @example
 * const state = BootstrapV2.getState(); // 'ready'
 */

/**
 * Verifica se o sistema está pronto
 * @function isReady
 * @returns {boolean} True se ready
 * @example
 * if (BootstrapV2.isReady()) { /* iniciar app *\/ }
 */

/**
 * Executa health check completo
 * @function healthCheck
 * @returns {HealthStatus} Status de saúde do sistema
 * @example
 * const health = BootstrapV2.healthCheck();
 * console.log(health.status); // 'HEALTHY'
 */

/**
 * Retorna informações sobre o sistema
 * @function info
 * @returns {Object} Informações detalhadas
 * @example
 * const info = BootstrapV2.info();
 * console.log(info.version, info.features);
 */

// ============================================================================
// SPRINT 5 - PERSISTENCE APIs
// ============================================================================

/**
 * Retorna informações do boot atual
 * @function getCurrentBoot
 * @returns {BootHistoryEntry|null} Boot atual ou null
 * @example
 * const current = BootstrapV2.getCurrentBoot();
 */

/**
 * Retorna o último boot bem-sucedido
 * @function getLastSuccessfulBoot
 * @returns {BootHistoryEntry|null} Último boot OK ou null
 * @example
 * const last = BootstrapV2.getLastSuccessfulBoot();
 */

/**
 * Retorna histórico completo de boots
 * @function getBootHistory
 * @param {number} [limit=10] - Limite de entradas
 * @returns {BootHistoryEntry[]} Lista de boots
 * @example
 * const history = BootstrapV2.getBootHistory(5);
 */

/**
 * Analisa o histórico de boots
 * @function analyzeBootHistory
 * @returns {Object} Análise com métricas e tendências
 * @example
 * const analysis = BootstrapV2.analyzeBootHistory();
 * console.log(analysis.successRate, analysis.avgDuration);
 */

/**
 * Ativa modo debug com logs detalhados
 * @function enableDebug
 * @returns {void}
 * @example
 * BootstrapV2.enableDebug();
 */

/**
 * Desativa modo debug
 * @function disableDebug
 * @returns {void}
 * @example
 * BootstrapV2.disableDebug();
 */

// ============================================================================
// SPRINT 7 - OBSERVABILITY ADVANCED APIs
// ============================================================================

/**
 * @typedef {Object} ModuleEvent
 * @property {string} moduleId - ID do módulo
 * @property {string} event - Tipo do evento
 * @property {number} timestamp - Timestamp
 * @property {Object} [data] - Dados adicionais
 */

/**
 * Objeto para gerenciar eventos de módulos
 * @type {Object}
 * @property {function(string, string, Object): void} emit - Emite evento
 * @property {function(string, function): function} on - Registra listener
 * @property {function(): ModuleEvent[]} getHistory - Retorna histórico
 */

/**
 * Retorna histórico de eventos de módulos
 * @function getModuleEventHistory
 * @param {string} [moduleId] - Filtrar por módulo
 * @returns {ModuleEvent[]} Lista de eventos
 * @example
 * const events = BootstrapV2.getModuleEventHistory('phase-1');
 */

/**
 * Retorna timeline de um módulo específico
 * @function getModuleTimeline
 * @param {string} phaseId - ID da fase
 * @returns {Object} Timeline com eventos ordenados
 * @example
 * const timeline = BootstrapV2.getModuleTimeline('phase-2');
 */

/**
 * Exporta spans no formato OpenTelemetry
 * @function exportOtelSpans
 * @returns {Object[]} Array de spans OTLP
 * @example
 * const spans = BootstrapV2.exportOtelSpans();
 * // Enviar para backend de observabilidade
 */

/**
 * Exporta métricas no formato OpenTelemetry
 * @function exportOtelMetrics
 * @returns {Object[]} Array de métricas OTLP
 * @example
 * const metrics = BootstrapV2.exportOtelMetrics();
 */

// ============================================================================
// SPRINT 8 - RESILIENCE ADVANCED APIs
// ============================================================================

/**
 * @typedef {Object} NetworkInfo
 * @property {string} effectiveType - Tipo de conexão (4g, 3g, 2g, slow-2g)
 * @property {number} downlink - Velocidade em Mbps
 * @property {number} rtt - Round-trip time em ms
 * @property {boolean} saveData - Se modo economia está ativo
 */

/**
 * Retorna informações da rede atual
 * @function getNetworkInfo
 * @returns {NetworkInfo} Info da rede
 * @example
 * const net = BootstrapV2.getNetworkInfo();
 * console.log(net.effectiveType); // '4g'
 */

/**
 * Calcula timeout ajustado baseado na rede
 * @function calculateAdjustedTimeout
 * @param {number} baseMs - Timeout base em ms
 * @returns {number} Timeout ajustado
 * @example
 * const timeout = BootstrapV2.calculateAdjustedTimeout(5000);
 * // Retorna 5000 em 4G, 10000 em 3G, etc.
 */

/**
 * Valida integridade do manifest de boot
 * @function validateManifestIntegrity
 * @returns {Object} Resultado da validação
 * @example
 * const result = BootstrapV2.validateManifestIntegrity();
 * if (!result.valid) console.error(result.errors);
 */

/**
 * Executa rollback de uma fase específica
 * @function rollbackPhase
 * @param {string} phaseId - ID da fase
 * @returns {Promise<boolean>} Se rollback foi bem-sucedido
 * @example
 * await BootstrapV2.rollbackPhase('phase-3');
 */

/**
 * Executa rollback até uma fase específica
 * @function rollbackToPhase
 * @param {string} phaseId - ID da fase destino
 * @returns {Promise<boolean>} Se rollback foi bem-sucedido
 * @example
 * await BootstrapV2.rollbackToPhase('phase-2');
 */

// ============================================================================
// SPRINT 9 - PERFORMANCE APIs
// ============================================================================

/**
 * Registra um módulo para lazy loading
 * @function registerLazyModule
 * @param {string} id - ID do módulo
 * @param {function(): Promise<any>} loader - Função de carregamento
 * @returns {void}
 * @example
 * BootstrapV2.registerLazyModule('analytics', () => import('./analytics.js'));
 */

/**
 * Carrega um módulo lazy registrado
 * @function lazyLoad
 * @param {string} moduleId - ID do módulo
 * @returns {Promise<any>} Módulo carregado
 * @example
 * const analytics = await BootstrapV2.lazyLoad('analytics');
 */

/**
 * Cancela o boot em andamento
 * @function cancelBoot
 * @param {string} [reason] - Motivo do cancelamento
 * @returns {boolean} Se cancelamento foi aceito
 * @example
 * if (userNavigatedAway) {
 *   BootstrapV2.cancelBoot('user-navigation');
 * }
 */

/**
 * Verifica se o boot pode ser cancelado
 * @function canCancelBoot
 * @returns {boolean} True se pode cancelar
 * @example
 * if (BootstrapV2.canCancelBoot()) { /* mostrar botão cancelar *\/ }
 */

/**
 * Reinicializa uma fase específica
 * @function reinitPhase
 * @param {string} phaseId - ID da fase
 * @returns {Promise<boolean>} Se reinit foi bem-sucedido
 * @example
 * await BootstrapV2.reinitPhase('phase-4-main');
 */

/**
 * Reinicializa a partir de uma fase
 * @function reinitFrom
 * @param {string} phaseId - ID da fase inicial
 * @returns {Promise<boolean>} Se reinit foi bem-sucedido
 * @example
 * await BootstrapV2.reinitFrom('phase-3');
 */

// ============================================================================
// CIRCUIT BREAKER APIs
// ============================================================================

/**
 * @typedef {Object} CircuitBreakerStatus
 * @property {'CLOSED'|'OPEN'|'HALF_OPEN'} state - Estado do breaker
 * @property {number} failures - Contagem de falhas
 * @property {number} successes - Contagem de sucessos
 * @property {number} lastFailure - Timestamp da última falha
 */

/**
 * Retorna status de todos os circuit breakers
 * @function getCircuitBreakerStatus
 * @returns {Object<string, CircuitBreakerStatus>} Map de status
 * @example
 * const status = BootstrapV2.getCircuitBreakerStatus();
 * console.log(status['phase-3'].state); // 'CLOSED'
 */

/**
 * Obtém ou cria um circuit breaker
 * @function getCircuitBreaker
 * @param {string} moduleId - ID do módulo
 * @param {Object} [config] - Configuração opcional
 * @returns {Object} Instância do circuit breaker
 * @example
 * const breaker = BootstrapV2.getCircuitBreaker('my-module');
 * await breaker.execute(() => fetch('/api'));
 */

// ============================================================================
// KERNEL APIs
// ============================================================================

/**
 * @typedef {'minimal'|'standard'|'full'|'degraded'} KernelMode
 */

/**
 * Retorna instância do Kernel
 * @function getKernel
 * @returns {Object} Instância do Kernel
 * @example
 * const kernel = BootstrapV2.getKernel();
 * console.log(kernel.getMode()); // 'standard'
 */

/**
 * Retorna StateMachine do boot
 * @function getStateMachine
 * @returns {Object} Instância da StateMachine
 * @example
 * const sm = BootstrapV2.getStateMachine();
 * sm.subscribe((state) => console.log('State:', state));
 */

// ============================================================================
// DEGRADATION NOTIFIER APIs
// ============================================================================

/**
 * @typedef {Object} DegradationNotification
 * @property {string} id - ID único
 * @property {string} type - Tipo (warning, error, critical)
 * @property {string} message - Mensagem
 * @property {number} timestamp - Timestamp
 * @property {Object} [data] - Dados adicionais
 */

/**
 * Retorna notificações ativas
 * @function getActiveNotifications
 * @returns {DegradationNotification[]} Lista de notificações
 * @example
 * const notifications = BootstrapV2.getActiveNotifications();
 */

/**
 * Descarta uma notificação
 * @function dismissNotification
 * @param {string} id - ID da notificação
 * @returns {boolean} Se foi descartada
 * @example
 * BootstrapV2.dismissNotification('notif-123');
 */

/**
 * Descarta todas as notificações
 * @function dismissAllNotifications
 * @returns {number} Quantidade descartada
 * @example
 * const count = BootstrapV2.dismissAllNotifications();
 */

// ============================================================================
// EXPORTS
// ============================================================================

export var VERSION = '1.0.1-CONTRACTS';
export var MODULE_ID = 'bootstrap-v2-types';

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    description: 'JSDoc Type Definitions for Bootstrap-V2',
    sections: [
      'Core Types',
      'Core APIs',
      'Sprint 5 - Persistence',
      'Sprint 7 - Observability Advanced',
      'Sprint 8 - Resilience Advanced',
      'Sprint 9 - Performance',
      'Circuit Breaker',
      'Kernel',
      'Degradation Notifier'
    ]
  };
}

export default { VERSION: VERSION, MODULE_ID: MODULE_ID, info: info };
