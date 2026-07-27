// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/performance/lazy-loader
// PURPOSE: Panel-01 - Lazy Loading de Modulos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   preloadModules() — exported function
//   clearCache() — exported function
//   getCacheStats() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/performance/lazy-loader';

const moduleCache = new Map();
const loadingModules = new Map();

export async function lazyLoad(modulePath: string) {
  if (moduleCache.has(modulePath)) return moduleCache.get(modulePath);
  if (loadingModules.has(modulePath)) return loadingModules.get(modulePath);
  const promise = import(modulePath).then(module => {
    moduleCache.set(modulePath, module);
    loadingModules.delete(modulePath);
    return module;
  }).catch(error => {
    loadingModules.delete(modulePath);
    throw error;
  });
  loadingModules.set(modulePath, promise);
  return promise;
}

export async function lazyLoadDrawer() {
  return lazyLoad('./ui/drawer.js');
}

export async function lazyLoadContextMenu() {
  return lazyLoad('./ui/context-menu.js');
}

export async function lazyLoadExport() {
  return lazyLoad('./utils/export.js');
}

export async function lazyLoadColumns() {
  return lazyLoad('./ui/columns.js');
}

export function preloadModules(paths: string[]) {
  paths.forEach((path: string) => {
    requestIdleCallback(() => lazyLoad(path), { timeout: 5000 });
  });
}

export function clearCache() { moduleCache.clear(); }
export function getCacheStats() { return { cached: moduleCache.size, loading: loadingModules.size }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { lazyLoad, lazyLoadDrawer, lazyLoadContextMenu, lazyLoadExport, lazyLoadColumns, preloadModules, clearCache, getCacheStats };
