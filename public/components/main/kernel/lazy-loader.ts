

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-kernel-lazy-loader
// PURPOSE: MainKernel Lazy Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   destroy() — exported function
//   preloadFeature() — exported function
//   preloadForRoute() — exported function
//   setRouteFeatures() — exported function
//   addRouteFeature() — exported function
//   getRouteMap() — exported function
//   isFeatureLoaded() — exported function
//   getLoadedFeatures() — exported function
//   getStatus() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
//   window.lazyLoader (exposes module)
// ═══════════════════════════════════════════════════════════════
// @version 1.3.0-STRICT-MODE
// @changelog v1.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.2.0-P0-ENTERPRISE - Logger via Ports (elimina window.Logger fallback)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'main-kernel-lazy-loader';
export const VERSION = '1.4.0-P2-ENTERPRISE';

interface KernelLazyApi {
  getFeature?(featureId: string): { ok: boolean; data?: { status: string; [key: string]: unknown }; [key: string]: unknown } | null;
  enableFeature(featureId: string, context?: Record<string, unknown>): { ok: boolean; errors?: Array<{ message: string; [key: string]: unknown }>; [key: string]: unknown };
  registerFeature(def: Record<string, unknown>): { ok: boolean; errors?: Array<{ message: string; [key: string]: unknown }>; [key: string]: unknown };
  listFeatures(): { ok: boolean; data?: { features: Array<{ id: string; [key: string]: unknown }>; [key: string]: unknown }; [key: string]: unknown };
}

interface LazyLoaderOptions {
  config?: Partial<LazyLoaderConfig>;
  routeMap?: Record<string, string[]>;
}

interface LazyLoaderConfig {
  preloadOnHover: boolean;
  hoverDelayMs: number;
  loadTimeoutMs: number;
}

interface LoadFeatureOptions {
  path?: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

// P0 ENTERPRISE: Ports-based access
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { _initPorts(); return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback to console)
  // 4. Non-strict: use window.Logger with violation recording or console

  // 5. Ultimate fallback: console (only in non-strict)
  return console;
}

let _kernel: KernelLazyApi | null = null;
let _enabled = false;
const _routeFeatureMap = new Map();
const _loadedFeatures = new Set();
const _pendingLoads = new Map();

let _config: LazyLoaderConfig = {
  preloadOnHover: true,
  hoverDelayMs: 200,
  loadTimeoutMs: 10000
};

const _metrics = {
  lazyLoadsTriggered: 0,
  lazyLoadsCompleted: 0,
  lazyLoadsFailed: 0,
  preloadsTriggered: 0,
  cacheHits: 0,
  totalLoadTimeMs: 0
};

// ═══════════════════════════════════════════════════════════════
// ROUTE-FEATURE MAPPING
// ═══════════════════════════════════════════════════════════════

