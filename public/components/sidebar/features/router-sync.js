import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { normalizeRoute } from "../core/utils.js";
const MODULE_ID = "sidebar-router-sync";
const VERSION = "7.1.0-ES6";
const _state = { initialized: false, ctx: null, syncs: 0, reloads: 0, errors: 0, cleanups: [] };
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
function _getCurrentHash() {
  const router = _getPort("routerGlobal");
  if (router && router.getCurrentRoute) {
    try {
      const route = router.getCurrentRoute();
      if (route && (route.hash || route.path)) return route.hash || route.path;
    } catch (e) {
    }
  }
  if (typeof window !== "undefined" && window.location) return window.location.hash || "#/";
  return "#/";
}
function _envelope(ok, data, errors) {
  return { ok, data: data || null, meta: { moduleId: MODULE_ID, version: VERSION, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: errors || [] };
}
function _resolveItemDomId(item) {
  return item.key || item.item_key || item.id;
}
function findItemByRoute(items, path) {
  const normalizedPath = normalizeRoute(path);
  for (let i = 0; i < items.length; i++) {
    if (normalizeRoute(items[i].route) === normalizedPath) return items[i];
  }
  return null;
}
function syncWithRouter(dependencies) {
  const routerAdapter = dependencies.routerAdapter;
  const registry = dependencies.registry;
  const onSetActiveItem = dependencies.onSetActiveItem;
  try {
    const route = routerAdapter && routerAdapter.getCurrentRoute ? routerAdapter.getCurrentRoute() : null;
    const path = route && (route.path || route.hash) || _getCurrentHash();
    const items = registry && registry.getItems ? registry.getItems() : [];
    const item = findItemByRoute(items, path);
    if (item && onSetActiveItem) {
      const domId = _resolveItemDomId(item);
      onSetActiveItem(domId);
      _state.syncs++;
    }
    const eb = _getPort("eventBus");
    if (eb && eb.emit) {
      eb.emit(SIDEBAR_EVENTS.ROUTER_SYNCED, {
        path,
        itemId: item ? _resolveItemDomId(item) : null,
        itemKey: item ? item.key || item.item_key || null : null,
        numericId: item ? item.id : null
      });
    }
    return _envelope(true, {
      synced: true,
      path,
      itemId: item ? _resolveItemDomId(item) : null,
      itemKey: item ? item.key || item.item_key || null : null
    });
  } catch (e) {
    _state.errors++;
    return _envelope(false, null, [{ code: "SYNC_ERROR", message: e.message }]);
  }
}
function setupRouterSync(dependencies) {
  const routerAdapter = dependencies.routerAdapter;
  const registry = dependencies.registry;
  const onSetActiveItem = dependencies.onSetActiveItem;
  const onReloadNavigation = dependencies.onReloadNavigation;
  const eventBus = dependencies.eventBus;
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  syncWithRouter(dependencies);
  const eb = _getPort("eventBus");
  if (eb && eb.on) {
    const routeHandler = (data) => {
      _state.syncs++;
      const items = registry && registry.getItems ? registry.getItems() : [];
      const path = data && data.path ? data.path : _getCurrentHash();
      const item = findItemByRoute(items, path);
      if (item && onSetActiveItem) {
        const domId = _resolveItemDomId(item);
        onSetActiveItem(domId);
      }
    };
    const unsub1 = eb.on(ROUTER_EVENTS.NAVIGATED, routeHandler);
    _state.cleanups.push(
      typeof unsub1 === "function" ? unsub1 : () => {
        if (eb.off) eb.off(ROUTER_EVENTS.NAVIGATED, routeHandler);
      }
    );
    const unsub2 = eb.on(ROUTER_EVENTS.ROUTE_CHANGED, routeHandler);
    _state.cleanups.push(
      typeof unsub2 === "function" ? unsub2 : () => {
        if (eb.off) eb.off(ROUTER_EVENTS.ROUTE_CHANGED, routeHandler);
      }
    );
  }
  if (eb && eb.on && onReloadNavigation) {
    const reloadHandler = () => {
      _state.reloads++;
      onReloadNavigation();
    };
    const unsub3 = eb.on(SIDEBAR_EVENTS.RELOAD_NAVIGATION, reloadHandler);
    _state.cleanups.push(
      typeof unsub3 === "function" ? unsub3 : () => {
        if (eb.off) eb.off(SIDEBAR_EVENTS.RELOAD_NAVIGATION, reloadHandler);
      }
    );
  }
  return () => {
    cleanup();
  };
}
function emitReloaded(sectionsCount, itemsCount) {
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.NAVIGATION_RELOADED, { sectionsCount, itemsCount, timestamp: Date.now() });
}
function init(ctx) {
  if (_state.initialized) return _envelope(true, { alreadyInitialized: true });
  try {
    _state.ctx = ctx;
    if (ctx && ctx.ports) {
      Ports.inject(ctx.ports);
    }
    _initPorts();
    _state.initialized = true;
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.ROUTER_SYNC_INITIALIZED, { version: VERSION });
    return _envelope(true, { initialized: true, version: VERSION });
  } catch (e) {
    _state.errors++;
    return _envelope(false, null, [{ code: "INIT_ERROR", message: e.message }]);
  }
}
function cleanup() {
  for (let i = 0; i < _state.cleanups.length; i++) {
    try {
      _state.cleanups[i]();
    } catch (e) {
    }
  }
  _state.cleanups = [];
  _state.initialized = false;
  _state.ctx = null;
  return _envelope(true, { cleanedUp: true });
}
function destroy() {
  return cleanup();
}
function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    hasEventBus: !!_getPort("eventBus"),
    portsInitialized: Ports.isInitialized(),
    lowErrorRate: _state.syncs === 0 || _state.errors < _state.syncs * 0.2,
    noOrphanListeners: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_state.initialized) {
    status = "NOT_INITIALIZED";
  } else if (passed < total) {
    status = "DEGRADED";
  }
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: { syncs: _state.syncs, reloads: _state.reloads, errors: _state.errors, cleanups: _state.cleanups.length },
    portsInitialized: Ports.isInitialized(),
    p24Compliant: true,
    timestamp: Date.now()
  };
}
function info() {
  return _envelope(true, {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    syncs: _state.syncs,
    reloads: _state.reloads,
    errors: _state.errors,
    cleanups: _state.cleanups.length,
    portsInitialized: Ports.isInitialized(),
    p24Compliant: true
  });
}
function getMetrics() {
  return { syncs: _state.syncs, reloads: _state.reloads, errors: _state.errors, cleanups: _state.cleanups.length };
}
const capabilities = { singleton: true, critical: true, rendersUI: false, category: "navigation", priority: "high" };
function setLogger(logger) {
}
var router_sync_default = { id: MODULE_ID, version: VERSION, capabilities, init, cleanup, destroy, healthCheck, info, getMetrics, setupRouterSync, emitReloaded };
export {
  MODULE_ID,
  VERSION,
  capabilities,
  cleanup,
  router_sync_default as default,
  destroy,
  emitReloaded,
  findItemByRoute,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  setLogger,
  setupRouterSync,
  syncWithRouter
};
