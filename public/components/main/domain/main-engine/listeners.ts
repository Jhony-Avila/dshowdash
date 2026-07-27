

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.7.0-PANELID-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.domain.main-engine.listeners
// PURPOSE: Main Engine - Listeners
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS, NAV_EVENTS, NAV_INTENTS, SIDEBAR_EVENTS from /core/runtime/eve...
//   getRouteByIdOrPath from /components/router/registry/routes.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   setupAllListeners() — exported function
//   destroyAllListeners() — exported function
//   init() — exported function
//   cleanup() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   MAIN_NAV_EVENTS — exported value
//   registerListener() — exported function
//   registerDOMListener() — exported function
//   unregisterAll() — exported function
//   getListeners() — exported function
//   extractPanelId() — exported function
//   extractPanelIdFromSidebarItem() — exported function
//   emitNavigationSync() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   MAIN_NAV_EVENTS.NAVIGATION_SYNC
// LISTENS (eventos):
//   event
// WINDOW ACCESS:
//   (window as any).SidebarRegistry
// @changelog v3.7.0-PANELID-AAA: Fix extractPanelId to support nested { route: { path } } format from applyRouteEffects + add virtualRoute.view priority extraction
// @changelog v3.6.0-PANELID-AAA: Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { NAV_EVENTS, NAV_INTENTS } from '/core/runtime/events/catalog/nav.events.js';
import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { getRouteByIdOrPath } from '/components/router/registry/routes.js';

const MODULE_ID = 'components.main.domain.main-engine.listeners';
const VERSION = '3.7.0-PANELID-PRIORITY';

const Ports = createCorePorts({ moduleId: MODULE_ID });

let _injectedPorts: Record<string, unknown> | null = null;

function _initPorts() { Ports.init(); }

function _getPort(name: string) {
  if (_injectedPorts && _injectedPorts[name]) return _injectedPorts[name];
  return Ports.get(name);
}

export function injectPorts(p: Record<string, unknown>) {
  _injectedPorts = p;
  return Ports.inject(p);
}
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, listeners: [] as unknown[], allSetup: false, currentPanel: null as string | null, navigationHistory: [] as unknown[] };
let _cleanups: Array<() => void> = [];
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
  NAVIGATION_SYNC: 'main.navigation.sync'
};

function registerListener(event: string, handler: (...args: unknown[]) => void, options?: Record<string, unknown>) {
  options = options || {};
  _metrics.registered++;
  const eb = _getPort('eventBus') || _getPort('events');
  const ebTyped = eb as Record<string, (...args: unknown[]) => unknown> | null;
  if (ebTyped && ebTyped.on) {
    const cleanup = ebTyped.on(event, (data: Record<string, unknown>) => {
      _metrics.triggered++;
      handler(data);
    });
    if (typeof cleanup === 'function') {
// @ts-expect-error TS migration - TS2345
      _cleanups.push(cleanup);
    } else {
      const manualCleanup = () => { if (ebTyped.off) ebTyped.off(event, handler); };
      _cleanups.push(manualCleanup);
    }
    _state.listeners.push({ event, handler, registeredAt: Date.now() });
    return cleanup;
  }
  return () => {};
}

function registerDOMListener(element: HTMLElement, event: string, handler: EventListener, options: Record<string, unknown>) {
  if (!element || typeof element.addEventListener !== 'function') return () => {};
  _metrics.registered++;
  element.addEventListener(event, handler, options as AddEventListenerOptions);
  const cleanup = () => { element.removeEventListener(event, handler, options as EventListenerOptions); };
  _cleanups.push(cleanup);
  return cleanup;
}

function unregisterAll() {
  for (let i = 0; i < _cleanups.length; i++) {
    try { if (typeof _cleanups[i] === 'function') _cleanups[i](); } catch (e) {}
  }
  _cleanups = [];
  _state.listeners = [];
  return { ok: true };
}

function getListeners() {
  return _state.listeners.map((l: unknown) => {
    const item = l as Record<string, unknown>;
    return { event: item.event, registeredAt: item.registeredAt };
  });
}

