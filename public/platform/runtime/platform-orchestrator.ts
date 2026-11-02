// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-orchestrator
// PURPOSE: Platform Orchestrator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/ports-profiles.js
//   from ./manifest-v3.js
//   from ./federation-loader.js
//   from ./microapp-registry.js
//   from ./region-manager.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   init
//   navigate
//   getActiveApp
//   getActiveAppId
//   getActiveRoute
//   isNavigating
//   shouldIgnoreEvent
//   info
//   reset
//   injectPorts
//   getPortsSnapshot
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { resolveAppByRoute } from './manifest-v3.js';
import { loadMicroapp } from './federation-loader.js';
import { register, setInstance } from './microapp-registry.js';
import { getRegion, clearRegion, REGIONS } from './region-manager.js';

interface EventBus {
  emit(event: string, data: Record<string, unknown>): void;
}

interface MicroappModule {
  init?(context: Record<string, unknown>): Promise<unknown>;
  mount?(container: HTMLElement, context: Record<string, unknown>): Promise<unknown>;
  unmount?(): Promise<void>;
  destroy?(): Promise<void>;
  update?(context: Record<string, unknown>): Promise<unknown>;
  hydrate?(context: Record<string, unknown>): Promise<unknown>;
  [key: string]: unknown;
}

interface LoadResult {
  id: string;
  module: MicroappModule | null;
  config: Record<string, unknown>;
  status: string;
  [key: string]: unknown;
}

const VERSION = '3.3.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-orchestrator';

const _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
function getPortsSnapshot() { return _Ports.snapshot(); }

function _log(level: 'error' | 'warn' | 'info' | 'debug' | 'trace', msg: string, data?: Record<string, unknown>) {
  const L = _getPort('logger');
  if (L && L[level]) L[level](`[${MODULE_ID}] ${msg}`, data);
}

let _eventBus: EventBus | null = null;
let _mainEngine: unknown = null;
let _activeApp: LoadResult | null = null;
let _activeAppId: string | null = null;
let _activeRoute: string | null = null;
let _navigating = false;
let _initialized = false;

const IGNORED_EVENTS = ['layout:changed', 'state:update', 'canvas:event', 'mf:navigate', 'mf:route-change', 'mf:route-change-requested', 'timeline:record', 'telemetry:track'];

function init(context: Record<string, unknown>) {
  if (!context) context = {};
  if (_initialized) return { version: VERSION, moduleId: MODULE_ID };
  _eventBus = (context.eventBus as EventBus) || null;
  _mainEngine = context.mainEngine || null;
  _initialized = true;
  return { version: VERSION, moduleId: MODULE_ID };
}

function navigate(route: string) {
  if (_navigating) {
    _log('warn', 'Navigation already in progress');
    return Promise.resolve(false);
  }

  const targetApp = resolveAppByRoute(route);
  if (_activeAppId === (targetApp && targetApp.id) && _activeRoute === route) {
    return Promise.resolve(true);
  }

  _navigating = true;

  return Promise.resolve().then(() => {
    if (!targetApp) {
      _navigating = false;
      return false;
    }

    if (_activeAppId === targetApp.id && _activeApp && _activeApp.module && _activeApp.module.update) {
      return _activeApp.module.update({ route }).then(() => {
        _activeRoute = route;
        _navigating = false;
        return true;
      });
    }

    const unmountPromise = _activeApp ? unmountCurrentApp() : Promise.resolve();

    return unmountPromise.then(() => loadMicroapp(targetApp as unknown as Parameters<typeof loadMicroapp>[0])).then(loadResult => {
      if (loadResult.status === 'failed') {
        _navigating = false;
        return false;
      }

      register(targetApp.id, loadResult as unknown as Record<string, unknown>);

      const container = getRegion(targetApp.region || REGIONS.MAIN) || getRegion('main-region');
      if (!container) {
        _navigating = false;
        return false;
      }

      const module = loadResult.module as MicroappModule | null;
      const mfeContext = {
        route,
        app: targetApp,
        platform: {
          emit(event: string, data: Record<string, unknown>) {
            if (event === 'mf:route-change-requested') {
              _log('info', 'MFE requested route change:', data && (data.route as Record<string, unknown>));
              return;
            }
          }
        }
      };

      const initPromise = (module && module.init) ? module.init(mfeContext) : Promise.resolve();

      return initPromise.then(() => {
        if (module && module.mount) {
          return module.mount(container, { route, app: targetApp });
        }
        return null;
      }).then((instance: unknown) => {
        if (instance) setInstance(targetApp.id, instance);
        if (module && module.hydrate) return module.hydrate({});
        return null;
      }).then(() => {
        _activeApp = loadResult as unknown as LoadResult;
        _activeAppId = targetApp.id;
        _activeRoute = route;
        _navigating = false;
        return true;
      });
    });
  }).catch((error: Error) => {
    _log('error', 'Navigation error:', error.message as unknown as Record<string, unknown>);
    _navigating = false;
    return false;
  });
}

function unmountCurrentApp() {
  if (!_activeApp) return Promise.resolve();
  const module = _activeApp.module;

  return Promise.resolve().then(() => {
    if (module && module.unmount) return module.unmount();
  }).then(() => {
    if (module && module.destroy) return module.destroy();
  }).then(() => {
    const region = (_activeApp && _activeApp.config && (_activeApp.config.region as string)) || 'main-region';
    clearRegion(region);
    _activeApp = null;
    _activeAppId = null;
    _activeRoute = null;
  });
}

function shouldIgnoreEvent(eventName: string) {
  for (let i = 0; i < IGNORED_EVENTS.length; i++) {
    if (eventName.indexOf(IGNORED_EVENTS[i]) !== -1) return true;
  }
  return false;
}

function getActiveApp() { return _activeApp; }
function getActiveAppId() { return _activeAppId; }
function getActiveRoute() { return _activeRoute; }
function isNavigating() { return _navigating; }

function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: _Ports.isInitialized(), activeAppId: _activeAppId, activeRoute: _activeRoute, navigating: _navigating, initialized: _initialized };
}

function reset() {
  _activeApp = null;
  _activeAppId = null;
  _activeRoute = null;
  _navigating = false;
  _initialized = false;
}

export { VERSION, MODULE_ID, init, navigate, getActiveApp, getActiveAppId, getActiveRoute, isNavigating, shouldIgnoreEvent, info, reset, injectPorts, getPortsSnapshot };
export default { VERSION, MODULE_ID, init, navigate, getActiveApp, getActiveAppId, getActiveRoute, isNavigating, shouldIgnoreEvent, info, reset, injectPorts, getPorts: getPortsSnapshot };
