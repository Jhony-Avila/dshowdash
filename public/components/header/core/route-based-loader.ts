
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/route-based-loader
// PURPOSE: Route-aware component priority loading and preloading
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   init(componentsLoader) — initialize with components loader
//   getPriorityComponents(route) — get priority components for route
//   loadWithPriority(route) — load components with route-based priority
//   registerRouteComponents(route, names) — register components for a route
//   registerPreload(route, names) — register preload list for a route
//   getCurrentRoute() — get current hash route
//   destroy() — cleanup route listener
//   getMetrics() — return route metrics
//   resetMetrics() — reset route metrics
//   healthCheck() — return health status
//   info() — return module info
//   injectPorts(p) — inject dependency ports
//   getPorts() — get ports snapshot
// LISTENS (eventos):
//   hashchange (window) — detects route changes for preloading
// EMITS (eventos):
//   header:route:changed — when hash route changes
// WINDOW ACCESS:
//   window.location.hash — reads current route
//   window.requestIdleCallback — uses idle callback for preloading
// ═══════════════════════════════════════════════════════════════
// Header - Route Based Loader
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B11: var → const/let
// @description Carrega componentes com prioridade baseada na rota atual
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/route-based-loader';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...rest: any[]) { const args = rest; const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error' && logger.error) logger.error(prefix, args.join(' ')); else if (level === 'warn' && logger.warn) logger.warn(prefix, args.join(' ')); else if (level === 'info' && logger.info) logger.info(prefix, args.join(' ')); };

const ROUTE_PRIORITIES = {
  '#/dashboard': ['notifications', 'real-time-clock', 'weather-sp'],
  '#/integrations': ['panel-pipedrive', 'panel-asaas', 'panel-bling'],
  '#/integrations/pipedrive': ['panel-pipedrive'],
  '#/integrations/asaas': ['panel-asaas'],
  '#/integrations/bling': ['panel-bling'],
  '#/integrations/mercado-livre': ['panel-mercado-livre'],
  '#/integrations/loja-integrada': ['panel-loja-integrada'],
  '#/integrations/google-drive': ['panel-google-drive'],
  '#/integrations/chatgpt': ['panel-chatgpt'],
  '#/integrations/adwords': ['panel-adwords'],
  '#/integrations/calendar': ['panel-calendar'],
  '#/location': ['panel-maps'],
  '#/financial': ['currency-rotator'],
  '#/communications': ['whatsapp-integration', 'wechat-integration', 'instagram-messenger-integration', 'email-integration'],
  'default': ['user-menu', 'notifications', 'logo']
};

const PRELOAD_MAP = {
  '#/dashboard': ['panel-pipedrive', 'panel-asaas'],
  '#/integrations': ['panel-calendar', 'panel-maps'],
  '#/financial': ['panel-asaas', 'panel-bling'],
  '#/communications': ['email-integration']
};

let _initialized = false;
let _currentRoute: unknown = null;
let _componentsLoader: Record<string,unknown>|null = null;
let _routeChangeCleanup: unknown = null;

const _metrics = {
  routeChanges: 0,
  preloadsTriggered: 0,
  priorityLoads: 0,
  lastRouteAt: (null as unknown|null)
};

export function init(componentsLoader: Record<string,unknown>) {
  if (_initialized) return;
  
  _initPorts();
  _componentsLoader = componentsLoader;
  
  _currentRoute = _getCurrentRoute();
  
  _setupRouteListener();
  
  _initialized = true;
  _log('info', 'RouteBasedLoader inicializado na rota:', _currentRoute);
}

function _getCurrentRoute() {
  return window.location.hash || '#/dashboard';
}

function _setupRouteListener() {
  const handler = () => {
    const newRoute = _getCurrentRoute();
    if (newRoute !== _currentRoute) {
      _metrics.routeChanges++;
      _metrics.lastRouteAt = Date.now();
      _log('info', 'Rota alterada:', _currentRoute, '->', newRoute);
      _currentRoute = newRoute;
      _onRouteChange(newRoute);
    }
  };
  
  window.addEventListener('hashchange', handler);
  
  _routeChangeCleanup = () => {
    window.removeEventListener('hashchange', handler);
  };
}

function _onRouteChange(route: string) {
  const preloadList = _getPreloadList(route);
  if (preloadList.length > 0) {
    _preloadComponents(preloadList);
  }
  
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) {
    eventBus.emit('header:route:changed', {
      route,
      preloadList,
      timestamp: Date.now()
    });
  }
}

