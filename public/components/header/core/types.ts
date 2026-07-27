
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/types
// PURPOSE: Centraliza todas as definições de tipos JSDoc do Header
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   VERSION — versão do módulo
//   MODULE_ID — identificador do módulo
//   Types — objeto com VERSION e MODULE_ID
//   JSDoc Typedefs: ComponentConfig, ComponentCapabilities,
//     ComponentInstance, LoadedComponent, HealthCheckResult,
//     AggregatedHealth, HealthSummary, ComponentHealthResult,
//     ContractValidation, ContractCompliance, GovernanceInfo,
//     ModuleGovernance, PortsSnapshot, PortsInterface,
//     ComponentLoaderMetrics, PollingMetrics, CircuitBreakerStatus,
//     CircuitBreakerOptions, FeatureFlags, FeatureFlagChange,
//     RegistryComponent, OrderInfo, HeaderError, Plugin, PluginHooks
// ═══════════════════════════════════════════════════════════════
// Header - Types (JSDoc Typedefs)
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B09: var → const
// Centraliza todas as definições de tipos JSDoc do Header
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/types';

// ═══════════════════════════════════════════════════════════════
// COMPONENT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} ComponentConfig
 * @property {string} name - Nome/key do componente
 * @property {string} [label] - Label legível
 * @property {string} region - Região: 'left' | 'center' | 'right'
 * @property {string} criticality - Criticidade: 'critical' | 'important' | 'optional'
 * @property {number} [timeout] - Timeout de mount em ms
 * @property {string} [componentType] - Tipo do componente
 * @property {string} [icon] - Ícone do componente
 * @property {string} [apiEndpoint] - Endpoint da API
 * @property {boolean} [pollingEnabled] - Se polling está ativo
 * @property {number} [pollingInterval] - Intervalo de polling em ms
 * @property {boolean} [showOnMobile] - Exibir em mobile
 * @property {boolean} [showOnTablet] - Exibir em tablet
 * @property {boolean} [showOnDesktop] - Exibir em desktop
 * @property {boolean} [isDraggable] - Se pode ser reordenado
 */

/**
 * @typedef {Object} ComponentCapabilities
 * @property {boolean} reorderable - Se pode ser reordenado
 * @property {boolean} hideable - Se pode ser ocultado
 * @property {boolean} critical - Se é crítico
 * @property {boolean} refreshable - Se pode ser atualizado
 * @property {boolean} configurable - Se tem configurações
 */

/**
 * @typedef {Object} ComponentInstance
 * @property {function} mount - Montar componente
 * @property {function} unmount - Desmontar componente
 * @property {function} [healthCheck] - Verificar saúde
 * @property {function} [info] - Obter informações
 * @property {function} [destroy] - Destruir componente
 * @property {string} [id] - ID do componente
 * @property {string} [VERSION] - Versão do componente
 * @property {ComponentCapabilities} [capabilities] - Capacidades
 */

/**
 * @typedef {Object} LoadedComponent
 * @property {ComponentInstance} instance - Instância do componente
 * @property {ComponentConfig} config - Configuração
 * @property {ContractValidation} contractValidation - Validação de contrato
 * @property {ModuleGovernance} governance - Governança
 * @property {HTMLElement} wrapper - Wrapper DOM
 */

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} HealthCheckResult
 * @property {string} status - 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY'
 * @property {number} score - Pontuação atual
 * @property {number} maxScore - Pontuação máxima
 * @property {string} scoreDisplay - Ex: '5/6'
 * @property {Object<string, boolean>} checks - Checks individuais
 * @property {string[]} [issues] - Issues encontradas
 * @property {string} version - Versão do módulo
 * @property {string} moduleId - ID do módulo
 * @property {boolean} portsInitialized - Se Ports foi inicializado
 * @property {string} timestamp - ISO timestamp
 */

/**
 * @typedef {Object} AggregatedHealth
 * @property {number} timestamp - Timestamp da agregação
 * @property {Object<string, ComponentHealthResult>} components - Health por componente
 * @property {HealthSummary} summary - Resumo
 * @property {number} overallScore - Score geral (0-100)
 * @property {string} overallStatus - Status geral
 */

