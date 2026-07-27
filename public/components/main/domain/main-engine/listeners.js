import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { ROUTER_EVENTS } from "/core/runtime/events/catalog/router.events.js";
import { NAV_EVENTS, NAV_INTENTS } from "/core/runtime/events/catalog/nav.events.js";
import { SIDEBAR_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { getRouteByIdOrPath } from "/components/router/registry/routes.js";
const MODULE_ID = "components.main.domain.main-engine.listeners";
const VERSION = "3.7.0-PANELID-PRIORITY";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _injectedPorts = null;
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  if (_injectedPorts && _injectedPorts[name]) return _injectedPorts[name];
  return Ports.get(name);
}
function injectPorts(p) {
  _injectedPorts = p;
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _state = { initialized: false, listeners: [], allSetup: false, currentPanel: null, navigationHistory: [] };
let _cleanups = [];
const _metrics = {
  registered: 0,
  triggered: 0,
  routeChanges: 0,
  navigations: 0,
  extractionFailures: 0,
  routerLookups: 0,
  navIntents: 0,
  navPathEvents: 0,
  navSuccess: 0,
  sidebarNavigates: 0,
  sidebarItemClicks: 0,
  duplicateNavBlocked: 0,
  panelIdFromEventPayload: 0
};
const MAIN_NAV_EVENTS = {
  NAVIGATION_SYNC: "main.navigation.sync"
};
function registerListener(event, handler, options) {
  options = options || {};
  _metrics.registered++;
  const eb = _getPort("eventBus") || _getPort("events");
  const ebTyped = eb;
  if (ebTyped && ebTyped.on) {
    const cleanup2 = ebTyped.on(event, (data) => {
      _metrics.triggered++;
      handler(data);
    });
    if (typeof cleanup2 === "function") {
      _cleanups.push(cleanup2);
    } else {
      const manualCleanup = () => {
        if (ebTyped.off) ebTyped.off(event, handler);
      };
      _cleanups.push(manualCleanup);
    }
    _state.listeners.push({ event, handler, registeredAt: Date.now() });
    return cleanup2;
  }
  return () => {
  };
}
function registerDOMListener(element, event, handler, options) {
  if (!element || typeof element.addEventListener !== "function") return () => {
  };
  _metrics.registered++;
  element.addEventListener(event, handler, options);
  const cleanup2 = () => {
    element.removeEventListener(event, handler, options);
  };
  _cleanups.push(cleanup2);
  return cleanup2;
}
function unregisterAll() {
  for (let i = 0; i < _cleanups.length; i++) {
    try {
      if (typeof _cleanups[i] === "function") _cleanups[i]();
    } catch (e) {
    }
  }
  _cleanups = [];
  _state.listeners = [];
  return { ok: true };
}
function getListeners() {
  return _state.listeners.map((l) => {
    const item = l;
    return { event: item.event, registeredAt: item.registeredAt };
  });
}
function extractPanelId(route, globalsPort) {
  if (!route) return null;
  const routeObj = route;
  if (typeof route !== "string" && routeObj.virtualRoute && routeObj.virtualRoute.view) {
    return routeObj.virtualRoute.view;
  }
  let routeResolved = route;
  if (typeof route === "object" && routeObj.route && typeof routeObj.route === "object" && routeObj.route.path) {
    routeResolved = routeObj.route;
  }
  const rObj = routeResolved;
  let path = typeof routeResolved === "string" ? routeResolved : rObj.path || rObj.hash || "";
  if (typeof path !== "string") path = "";
  path = path.replace(/^#/, "");
  if (path && path.charAt(0) !== "/") path = "/" + path;
  const segments = path.split("/").filter((s) => s);
  const firstSegment = segments[0] || "";
  if (firstSegment.match(/^panel-\d+$/)) return firstSegment;
  if (firstSegment.match(/^panel-[a-z-]+$/)) return firstSegment;
  if (firstSegment.match(/^painel-[a-z-]+$/)) return firstSegment;
  if (!firstSegment || firstSegment === "" || path === "/") return "panel-cards";
  _metrics.routerLookups++;
  let routeDef = getRouteByIdOrPath(path);
  if (routeDef && routeDef.defaultView) return routeDef.defaultView;
  routeDef = getRouteByIdOrPath("/" + firstSegment);
  if (routeDef && routeDef.defaultView) return routeDef.defaultView;
  routeDef = getRouteByIdOrPath(firstSegment);
  if (routeDef && routeDef.defaultView) return routeDef.defaultView;
  routeDef = getRouteByIdOrPath("#/" + firstSegment);
  if (routeDef && routeDef.defaultView) return routeDef.defaultView;
  try {
    const gp = globalsPort || _getPort("globals");
    let registry = gp && gp.getSidebarRegistry ? gp.getSidebarRegistry() : null;
    if (!registry && typeof window !== "undefined") {
      registry = window.SidebarRegistry;
    }
    const reg = registry;
    if (reg && reg.getItems) {
      const items = reg.getItems();
      for (let k = 0; k < items.length; k++) {
        const item = items[k];
        const itemRoute = (item.route || "").replace(/^[#\/]+/, "");
        if (itemRoute === firstSegment && item.panelId) return item.panelId;
        if (item.id === firstSegment && item.panelId) return item.panelId;
      }
    }
  } catch (e) {
  }
  _metrics.extractionFailures++;
  return null;
}
function extractPanelIdFromSidebarItem(data, globalsPort) {
  if (!data) return null;
  const item = data.item;
  if (data.panelId) {
    _metrics.panelIdFromEventPayload++;
    return data.panelId;
  }
  if (item && item.panelId) {
    _metrics.panelIdFromEventPayload++;
    return item.panelId;
  }
  if (item && item.route) {
    const fromRoute = extractPanelId(item.route, globalsPort);
    if (fromRoute) return fromRoute;
  }
  if (item && item.path) {
    const fromPath = extractPanelId(item.path, globalsPort);
    if (fromPath) return fromPath;
  }
  if (data.itemId) {
    const itemId = data.itemId;
    if (itemId.indexOf("panel-") === 0) {
      return itemId;
    }
    const fromItemId = extractPanelId(itemId, globalsPort);
    if (fromItemId) return fromItemId;
    return "panel-" + itemId.replace(/^item-/, "");
  }
  if (item && item.id) {
    const itemIdStr = item.id;
    if (itemIdStr.indexOf("panel-") === 0) {
      return itemIdStr;
    }
    return "panel-" + itemIdStr.replace(/^item-/, "");
  }
  return null;
}
function emitNavigationSync(panelId, route, options) {
  const eb = _getPort("eventBus") || _getPort("events");
  if (!eb || !eb.emit) return;
  _state.currentPanel = panelId;
  if (_state.navigationHistory.length >= 20) _state.navigationHistory.shift();
  _state.navigationHistory.push({ panelId, route, timestamp: Date.now() });
  eb.emit(MAIN_NAV_EVENTS.NAVIGATION_SYNC, {
    panelId,
    route,
    previousPanel: _state.navigationHistory.length > 1 ? _state.navigationHistory[_state.navigationHistory.length - 2].panelId : null,
    historyLength: _state.navigationHistory.length,
    source: MODULE_ID,
    timestamp: Date.now()
  });
}
function setupAllListeners(engine) {
  if (_state.allSetup) return { ok: true, alreadySetup: true };
  if (engine && engine._ports) {
    _injectedPorts = engine._ports;
  }
  init({});
  const eb = _getPort("eventBus") || _getPort("events");
  const gp = _getPort("globals");
  const eng = engine;
  if (eb && engine) {
    if (eng.navigate) {
      registerListener(ROUTER_EVENTS.ROUTE_CHANGED, (data) => {
        _metrics.routeChanges++;
        const panelId = extractPanelId(data, gp);
        if (panelId) {
          if (panelId === _state.currentPanel) {
            _metrics.duplicateNavBlocked++;
            return;
          }
          _metrics.navigations++;
          eng.navigate(panelId, { source: "route-changed" });
        }
      });
    }
    if (eng.navigate) {
      registerListener("main:navigate", (data) => {
        if (data && data.panelId) {
          _metrics.navigations++;
          eng.navigate(data.panelId, data.options);
        }
      });
    }
    if (eng.navigate) {
      registerListener(NAV_INTENTS.NAVIGATE, (data) => {
        _metrics.navIntents++;
        let panelId = null;
        if (data && data.panelId) {
          panelId = data.panelId;
        } else if (data && data.route) {
          panelId = extractPanelId(data.route, gp);
        } else if (data && data.path) {
          panelId = extractPanelId(data.path, gp);
        }
        if (panelId) {
          _metrics.navigations++;
          eng.navigate(panelId, { source: "nav-intent", originalData: data });
        }
      });
    }
    if (eng.navigate) {
      registerListener(NAV_EVENTS.NAVIGATE_PATH, (data) => {
        _metrics.navPathEvents++;
        let panelId = null;
        const nestedData = data.data;
        if (data && data.panelId) {
          panelId = data.panelId;
        } else if (data && nestedData && nestedData.panelId) {
          panelId = nestedData.panelId;
        } else if (data && data.itemId) {
          panelId = data.itemId.indexOf("panel-") === 0 ? data.itemId : "panel-" + data.itemId;
        } else if (data && nestedData && nestedData.itemId) {
          const nestedItemId = nestedData.itemId;
          panelId = nestedItemId.indexOf("panel-") === 0 ? nestedItemId : "panel-" + nestedItemId;
        } else if (data && data.path) {
          panelId = extractPanelId(data.path, gp);
        } else if (data && data.route) {
          panelId = extractPanelId(data.route, gp);
        }
        if (panelId) {
          _metrics.navigations++;
          eng.navigate(panelId, {
            source: "nav-path",
            originalData: data,
            // @ts-expect-error TS migration - TS2339
            route: data.path || data.route || "#/" + panelId.replace("panel-", "")
          });
        }
      });
    }
    if (eng.navigate) {
      registerListener(SIDEBAR_EVENTS.NAVIGATE, (data) => {
        _metrics.sidebarNavigates++;
        const panelId = extractPanelIdFromSidebarItem(data, gp);
        if (panelId) {
          _metrics.navigations++;
          const sidebarItem = data.item;
          let route = "#/" + panelId.replace("panel-", "");
          if (sidebarItem && sidebarItem.route) {
            route = sidebarItem.route;
          }
          eng.navigate(panelId, {
            source: "sidebar-navigate",
            originalData: data,
            route
          });
        }
      });
    }
    registerListener(SIDEBAR_EVENTS.ITEM_CLICK, (data) => {
      _metrics.sidebarItemClicks++;
    });
    registerListener(NAV_EVENTS.NAVIGATE_SUCCESS, (data) => {
      _metrics.navSuccess++;
      if (data && data.panelId) {
        emitNavigationSync(data.panelId, data.route || data.path, data);
      }
    });
  }
  _state.allSetup = true;
  return { ok: true, listenersRegistered: _state.listeners.length };
}
function destroyAllListeners(engine) {
  unregisterAll();
  _state.allSetup = false;
  _state.initialized = false;
  _state.currentPanel = null;
  _state.navigationHistory = [];
  _injectedPorts = null;
  _metrics.registered = 0;
  _metrics.triggered = 0;
  return { ok: true, destroyed: true };
}
function init(options) {
  options = options || {};
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  _state.initialized = true;
  return { ok: true };
}
function cleanup() {
  unregisterAll();
  _state.allSetup = false;
  _state.initialized = false;
  _state.currentPanel = null;
  _state.navigationHistory = [];
  _injectedPorts = null;
  return { ok: true };
}
function healthCheck() {
  const eb = _getPort("eventBus") || _getPort("events");
  return {
    status: eb ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    listenersCount: _state.listeners.length,
    allSetup: _state.allSetup,
    hasEventBus: !!eb,
    hasGlobalsPort: !!_getPort("globals"),
    hasInjectedPorts: !!_injectedPorts,
    metrics: Object.assign({}, _metrics)
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _state.initialized,
    allSetup: _state.allSetup,
    listenersCount: _state.listeners.length,
    currentPanel: _state.currentPanel,
    navigationHistoryLength: _state.navigationHistory.length,
    hasInjectedPorts: !!_injectedPorts,
    metrics: Object.assign({}, _metrics)
  };
}
var listeners_default = {
  MODULE_ID,
  VERSION,
  init,
  cleanup,
  destroyAllListeners,
  setupAllListeners,
  registerListener,
  registerDOMListener,
  unregisterAll,
  getListeners,
  extractPanelId,
  extractPanelIdFromSidebarItem,
  emitNavigationSync,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  MAIN_NAV_EVENTS
};
export {
  MAIN_NAV_EVENTS,
  MODULE_ID,
  VERSION,
  cleanup,
  listeners_default as default,
  destroyAllListeners,
  emitNavigationSync,
  extractPanelId,
  extractPanelIdFromSidebarItem,
  getListeners,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  registerDOMListener,
  registerListener,
  setupAllListeners,
  unregisterAll
};
