// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core
// PURPOSE: Ponto de entrada centralizado - exporta todos os modulos core do Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * as Constants from ./constants.js
//   * as Types from ./types.js
//   * as FeatureFlags from ./feature-flags.js
//   * as FeatureFlagsSync from ./feature-flags-sync.js
//   * as CircuitBreaker from ./circuit-breaker.js
//   * as CircuitBreakerAPI from ./circuit-breaker-api.js
//   * as CircuitBreakerUnified from ./circuit-breaker-unified.js
//   * as RetryWithJitter from ./retry-with-jitter.js
//   * as GracefulDegradation from ./graceful-degradation.js
//   * as SelfHealing from ./self-healing.js
//   * as ComponentsSelfHealing from ./components-self-healing.js
//   * as HealthAggregator from ./health-aggregator.js
//   * as HealthScheduler from ./health-scheduler.js
//   * as ConfigValidator from ./config-validator.js
//   * as HeaderGateway from ./header-gateway.js
//   * as CacheManager from ./cache-manager.js
//   * as Lifecycle from ./lifecycle.js
//   * as Helpers from ./helpers.js
//   * as MountHandler from ./mount-handler.js
//   * as UnmountHandler from ./unmount-handler.js
//   * as ComponentsLoader from ./components-loader.js
//   * as ComponentsLazyIntegration from ./components-lazy-integration.js
//   * as ComponentFallbackUI from ./component-fallback-ui.js
//   * as LazyLoader from ./lazy-loader.js
//   * as Polling from ./polling.js
//   * as PollingWithDegradation from ./polling-with-degradation.js
//   * as HeaderIntegrations from ./header-integrations.js
//   * as OrchestratorAdapter from ./orchestrator-adapter.js
//   * as VersionManager from ./version-manager.js
//   * as PluginSystem from ./plugin-system.js
// PROVIDES:
//   VERSION, MODULE_ID — identificacao do modulo
//   modules — array com nomes de todos os modulos
//   info() — informacoes do modulo e contagem
//   Re-exports de todos os modulos core
// ═══════════════════════════════════════════════════════════════

// Header Core - Module Index
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B04: var → const
// Exporta todos os modulos core do Header
// Ponto de entrada centralizado
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core';

// Fundamentais
export * as Constants from './constants.js';
export * as Types from './types.js';
export * as FeatureFlags from './feature-flags.js';
export * as FeatureFlagsSync from './feature-flags-sync.js';

// Resiliencia
export * as CircuitBreaker from './circuit-breaker.js';
export * as CircuitBreakerAPI from './circuit-breaker-api.js';
export * as CircuitBreakerUnified from './circuit-breaker-unified.js';
export * as RetryWithJitter from './retry-with-jitter.js';
export * as GracefulDegradation from './graceful-degradation.js';

// Self-Healing
export * as SelfHealing from './self-healing.js';
export * as ComponentsSelfHealing from './components-self-healing.js';
export * as HealthAggregator from './health-aggregator.js';
export * as HealthScheduler from './health-scheduler.js';

// Gateway e Cache
export * as ConfigValidator from './config-validator.js';
export * as HeaderGateway from './header-gateway.js';
export * as CacheManager from './cache-manager.js';

// Lifecycle
export * as Lifecycle from './lifecycle.js';
export * as Helpers from './helpers.js';
export * as MountHandler from './mount-handler.js';
export * as UnmountHandler from './unmount-handler.js';

// Componentes
export * as ComponentsLoader from './components-loader.js';
export * as ComponentsLazyIntegration from './components-lazy-integration.js';
export * as ComponentFallbackUI from './component-fallback-ui.js';
export * as LazyLoader from './lazy-loader.js';

// Polling
export * as Polling from './polling.js';
export * as PollingWithDegradation from './polling-with-degradation.js';

// Integracao
export * as HeaderIntegrations from './header-integrations.js';
export * as OrchestratorAdapter from './orchestrator-adapter.js';
export * as VersionManager from './version-manager.js';
export * as PluginSystem from './plugin-system.js';

// Module list
export const modules = [
  'constants', 'types', 'feature-flags', 'feature-flags-sync',
  'circuit-breaker', 'circuit-breaker-api', 'circuit-breaker-unified',
  'retry-with-jitter', 'graceful-degradation',
  'self-healing', 'components-self-healing', 'health-aggregator', 'health-scheduler',
  'config-validator', 'header-gateway', 'cache-manager',
  'lifecycle', 'helpers', 'mount-handler', 'unmount-handler',
  'components-loader', 'components-lazy-integration', 'component-fallback-ui', 'lazy-loader',
  'polling', 'polling-with-degradation',
  'header-integrations', 'orchestrator-adapter', 'version-manager', 'plugin-system'
];

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    modules,
    totalModules: modules.length
  };
}

export default {
  VERSION,
  MODULE_ID,
  modules,
  info
};