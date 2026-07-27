// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.cache.debounce
// PURPOSE: Router Resolution Debounce v1.2.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   ResolutionDebounce — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
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

const VERSION = '1.2.0-P17WI';
const MODULE_ID = 'router.cache.debounce';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown>) { if (!ctx) ctx = {}; const logger = _getPort('logger'); if (!logger || typeof logger[level] !== 'function') return; ctx.component = MODULE_ID; logger[level](msg, ctx); }

const DEFAULT_CONFIG = { enabled: true, delay: 50, maxWait: 200, coalesceIdentical: true };
let _config = Object.assign({}, DEFAULT_CONFIG);
let _pendingResolve: Promise<unknown> | null = null;
let _pendingTimer: ReturnType<typeof setTimeout> | null = null;
let _lastPath: string | null = null;
let _lastResolveTime = 0;
const _metrics = { debounced: 0, coalesced: 0, executed: 0 };

const ResolutionDebounce = {
  debounce(path: string, resolveFn: (path: string) => unknown) {
    return new Promise((resolve, reject) => {
      if (!_config.enabled) { _metrics.executed++; return resolve(resolveFn(path)); }
      const now = Date.now();
      if (_config.coalesceIdentical && path === _lastPath && (now - _lastResolveTime) < _config.delay) { _metrics.coalesced++; _log('debug', 'Navigation coalesced', { path }); if (_pendingResolve) { return _pendingResolve.then(resolve).catch(reject); } }
      if (_pendingTimer) { clearTimeout(_pendingTimer); _metrics.debounced++; }
      _lastPath = path;
      _pendingResolve = new Promise((res, rej) => {
        _pendingTimer = setTimeout(() => {
          _lastResolveTime = Date.now();
          _metrics.executed++;
          try { const result = resolveFn(path); res(result); resolve(result); }
          catch (error) { rej(error); reject(error); }
          finally { _pendingTimer = null; _pendingResolve = null; }
        }, _config.delay);
      });
    });
  },
  immediate(path: string, resolveFn: (path: string) => unknown) { if (_pendingTimer) { clearTimeout(_pendingTimer); _pendingTimer = null; } _metrics.executed++; return resolveFn(path); },

  // @ts-expect-error TS migration - TS2554
  cancel() { if (_pendingTimer) { clearTimeout(_pendingTimer); _pendingTimer = null; _pendingResolve = null; _log('debug', 'Pending resolve cancelled'); return true; } return false; },
  isPending() { return !!_pendingTimer; },
  configure(options: Record<string, unknown>) { if (!options) options = {}; _config = Object.assign({}, _config, options); return Object.assign({}, _config); },
  enable() { _config.enabled = true; },
  disable() { _config.enabled = false; },
  isEnabled() { return _config.enabled; },
  getMetrics() { return Object.assign({}, _metrics, { config: Object.assign({}, _config), pending: this.isPending() }); },
  getStatus() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), enabled: _config.enabled, delay: _config.delay, pending: this.isPending(), metrics: this.getMetrics() }; },
  healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { enabled: _config.enabled, noPendingLeak: !this.isPending() || _config.enabled } }; },
  resetMetrics() { _metrics.debounced = 0; _metrics.coalesced = 0; _metrics.executed = 0; }
};

export { ResolutionDebounce, VERSION, MODULE_ID, injectPorts, getPorts };
export default ResolutionDebounce;