/**
 * @typedef {Object} HealthSummary
 * @property {number} total - Total de componentes
 * @property {number} healthy - Componentes healthy
 * @property {number} degraded - Componentes degraded
 * @property {number} unhealthy - Componentes unhealthy
 * @property {number} noHealthCheck - Sem health check
 */

/**
 * @typedef {Object} ComponentHealthResult
 * @property {string} status - Status do componente
 * @property {number} score - Score calculado (0-1)
 * @property {string} source - Fonte do health check
 * @property {Object} [details] - Detalhes do health check
 * @property {number} checkedAt - Timestamp do check
 */

// ═══════════════════════════════════════════════════════════════
// CONTRACT TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} ContractValidation
 * @property {boolean} valid - Se contrato é válido
 * @property {string[]} issues - Issues encontradas
 * @property {string[]} warnings - Warnings
 * @property {string} componentName - Nome do componente
 * @property {ContractCompliance} compliance - Conformidade
 * @property {GovernanceInfo} governance - Info de governança
 */

/**
 * @typedef {Object} ContractCompliance
 * @property {number} required - Métodos requeridos implementados
 * @property {number} requiredTotal - Total de métodos requeridos
 * @property {number} recommended - Métodos recomendados implementados
 * @property {number} recommendedTotal - Total de recomendados
 */

/**
 * @typedef {Object} GovernanceInfo
 * @property {boolean} hasId - Se tem id
 * @property {boolean} hasVersion - Se tem VERSION
 * @property {boolean} hasCapabilities - Se tem capabilities
 * @property {ComponentCapabilities} capabilities - Capabilities resolvidas
 */

/**
 * @typedef {Object} ModuleGovernance
 * @property {string|null} id - ID do módulo
 * @property {ComponentCapabilities|null} capabilities - Capabilities
 * @property {string|null} version - Versão
 * @property {boolean} valid - Se governança é válida
 */

// ═══════════════════════════════════════════════════════════════
// PORTS TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} PortsSnapshot
 * @property {boolean} _initialized - Se foi inicializado
 * @property {Object} [logger] - Logger instance
 * @property {Object} [config] - Config object
 * @property {Object} [eventBus] - EventBus instance
 * @property {Object} [telemetry] - Telemetry instance
 * @property {Object} [routerGlobal] - Router global
 */

/**
 * @typedef {Object} PortsInterface
 * @property {function} init - Inicializar ports
 * @property {function} get - Obter port por nome
 * @property {function} inject - Injetar ports
 * @property {function} snapshot - Obter snapshot
 * @property {function} isInitialized - Verificar se inicializado
 */

// ═══════════════════════════════════════════════════════════════
// METRICS TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} ComponentLoaderMetrics
 * @property {number} loadCount - Contagem de loads
 * @property {number} unmountCount - Contagem de unmounts
 * @property {number} errorCount - Contagem de erros
 * @property {number} timeoutCount - Contagem de timeouts
 * @property {number} retryCount - Contagem de retries
 * @property {number|null} lastLoadAt - Último load
 * @property {string|null} registrySource - Fonte do registry
 * @property {number|null} registryLoadTime - Tempo de load do registry
 * @property {string|null} orderSource - Fonte da ordem
 * @property {number} governanceValidated - Componentes com governança válida
 */

/**
 * @typedef {Object} PollingMetrics
 * @property {number} totalHealthPolls - Total de polls de health
 * @property {number} totalHealthSuccess - Sucessos de health
 * @property {number} totalHealthFailures - Falhas de health
 * @property {number} totalAlertsPolls - Total de polls de alerts
 * @property {number} totalAlertsSuccess - Sucessos de alerts
 * @property {number} totalAlertsFailures - Falhas de alerts
 * @property {number} totalNetworkUpdates - Updates de network
 * @property {number} reconnectAttempts - Tentativas de reconexão
 * @property {number} currentBackoffIndex - Índice atual de backoff
 * @property {number|null} lastHealthPollAt - Último poll de health
 * @property {number|null} lastAlertsPollAt - Último poll de alerts
 * @property {number|null} lastNetworkUpdateAt - Último update de network
 * @property {number|null} startedAt - Início
 * @property {number|null} stoppedAt - Parada
 * @property {number} uptime - Tempo ativo em ms
 */

