const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/performance/lazy-loader";
const moduleCache = /* @__PURE__ */ new Map();
const loadingModules = /* @__PURE__ */ new Map();
async function lazyLoad(modulePath) {
  if (moduleCache.has(modulePath)) return moduleCache.get(modulePath);
  if (loadingModules.has(modulePath)) return loadingModules.get(modulePath);
  const promise = import(modulePath).then((module) => {
    moduleCache.set(modulePath, module);
    loadingModules.delete(modulePath);
    return module;
  }).catch((error) => {
    loadingModules.delete(modulePath);
    throw error;
  });
  loadingModules.set(modulePath, promise);
  return promise;
}
async function lazyLoadDrawer() {
  return lazyLoad("./ui/drawer.js");
}
async function lazyLoadContextMenu() {
  return lazyLoad("./ui/context-menu.js");
}
async function lazyLoadExport() {
  return lazyLoad("./utils/export.js");
}
async function lazyLoadColumns() {
  return lazyLoad("./ui/columns.js");
}
function preloadModules(paths) {
  paths.forEach((path) => {
    requestIdleCallback(() => lazyLoad(path), { timeout: 5e3 });
  });
}
function clearCache() {
  moduleCache.clear();
}
function getCacheStats() {
  return { cached: moduleCache.size, loading: loadingModules.size };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var lazy_loader_default = { lazyLoad, lazyLoadDrawer, lazyLoadContextMenu, lazyLoadExport, lazyLoadColumns, preloadModules, clearCache, getCacheStats };
export {
  MODULE_ID,
  VERSION,
  clearCache,
  lazy_loader_default as default,
  getCacheStats,
  healthCheck,
  info,
  lazyLoad,
  lazyLoadColumns,
  lazyLoadContextMenu,
  lazyLoadDrawer,
  lazyLoadExport,
  preloadModules
};
