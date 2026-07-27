// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-FIX-PROTOTYPE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-router-adapters
// PURPOSE: Router Adapters - Login Modal
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   HashRouterAdapter() — exported function
//   MemoryRouterAdapter() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'login-modal-router-adapters';
const VERSION = '2.4.0-FIX-PROTOTYPE';

const isBrowser = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level?: any, ...rest: any[]) { var args = rest; var logger = _getPort('logger'); if (!logger) return; if (level === 'info') { if (logger.info) logger.info.apply(logger, ['[login-router-adapters]'].concat(args)); } };

// v2.4.0-FIX: Must be a regular function (not arrow) to have .prototype
function RouterAdapter() {}
RouterAdapter.prototype.getCurrentRoute = function() { throw new Error('Not implemented'); };
RouterAdapter.prototype.setRoute = function(route: string) { throw new Error('Not implemented'); };
RouterAdapter.prototype.onRouteChange = function(callback: (route: string) => void) { throw new Error('Not implemented'); };
RouterAdapter.prototype.cleanup = function() { throw new Error('Not implemented'); };

export function HashRouterAdapter(this: any) {
  this._listeners = [];
  this._handler = this._onHashChange.bind(this);
  this._bound = false;
  if (isBrowser) {
    window.addEventListener('hashchange', this._handler);
    this._bound = true;
  }
}

HashRouterAdapter.prototype = Object.create(RouterAdapter.prototype);
HashRouterAdapter.prototype.constructor = HashRouterAdapter;

HashRouterAdapter.prototype.getCurrentRoute = function() {
  if (!isBrowser) return '/';
  _initPorts();
  let routerGlobal = _getPort('routerGlobal');
  if (routerGlobal && routerGlobal.getCurrentRoute) {
    let route = routerGlobal.getCurrentRoute();
    return (route && route.path) || '/';
  }
  _log('info', 'RouterGlobal nao disponivel - leitura fallback');
  return '/';
};

HashRouterAdapter.prototype.setRoute = function(route: string) {
  if (!isBrowser) return;
  _initPorts();
  const routerGlobal = _getPort('routerGlobal');
  if (routerGlobal && routerGlobal.navigate) {
    routerGlobal.navigate(route, { replace: true, source: 'login-modal' });
  } else {
    _log('info', 'RouterGlobal nao disponivel - navegacao ignorada');
  }
};

HashRouterAdapter.prototype.onRouteChange = function(callback: (route: string) => void) {
  this._listeners.push(callback);
};

HashRouterAdapter.prototype._onHashChange = function() {
  const route = this.getCurrentRoute();
  for (var i = 0; i < this._listeners.length; i++) {
    this._listeners[i](route);
  }
};

HashRouterAdapter.prototype.cleanup = function() {
  if (isBrowser && this._bound) {
    window.removeEventListener('hashchange', this._handler);
    this._bound = false;
  }
  this._listeners = [];
};

export function MemoryRouterAdapter(this: any) {
  this._currentRoute = '/';
  this._listeners = [];
}

MemoryRouterAdapter.prototype = Object.create(RouterAdapter.prototype);
MemoryRouterAdapter.prototype.constructor = MemoryRouterAdapter;

MemoryRouterAdapter.prototype.getCurrentRoute = function() {
  return this._currentRoute;
};

MemoryRouterAdapter.prototype.setRoute = function(route: string) {
  this._currentRoute = route;
  for (var i = 0; i < this._listeners.length; i++) {
    this._listeners[i](route);
  }
};

MemoryRouterAdapter.prototype.onRouteChange = function(callback: (route: string) => void) {
  this._listeners.push(callback);
};

MemoryRouterAdapter.prototype.cleanup = function() {
  this._listeners = [];
};

export { VERSION, MODULE_ID };

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    hasRouterGlobal: !!_getPort('routerGlobal')
  };
}

export function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    checks: { hasRouterGlobal: !!_getPort('routerGlobal') }
  };
}

export default { HashRouterAdapter: HashRouterAdapter, MemoryRouterAdapter: MemoryRouterAdapter, injectPorts: injectPorts, getPorts: getPorts, info: info, healthCheck: healthCheck, VERSION: VERSION, MODULE_ID: MODULE_ID };