// ═══════════════════════════════════════════════════════════════
// CIRCUIT BREAKER TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} CircuitBreakerStatus
 * @property {boolean} isOpen - Se está aberto
 * @property {number} failures - Contagem de falhas
 * @property {number} maxFailures - Máximo de falhas
 * @property {number|null} lastFailureTime - Último tempo de falha
 */

/**
 * @typedef {Object} CircuitBreakerOptions
 * @property {number} [maxFailures=3] - Máximo de falhas antes de abrir
 * @property {number} [resetTimeout=60000] - Timeout para reset em ms
 * @property {string} [name] - Nome do circuit breaker
 */

// ═══════════════════════════════════════════════════════════════
// FEATURE FLAGS TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} FeatureFlags
 * @property {boolean} routerIntegration - Integração com router
 * @property {boolean} globalStateIntegration - Integração com GlobalState
 * @property {boolean} eventBusIntegration - Integração com EventBus
 * @property {boolean} appShellIntegration - Integração com AppShell
 * @property {boolean} telemetryEnabled - Telemetria ativa
 * @property {boolean} circuitBreakerEnabled - Circuit breaker ativo
 * @property {boolean} pollingEnabled - Polling ativo
 * @property {boolean} accessibilityEnabled - Acessibilidade ativa
 */

/**
 * @typedef {Object} FeatureFlagChange
 * @property {string} feature - Nome da feature
 * @property {boolean} previousValue - Valor anterior
 * @property {boolean} newValue - Novo valor
 * @property {number} timestamp - Timestamp da mudança
 */

// ═══════════════════════════════════════════════════════════════
// REGISTRY TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} RegistryComponent
 * @property {string} component_key - Key do componente
 * @property {string} component_type - Tipo do componente
 * @property {string} label - Label
 * @property {number} order_index - Índice de ordem
 * @property {string} group_position - Posição do grupo
 * @property {string|null} uarps_trigger_id - ID do trigger UARPS
 * @property {number} is_active - Se está ativo
 * @property {string} [icon_name] - Nome do ícone
 * @property {string} [api_endpoint] - Endpoint da API
 * @property {number} [polling_enabled] - Se polling está ativo
 * @property {number} [polling_interval] - Intervalo de polling
 * @property {number} [min_access_level] - Nível mínimo de acesso
 * @property {number} [show_on_mobile] - Exibir em mobile
 * @property {number} [show_on_tablet] - Exibir em tablet
 * @property {number} [show_on_desktop] - Exibir em desktop
 */

/**
 * @typedef {Object} OrderInfo
 * @property {string} source - 'user' | 'admin' | 'system' | 'fallback'
 * @property {number} count - Contagem de componentes
 * @property {number} timestamp - Timestamp
 */

// ═══════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} HeaderError
 * @property {string} name - Nome do erro
 * @property {string} message - Mensagem
 * @property {string} code - Código do erro
 * @property {string} [componentName] - Nome do componente relacionado
 * @property {Object} [context] - Contexto adicional
 * @property {number} timestamp - Timestamp
 */

// ═══════════════════════════════════════════════════════════════
// PLUGIN TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {Object} Plugin
 * @property {string} id - ID único do plugin
 * @property {string} version - Versão do plugin
 * @property {string} [name] - Nome legível
 * @property {string} [description] - Descrição
 * @property {function} init - Função de inicialização
 * @property {function} destroy - Função de destruição
 * @property {Object} [hooks] - Hooks disponíveis
 */

/**
 * @typedef {Object} PluginHooks
 * @property {function} [beforeMount] - Antes do mount
 * @property {function} [afterMount] - Depois do mount
 * @property {function} [beforeUnmount] - Antes do unmount
 * @property {function} [afterUnmount] - Depois do unmount
 * @property {function} [onError] - Em caso de erro
 * @property {function} [onHealthCheck] - Durante health check
 */

// ═══════════════════════════════════════════════════════════════
// EXPORT (para uso com typeof)
// ═══════════════════════════════════════════════════════════════
export const Types = {
  VERSION,
  MODULE_ID
};

export default Types;
