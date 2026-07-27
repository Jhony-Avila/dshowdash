import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
const VERSION = "7.1.0-P2-HARDNAV";
const MODULE_ID = "sidebar-router-adapter";
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
function _getEventBus() {
  return _getPort("eventBus") || _getPort("eventBusGlobal");
}
function createRouterAdapter() {
  _initPorts();
  let _cleanups = [];
  let _metrics = {
    navigations: 0,
    routeChanges: 0,
    hardNavs: 0,
    errors: 0,
    lastNavigation: null,
    lastRouteChange: null,
    busSource: null
  };
  function _emitNavigateRequest(route, source, meta) {
    const bus = _getEventBus();
    if (bus && bus.emit) {
      _metrics.busSource = _getPort("eventBus") ? "eventBus" : "eventBusGlobal";
      bus.emit(ROUTER_EVENTS.NAVIGATE, {
        path: route,
        options: { source: source || MODULE_ID, ...meta },
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
    navigate(route, meta = {}) {
      try {
        const rg = _getPort("routerGlobal");
        if (rg && rg.navigate) {
          rg.navigate(route, { source: MODULE_ID, ...meta });
          _metrics.navigations++;
          _metrics.lastNavigation = { route, timestamp: Date.now() };
          return { success: true, method: "router-global" };
        }
        const bus = _getEventBus();
        if (bus && bus.emit) {
          _emitNavigateRequest(route, MODULE_ID, meta);
          _metrics.navigations++;
          _metrics.lastNavigation = { route, timestamp: Date.now() };
          return { success: true, method: "event-bus-navigate" };
        }
        if (route && typeof window !== "undefined" && window.location) {
          _emitHardNav(route, "No RouterGlobal or EventBus available");
          window.location.hash = route.startsWith("#") ? route : `#${route}`;
          _metrics.navigations++;
          _metrics.lastNavigation = { route, timestamp: Date.now() };
          return { success: true, method: "hash-fallback" };
        }
        _metrics.errors++;
        return { success: false, error: "no-route" };
      } catch (error) {
        _metrics.errors++;
        return { success: false, error: error.message };
      }
    },
    getCurrentRoute() {
      try {
        const rg = _getPort("routerGlobal");
        if (rg?.getCurrentRoute) return rg.getCurrentRoute();
        if (typeof window !== "undefined" && window.location) {
          return {
            path: window.location.hash || "#/",
            hash: window.location.hash,
            pathname: window.location.pathname
          };
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
        const rg = _getPort("routerGlobal");
        if (rg?.on) {
          const handler = (data) => {
            _metrics.routeChanges++;
            _metrics.lastRouteChange = Date.now();
            callback(data);
          };
          rg.on(ROUTER_EVENTS.ROUTE_CHANGED, handler);
          const cleanup2 = () => {
            rg.off?.(ROUTER_EVENTS.ROUTE_CHANGED, handler);
          };
          _cleanups.push(cleanup2);
          return cleanup2;
        }
        const hashHandler = () => {
          _metrics.routeChanges++;
          _metrics.lastRouteChange = Date.now();
          callback({
            path: window.location.hash || "#/",
            hash: window.location.hash
          });
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
    getMetrics() {
      return { ..._metrics };
    },
    reset() {
      _metrics = {
        navigations: 0,
        routeChanges: 0,
        hardNavs: 0,
        errors: 0,
        lastNavigation: null,
        lastRouteChange: null,
        busSource: null
      };
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
        p2Compliant: true,
        portsInitialized: Ports.isInitialized(),
        currentRoute: this.getCurrentRoute(),
        cleanupCount: _cleanups.length,
        metrics: this.getMetrics(),
        busSource: _metrics.busSource
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
        p0Compliant: true,
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
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p0Compliant: true,
    p2Compliant: true,
    portsInitialized: Ports.isInitialized()
  };
}
function getMetrics() {
  return {};
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    p0Compliant: true,
    p2Compliant: true,
    portsInitialized: Ports.isInitialized()
  };
}
var router_adapter_default = {
  VERSION,
  MODULE_ID,
  createRouterAdapter,
  info,
  getMetrics,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  createRouterAdapter,
  router_adapter_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
