// ═════════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.0-ES6)
// ═════════════════════════════════════════════════════════════════
// MODULE: header/core/navigation-adapter
// PURPOSE: Single point of navigation for the Header — emits
//          only navigation INTENTS (never ROUTE_CHANGED), with
//          fallbacks to router port and window.location.hash.
// ─────────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   NAV_INTENTS from /core/runtime/events/catalog/nav.events.js
// PROVIDES:
//   requestNavigation(options) — emit a nav intent for a route
//   requestPanelNavigation(panelId, source) — navigate to panel
//   requestIntegrationNavigation(integrationId, source)
//   NAV_INTENTS — re-exported event constants
//   info() / healthCheck() / getMetrics() / resetMetrics()
//   injectPorts(p) / getPorts()
// EMITS (eventos):
//   NAV_INTENTS.NAVIGATE (nav.intent) — primary navigation intent
//   UI_EVENTS.HARD_NAV — hard navigation fallback
// WINDOW ACCESS:
//   window.location.hash — last-resort fallback navigation
// ═════════════════════════════════════════════════════════════════
// Header - Navigation Adapter Enterprise
// @version 1.3.0-ES6
// @changelog v1.3.0-ES6 - Task 10.1 B10: var → const/let
// @changelog v1.2.0-EVENT-FIX - FIX: Usar NAV_INTENTS do catálogo oficial
// ÚNICO ponto de navegação do Header - emite apenas INTENTS, nunca ROUTE_CHANGED
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { NAV_INTENTS } from '/core/runtime/events/catalog/nav.events.js';

export const VERSION = '1.3.0-ES6';
export const MODULE_ID = 'header/core/navigation-adapter';

export { NAV_INTENTS };

const Ports = createUiPorts({ moduleId: MODULE_ID });
let _initialized = false;
const _metrics = {
  requestCount: 0,
  lastRequestAt: (null as unknown|null),
  successCount: 0,
  fallbackCount: 0
};

function _initPorts() {
  if (_initialized) return;
  Ports.init();
  _initialized = true;
}

function _getPort(name: string) {
  _initPorts();
  return Ports.get(name);
}

function _log(level: string, msg: string, data?: unknown) {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') {
    logger.error && logger.error(prefix, msg, data || '');
  } else if (level === 'warn') {
    logger.warn && logger.warn(prefix, msg, data || '');
  } else {
    const config = _getPort('config');
    if (config && config.app && config.app.debug) {
      logger.debug && logger.debug(prefix, msg, data || '');
    }
  }
}

function _emitTelemetry(action: string, data: Record<string,unknown>) {
  const telemetry = _getPort('telemetry');
  if (telemetry && telemetry.track) {
    telemetry.track(`${MODULE_ID}:${action}`, data);
  }
}

function _normalizeRoute(route: string) {
  if (!route) return null;
  const normalized = route.toString().trim();
  if (normalized.indexOf('#') === 0) {
    return normalized;
  }
  if (normalized.indexOf('/') === 0) {
    return `#${normalized}`;
  }
  return `#/${normalized}`;
}

export function requestNavigation(options: Record<string,unknown>) {
  if (!options || !options.route) {
    _log('warn', 'requestNavigation called without route');
    return false;
  }

  _initPorts();
  _metrics.requestCount++;
  _metrics.lastRequestAt = Date.now();

  // @ts-expect-error TS migration - TS2345
  const route = _normalizeRoute(options.route);
  const payload = {
    route,
    path: route,
    hash: route,
    panelId: options.panelId || null,
    source: options.source || MODULE_ID,
    componentId: options.componentId || null,
    timestamp: Date.now(),
    intent: true
  };

  const eventBus = _getPort('eventBus');

  if (eventBus && eventBus.emit) {
    eventBus.emit(NAV_INTENTS.NAVIGATE, payload);
    _log('info', 'Navigation intent emitted via NAV_INTENTS.NAVIGATE', { route, source: payload.source });
    _emitTelemetry('intent-emitted', { route });
    _metrics.successCount++;
    return true;
  }

  const router = _getPort('router');
  if (router && router.navigate) {
    router.navigate(route);
    _log('info', 'Navigation via router fallback', { route });
    _emitTelemetry('fallback-router', { route });
    _metrics.fallbackCount++;
    return true;
  }

  if (typeof window !== 'undefined' && window.location) {
    if (eventBus && eventBus.emit) {
      eventBus.emit(UI_EVENTS.HARD_NAV, {
        path: route,
        reason: 'No EventBus pipeline or Router',
        source: MODULE_ID,
        timestamp: Date.now()
      });
    }
    // @ts-expect-error strict migration — TS2322
    window.location.hash = route;
    _log('warn', 'Navigation via hash fallback', { route });
    _emitTelemetry('fallback-hash', { route });
    _metrics.fallbackCount++;
    return true;
  }

  _log('error', 'Navigation failed - no available method', { route });
  return false;
}

export function requestPanelNavigation(panelId: string, source: string) {
  if (!panelId) return false;

  let route;
  if (panelId.match(/^panel-\d+$/)) {
    route = `#/${panelId}`;
  } else if (panelId.indexOf('panel-') === 0) {
    route = `#/${panelId.replace('panel-', '')}`;
  } else {
    route = `#/${panelId}`;
  }

  return requestNavigation({
    route,
    panelId,
    source: source || MODULE_ID,
    componentId: panelId
  });
}

export function requestIntegrationNavigation(integrationId: string, source: string) {
  if (!integrationId) return false;

  const route = `#/integrations/${integrationId}`;

  return requestNavigation({
    route,
    panelId: `integration-${integrationId}`,
    source: source || MODULE_ID,
    componentId: integrationId
  });
}

export function injectPorts(p: Record<string,unknown>) {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p2Compliant: true,
    eventFix: true,
    portsInitialized: Ports.isInitialized(),
    metrics: Object.assign({}, _metrics),
    intents: Object.keys(NAV_INTENTS),
    emitsEvent: 'NAV_INTENTS.NAVIGATE (nav.intent)'
  };
}

export function healthCheck() {
  const hasEventBus = !!_getPort('eventBus');
  const hasRouter = !!_getPort('router');

  return {
    status: hasEventBus ? 'HEALTHY' : (hasRouter ? 'DEGRADED' : 'UNHEALTHY'),
    version: VERSION,
    moduleId: MODULE_ID,
    p2Compliant: true,
    eventFix: true,
    checks: {
      hasEventBus,
      hasRouter,
      hasFallback: typeof window !== 'undefined',
      usesOfficialEvents: true
    },
    metrics: Object.assign({}, _metrics),
    portsInitialized: Ports.isInitialized()
  };
}

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function resetMetrics() {
  _metrics.requestCount = 0;
  _metrics.lastRequestAt = null;
  _metrics.successCount = 0;
  _metrics.fallbackCount = 0;
}

export default {
  VERSION,
  MODULE_ID,
  NAV_INTENTS,
  requestNavigation,
  requestPanelNavigation,
  requestIntegrationNavigation,
  info,
  healthCheck,
  getMetrics,
  resetMetrics,
  injectPorts,
  getPorts
};