// v3.7.0: extractPanelId - supports both flat { path } and nested { route: { path } } formats
// Priority: 1) virtualRoute.view from event data, 2) route path resolution via registry
function extractPanelId(route: string | Record<string, unknown> | null, globalsPort?: Record<string, unknown> | null) {
  if (!route) return null;
  const routeObj = route as Record<string, unknown>;

  // v3.7.0: If data has virtualRoute.view, use it directly (highest priority - already resolved panelId)
  if (typeof route !== 'string' && routeObj.virtualRoute && (routeObj.virtualRoute as Record<string, unknown>).view) {
    return (routeObj.virtualRoute as Record<string, unknown>).view;
  }

  // v3.7.0: Support nested format from applyRouteEffects: { route: { path: ... } }
  let routeResolved: string | Record<string, unknown> = route;
  if (typeof route === 'object' && routeObj.route && typeof routeObj.route === 'object' && (routeObj.route as Record<string, unknown>).path) {
    routeResolved = routeObj.route as Record<string, unknown>;
  }

  const rObj = routeResolved as Record<string, unknown>;
  let path = typeof routeResolved === 'string' ? routeResolved : ((rObj.path || rObj.hash || '') as string);
  // v3.7.0: Guard against route being an object (e.g. route.route was object but had no path)
  if (typeof path !== 'string') path = '';
  path = path.replace(/^#/, '');
  if (path && path.charAt(0) !== '/') path = '/' + path;
  const segments = path.split('/').filter((s: string) => s);
  const firstSegment = segments[0] || '';

  if (firstSegment.match(/^panel-\d+$/)) return firstSegment;
  if (firstSegment.match(/^panel-[a-z-]+$/)) return firstSegment;
  if (firstSegment.match(/^painel-[a-z-]+$/)) return firstSegment;
  if (!firstSegment || firstSegment === '' || path === '/') return 'panel-cards';

  _metrics.routerLookups++;
  let routeDef = getRouteByIdOrPath(path);
  if (routeDef && routeDef.defaultView) return routeDef.defaultView;
  routeDef = getRouteByIdOrPath('/' + firstSegment);
  if (routeDef && routeDef.defaultView) return routeDef.defaultView;
  routeDef = getRouteByIdOrPath(firstSegment);
  if (routeDef && routeDef.defaultView) return routeDef.defaultView;
  routeDef = getRouteByIdOrPath('#/' + firstSegment);
  if (routeDef && routeDef.defaultView) return routeDef.defaultView;

  try {
    const gp = (globalsPort || _getPort('globals')) as Record<string, (...args: unknown[]) => unknown> | null;
    let registry = gp && gp.getSidebarRegistry ? gp.getSidebarRegistry() : null;
    if (!registry && typeof window !== 'undefined') {
      registry = (window as any).SidebarRegistry;
    }
    const reg = registry as Record<string, (...args: unknown[]) => Record<string, unknown>[]> | null;
    if (reg && reg.getItems) {
      const items = reg.getItems();
      for (let k = 0; k < items.length; k++) {
        const item = items[k];
        const itemRoute = ((item.route || '') as string).replace(/^[#\/]+/, '');
        if (itemRoute === firstSegment && item.panelId) return item.panelId;
        if (item.id === firstSegment && item.panelId) return item.panelId;
      }
    }
  } catch (e) {}

  _metrics.extractionFailures++;
  return null;
}

// v3.6.0-PANELID-PRIORITY: Extract panel ID from sidebar item data
// Priority order: data.panelId > data.item.panelId > data.item.route > data.item.path > data.itemId > data.item.id
function extractPanelIdFromSidebarItem(data: Record<string, unknown>, globalsPort?: Record<string, unknown> | null) {
  if (!data) return null;
  const item = data.item as Record<string, unknown> | undefined;

  // v3.6.0: Prioridade 0 - panelId direto no payload do evento (from event-setup v6.0.0)
  if (data.panelId) {
    _metrics.panelIdFromEventPayload++;
    return data.panelId;
  }

  // Prioridade 1: item.panelId direto
  if (item && item.panelId) {
    _metrics.panelIdFromEventPayload++;
    return item.panelId;
  }

  // Prioridade 2: item.route
  if (item && item.route) {
    const fromRoute = extractPanelId(item.route as string, globalsPort);
    if (fromRoute) return fromRoute;
  }

  // Prioridade 3: item.path
  if (item && item.path) {
    const fromPath = extractPanelId(item.path as string, globalsPort);
    if (fromPath) return fromPath;
  }

  // Prioridade 4: itemId com conversão
  if (data.itemId) {
    const itemId = data.itemId as string;
    if (itemId.indexOf('panel-') === 0) {
      return itemId;
    }
    const fromItemId = extractPanelId(itemId, globalsPort);
    if (fromItemId) return fromItemId;
    return 'panel-' + itemId.replace(/^item-/, '');
  }

  // Prioridade 5: item.id
  if (item && item.id) {
    const itemIdStr = item.id as string;
    if (itemIdStr.indexOf('panel-') === 0) {
      return itemIdStr;
    }
    return 'panel-' + itemIdStr.replace(/^item-/, '');
  }

  return null;
}

function emitNavigationSync(panelId: unknown, route: unknown, options: Record<string, unknown>) {
  const eb = (_getPort('eventBus') || _getPort('events')) as Record<string, (...args: unknown[]) => unknown> | null;
  if (!eb || !eb.emit) return;
  _state.currentPanel = panelId as string;
  if (_state.navigationHistory.length >= 20) _state.navigationHistory.shift();
  _state.navigationHistory.push({ panelId, route, timestamp: Date.now() });
  eb.emit(MAIN_NAV_EVENTS.NAVIGATION_SYNC, {
    panelId,
    route,
    previousPanel: _state.navigationHistory.length > 1 ? (_state.navigationHistory[_state.navigationHistory.length - 2] as Record<string, unknown>).panelId : null,
    historyLength: _state.navigationHistory.length,
    source: MODULE_ID,
    timestamp: Date.now()
  });
}

export function setupAllListeners(engine: Record<string, unknown>) {
  if (_state.allSetup) return { ok: true, alreadySetup: true };

  if (engine && engine._ports) {
    _injectedPorts = engine._ports as Record<string, unknown>;
  }

  init({});
  const eb = _getPort('eventBus') || _getPort('events');
  const gp = _getPort('globals') as Record<string, unknown> | null;

  const eng = engine as Record<string, (...args: unknown[]) => unknown>;
  if (eb && engine) {

    // ═══════════════════════════════════════════════════════════════
    // ROUTER EVENTS
    // ═══════════════════════════════════════════════════════════════

    // Listener para ROUTER_EVENTS.ROUTE_CHANGED
    // v3.5.0: Added same-panel guard to prevent re-navigation loops
    if (eng.navigate) {
      // @ts-expect-error strict migration — TS2345
      registerListener(ROUTER_EVENTS.ROUTE_CHANGED, (data: Record<string, unknown>) => {
        _metrics.routeChanges++;
        const panelId = extractPanelId(data, gp);
        if (panelId) {
          if (panelId === _state.currentPanel) {
            _metrics.duplicateNavBlocked++;
            return;
          }
          _metrics.navigations++;
          eng.navigate(panelId, { source: 'route-changed' });
        }
      });
    }

    // Listener para main:navigate (evento interno)
    if (eng.navigate) {
      // @ts-expect-error strict migration — TS2345
      registerListener('main:navigate', (data: Record<string, unknown>) => {
        if (data && data.panelId) {
          _metrics.navigations++;
          eng.navigate(data.panelId as string, data.options as Record<string, unknown>);
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // NAV INTENTS & PATHS
    // ═══════════════════════════════════════════════════════════════

    // Listener para NAV_INTENTS.NAVIGATE
    if (eng.navigate) {
      // @ts-expect-error strict migration — TS2345
      registerListener(NAV_INTENTS.NAVIGATE, (data: Record<string, unknown>) => {
        _metrics.navIntents++;
        let panelId = null;
        if (data && data.panelId) {
          panelId = data.panelId;
        } else if (data && data.route) {
// @ts-expect-error TS migration - TS2345
          panelId = extractPanelId(data.route, gp);
        } else if (data && data.path) {
// @ts-expect-error TS migration - TS2345
          panelId = extractPanelId(data.path, gp);
        }
        if (panelId) {
          _metrics.navigations++;
          eng.navigate(panelId, { source: 'nav-intent', originalData: data });
        }
      });
    }

    // v3.3.0-NAVPATH-FIX: Listener para NAV_EVENTS.NAVIGATE_PATH (NavRail, Sidebar, Header, Footer)
    if (eng.navigate) {
      // @ts-expect-error strict migration — TS2345
      registerListener(NAV_EVENTS.NAVIGATE_PATH, (data: Record<string, unknown>) => {
        _metrics.navPathEvents++;
        let panelId: unknown = null;
        const nestedData = data.data as Record<string, unknown> | undefined;

        if (data && data.panelId) {
          panelId = data.panelId;
        } else if (data && nestedData && nestedData.panelId) {
          panelId = nestedData.panelId;
        } else if (data && data.itemId) {
          panelId = (data.itemId as string).indexOf('panel-') === 0 ? data.itemId : 'panel-' + data.itemId;
        } else if (data && nestedData && nestedData.itemId) {
          const nestedItemId = nestedData.itemId as string;
          panelId = nestedItemId.indexOf('panel-') === 0 ? nestedItemId : 'panel-' + nestedItemId;
        } else if (data && data.path) {
          panelId = extractPanelId(data.path as string, gp);
        } else if (data && data.route) {
          panelId = extractPanelId(data.route as string, gp);
        }

        if (panelId) {
          _metrics.navigations++;
          eng.navigate(panelId, {
            source: 'nav-path',
            originalData: data,
// @ts-expect-error TS migration - TS2339
            route: data.path || data.route || ('#/' + panelId.replace('panel-', ''))
          });
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // v3.4.0-SIDEBAR-EVENTS: Listeners para eventos da Sidebar
    // v3.5.0: ITEM_CLICK is now tracking-only to prevent double navigation
    // v3.6.0: NAVIGATE now uses panelId from event payload (data-driven)
    // ═══════════════════════════════════════════════════════════════

    // Listener para SIDEBAR_EVENTS.NAVIGATE (primary navigation handler)
    if (eng.navigate) {
      // @ts-expect-error strict migration — TS2345
      registerListener(SIDEBAR_EVENTS.NAVIGATE, (data: Record<string, unknown>) => {
        _metrics.sidebarNavigates++;
        const panelId = extractPanelIdFromSidebarItem(data, gp);

        if (panelId) {
          _metrics.navigations++;
          const sidebarItem = data.item as Record<string, unknown> | undefined;
          let route: unknown = '#/' + (panelId as string).replace('panel-', '');
          if (sidebarItem && sidebarItem.route) {
            route = sidebarItem.route;
          }
          eng.navigate(panelId, {
            source: 'sidebar-navigate',
            originalData: data,
            route
          });
        }
      });
    }

    // Listener para SIDEBAR_EVENTS.ITEM_CLICK (tracking only)
    // v3.5.0-SINGLE-NAV-FIX: Removed engine.navigate() to prevent double navigation.
    // Navigation is handled exclusively by SIDEBAR_EVENTS.NAVIGATE above.
    // @ts-expect-error strict migration — TS2345
    registerListener(SIDEBAR_EVENTS.ITEM_CLICK, (data: Record<string, unknown>) => {
      _metrics.sidebarItemClicks++;
    });

    // ═══════════════════════════════════════════════════════════════
    // NAVIGATION SUCCESS
    // ═══════════════════════════════════════════════════════════════

    // Listener para NAV_EVENTS.NAVIGATE_SUCCESS
    // @ts-expect-error strict migration — TS2345
    registerListener(NAV_EVENTS.NAVIGATE_SUCCESS, (data: Record<string, unknown>) => {
      _metrics.navSuccess++;
      if (data && data.panelId) {
        emitNavigationSync(data.panelId as string, (data.route || data.path) as string, data);
      }
    });
  }

  _state.allSetup = true;
  return { ok: true, listenersRegistered: _state.listeners.length };
}

// v3.2.0: destroyAllListeners - alias for cleanup with engine context reset
export function destroyAllListeners(engine: Record<string, unknown>) {
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

export function init(options: Record<string, unknown>) {
  options = options || {};
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  _state.initialized = true;
  return { ok: true };
}

// v3.5.0: Aligned with destroyAllListeners for consistent full reset
export function cleanup() {
  unregisterAll();
  _state.allSetup = false;
  _state.initialized = false;
  _state.currentPanel = null;
  _state.navigationHistory = [];
  _injectedPorts = null;
  return { ok: true };
}

export function healthCheck() {
  const eb = _getPort('eventBus') || _getPort('events');
  return {
    status: eb ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    listenersCount: _state.listeners.length,
    allSetup: _state.allSetup,
    hasEventBus: !!eb,
    hasGlobalsPort: !!_getPort('globals'),
    hasInjectedPorts: !!_injectedPorts,
    metrics: Object.assign({}, _metrics)
  };
}

export function info() {
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

export { MODULE_ID, VERSION, MAIN_NAV_EVENTS, registerListener, registerDOMListener, unregisterAll, getListeners, extractPanelId, extractPanelIdFromSidebarItem, emitNavigationSync };

export default {
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
