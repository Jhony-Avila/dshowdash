
// MainKernel Lazy Loader
// @version 1.2.0-HEALTH-CONTRACT
// @description Carregamento lazy de features baseado em rotas/painéis
// @changelog v1.2.0-HEALTH-CONTRACT - healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v1.1.1-CONTRACTS - Dependency Contract formalizado
// @changelog v1.1.0-LOGGING - Convertido console.log para sistema de logging interno
// @changelog v1.0.0-ENTERPRISE - Initial version
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// RECEIVES: kernel instance via init(kernel, options)
// PROVIDES: init(), destroy(), loadFeaturesForRoute(), loadFeature(),
//   preloadFeature(), preloadForRoute(), setRouteFeatures(),
//   addRouteFeature(), getRouteMap(), isFeatureLoaded(), getLoadedFeatures()
// WINDOW ACCESS:
//   (window as any).lazyLoader — LEGÍTIMO: debug/dev helper (created in init, removed in destroy)
//   document.createElement('link') — LEGÍTIMO: prefetch preloading
//   performance.now() — timing
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

// Types
interface KernelLike {
  getFeature?: (id: string) => { ok: boolean; data?: { status: string } };
  enableFeature: (id: string, context: Record<string, unknown>) => { ok: boolean; errors?: string[] };
  registerFeature: (config: Record<string, unknown>) => { ok: boolean; errors?: string[] };
  [key: string]: unknown;
}

interface LazyLoaderInitOptions {
  config?: Partial<typeof _config>;
  routeMap?: Record<string, string[]>;
  logLevel?: string | number;
}

interface FeatureLoadOptions {
  path?: string;
  context?: Record<string, unknown>;
}

export var MODULE_ID = 'main-kernel-lazy-loader';
export var VERSION = '1.2.0-HEALTH-CONTRACT';

var _kernel: KernelLike | null = null;
var _enabled = false;
var _routeFeatureMap = new Map();
var _loadedFeatures = new Set();
var _pendingLoads = new Map();

var _config = {
  preloadOnHover: true,
  hoverDelayMs: 200,
  loadTimeoutMs: 10000,
  logLevel: 1
};

var _metrics = {
  lazyLoadsTriggered: 0,
  lazyLoadsCompleted: 0,
  lazyLoadsFailed: 0,
  preloadsTriggered: 0,
  cacheHits: 0,
  totalLoadTimeMs: 0
};

// ═══════════════════════════════════════════════════════════════
// INTERNAL LOGGING
// ═══════════════════════════════════════════════════════════════

var LOG_LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };

function _log(level: string, msg: string, data?: unknown) {
  var levelNum = LOG_LEVELS[level] || 1;
  if (levelNum < _config.logLevel) return;
  
  var prefix = '[LazyLoader]';
  var fullMsg = prefix + ' ' + msg;
  
  if (level === 'error') {
    console.error(fullMsg, data !== undefined ? data : '');
  } else if (level === 'warn') {
    console.warn(fullMsg, data !== undefined ? data : '');
  } else if (level === 'debug') {
    console.debug(fullMsg, data !== undefined ? data : '');
  } else {
    console.debug(fullMsg, data !== undefined ? data : '');
  }
}

export function setLogLevel(level: string | number) {
  if (typeof level === 'string') {
    _config.logLevel = LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : 1;
  } else if (typeof level === 'number') {
    _config.logLevel = level;
  }
  return _config.logLevel;
}

// ═══════════════════════════════════════════════════════════════
// ROUTE-FEATURE MAPPING
// ═══════════════════════════════════════════════════════════════

