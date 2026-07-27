import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "router.navigation.prefetch";
const hasWindow = typeof window !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _log(level, msg, ctx) {
  if (!ctx) ctx = {};
  const logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  ctx.component = MODULE_ID;
  logger[level](msg, ctx);
}
const _config = { enabled: true, prefetchOnHover: true, prefetchOnVisible: true, hoverDelay: 100, maxConcurrent: 3, maxPrefetched: 20, priorityThreshold: 0.5, observerRootMargin: "200px", respectDataSaver: true, cacheTime: 3e5 };
const _prefetchedRoutes = /* @__PURE__ */ new Map();
const _pendingPrefetch = /* @__PURE__ */ new Set();
const _routeScores = /* @__PURE__ */ new Map();
let _observer = null;
let _initialized = false;
const _metrics = { prefetchAttempts: 0, prefetchSuccess: 0, prefetchFailed: 0, cacheHits: 0, cacheMisses: 0 };
let _hoverTimer = null;
function _isDataSaverEnabled() {
  return typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData === true;
}
function _getConnectionQuality() {
  if (typeof navigator === "undefined" || !navigator.connection) return 0.5;
  const conn = navigator.connection;
  if (conn.saveData) return 0;
  if (conn.effectiveType === "4g") return 1;
  if (conn.effectiveType === "3g") return 0.6;
  if (conn.effectiveType === "2g") return 0.2;
  return 0.5;
}
function _calculatePriority(routePath) {
  const score = _routeScores.get(routePath) || { visits: 0, lastVisit: 0 };
  const visitWeight = Math.min(score.visits / 10, 1) * 0.4;
  const recencyWeight = score.lastVisit ? Math.max(0, 1 - (Date.now() - score.lastVisit) / 864e5) * 0.3 : 0;
  const connectionWeight = _getConnectionQuality() * 0.3;
  return visitWeight + recencyWeight + connectionWeight;
}
function _cleanupCache() {
  const now = Date.now();
  _prefetchedRoutes.forEach((data, path) => {
    if (data.expiresAt < now) {
      _prefetchedRoutes.delete(path);
    }
  });
  while (_prefetchedRoutes.size > _config.maxPrefetched) {
    let oldest = null;
    let oldestTime = Infinity;
    _prefetchedRoutes.forEach((data, path) => {
      if (data.prefetchedAt < oldestTime) {
        oldestTime = data.prefetchedAt;
        oldest = path;
      }
    });
    if (oldest) {
      _prefetchedRoutes.delete(oldest);
    }
  }
}
function _prefetchRoute(routePath) {
  if (typeof document !== "undefined") {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = routePath;
    link.as = "document";
    document.head.appendChild(link);
    setTimeout(() => {
      link.remove();
    }, 5e3);
  }
  return Promise.resolve();
}
function _prefetchModule(modulePath) {
  try {
    const link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = modulePath;
    document.head.appendChild(link);
    return Promise.resolve();
  } catch (e) {
    const _c = new AbortController();
    const _t = setTimeout(() => _c.abort(), 8e3);
    return fetch(modulePath, { credentials: "same-origin", signal: _c.signal }).finally(() => clearTimeout(_t));
  }
}
function _handleMouseOver(e) {
  const link = e.target.closest ? e.target.closest('a[href^="/"]') : null;
  if (!link) return;
  const href = link.getAttribute("href");
  if (_hoverTimer) clearTimeout(_hoverTimer);
  _hoverTimer = setTimeout(() => {
    prefetch(href, { priority: 0.8 });
  }, _config.hoverDelay);
}
function _handleMouseOut() {
  if (_hoverTimer) {
    clearTimeout(_hoverTimer);
    _hoverTimer = null;
  }
}
function _initHoverListeners() {
  if (typeof document === "undefined") return;
  document.addEventListener("mouseover", _handleMouseOver, { passive: true });
  document.addEventListener("mouseout", _handleMouseOut, { passive: true });
}
function _removeHoverListeners() {
  if (typeof document === "undefined") return;
  document.removeEventListener("mouseover", _handleMouseOver);
  document.removeEventListener("mouseout", _handleMouseOut);
}
function _initIntersectionObserver() {
  if (typeof IntersectionObserver === "undefined") return;
  _observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const href = entry.target.getAttribute("href");
        if (href && href.indexOf("/") === 0) {
          prefetch(href, { priority: 0.6 });
        }
      }
    });
  }, { rootMargin: _config.observerRootMargin });
}
function init(options) {
  if (_initialized) return;
  if (options) Object.assign(_config, options);
  if (_config.respectDataSaver && _isDataSaverEnabled()) {
    _config.enabled = false;
    _log("info", "Data saver detected, prefetch disabled");
    return;
  }
  if (_config.prefetchOnVisible) {
    _initIntersectionObserver();
  }
  if (_config.prefetchOnHover) {
    _initHoverListeners();
  }
  _initialized = true;
  _log("info", "Prefetch system initialized");
}
function destroy() {
  if (_observer) {
    _observer.disconnect();
    _observer = null;
  }
  _removeHoverListeners();
  _prefetchedRoutes.clear();
  _pendingPrefetch.clear();
  _initialized = false;
}
function prefetch(routePath, options) {
  if (!options) options = {};
  if (!_config.enabled) return Promise.resolve(false);
  if (_prefetchedRoutes.has(routePath)) {
    _metrics.cacheHits++;
    return Promise.resolve(true);
  }
  if (_pendingPrefetch.has(routePath)) return Promise.resolve(false);
  if (_pendingPrefetch.size >= _config.maxConcurrent) return Promise.resolve(false);
  _pendingPrefetch.add(routePath);
  _metrics.prefetchAttempts++;
  const priority = options.priority || _calculatePriority(routePath);
  if (priority < _config.priorityThreshold && !options.force) {
    _pendingPrefetch.delete(routePath);
    return Promise.resolve(false);
  }
  const promise = options.module ? _prefetchModule(options.module) : _prefetchRoute(routePath);
  return promise.then(() => {
    _prefetchedRoutes.set(routePath, { prefetchedAt: Date.now(), priority, expiresAt: Date.now() + _config.cacheTime });
    _cleanupCache();
    _metrics.prefetchSuccess++;
    _log("debug", "Route prefetched", { routePath, priority });
    return true;
  }).catch((error) => {
    _metrics.prefetchFailed++;
    _log("debug", "Prefetch failed", { routePath, error: error.message });
    return false;
  }).finally(() => {
    _pendingPrefetch.delete(routePath);
  });
}
function prefetchMultiple(routes) {
  return Promise.all(routes.map((r) => typeof r === "string" ? prefetch(r) : prefetch(r.path, r)));
}
function recordVisit(routePath) {
  const existing = _routeScores.get(routePath) || { visits: 0, lastVisit: 0 };
  _routeScores.set(routePath, { visits: existing.visits + 1, lastVisit: Date.now() });
}
function observe(element) {
  if (_observer && element) {
    _observer.observe(element);
  }
}
function unobserve(element) {
  if (_observer && element) {
    _observer.unobserve(element);
  }
}
function observeLinks(container) {
  if (!_observer) return 0;
  if (!container) container = document;
  const links = container.querySelectorAll('a[href^="/"]');
  links.forEach((link) => {
    _observer.observe(link);
  });
  return links.length;
}
function isPrefetched(routePath) {
  const data = _prefetchedRoutes.get(routePath);
  if (!data) return false;
  if (data.expiresAt < Date.now()) {
    _prefetchedRoutes.delete(routePath);
    return false;
  }
  return true;
}
function clearCache() {
  _prefetchedRoutes.clear();
}
function getMetrics() {
  return Object.assign({}, _metrics, { prefetchedCount: _prefetchedRoutes.size, pendingCount: _pendingPrefetch.size, hitRate: _metrics.prefetchAttempts > 0 ? `${(_metrics.cacheHits / _metrics.prefetchAttempts * 100).toFixed(2)}%` : "0%" });
}
function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), enabled: _config.enabled, initialized: _initialized, prefetchedRoutes: _prefetchedRoutes.size, metrics: getMetrics() };
}
function healthCheck() {
  return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), features: ["hover-prefetch", "intersection-observer", "priority-scoring", "data-saver-respect", "module-preload"], status: getStatus() };
}
var prefetch_default = { VERSION, MODULE_ID, init, destroy, prefetch, prefetchMultiple, isPrefetched, clearCache, recordVisit, observe, unobserve, observeLinks, getMetrics, getStatus, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  clearCache,
  prefetch_default as default,
  destroy,
  getMetrics,
  getPorts,
  getStatus,
  healthCheck,
  info,
  init,
  injectPorts,
  isPrefetched,
  observe,
  observeLinks,
  prefetch,
  prefetchMultiple,
  recordVisit,
  unobserve
};