// @ts-expect-error TS migration - TS17019
export function getPriorityComponents(route?: string) {
  // @ts-expect-error TS migration - TS2322
  route = route || _currentRoute;
  
  if ((ROUTE_PRIORITIES as Record<string,unknown>)[route as string]) {
    // @ts-expect-error TS migration - TS2339
    return (ROUTE_PRIORITIES as Record<string,unknown>)[route as string].slice();
  }
  
  const routePrefix = Object.keys(ROUTE_PRIORITIES).find(key => route!.startsWith(key) && key !== 'default');
  
  if (routePrefix) {
    // @ts-expect-error TS migration - TS2339
    return (ROUTE_PRIORITIES as Record<string,unknown>)[routePrefix].slice();
  }
  
  return ROUTE_PRIORITIES['default'].slice();
}

function _getPreloadList(route: string) {
  if ((PRELOAD_MAP as Record<string,unknown>)[route as string]) {
    // @ts-expect-error TS migration - TS2339
    return (PRELOAD_MAP as Record<string,unknown>)[route as string].slice();
  }
  
  const routePrefix = Object.keys(PRELOAD_MAP).find(key => route.startsWith(key));
  
  if (routePrefix) {
    // @ts-expect-error TS migration - TS2339
    return (PRELOAD_MAP as Record<string,unknown>)[routePrefix].slice();
  }
  
  return [];
}

function _preloadComponents(componentNames: unknown) {
  if (!_componentsLoader) return;
  
  _metrics.preloadsTriggered++;
  // @ts-expect-error TS migration - TS2339
  _log('debug', 'Preloading componentes:', componentNames.join(', '));
  
  // @ts-expect-error TS migration - TS2339
  componentNames.forEach((name: string) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        _preloadSingle(name);
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        _preloadSingle(name);
      }, 100);
    }
  });
}

function _preloadSingle(componentName: string) {
  if (!_componentsLoader) return;
  
  // @ts-expect-error TS migration - TS2349
  if (_componentsLoader.isLoaded && _componentsLoader.isLoaded(componentName)) {
    return;
  }
  
  let config = null;
  if (_componentsLoader.componentsList) {
    // @ts-expect-error TS migration - TS2339
    config = _componentsLoader.componentsList.find((c: unknown) => c.name === componentName);
  }
  
  if (config && _componentsLoader.loadComponent) {
    // @ts-expect-error TS migration - TS2349
    _componentsLoader.loadComponent(config).catch((error: unknown) => {
      // @ts-expect-error TS migration - TS2339
      _log('warn', 'Falha ao preload:', componentName, error.message);
    });
  }
}

export function loadWithPriority(route: string) {
  // @ts-expect-error TS migration - TS2322
  route = route || _currentRoute;
  
  const priorityList = getPriorityComponents(route);
  _metrics.priorityLoads++;
  
  _log('info', 'Carregando com prioridade para', `${route}:`, priorityList.join(', '));
  
  // @ts-expect-error TS migration - TS2339
  return priorityList.reduce((promise: unknown, componentName: string) => promise.then(() => _preloadSingle(componentName)), Promise.resolve());
}

export function registerRouteComponents(route: string, componentNames: unknown) {
  (ROUTE_PRIORITIES as Record<string,unknown>)[route as string] = componentNames;
  _log('debug', 'Rota registrada:', route);
}

export function registerPreload(route: string, componentNames: unknown) {
  (PRELOAD_MAP as Record<string,unknown>)[route as string] = componentNames;
  _log('debug', 'Preload registrado:', route);
}

export function getCurrentRoute() {
  return _currentRoute;
}

export function destroy() {
  if (_routeChangeCleanup) {
    // @ts-expect-error TS migration - TS2349
    _routeChangeCleanup();
    _routeChangeCleanup = null;
  }
  _initialized = false;
}

export function getMetrics() {
  return Object.assign({}, _metrics, {
    currentRoute: _currentRoute,
    // @ts-expect-error TS migration - TS2554
    priorityComponents: getPriorityComponents()
  });
}

export function resetMetrics() {
  _metrics.routeChanges = 0;
  _metrics.preloadsTriggered = 0;
  _metrics.priorityLoads = 0;
  _metrics.lastRouteAt = null;
}

export function healthCheck() {
  const checks = {
    initialized: _initialized,
    hasComponentsLoader: !!_componentsLoader,
    hasCurrentRoute: !!_currentRoute,
    hasRouteListener: !!_routeChangeCleanup,
    portsInitialized: Ports.isInitialized()
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    currentRoute: _currentRoute,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    currentRoute: _currentRoute,
    routePriorities: Object.keys(ROUTE_PRIORITIES),
    preloadRoutes: Object.keys(PRELOAD_MAP),
    // @ts-expect-error TS migration - TS2554
    priorityComponents: getPriorityComponents(),
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}

export { ROUTE_PRIORITIES, PRELOAD_MAP };

export default {
  VERSION,
  MODULE_ID,
  init,
  getPriorityComponents,
  loadWithPriority,
  registerRouteComponents,
  registerPreload,
  getCurrentRoute,
  destroy,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