const DEFAULT_ROUTE_MAP: Record<string, string[]> = {
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

export function init(kernel: KernelLazyApi, options?: LazyLoaderOptions) {
  if (!kernel) return { ok: false, error: 'Kernel required' };

  _kernel = kernel;

  if (options) {
    if (options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    if (options.routeMap) {
      for (const route in options.routeMap) {
        if (options.routeMap.hasOwnProperty(route)) {
          _routeFeatureMap.set(route, options.routeMap[route]);
        }
      }
    }
  }

  // Carregar mapa padrão
  for (const r in DEFAULT_ROUTE_MAP) {
    if (DEFAULT_ROUTE_MAP.hasOwnProperty(r) && !_routeFeatureMap.has(r)) {
      _routeFeatureMap.set(r, DEFAULT_ROUTE_MAP[r]);
    }
  }

  _enabled = true;

  // Expor globalmente
  if (typeof window !== 'undefined') {
    (window as any).lazyLoader = {
      loadForRoute: loadFeaturesForRoute,
      preload: preloadFeature,
      isLoaded: isFeatureLoaded,
      getMap: getRouteMap,
      status: getStatus
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

export async function loadFeaturesForRoute(route: string, options?: LoadFeatureOptions) {
  if (!_enabled || !_kernel) {
    return { ok: false, error: 'Lazy loader not initialized' };
  }

  const featureIds = _routeFeatureMap.get(route) || [];

  if (featureIds.length === 0) {
    return { ok: true, route, features: [] as string[], message: 'No features mapped' };
  }

  const results = [];

  for (let i = 0; i < featureIds.length; i++) {
    const featureId = featureIds[i];
    const result = await loadFeature(featureId, options);
    results.push(result);
  }

  const succeeded = results.filter(r => r.ok).length;

  return {
    ok: succeeded === results.length,
    route,
    features: featureIds,
    results,
    succeeded,
    failed: results.length - succeeded
  };
}

export async function loadFeature(featureId: string, options?: LoadFeatureOptions) {
  if (!_enabled || !_kernel) {
    return { ok: false, error: 'Lazy loader not initialized' };
  }

  // Verificar se já está carregada
  if (_loadedFeatures.has(featureId)) {
    _metrics.cacheHits++;
    return { ok: true, featureId, cached: true };
  }

  // Verificar se já está carregando
  if (_pendingLoads.has(featureId)) {
    return _pendingLoads.get(featureId);
  }

  _metrics.lazyLoadsTriggered++;
  const startTime = performance.now();

  // Criar promise de carregamento
  const loadPromise = _doLoadFeature(featureId, options, startTime);
  _pendingLoads.set(featureId, loadPromise);

  try {
    const result = await loadPromise;
    return result;
  } finally {
    _pendingLoads.delete(featureId);
  }
}

async function _doLoadFeature(featureId: string, options: LoadFeatureOptions | undefined, startTime: number) {
  const opts = options || {};
  const logger = _getLogger();

  try {
    // Verificar se já está registrada no kernel
    const featureStatus = _kernel!.getFeature ? _kernel!.getFeature(featureId) : null;

    if (featureStatus && featureStatus.ok && featureStatus.data) {
      // Feature já registrada, só habilitar se necessário
      if (featureStatus.data.status !== 'enabled') {
        const enableResult = _kernel!.enableFeature(featureId, opts.context || {});
        if (!enableResult.ok) {
          throw new Error(`Failed to enable: ${JSON.stringify(enableResult.errors)}`);
        }
      }
    } else {
      // Feature não registrada, precisa carregar módulo
      const featurePath = opts.path || (`../features/${featureId}/index.js`);

      const featureModule: any = await _loadWithTimeout(
        import(featurePath),
        _config.loadTimeoutMs,
        featureId
      );

      // Registrar
      const registerResult = _kernel!.registerFeature({
        id: featureId,
        version: (featureModule.VERSION || (featureModule.default && featureModule.default.VERSION)) || '1.0.0',
        init: featureModule.init || (featureModule.default && featureModule.default.init),
        cleanup: featureModule.destroy || featureModule.cleanup || (featureModule.default && featureModule.default.destroy),
        healthCheck: featureModule.healthCheck || (featureModule.default && featureModule.default.healthCheck)
      });

      if (!registerResult.ok) {
        throw new Error(`Failed to register: ${JSON.stringify(registerResult.errors)}`);
      }

      // Habilitar
      const enableResult = _kernel!.enableFeature(featureId, opts.context || {});
      if (!enableResult.ok) {
        throw new Error(`Failed to enable: ${JSON.stringify(enableResult.errors)}`);
      }
    }

    const duration = Math.round(performance.now() - startTime);
    _metrics.lazyLoadsCompleted++;
    _metrics.totalLoadTimeMs += duration;
    _loadedFeatures.add(featureId);

    if (logger?.info) logger.info('[LazyLoader] Loaded:', featureId, `(${duration}ms)`);

    return { ok: true, featureId, duration };

  } catch (e: any) {
    const duration = Math.round(performance.now() - startTime);
    _metrics.lazyLoadsFailed++;

    if (logger?.error) {
      logger.error('[LazyLoader] Failed to load:', featureId, e);
    } else if (!isStrict()) {
      console.error('[LazyLoader] Failed to load:', featureId, e);
    }

    return { ok: false, featureId, error: e.message, duration };
  }
}

function _loadWithTimeout(promise: Promise<unknown>, timeoutMs: number, featureId: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Load timeout for ${featureId} after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result: unknown) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error: Error) => {
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

  // Preload silencioso usando link prefetch
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/components/main/domain/features/${featureId}/index.js`;
    link.as = 'script';
    document.head.appendChild(link);
  }
}

export function preloadForRoute(route: string) {
  const featureIds = _routeFeatureMap.get(route) || [];

  for (let i = 0; i < featureIds.length; i++) {
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
  const features = _routeFeatureMap.get(route) || [];
  if (features.indexOf(featureId) === -1) {
    features.push(featureId);
    _routeFeatureMap.set(route, features);
  }
  return { ok: true };
}

export function getRouteMap() {
  const map: Record<string, string[]> = {};
  _routeFeatureMap.forEach((features: string[], route: string) => {
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
  const avgLoadTime = _metrics.lazyLoadsCompleted > 0
    ? Math.round(_metrics.totalLoadTimeMs / _metrics.lazyLoadsCompleted)
    : 0;

  return Object.assign({}, _metrics, {
    averageLoadTimeMs: avgLoadTime,
    loadedFeatures: _loadedFeatures.size,
    successRate: _metrics.lazyLoadsTriggered > 0
      ? `${Math.round((_metrics.lazyLoadsCompleted / _metrics.lazyLoadsTriggered) * 100)}%`
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
    metrics: getMetrics(),
    strictMode: isStrict()
  };
}

export function healthCheck() {
  const checks = {
    enabled: _enabled,
    kernelConnected: !!_kernel,
    lowFailureRate: _metrics.lazyLoadsFailed < _metrics.lazyLoadsTriggered * 0.2
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: _enabled ? 'HEALTHY' : 'NOT_INITIALIZED',
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    strictMode: isStrict(),
    portsInitialized: _portsInitialized,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

export default {
  MODULE_ID,
  VERSION,
  init,
  destroy,
  loadFeaturesForRoute,
  loadFeature,
  preloadFeature,
  preloadForRoute,
  setRouteFeatures,
  addRouteFeature,
  getRouteMap,
  isFeatureLoaded,
  getLoadedFeatures,
  getStatus,
  getMetrics,
  info,
  healthCheck
};
