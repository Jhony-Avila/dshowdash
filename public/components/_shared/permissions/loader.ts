// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.loader
// PURPOSE: Dynamic loader for permissions system modules
// ───────────────────────────────────────────────────────────────
// @contract LOAD - load(options) dynamically imports integration and ui-feedback
// @contract IS_LOADED - isLoaded() returns load state
// @contract HEALTH - healthCheck() for observability
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: load, isLoaded, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v3.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.2.0-P17WI: PortsFactory/PortsProfiles migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '3.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components._shared.permissions.loader';

const hasWindow = typeof window !== 'undefined';
const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: 'error' | 'warn' | 'info' | 'debug', ...args: any[]) {
  const logger = _getPort('logger');
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === 'function') fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};

let _loaded = false;

export function load(options: Record<string, unknown>) {
  if (!options) options = {};
  if (_loaded) return Promise.resolve({ ok: true, alreadyLoaded: true });
  return import('./integration.js')
    .then(module => {
      const Integration = module.default;
      return Integration.init({ debug: options.debug || false });
    })
    .then(() => {
      if (options.uiFeedback !== false) {
        return import('./ui-feedback.js').then(module => {
          const UIFeedback = module.default;
          UIFeedback.init({ mode: options.uiFeedbackMode || 'disable', debug: options.debug || false });
        });
      }
    })
    .then(() => import('./migration-bridge.js'))
    .then(() => {
      _loaded = true;
      _log('info', `Permissions System loaded v${VERSION}`);
      return { ok: true, alreadyLoaded: false };
    })
    .catch(error => {
      _log('error', 'Failed to load:', error ? error.message : '');
      return { ok: false, error: error.message };
    });
}

export function isLoaded() { return _loaded; }

export function healthCheck() {
  const ps = Ports.snapshot();
  const logger = _getPort('logger');
  return {
    status: _loaded ? 'HEALTHY' : 'NOT_LOADED',
    version: VERSION,
    moduleId: MODULE_ID,
    loaded: _loaded,
    loggerAvailable: !!logger,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, loaded: _loaded, timestamp: Date.now() };
}

export default { load, isLoaded, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