var DEFAULT_ROUTE_MAP: Record<string, string[]> = {
  'panel-1': [],
  'panel-2': [],
  'panel-3': [],
  'panel-4': [],
  'panel-5': [],
  'panel-6': [],
  'panel-7': [],
  'panel-8': [],
  'panel-9': [],
  'panel-10': [],
  'panel-11': [],
  'panel-12': ['analytics-tracker'],
  'panel-13': [],
  'panel-14': [],
  'panel-15': [],
  'settings': ['ux-feedback'],
  'admin': ['analytics-tracker', 'session-sync']
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function init(kernel: KernelLike, options: LazyLoaderInitOptions) {
  if (!kernel) return { ok: false, error: 'Kernel required' };
  
  _kernel = kernel;
  
  if (options) {
    if (options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    if (options.routeMap) {
      for (var route in options.routeMap) {
        if (options.routeMap.hasOwnProperty(route)) {
          _routeFeatureMap.set(route, options.routeMap[route]);
        }
      }
    }
    if (options.logLevel !== undefined) {
      setLogLevel(options.logLevel);
    }
  }
  
  for (var r in DEFAULT_ROUTE_MAP) {
    if (DEFAULT_ROUTE_MAP.hasOwnProperty(r) && !_routeFeatureMap.has(r)) {
      _routeFeatureMap.set(r, DEFAULT_ROUTE_MAP[r]);
    }
  }
  
  _enabled = true;
  
  if (typeof window !== 'undefined') {
    (window as any).lazyLoader = {
      loadForRoute: loadFeaturesForRoute,
      preload: preloadFeature,
      isLoaded: isFeatureLoaded,
      getMap: getRouteMap,
      status: getStatus,
      setLogLevel: setLogLevel
    };
  }
  
  return { ok: true, version: VERSION, routesMapped: _routeFeatureMap.size };
}

export function destroy() {
  _kernel = null;
  _enabled = false;
  _routeFeatureMap.clear();
  _loadedFeatures.clear();
  _pendingLoads.clear();
  
  if (typeof window !== 'undefined') {
    delete (window as any).lazyLoader;
  }
  
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// LAZY LOADING
// ═══════════════════════════════════════════════════════════════

export async function loadFeaturesForRoute(route: string, options: FeatureLoadOptions) {
  if (!_enabled || !_kernel) {
    return { ok: false, error: 'Lazy loader not initialized' };
  }
  
  var featureIds = _routeFeatureMap.get(route) || [];
  
  if (featureIds.length === 0) {
    return { ok: true, route: route, features: [] as string[], message: 'No features mapped' };
  }
  
  var results = [];
  
  for (var i = 0; i < featureIds.length; i++) {
    var featureId = featureIds[i];
    var result = await loadFeature(featureId, options);
    results.push(result);
  }
  
  var succeeded = results.filter(function(r) { return r.ok; }).length;
  
  return {
    ok: succeeded === results.length,
    route: route,
    features: featureIds,
    results: results,
    succeeded: succeeded,
    failed: results.length - succeeded
  };
}

export async function loadFeature(featureId: string, options: FeatureLoadOptions) {
  if (!_enabled || !_kernel) {
    return { ok: false, error: 'Lazy loader not initialized' };
  }
  
  if (_loadedFeatures.has(featureId)) {
    _metrics.cacheHits++;
    return { ok: true, featureId: featureId, cached: true };
  }
  
  if (_pendingLoads.has(featureId)) {
    return _pendingLoads.get(featureId);
  }
  
  _metrics.lazyLoadsTriggered++;
  var startTime = performance.now();
  
  var loadPromise = _doLoadFeature(featureId, options, startTime);
  _pendingLoads.set(featureId, loadPromise);
  
  try {
    var result = await loadPromise;
    return result;
  } finally {
    _pendingLoads.delete(featureId);
  }
}

async function _doLoadFeature(featureId: string, options: FeatureLoadOptions, startTime: number) {
  var opts = options || {};
  
  try {
    var featureStatus = _kernel!.getFeature ? _kernel!.getFeature(featureId) : null;
    
    if (featureStatus && featureStatus.ok && featureStatus.data) {
      if (featureStatus.data.status !== 'enabled') {
        var enableResult = _kernel!.enableFeature(featureId, opts.context || {});
        if (!enableResult.ok) {
          throw new Error('Failed to enable: ' + JSON.stringify(enableResult.errors));
        }
      }
    } else {
      var featurePath = opts.path || ('../features/' + featureId + '/index.js');
      
      var featureModule: Record<string, any> = await _loadWithTimeout(
        import(featurePath),
        _config.loadTimeoutMs,
        featureId
      );
      
      var registerResult = _kernel!.registerFeature({
        id: featureId,
        version: (featureModule.VERSION || (featureModule.default && featureModule.default.VERSION)) || '1.0.0',
        init: featureModule.init || (featureModule.default && featureModule.default.init),
        cleanup: featureModule.destroy || featureModule.cleanup || (featureModule.default && featureModule.default.destroy),
        healthCheck: featureModule.healthCheck || (featureModule.default && featureModule.default.healthCheck)
      });
      
      if (!registerResult.ok) {
        throw new Error('Failed to register: ' + JSON.stringify(registerResult.errors));
      }
      
      var enableResult = _kernel!.enableFeature(featureId, opts.context || {});
      if (!enableResult.ok) {
        throw new Error('Failed to enable: ' + JSON.stringify(enableResult.errors));
      }
    }
    
    var duration = Math.round(performance.now() - startTime);
    _metrics.lazyLoadsCompleted++;
    _metrics.totalLoadTimeMs += duration;
    _loadedFeatures.add(featureId);
    
    _log('info', '✅ Loaded: ' + featureId + ' (' + duration + 'ms)');
    
    return { ok: true, featureId: featureId, duration: duration };
    
  } catch (e: any) {
    var duration = Math.round(performance.now() - startTime);
    _metrics.lazyLoadsFailed++;
    
    _log('error', '❌ Failed to load: ' + featureId, e);
    
    return { ok: false, featureId: featureId, error: e.message, duration: duration };
  }
}

function _loadWithTimeout<T>(promise: Promise<T>, timeoutMs: number, featureId: string): Promise<T> {
  return new Promise(function(resolve, reject) {
    var timer = setTimeout(function() {
      reject(new Error('Load timeout for ' + featureId + ' after ' + timeoutMs + 'ms'));
    }, timeoutMs);
    
    promise
      .then(function(result) {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(function(error) {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// ═══════════════════════════════════════════════════════════════
// PRELOADING
// ═══════════════════════════════════════════════════════════════

export function preloadFeature(featureId: string) {
  if (!_enabled) return;
  
  _metrics.preloadsTriggered++;
  
  if (typeof document !== 'undefined') {
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/components/main/domain/features/' + featureId + '/index.js';
    link.as = 'script';
    document.head.appendChild(link);
  }
}

export function preloadForRoute(route: string) {
  var featureIds = _routeFeatureMap.get(route) || [];
  
  for (var i = 0; i < featureIds.length; i++) {
    if (!_loadedFeatures.has(featureIds[i])) {
      preloadFeature(featureIds[i]);
    }
  }
  
  return { ok: true, preloaded: featureIds.length };
}

// ═══════════════════════════════════════════════════════════════
// ROUTE MAP MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export function setRouteFeatures(route: string, featureIds: string[]) {
  _routeFeatureMap.set(route, featureIds);
  return { ok: true };
}

export function addRouteFeature(route: string, featureId: string) {
  var features = _routeFeatureMap.get(route) || [];
  if (features.indexOf(featureId) === -1) {
    features.push(featureId);
    _routeFeatureMap.set(route, features);
  }
  return { ok: true };
}

export function getRouteMap() {
  var map: Record<string, string[]> = {};
  _routeFeatureMap.forEach(function(features: string[], route: string) {
    map[route] = features.slice();
  });
  return map;
}

export function isFeatureLoaded(featureId: string) {
  return _loadedFeatures.has(featureId);
}

export function getLoadedFeatures() {
  return Array.from(_loadedFeatures);
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getStatus() {
  return {
    enabled: _enabled,
    routesMapped: _routeFeatureMap.size,
    featuresLoaded: _loadedFeatures.size,
    pendingLoads: _pendingLoads.size
  };
}

export function getMetrics() {
  var avgLoadTime = _metrics.lazyLoadsCompleted > 0
    ? Math.round(_metrics.totalLoadTimeMs / _metrics.lazyLoadsCompleted)
    : 0;
    
  return Object.assign({}, _metrics, {
    averageLoadTimeMs: avgLoadTime,
    loadedFeatures: _loadedFeatures.size,
    successRate: _metrics.lazyLoadsTriggered > 0
      ? Math.round((_metrics.lazyLoadsCompleted / _metrics.lazyLoadsTriggered) * 100) + '%'
      : 'N/A'
  });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    config: Object.assign({}, _config),
    routeMap: getRouteMap(),
    loadedFeatures: getLoadedFeatures(),
    metrics: getMetrics()
  };
}

export function healthCheck() {
  var kernelConnected = !!_kernel;
  var lowFailureRate = _metrics.lazyLoadsFailed < _metrics.lazyLoadsTriggered * 0.2;
  
  var status: string = HEALTH_STATUS.HEALTHY;
  if (!_enabled) {
    status = HEALTH_STATUS.UNHEALTHY;
  } else if (!kernelConnected || !lowFailureRate) {
    status = HEALTH_STATUS.DEGRADED;
  }
  
  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      enabled: _enabled,
      kernelConnected: kernelConnected,
      lowFailureRate: lowFailureRate
    },
    details: {
      enabled: _enabled,
      kernelConnected: kernelConnected,
      routesMapped: _routeFeatureMap.size,
      featuresLoaded: _loadedFeatures.size,
      pendingLoads: _pendingLoads.size,
      metrics: Object.assign({}, _metrics)
    }
  });
}

export default {
  MODULE_ID: MODULE_ID,
  VERSION: VERSION,
  init: init,
  destroy: destroy,
  loadFeaturesForRoute: loadFeaturesForRoute,
  loadFeature: loadFeature,
  preloadFeature: preloadFeature,
  preloadForRoute: preloadForRoute,
  setRouteFeatures: setRouteFeatures,
  addRouteFeature: addRouteFeature,
  getRouteMap: getRouteMap,
  isFeatureLoaded: isFeatureLoaded,
  getLoadedFeatures: getLoadedFeatures,
  getStatus: getStatus,
  getMetrics: getMetrics,
  setLogLevel: setLogLevel,
  info: info,
  healthCheck: healthCheck
};
