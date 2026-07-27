const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-lazy-loader";
const _loadedModules = /* @__PURE__ */ new Map();
const _loadingPromises = /* @__PURE__ */ new Map();
const _preloadQueue = [];
let _metrics = { loaded: 0, cached: 0, failed: 0, preloaded: 0 };
async function loadModule(modulePath, options = {}) {
  const { cache = true, timeout = 1e4, fallback = null } = options;
  if (cache && _loadedModules.has(modulePath)) {
    _metrics.cached++;
    return _loadedModules.get(modulePath);
  }
  if (_loadingPromises.has(modulePath)) {
    return _loadingPromises.get(modulePath);
  }
  const loadPromise = new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Module load timeout: ${modulePath}`));
    }, Number(timeout));
    try {
      const module = await import(modulePath);
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
async function loadComponent(componentPath, options = {}) {
  const module = await loadModule(componentPath, options);
  const factory = module.default || module.create || module[`create${componentPath.split("/").pop().replace(".js", "")}`] || module;
  return factory;
}
function preload(modulePaths, options = {}) {
  const { priority = "low" } = options;
  const paths = Array.isArray(modulePaths) ? modulePaths : [modulePaths];
  paths.forEach((path) => {
    if (!_loadedModules.has(path) && !_loadingPromises.has(path)) {
      _preloadQueue.push({ path, priority });
    }
  });
  _processPreloadQueue();
}
function _processPreloadQueue() {
  if (_preloadQueue.length === 0) return;
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback((deadline) => {
      while (_preloadQueue.length > 0 && deadline.timeRemaining() > 10) {
        const { path } = _preloadQueue.shift();
        loadModule(path, { cache: true }).then(() => {
          _metrics.preloaded++;
        }).catch(() => {
        });
      }
      if (_preloadQueue.length > 0) _processPreloadQueue();
    });
  } else {
    setTimeout(() => {
      const { path } = _preloadQueue.shift();
      loadModule(path, { cache: true }).then(() => {
        _metrics.preloaded++;
      }).catch(() => {
      });
      if (_preloadQueue.length > 0) _processPreloadQueue();
    }, 100);
  }
}
function loadOnVisible(element, modulePath, options = {}) {
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
    }, { rootMargin: options.rootMargin || "100px" });
    observer.observe(element);
  });
}
async function loadAll(modulePaths, options = {}) {
  return Promise.all(modulePaths.map((path) => loadModule(path, options)));
}
async function loadSequential(modulePaths, options = {}) {
  const modules = [];
  for (const path of modulePaths) {
    modules.push(await loadModule(path, options));
  }
  return modules;
}
function isLoaded(modulePath) {
  return _loadedModules.has(modulePath);
}
function isLoading(modulePath) {
  return _loadingPromises.has(modulePath);
}
function getLoaded(modulePath) {
  return _loadedModules.get(modulePath) || null;
}
function clearCache(modulePath = null) {
  if (modulePath) {
    return _loadedModules.delete(modulePath);
  }
  const count = _loadedModules.size;
  _loadedModules.clear();
  return count;
}
function getMetrics() {
  return { ..._metrics, cached: _loadedModules.size, pending: _loadingPromises.size, preloadQueue: _preloadQueue.length };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, ...getMetrics() };
}
function healthCheck() {
  const m = getMetrics();
  const status = m.failed > 0 && m.loaded === 0 ? "UNHEALTHY" : m.failed > m.loaded * 0.3 ? "DEGRADED" : "HEALTHY";
  return { status, version: VERSION, moduleId: MODULE_ID, ...m };
}
var lazy_loader_default = {
  loadModule,
  loadComponent,
  preload,
  loadOnVisible,
  loadAll,
  loadSequential,
  isLoaded,
  isLoading,
  getLoaded,
  clearCache,
  getMetrics,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  clearCache,
  lazy_loader_default as default,
  getLoaded,
  getMetrics,
  healthCheck,
  info,
  isLoaded,
  isLoading,
  loadAll,
  loadComponent,
  loadModule,
  loadOnVisible,
  loadSequential,
  preload
};
