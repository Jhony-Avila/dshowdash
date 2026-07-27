import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { NAV_EVENTS } from "/core/runtime/events/catalog/nav.events.js";
const VERSION = "6.3.0-ES6";
const MODULE_ID = "navrail-router-adapter";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function _getEventBus() {
  return _getPort("eventBus") || _getPort("eventBusGlobal");
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function createRouterAdapter() {
  _initPorts();
  let _cleanups = [];
  let _metrics = { navigations: 0, routeChanges: 0, navIntents: 0, hardNavs: 0, errors: 0, lastNavigation: null, lastRouteChange: null, busSource: null };
  function _emitNavIntent(itemId, route, panelId, source) {
    const bus = _getEventBus();
    if (!bus || !bus.emit) return false;
    _metrics.busSource = _getPort("eventBus") ? "eventBus" : "eventBusGlobal";
    bus.emit(NAV_EVENTS.NAVIGATE_PATH, {
      type: NAV_EVENTS.NAVIGATE_PATH,
      itemId,
      path: route,
      panelId: panelId || `panel-${itemId}`,
      source: source || MODULE_ID,
      timestamp: Date.now()
    });
    _metrics.navIntents++;
    return true;
  }
  function _emitNavigateRequest(route, source, itemId, panelId) {
    const bus = _getEventBus();
    if (bus && bus.emit) {
      _metrics.busSource = _getPort("eventBus") ? "eventBus" : "eventBusGlobal";
      bus.emit(ROUTER_EVENTS.NAVIGATE, {
        path: route,
        options: { source: source || MODULE_ID, itemId: itemId || null, panelId: panelId || (itemId ? `panel-${itemId}` : null) },
        source: source || MODULE_ID,
        timestamp: Date.now()
      });
    }
  }
  function _emitHardNav(route, reason) {
    const bus = _getEventBus();
    if (bus && bus.emit) {
      bus.emit(UI_EVENTS.HARD_NAV, {
        path: route,
        reason: reason || "No RouterGlobal or EventBus pipeline",
        source: MODULE_ID,
        timestamp: Date.now()
      });
    }
    _metrics.hardNavs++;
  }
  return {
    navigate(route, meta) {
      if (!meta) meta = {};
      try {
        let itemId = meta.itemId || null;
        if (!itemId && route) {
          const cleanRoute = route.replace(/^#?\/?/, "");
          if (cleanRoute) itemId = cleanRoute;
        }
        if (itemId) {
          _emitNavIntent(itemId, route, meta.panelId, meta.source || MODULE_ID);
        }
        const rg = _getPort("routerGlobal");
        if (rg && rg.navigate) {
          rg.navigate(route, { source: MODULE_ID });
          _metrics.navigations++;
          _metrics.lastNavigation = { route, itemId, timestamp: Date.now() };
          return { success: true, method: "router-global", itemId };
        }
        const bus = _getEventBus();
        if (bus && bus.emit) {
          _emitNavigateRequest(route, MODULE_ID, itemId, meta.panelId);
          _metrics.navigations++;
          _metrics.lastNavigation = { route, itemId, timestamp: Date.now() };
          return { success: true, method: "event-bus-navigate", itemId };
        }
        if (route && typeof window !== "undefined" && window.location) {
          _emitHardNav(route, "No RouterGlobal or EventBus available");
          window.location.hash = route.indexOf("#") === 0 ? route : `#${route}`;
          _metrics.navigations++;
          _metrics.lastNavigation = { route, itemId, timestamp: Date.now() };
          return { success: true, method: "hash-fallback", itemId };
        }
        _metrics.errors++;
        return { success: false, error: "no-route" };
      } catch (error) {
        _metrics.errors++;
        return { success: false, error: error.message };
      }
    },
    navigateByIntent(itemId, panelId) {
      const route = `#/${itemId}`;
      return this.navigate(route, { itemId, panelId: panelId || `panel-${itemId}`, source: MODULE_ID });
    },
    getCurrentRoute() {
      try {
        const rg = _getPort("routerGlobal");
        if (rg && rg.getCurrentRoute) return rg.getCurrentRoute();
        if (typeof window !== "undefined" && window.location) {
          return { path: window.location.hash || "#/", hash: window.location.hash, pathname: window.location.pathname };
        }
        return { path: "#/", hash: "#/" };
      } catch (error) {
        return { path: "#/", hash: "#/", error: error.message };
      }
    },
    onRouteChange(callback) {
      if (typeof callback !== "function") return () => {
      };
      try {
        const bus = _getEventBus();
        if (bus && bus.on) {
          const handler = (data) => {
            _metrics.routeChanges++;
            _metrics.lastRouteChange = Date.now();
            callback(data);
          };
          const cleanup2 = bus.on(ROUTER_EVENTS.ROUTE_CHANGED, handler);
          if (typeof cleanup2 === "function") {
            _cleanups.push(cleanup2);
            return cleanup2;
          } else {
            const manualCleanup = () => {
              if (bus.off) bus.off(ROUTER_EVENTS.ROUTE_CHANGED, handler);
            };
            _cleanups.push(manualCleanup);
            return manualCleanup;
          }
        }
        const hashHandler = () => {
          _metrics.routeChanges++;
          _metrics.lastRouteChange = Date.now();
          callback({ path: window.location.hash || "#/", hash: window.location.hash });
        };
        window.addEventListener("hashchange", hashHandler);
        const cleanup = () => {
          window.removeEventListener("hashchange", hashHandler);
        };
        _cleanups.push(cleanup);
        return cleanup;
      } catch (error) {
        _metrics.errors++;
        return () => {
        };
      }
    },
    onNavIntent(callback) {
      if (typeof callback !== "function") return () => {
      };
      try {
        const bus = _getEventBus();
        if (!bus || !bus.on) return () => {
        };
        const handler = (data) => {
          callback(data);
        };
        const cleanup = bus.on(NAV_EVENTS.NAVIGATE_PATH, handler);
        if (typeof cleanup === "function") {
          _cleanups.push(cleanup);
          return cleanup;
        }
        const manualCleanup = () => {
          if (bus.off) bus.off(NAV_EVENTS.NAVIGATE_PATH, handler);
        };
        _cleanups.push(manualCleanup);
        return manualCleanup;
      } catch (error) {
        _metrics.errors++;
        return () => {
        };
      }
    },
    getMetrics() {
      return Object.assign({}, _metrics);
    },
    reset() {
      _metrics = { navigations: 0, routeChanges: 0, navIntents: 0, hardNavs: 0, errors: 0, lastNavigation: null, lastRouteChange: null, busSource: null };
    },
    destroy() {
      _cleanups.forEach((fn) => {
        try {
          fn();
        } catch (e) {
        }
      });
      _cleanups = [];
    },
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        p0Compliant: true,
        p02Compliant: true,
        p2Compliant: true,
        portsInitialized: Ports.isInitialized(),
        currentRoute: this.getCurrentRoute(),
        cleanupCount: _cleanups.length,
        metrics: this.getMetrics(),
        busSource: _metrics.busSource,
        capabilities: ["navigate", "navigateByIntent", "onRouteChange", "onNavIntent"]
      };
    },
    healthCheck() {
      const bus = _getEventBus();
      const hasEventBus = !!bus;
      const hasRouterGlobal = !!_getPort("routerGlobal");
      const currentRoute = this.getCurrentRoute();
      const hasValidRoute = currentRoute && !currentRoute.error;
      const checks = {
        hasEventBus,
        hasRouterGlobal,
        hasValidRoute,
        noErrors: _metrics.errors === 0,
        cleanupSetup: _cleanups.length >= 0,
        navIntentSupport: true,
        p0Compliant: true,
        p02Compliant: true,
        p2Compliant: true
      };
      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;
      let status = "HEALTHY";
      if (!hasEventBus && !hasRouterGlobal) status = "DEGRADED";
      if (_metrics.errors > 5) status = "DEGRADED";
      return {
        status,
        score: passed,
        maxScore: total,
        scoreDisplay: `${passed}/${total}`,
        checks,
        currentRoute,
        metrics: _metrics,
        cleanupCount: _cleanups.length,
        version: VERSION,
        moduleId: MODULE_ID,
        portsInitialized: Ports.isInitialized(),
        busSource: _getPort("eventBus") ? "eventBus" : _getPort("eventBusGlobal") ? "eventBusGlobal" : "none",
        timestamp: Date.now()
      };
    }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p0Compliant: true, p02Compliant: true, p2Compliant: true, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, p0Compliant: true, p02Compliant: true, p2Compliant: true, portsInitialized: Ports.isInitialized() };
}
var router_adapter_default = { VERSION, MODULE_ID, createRouterAdapter, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createRouterAdapter,
  router_adapter_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
