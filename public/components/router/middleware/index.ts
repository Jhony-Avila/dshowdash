// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.middleware.index
// PURPOSE: Router Middleware System v1.3.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   RouterMiddleware — exported value
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

const VERSION = '1.3.0-ENTERPRISE';
const MODULE_ID = 'router.middleware.index';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown>) { if (!ctx) ctx = {}; const logger = _getPort('logger'); if (!logger || typeof logger[level] !== 'function') return; ctx.component = MODULE_ID; logger[level](msg, ctx); }

const _middlewares: Record<string, unknown>[] = [];
const _metrics = { registered: 0, executed: 0, blocked: 0, errors: 0, totalTime: 0 };
let _idCounter = 0;
function _generateId() { return `mw_${++_idCounter}_${Date.now()}`; }

const RouterMiddleware = {
  use(middleware: ((ctx: Record<string, unknown>) => unknown) & { name?: string }, options: Record<string, unknown>) {
    if (!options) options = {};
    const mw = { id: _generateId(), name: options.name || middleware.name || 'anonymous', handler: middleware, priority: options.priority || 10, enabled: true, routes: options.routes || null, exclude: options.exclude || null };
    _middlewares.push(mw);
    _middlewares.sort((a, b) => (a.priority as number) - (b.priority as number));
    _metrics.registered++;
    _log('info', 'Middleware registered', { id: mw.id, name: mw.name, priority: mw.priority });
    const self = this;
    return () => { self.remove(mw.id); };
  },
  remove(middlewareId: string) { let index = -1; for (let i = 0; i < _middlewares.length; i++) { if (_middlewares[i].id === middlewareId) { index = i; break; } } if (index !== -1) { const removed = _middlewares.splice(index, 1)[0]; _log('info', 'Middleware removed', { id: removed.id, name: removed.name }); return true; } return false; },
  execute(context: Record<string, unknown>) {
    const startTime = performance.now();
    const path = context.path as string;
    const applicable = _middlewares.filter(mw => {
      if (!mw.enabled) return false;
      if (mw.routes) { if (Array.isArray(mw.routes)) { let match = false; for (let i = 0; i < (mw.routes as string[]).length; i++) { if (path.indexOf(String((mw.routes as string[])[i])) === 0) { match = true; break; } } if (!match) return false; } else if (mw.routes instanceof RegExp) { if (!(mw.routes as RegExp).test(path)) return false; } }
      if (mw.exclude) { if (Array.isArray(mw.exclude)) { for (let j = 0; j < (mw.exclude as string[]).length; j++) { if (path.indexOf(String((mw.exclude as string[])[j])) === 0) return false; } } else if (mw.exclude instanceof RegExp) { if ((mw.exclude as RegExp).test(path)) return false; } }
      return true;
    });
    let currentContext = Object.assign({}, context);
    const results: Record<string, unknown>[] = [];
    let i = 0;
    const self = this;
    function runNext(): Promise<Record<string, unknown>> {
      if (i >= applicable.length) { const totalTime = performance.now() - startTime; _metrics.totalTime += totalTime; return Promise.resolve({ blocked: false, context: currentContext, results, time: totalTime }); }
      const mw = applicable[i++];
      _metrics.executed++;
      const mwStart = performance.now();
      return Promise.resolve().then(() => (mw.handler as (ctx: Record<string, unknown>) => unknown)(currentContext)).then(result => {
        const mwTime = performance.now() - mwStart;
        results.push({ id: mw.id, name: mw.name, time: mwTime, result: typeof result });
        if (result === false) { _metrics.blocked++; _log('debug', 'Navigation blocked by middleware', { middleware: mw.name, path }); return { blocked: true, blockedBy: mw.name, results }; }
        if (result && typeof result === 'object') { if ((result as Record<string, unknown>).redirect) { _log('debug', 'Redirect by middleware', { middleware: mw.name, redirect: (result as Record<string, unknown>).redirect }); return { redirect: (result as Record<string, unknown>).redirect, redirectBy: mw.name, results }; } currentContext = Object.assign({}, currentContext, result); }
        return runNext();
      }).catch(error => { _metrics.errors++; _log('error', 'Middleware error', { middleware: mw.name, error: error.message }); results.push({ id: mw.id, name: mw.name, error: error.message }); return runNext(); });
    }
    return runNext();
  },
  list() { return _middlewares.map(m => ({
    id: m.id,
    name: m.name,
    priority: m.priority,
    enabled: m.enabled,
    hasRouteFilter: !!m.routes,
    hasExclude: !!m.exclude
  })); },
  enable(middlewareId: string) { for (let i = 0; i < _middlewares.length; i++) { if (_middlewares[i].id === middlewareId) { _middlewares[i].enabled = true; return true; } } return false; },
  disable(middlewareId: string) { for (let i = 0; i < _middlewares.length; i++) { if (_middlewares[i].id === middlewareId) { _middlewares[i].enabled = false; return true; } } return false; },
  clear() { const count = _middlewares.length; _middlewares.length = 0; return count; },
  getMetrics() { return Object.assign({}, _metrics, { count: _middlewares.length, avgTime: _metrics.executed > 0 ? `${(_metrics.totalTime / _metrics.executed).toFixed(2)}ms` : '0ms' }); },
  getStatus() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), middlewareCount: _middlewares.length, metrics: this.getMetrics() }; },
  healthCheck() { return { status: _metrics.errors < 50 ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { middlewaresConfigured: _middlewares.length > 0 || true, lowErrorRate: _metrics.errors < 50, avgTimeAcceptable: _metrics.executed === 0 || (_metrics.totalTime / _metrics.executed) < 100 } }; },
  info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), middlewareCount: _middlewares.length, status: this.getStatus(), healthCheck: this.healthCheck(), timestamp: Date.now() }; },
  resetMetrics() { _metrics.executed = 0; _metrics.blocked = 0; _metrics.errors = 0; _metrics.totalTime = 0; }
};

export { RouterMiddleware, VERSION, MODULE_ID, injectPorts, getPorts };
export default RouterMiddleware;
