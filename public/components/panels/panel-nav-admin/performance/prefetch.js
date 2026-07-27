import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isEnabled } from "../config/feature-flags.js";
const VERSION = "10.4.0-MIGRATION-PHASE8";
const MODULE_ID = "panel-nav-admin.performance.prefetch";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[Prefetch]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
function Prefetch(options = {}) {
  const {
    hoverDelayMs = 200,
    ttlMs = 3e4,
    maxPrefetches = 5
  } = options;
  const _cache = /* @__PURE__ */ new Map();
  let _hoverTimer = null;
  let _activePrefetches = 0;
  let _totalPrefetches = 0;
  let _cacheHits = 0;
  async function prefetch(key, loader) {
    if (!isEnabled("prefetch")) return null;
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.timestamp < Number(ttlMs)) {
      _cacheHits++;
      _log("debug", `Cache hit for "${key}"`);
      return cached.data;
    }
    if (_activePrefetches >= Number(maxPrefetches)) {
      _log("debug", `Max prefetches reached, skipping "${key}"`);
      return null;
    }
    _activePrefetches++;
    _totalPrefetches++;
    try {
      _log("debug", `Prefetching "${key}"...`);
      const data = await loader();
      _cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      _log("error", `Prefetch failed for "${key}":`, err);
      return null;
    } finally {
      _activePrefetches--;
    }
  }
  function getCached(key) {
    const cached = _cache.get(key);
    if (cached && Date.now() - cached.timestamp < Number(ttlMs)) {
      _cacheHits++;
      return cached.data;
    }
    return null;
  }
  function onHover(element, key, loader, opts = {}) {
    if (!element || !isEnabled("prefetch")) return;
    const signal = opts.signal;
    const mouseEnter = () => {
      _hoverTimer = setTimeout(() => {
        prefetch(key, loader);
      }, Number(hoverDelayMs));
    };
    const mouseLeave = () => {
      if (_hoverTimer) {
        clearTimeout(_hoverTimer);
        _hoverTimer = null;
      }
    };
    const listenerOpts = signal ? { signal } : {};
    element.addEventListener("mouseenter", mouseEnter, listenerOpts);
    element.addEventListener("mouseleave", mouseLeave, listenerOpts);
  }
  function invalidate(key) {
    if (key) {
      _cache.delete(key);
    } else {
      _cache.clear();
    }
  }
  function getStats() {
    return {
      cacheSize: _cache.size,
      activePrefetches: _activePrefetches,
      totalPrefetches: _totalPrefetches,
      cacheHits: _cacheHits
    };
  }
  function destroy() {
    if (_hoverTimer) clearTimeout(_hoverTimer);
    _cache.clear();
  }
  return {
    prefetch,
    getCached,
    onHover,
    invalidate,
    getStats,
    destroy
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var prefetch_default = { Prefetch, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  Prefetch,
  VERSION,
  prefetch_default as default,
  healthCheck,
  info,
  injectPorts
};
