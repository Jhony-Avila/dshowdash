// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/modules-index
// PURPOSE: Exporta todos os modulos do core para facilitar imports
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * as Constants from ./constants.js
//   * as Types from ./types.js
//   * as FeatureFlags from ./feature-flags.js
//   BaseError, MountError, TimeoutError, ContractError, NetworkError, ConfigError, PluginError from ./errors/index.js
//   * as CircuitBreakerAPI from ./circuit-breaker-api.js
//   * as RetryWithJitter from ./retry-with-jitter.js
//   * as SelfHealing from ./self-healing.js
//   * as GracefulDegradation from ./graceful-degradation.js
//   * as ConfigValidator from ./config-validator.js
//   * as HeaderGateway from ./header-gateway.js
//   * as PluginSystem from ./plugin-system.js
//   * as HeaderCore from ./header-core.js
//   * as LazyLoader from ./lazy-loader.js
//   * as CacheManager from ./cache-manager.js
//   * as OrchestratorAdapter from ./orchestrator-adapter.js
//   * as ServiceWorkerBridge from ./service-worker-bridge.js
//   * as VirtualScroller from ./virtual-scroller.js
//   * as VersionManager from ./version-manager.js
//   * as Integrations from ./header-integrations.js
//   * as Bootstrap from ./bootstrap.js
//   * as DevTools from ./devtools.js
// PROVIDES:
//   VERSION, MODULE_ID — identificacao do modulo
//   listModules() — lista nomes de todos os modulos
//   info() — informacoes do modulo e contagem total
//   Re-exports de todos os modulos core
// ═══════════════════════════════════════════════════════════════

// Header - Modules Index
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B04: var → const
// Exporta todos os modulos do core para facilitar imports
'use strict';

// FASE 1 - Infraestrutura Base
export * as Constants from './constants.js';
export * as Types from './types.js';
export * as FeatureFlags from './feature-flags.js';
export { BaseError, MountError, TimeoutError, ContractError, NetworkError, ConfigError, PluginError } from './errors/index.js';

// FASE 2 - Robustez
export * as CircuitBreakerAPI from './circuit-breaker-api.js';
export * as RetryWithJitter from './retry-with-jitter.js';
export * as SelfHealing from './self-healing.js';
export * as GracefulDegradation from './graceful-degradation.js';
export * as ConfigValidator from './config-validator.js';

// FASE 3 - Arquitetura
export * as HeaderGateway from './header-gateway.js';
export * as PluginSystem from './plugin-system.js';
export * as HeaderCore from './header-core.js';
export * as LazyLoader from './lazy-loader.js';

// FASE 5 - Extras
export * as CacheManager from './cache-manager.js';
export * as OrchestratorAdapter from './orchestrator-adapter.js';
export * as ServiceWorkerBridge from './service-worker-bridge.js';
export * as VirtualScroller from './virtual-scroller.js';
export * as VersionManager from './version-manager.js';

// Integracao e Bootstrap
export * as Integrations from './header-integrations.js';
export * as Bootstrap from './bootstrap.js';
export * as DevTools from './devtools.js';

// Version
export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/modules-index';

// Helper para listar todos os modulos
export function listModules() {
  return [
    'Constants', 'Types', 'FeatureFlags', 'Errors',
    'CircuitBreakerAPI', 'RetryWithJitter', 'SelfHealing', 'GracefulDegradation', 'ConfigValidator',
    'HeaderGateway', 'PluginSystem', 'HeaderCore', 'LazyLoader',
    'CacheManager', 'OrchestratorAdapter', 'ServiceWorkerBridge', 'VirtualScroller', 'VersionManager',
    'Integrations', 'Bootstrap', 'DevTools'
  ];
}

// Info
export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    modules: listModules(),
    totalModules: listModules().length
  };
}