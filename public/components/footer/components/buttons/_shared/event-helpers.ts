// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-NAVIGATE-FALLBACK)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-buttons-shared-events
// PURPOSE: Footer Buttons Shared - Event Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   FOOTER_EVENTS from /core/runtime/events/catalog/footer.events.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//   createLogger from ../../../core/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getEventBus() — exported function
//   emitFooterButtonClick() — exported function
//   navigateToRoute() — exported function
//   emitUIAction() — exported function
//   emitButtonEvent() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   UI_EVENTS.FOOTER_BUTTON_CLICK, ROUTER_EVENTS.NAVIGATE, UI_EVENTS.ACTION, FOOTER_EVENTS.*
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
//   window.location.hash (navigation fallback)
// @changelog v3.2.0-NAVIGATE-FALLBACK - navigateToRoute now falls back to window.location.hash when EventBus navigation is not handled
// @changelog v3.1.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v3.0.0-P0-NAVIGATE - P0 FIX: emit ROUTER_EVENTS.NAVIGATE instead of ROUTE_CHANGED
// @changelog v2.4.0-P0-ENTERPRISE - Removed window.EventBus fallback (100% DI compliance)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { FOOTER_EVENTS } from '/core/runtime/events/catalog/footer.events.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { createLogger } from '../../../core/logger.js';

const VERSION = '3.2.0-NAVIGATE-FALLBACK';
const MODULE_ID = 'footer-buttons-shared-events';

const Ports = createUiPorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
}

function _getPort(name: string) {
  _initPorts();
  return Ports.get(name);
}

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = createLogger(MODULE_ID);
const _metrics = { uiActions: 0, buttonClicks: 0, buttonEvents: 0, navigations: 0, navigationFallbacks: 0, eventBusMissing: 0 };

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: EventBus
// ═══════════════════════════════════════════════════════════════
export function getEventBus() {
  _initPorts();

  const portEventBus = _getPort('eventBus');
  if (portEventBus) return portEventBus;

  if (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const waEventBus = window.Core.windowAdapter.get('EventBus');
    if (waEventBus) return waEventBus;
  }


  _metrics.eventBusMissing++;
  _log.error('EventBus not available via Ports or Core.windowAdapter');
  return null;
}

export function emitFooterButtonClick(buttonId: string, trigger: string, meta: Record<string,unknown>) {
  if (meta === undefined) meta = {};
  let eventBus = getEventBus();
  if (!eventBus || !eventBus.emit) {
    _log.error('Cannot emit FOOTER_BUTTON_CLICK - EventBus unavailable');
    return false;
  }
  _metrics.buttonClicks++;
  let payload = {
    buttonId: buttonId,
    trigger: trigger || ('trigger:footer:' + buttonId),
    timestamp: Date.now(),
    meta: Object.assign({ source: 'footer' }, meta)
  };
  eventBus.emit(UI_EVENTS.FOOTER_BUTTON_CLICK, payload);
  _log.debug('FOOTER_BUTTON_CLICK emitted: ' + buttonId);
  return true;
}

// v3.2.0: navigateToRoute emits ROUTER_EVENTS.NAVIGATE via EventBus,
// then applies hash navigation as direct fallback to ensure the route
// actually changes (router may not be listening to this event yet)
export function navigateToRoute(route: string, source: string) {
  let eventBus = getEventBus();

  _metrics.navigations++;

  // Emit event for any listeners
  if (eventBus && eventBus.emit) {
    eventBus.emit(ROUTER_EVENTS.NAVIGATE, {
      path: route,
      options: { replace: false },
      source: source || MODULE_ID,
      meta: { origin: 'footer', reason: 'footer-action' },
      timestamp: Date.now()
    });
  }

  // Direct hash navigation fallback — ensures navigation actually happens
  // regardless of whether any router listener is subscribed to ROUTER_EVENTS.NAVIGATE
  if (typeof window !== 'undefined' && route) {
    const targetHash = route.charAt(0) === '#' ? route : '#' + route;
    if (window.location.hash !== targetHash) {
      _metrics.navigationFallbacks++;
      window.location.hash = targetHash;
      _log.debug('Navigation fallback applied: ' + targetHash);
    }
  }

  return true;
}

