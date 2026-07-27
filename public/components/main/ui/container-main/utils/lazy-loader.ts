// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-lazy-loader
// PURPOSE: Container-Main Lazy Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   preload() — exported function
//   loadOnVisible() — exported function
//   isLoaded() — exported function
//   isLoading() — exported function
//   getLoaded() — exported function
//   clearCache() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-lazy-loader';

const _loadedModules = new Map();
const _loadingPromises = new Map();
const _preloadQueue: Record<string, unknown>[] = [];
let _metrics = { loaded: 0, cached: 0, failed: 0, preloaded: 0 };

// Lazy load a module
export async function loadModule(modulePath: unknown, options: Record<string, unknown> = {}) {
  const { cache = true, timeout = 10000, fallback = null } = options;
  
  // Return cached if available
  if (cache && _loadedModules.has(modulePath)) {
    _metrics.cached++;
    return _loadedModules.get(modulePath);
  }
  
  // Return existing promise if already loading
  if (_loadingPromises.has(modulePath)) {
    return _loadingPromises.get(modulePath);
  }
  
  const loadPromise = new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Module load timeout: ${modulePath}`));
    }, Number(timeout));
    
    try {
      const module = await import(modulePath as string);
      clearTimeout(timeoutId);
      
      if (cache) _loadedModules.set(modulePath, module);
      _metrics.loaded++;
      resolve(module);
    } catch (error) {
      clearTimeout(timeoutId);
      _metrics.failed++;
      
      if (fallback) {
        resolve(fallback);
      } else {
        reject(error);
      }
    } finally {
      _loadingPromises.delete(modulePath);
    }
  });
  
  _loadingPromises.set(modulePath, loadPromise);
  return loadPromise;
}

// Lazy load a component factory
export async function loadComponent(componentPath: Record<string, unknown>, options: Record<string, unknown> = {}) {
  const module = await loadModule(componentPath, options);
  
  // Look for default export or common factory patterns
  const factory = module.default 
    || module.create 
    // @ts-expect-error TS migration - TS2339
    || module[`create${(componentPath.split as (...args: unknown[]) => unknown)('/').pop().replace('.js', '')}`]
    || module;
  
  return factory;
}

// Preload modules during idle time
export function preload(modulePaths: Record<string, unknown>, options: Record<string, unknown> = {}) {
  const { priority = 'low' } = options;
  
  const paths = Array.isArray(modulePaths) ? modulePaths : [modulePaths];
  
  paths.forEach(path => {
    if (!_loadedModules.has(path) && !_loadingPromises.has(path)) {
      _preloadQueue.push({ path, priority });
    }
  });
  
  _processPreloadQueue();
}

function _processPreloadQueue() {
  if (_preloadQueue.length === 0) return;
  
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback((deadline) => {
      while (_preloadQueue.length > 0 && deadline.timeRemaining() > 10) {
        // @ts-expect-error strict migration — TS2339
        const { path } = _preloadQueue.shift();
        loadModule(path, { cache: true }).then(() => {
          _metrics.preloaded++;
        }).catch(() => {});
      }
      if (_preloadQueue.length > 0) _processPreloadQueue();
    });
  } else {
    setTimeout(() => {
      // @ts-expect-error strict migration — TS2339
      const { path } = _preloadQueue.shift();
      loadModule(path, { cache: true }).then(() => {
        _metrics.preloaded++;
      }).catch(() => {});
      if (_preloadQueue.length > 0) _processPreloadQueue();
    }, 100);
  }
}

// Load when element becomes visible
export function loadOnVisible(element: HTMLElement, modulePath: unknown, options: Record<string, unknown> = {}) {
  return new Promise((resolve, reject) => {
    const observer = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        try {
          const module = await loadModule(modulePath, options);
          resolve(module);
        } catch (error) {
          reject(error);
        }
      }
    }, { rootMargin: (options.rootMargin as string) || '100px' });
    
    observer.observe(element);
  });
}

// Load multiple modules in parallel
export async function loadAll(modulePaths: Record<string, unknown>, options: Record<string, unknown> = {}) {
  // @ts-expect-error TS migration - TS2769
  return Promise.all((modulePaths.map as (...args: unknown[]) => unknown)((path: string) => loadModule(path, options)));
}

// Load modules sequentially
export async function loadSequential(modulePaths: Record<string, unknown>, options: Record<string, unknown> = {}) {
  const modules = [];
  for (const path of (modulePaths as unknown as unknown[])) {
    modules.push(await loadModule(path, options));
  }
  return modules;
}

// Check if module is loaded
export function isLoaded(modulePath: unknown) {
  return _loadedModules.has(modulePath);
}

// Check if module is loading
export function isLoading(modulePath: unknown) {
  return _loadingPromises.has(modulePath);
}

// Get loaded module from cache
export function getLoaded(modulePath: unknown) {
  return _loadedModules.get(modulePath) || null;
}

// Clear cache
export function clearCache(modulePath: unknown = null) {
  if (modulePath) {
    return _loadedModules.delete(modulePath);
  }
  const count = _loadedModules.size;
  _loadedModules.clear();
  return count;
}

// Get metrics
export function getMetrics() {
  return { ..._metrics, cached: _loadedModules.size, pending: _loadingPromises.size, preloadQueue: _preloadQueue.length };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, ...getMetrics() };
}

export function healthCheck() {
  const m = getMetrics();
  const status = m.failed > 0 && m.loaded === 0 ? 'UNHEALTHY' : m.failed > m.loaded * 0.3 ? 'DEGRADED' : 'HEALTHY';
  return { status, version: VERSION, moduleId: MODULE_ID, ...m };
}

export default {
  loadModule, loadComponent, preload, loadOnVisible, loadAll, loadSequential,
  isLoaded, isLoading, getLoaded, clearCache, getMetrics,
  info, healthCheck, VERSION, MODULE_ID
};
