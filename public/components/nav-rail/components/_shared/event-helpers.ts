// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.4.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-shared-events
// PURPOSE: Helpers de eventos para NavRail — navegação, ações UI,
//          intents e integração com EventBus/Registry
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//   NAV_EVENTS from /core/runtime/events/catalog/nav.events.js
//   NavRailRegistry from ../../registry/index.js
//
// PROVIDES:
//   getEventBus() — retorna EventBus via ports
//   emitUIAction(actionId, source, meta) — emite ação de UI
//   navigateToRoute(route, source, itemId, panelId) — navegação
//   emitNavIntent(itemId, route, panelId, source) — intent de nav
//   emitNavRailEvent(eventKey, data) — evento custom do NavRail
//   NAVRAIL_EVENTS — catálogo de eventos do NavRail
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
//   getMetrics() — métricas de uso
//   info() — metadata do módulo
//   healthCheck() — diagnóstico de saúde
//   VERSION — versão do módulo
//   MODULE_ID — identificador do módulo
//
// RECEIVES (via init/options): (none)
//
// EMITS (eventos):
//   NAV_EVENTS.NAVIGATE_PATH — intent de navegação
//   ROUTER_EVENTS.NAVIGATE — request de navegação
//   UI_EVENTS.ACTION — ação de UI
//   NAVRAIL_EVENTS.* — eventos custom do NavRail
//
// LISTENS (eventos): (none)
//
// WINDOW ACCESS:
//   window.location.hash — fallback de navegação
// ═══════════════════════════════════════════════════════════════
// NavRail Shared - Event Helpers P0-NAVIGATE + P2-HARDNAV + P03-PORTS + P04-PANELID
// @version 2.4.0-AAA
// @changelog v2.4.0-AAA - Added AAA Dependency Contract
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { NAV_EVENTS } from '/core/runtime/events/catalog/nav.events.js';
import { NavRailRegistry } from '../../registry/index.js';

const VERSION = '2.4.0-ES6';
const MODULE_ID = 'navrail-shared-events';

const NAVRAIL_EVENTS = {
  OPEN: 'navrail:open',
  CLOSE: 'navrail:close',
  TOGGLE: 'navrail:toggle',
  NAVIGATE: 'navrail:navigate',
  ITEM_CLICK: 'navrail:item-click',
  SECTION_TOGGLE: 'navrail:section-toggle',
  READY: 'navrail:ready',
  ERROR: 'navrail:error'
};

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const _metrics = { navIntents: 0, navigations: 0, fallbacks: 0, actions: 0 };

function getEventBus() { return _getPort('eventBus'); }

function _getPanelIdFromRegistry(itemId: string | null): string | null {
  if (!itemId) return null;
  const item = NavRailRegistry.getItem(itemId);
  if (item && item.panelId) return item.panelId as string;
  return `panel-${itemId}`;
}

function _getRouteFromRegistry(itemId: string | null): string | null {
  if (!itemId) return null;
  const item = NavRailRegistry.getItem(itemId);
  if (item && item.route) return item.route as string;
  return `#/${itemId}`;
}

function emitNavIntent(itemId: string, route: string, panelId: string | null, source: string) {
  const eventBus = _getPort('eventBus');
  if (!eventBus || !eventBus.emit) return false;
  _metrics.navIntents++;
  
  const resolvedPanelId = panelId || _getPanelIdFromRegistry(itemId);
  const resolvedRoute = route || _getRouteFromRegistry(itemId);
  
  const payload = {
    type: NAV_EVENTS.NAVIGATE_PATH,
    itemId,
    path: resolvedRoute,
    panelId: resolvedPanelId,
    source: source || 'navrail',
    timestamp: Date.now()
  };
  eventBus.emit(NAV_EVENTS.NAVIGATE_PATH, payload);
  return true;
}