function extractRouteFromActionId(actionId: string) {
  if (!actionId || actionId.indexOf('footer:') !== 0) return null;
  let buttonId = actionId.replace('footer:', '');
  if (buttonId === 'logout') return null;
  if (buttonId === 'settings') return '#/configuracoes';
  if (buttonId === 'dashboard') return '#/home';
  if (buttonId === 'search') return '#/busca';
  if (buttonId === 'bell') return '#/notificacoes';
  if (buttonId === 'users') return '#/rh-pessoas';
  if (buttonId === 'analytics') return '#/relatorios';
  if (buttonId === 'lgpd') return '#/lgpd';
  if (buttonId === 'privacidade') return '#/privacidade';
  if (buttonId === 'termos') return '#/termos';
  if (buttonId === 'language') return '#/status-language';
  if (buttonId === 'trending-up') return '#/status-trending';
  return '#/status-' + buttonId;
}

export function emitUIAction(actionId: string, source: string, meta: Record<string,unknown>) {
  if (meta === undefined) meta = {};
  let eventBus = getEventBus();
  if (!eventBus || !eventBus.emit) {
    _log.error('Cannot emit ui:action - EventBus unavailable');
    // v3.2.0: Even without EventBus, attempt direct navigation
    const fallbackRoute = extractRouteFromActionId(actionId);
    if (fallbackRoute && typeof window !== 'undefined') {
      const fallbackHash = fallbackRoute.charAt(0) === '#' ? fallbackRoute : '#' + fallbackRoute;
      _metrics.navigationFallbacks++;
      window.location.hash = fallbackHash;
      _log.debug('Direct navigation fallback (no EventBus): ' + fallbackHash);
      return true;
    }
    return false;
  }
  _metrics.uiActions++;

  const buttonId = actionId.indexOf('footer:') === 0 ? actionId.replace('footer:', '') : actionId;
  emitFooterButtonClick(buttonId, 'trigger:footer:' + buttonId, meta);

  const route = extractRouteFromActionId(actionId);
  if (route) {
    navigateToRoute(route, source);
    return true;
  }

  const payload = { actionId: actionId, source: source, timestamp: Date.now(), meta: meta };
  eventBus.emit(UI_EVENTS.ACTION, payload);
  return true;
}

const BUTTON_EVENT_MAP = {
  MOUNTED: FOOTER_EVENTS.BUTTON_MOUNTED,
  CLICKED: FOOTER_EVENTS.BUTTON_CLICKED,
  UNMOUNTED: FOOTER_EVENTS.BUTTON_UNMOUNTED
};

export function emitButtonEvent(eventName: string, data: Record<string,unknown>) {
  if (data === undefined) data = {};
  let eventBus = getEventBus();
  if (!eventBus || !eventBus.emit) {
    _log.error('Cannot emit button event - EventBus unavailable');
    return false;
  }
  _metrics.buttonEvents++;
  const fullEventName = (BUTTON_EVENT_MAP as Record<string,unknown>)[eventName.toUpperCase() as string] || FOOTER_EVENTS.BUTTON_CLICKED;
  eventBus.emit(fullEventName, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
  return true;
}

export function getMetrics() { return Object.assign({}, _metrics); }

export function info() {
  let ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    p0Compliant: true,
    noWindowFallback: isStrict(),
    strictMode: isStrict(),
    metrics: getMetrics(),
    portsInitialized: ps._initialized,
    catalogVersion: 'FOOTER_EVENTS'
  };
}

export function healthCheck() {
  const ps = Ports.snapshot();
  const eventBus = _getPort('eventBus');
  const eventBusAvailable = !!eventBus;
  const noFallbackErrors = _metrics.eventBusMissing === 0;
  return {
    status: eventBusAvailable && noFallbackErrors ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    p0Enterprise: true,
    p0Compliant: true,
    strictMode: isStrict(),
    checks: {
      eventBusAvailable: eventBusAvailable,
      noFallbackErrors: noFallbackErrors,
      portsInitialized: ps._initialized
    },
    metrics: getMetrics()
  };
}

export { MODULE_ID, VERSION, BUTTON_EVENT_MAP as BUTTON_EVENTS };

export default {
  getEventBus: getEventBus,
  emitUIAction: emitUIAction,
  emitFooterButtonClick: emitFooterButtonClick,
  emitButtonEvent: emitButtonEvent,
  navigateToRoute: navigateToRoute,
  BUTTON_EVENTS: BUTTON_EVENT_MAP,
  getMetrics: getMetrics,
  info: info,
  healthCheck: healthCheck,
  VERSION: VERSION,
  MODULE_ID: MODULE_ID
};
