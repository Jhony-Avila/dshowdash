// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/components-lazy-integration
// PURPOSE: Integrates LazyLoader with ComponentsLoader, feature-flag gated
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   * as LazyLoader from ./lazy-loader.js
//   * as FeatureFlags from ./feature-flags.js
// PROVIDES:
//   init(componentsLoader, config) — initialize lazy integration
//   loadComponent(componentName) — lazy or direct load a component
//   loadRegion(regionName) — load a region via lazy loader
//   loadAllRegions() — load all regions
//   startObserving() — start IntersectionObserver for regions
//   stopObserving() — stop observing regions
//   isLoaded(componentName) — check if component is loaded
//   preload(componentName) — preload a single component
//   preloadMultiple(componentNames) — preload multiple components
//   getMetrics() — return metrics
//   resetMetrics() — reset metrics
//   healthCheck() — return health status
//   info() — return module info
//   injectPorts(p) — inject dependency ports
//   getPorts() — get ports snapshot
// ═══════════════════════════════════════════════════════════════
// Header - Components Lazy Integration
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B09: var → const/let
// @description Integra LazyLoader com components-loader existente
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import * as LazyLoader from './lazy-loader.js';
import * as FeatureFlags from './feature-flags.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/components-lazy-integration';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error' && logger.error) logger.error(prefix, args.join(' ')); else if (level === 'warn' && logger.warn) logger.warn(prefix, args.join(' ')); else if (level === 'info' && logger.info) logger.info(prefix, args.join(' ')); };

let _componentsLoader: Record<string,unknown>|null = null;
let _initialized = false;
let _lazyEnabled = false;

const _metrics = {
  lazyLoadedCount: 0,
  eagerLoadedCount: 0,
  failedLoads: 0,
  lastLoadAt: (null as unknown|null)
};

export function init(componentsLoader: Record<string,unknown>, config: Record<string,unknown>) {
  if (_initialized) return;
  
  _initPorts();
  _componentsLoader = componentsLoader;
  
  _lazyEnabled = FeatureFlags.isEnabled('lazyLoadingEnabled');
  
  if (!_lazyEnabled) {
    _log('info', 'Lazy loading desabilitado via feature flag');
    _initialized = true;
    return;
  }
  
  LazyLoader.init(componentsLoader, {
    eagerLoadCritical: true,
    lazyLoadThreshold: 0.1,
    loadTimeout: 10000,
    parallelLoads: 3,
    priorityOrder: ['right', 'left', 'center']
  });
  
  _initialized = true;
  _log('info', 'Lazy integration inicializada');
}

export function loadComponent(componentName: string) {
  if (!_initialized || !_lazyEnabled) {
    return _loadDirect(componentName);
  }
  
  _metrics.lastLoadAt = Date.now();
  
  return LazyLoader.lazyLoad(componentName).then((result: unknown) => {
    // @ts-expect-error TS migration - TS2339
    if (result.success) {
      _metrics.lazyLoadedCount++;
      _log('info', 'Componente lazy-loaded:', componentName);
    }
    return result;
  }).catch((error: unknown) => {
    _metrics.failedLoads++;
    // @ts-expect-error TS migration - TS2339
    _log('error', 'Falha ao lazy-load:', componentName, error.message);
    return _loadDirect(componentName);
  });
}

function _loadDirect(componentName: string) {
  if (!_componentsLoader) {
    return Promise.reject(new Error('ComponentsLoader nao disponivel'));
  }
  
  let config = null;
  if (_componentsLoader.componentsList) {
    // @ts-expect-error TS migration - TS2339
    config = _componentsLoader.componentsList.find((c: unknown) => c.name === componentName);
  }
  
  if (!config) {
    return Promise.reject(new Error(`Componente nao encontrado: ${componentName}`));
  }
  
  _metrics.eagerLoadedCount++;
  // @ts-expect-error TS migration - TS2349
  return _componentsLoader.loadComponent(config).then((instance: Record<string,unknown>) => ({
    name: componentName,
    success: !!instance,
    instance
  }));
}

export function loadRegion(regionName: string) {
  if (!_lazyEnabled) {
    _log('warn', 'Lazy loading desabilitado');
    return Promise.resolve([]);
  }
  
  return LazyLoader.loadRegion(regionName);
}

export function loadAllRegions() {
  if (!_lazyEnabled) {
    _log('warn', 'Lazy loading desabilitado');
    return Promise.resolve({ regions: [], totalComponents: 0 });
  }
  
  return LazyLoader.loadAll();
}

export function startObserving() {
  if (!_lazyEnabled) return;
  LazyLoader.observeRegions();
  _log('info', 'Observacao de regioes iniciada');
}

export function stopObserving() {
  LazyLoader.unobserveRegions();
}

export function isLoaded(componentName: string) {
  return LazyLoader.isComponentLoaded(componentName);
}

export function preload(componentName: string) {
  if (!_lazyEnabled) return Promise.resolve();
  return loadComponent(componentName);
}

export function preloadMultiple(componentNames: unknown) {
  // @ts-expect-error TS migration - TS2339, TS7011
  return Promise.all(componentNames.map((name: string) => preload(name).catch(() => null)));
}

export function getMetrics() {
  const lazyMetrics = _lazyEnabled ? LazyLoader.getMetrics() : {};
  return Object.assign({}, _metrics, { lazy: lazyMetrics, enabled: _lazyEnabled });
}

export function resetMetrics() {
  _metrics.lazyLoadedCount = 0;
  _metrics.eagerLoadedCount = 0;
  _metrics.failedLoads = 0;
  _metrics.lastLoadAt = null;
}

export function healthCheck() {
  const checks = {
    initialized: _initialized,
    hasComponentsLoader: !!_componentsLoader,
    lazyLoaderHealthy: _lazyEnabled ? (LazyLoader.healthCheck().status !== 'UNHEALTHY') : true,
    lowFailureRate: (_metrics.lazyLoadedCount + _metrics.eagerLoadedCount) === 0 || 
      (_metrics.failedLoads / (_metrics.lazyLoadedCount + _metrics.eagerLoadedCount + _metrics.failedLoads)) < 0.2,
    portsInitialized: Ports.isInitialized()
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    lazyEnabled: _lazyEnabled,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    lazyEnabled: _lazyEnabled,
    metrics: getMetrics(),
    lazyLoaderStatus: _lazyEnabled ? LazyLoader.getAllRegionsStatus() : null,
    healthCheck: healthCheck()
  };
}

export default {
  VERSION,
  MODULE_ID,
  init,
  loadComponent,
  loadRegion,
  loadAllRegions,
  startObserving,
  stopObserving,
  isLoaded,
  preload,
  preloadMultiple,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