function navigateToRoute(route: string, source: string, itemId: string | null, panelId: string | null) {
  if (!route) return false;
  const eventBus = _getPort('eventBus');
  
  const resolvedPanelId = panelId || _getPanelIdFromRegistry(itemId);
  
  if (itemId) {
    emitNavIntent(itemId, route, resolvedPanelId, source);
  }
  
  if (eventBus && eventBus.emit) {
    _metrics.navigations++;
    eventBus.emit(ROUTER_EVENTS.NAVIGATE, {
      path: route,
      options: { 
        itemId: itemId || null, 
        panelId: resolvedPanelId, 
        source: source || MODULE_ID 
      },
      source: source || MODULE_ID,
      timestamp: Date.now()
    });
    return true;
  }
  
  if (typeof window !== 'undefined' && window.location) {
    _metrics.fallbacks++;
    window.location.hash = route.indexOf('#') === 0 ? route : `#${route}`;
    return true;
  }
  
  return false;
}

function emitUIAction(actionId: string, source: string, meta: Record<string, unknown>) {
  if (!meta) meta = {};
  const eventBus = _getPort('eventBus');
  let itemId = null;
  
  if (actionId && actionId.indexOf('navrail:') === 0) {
    itemId = actionId.replace('navrail:', '');
  }
  
  const panelId = (meta.panelId as string | null) || _getPanelIdFromRegistry(itemId);
  const route = (meta.route as string | null) || _getRouteFromRegistry(itemId);
  
  if (route || meta.route) {
    _metrics.actions++;
    if (eventBus && eventBus.emit) {
      eventBus.emit(UI_EVENTS.ACTION, {
        actionId,
        source,
        timestamp: Date.now(),
        meta: Object.assign({}, meta, { panelId })
      });
    }
    // @ts-expect-error strict migration — TS2345
    return navigateToRoute(route, source, itemId, panelId);
  }
  
  if (itemId && itemId !== 'toggle-sidebar') {
    _metrics.actions++;
    if (eventBus && eventBus.emit) {
      eventBus.emit(UI_EVENTS.ACTION, {
        actionId,
        source,
        timestamp: Date.now(),
        meta: Object.assign({}, meta, { panelId, route })
      });
    }
    // @ts-expect-error strict migration — TS2345
    return navigateToRoute(route, source, itemId, panelId);
  }
  
  if (!eventBus || !eventBus.emit) return false;
  _metrics.actions++;
  const payload = { actionId, source, timestamp: Date.now(), meta };
  eventBus.emit(UI_EVENTS.ACTION, payload);
  return true;
}

function emitNavRailEvent(eventKey: string, data: Record<string, unknown>) {
  if (!data) data = {};
  const eventBus = _getPort('eventBus');
  if (!eventBus || !eventBus.emit) return false;
  eventBus.emit(eventKey, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
  return true;
}

function getMetrics() { return Object.assign({}, _metrics); }

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p03PortsOnly: true,
    p04RegistrySSoT: true,
    portsInitialized: Ports.isInitialized(),
    registryLoaded: NavRailRegistry.isLoaded ? NavRailRegistry.isLoaded() : false,
    metrics: getMetrics()
  };
}

function healthCheck() {
  const hasEventBus = !!_getPort('eventBus');
  const registryLoaded = NavRailRegistry.isLoaded ? NavRailRegistry.isLoaded() : false;
  return {
    status: hasEventBus && registryLoaded ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    p03PortsOnly: true,
    p04RegistrySSoT: true,
    checks: { 
      hasEventBus, 
      portsInitialized: Ports.isInitialized(),
      registryLoaded
    },
    metrics: getMetrics()
  };
}

export { getEventBus, emitUIAction, navigateToRoute, emitNavIntent, emitNavRailEvent, NAVRAIL_EVENTS, VERSION, MODULE_ID, injectPorts, getPorts, getMetrics, info, healthCheck };
export default { getEventBus, emitUIAction, navigateToRoute, emitNavIntent, emitNavRailEvent, NAVRAIL_EVENTS, VERSION, MODULE_ID, injectPorts, getPorts, getMetrics, info, healthCheck };
